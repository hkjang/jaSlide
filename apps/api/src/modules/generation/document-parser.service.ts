import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';

export interface ParsedDocument {
    content: string;
    metadata: {
        title?: string;
        author?: string;
        pages?: number;
        language?: string;
        wordCount: number;
    };
    sections: Array<{
        heading?: string;
        content: string;
        level?: number;
    }>;
}

@Injectable()
export class DocumentParserService {
    private readonly logger = new Logger(DocumentParserService.name);

    /**
     * Parse document based on file type
     */
    async parseDocument(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocument> {
        const extension = filename.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'docx':
                return this.parseDocx(buffer);
            case 'pdf':
                return this.parsePdf(buffer);
            case 'txt':
                return this.parseTxt(buffer);
            case 'md':
                return this.parseMarkdown(buffer);
            case 'csv':
                return this.parseCsv(buffer);
            case 'xlsx':
            case 'xls':
                return this.parseExcel(buffer);
            default:
                // Try to detect from content
                return this.parseTxt(buffer);
        }
    }

    /**
     * Parse DOCX file using mammoth
     */
    async parseDocx(buffer: Buffer): Promise<ParsedDocument> {
        try {
            const result = await mammoth.extractRawText({ buffer });
            const content = result.value;
            const sections = this.extractSections(content);

            return {
                content,
                metadata: {
                    wordCount: this.countWords(content),
                    language: this.detectLanguage(content),
                },
                sections,
            };
        } catch (error) {
            this.logger.error('Failed to parse DOCX', error);
            throw error;
        }
    }

    /**
     * Parse PDF file using pdf-parse
     */
    async parsePdf(buffer: Buffer): Promise<ParsedDocument> {
        try {
            const data = await pdfParse(buffer);
            const content = data.text;
            const sections = this.extractSections(content);

            return {
                content,
                metadata: {
                    title: data.info?.Title,
                    author: data.info?.Author,
                    pages: data.numpages,
                    wordCount: this.countWords(content),
                    language: this.detectLanguage(content),
                },
                sections,
            };
        } catch (error) {
            this.logger.error('Failed to parse PDF', error);
            throw error;
        }
    }

    /**
     * Parse plain text file
     */
    async parseTxt(buffer: Buffer): Promise<ParsedDocument> {
        const content = buffer.toString('utf-8');
        const sections = this.extractSections(content);

        return {
            content,
            metadata: {
                wordCount: this.countWords(content),
                language: this.detectLanguage(content),
            },
            sections,
        };
    }

    /**
     * Parse Markdown file
     */
    async parseMarkdown(buffer: Buffer): Promise<ParsedDocument> {
        const content = buffer.toString('utf-8');
        const sections = this.parseMarkdownSections(content);

        // Remove markdown syntax for plain content
        const plainContent = content
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .trim();

        return {
            content: plainContent,
            metadata: {
                wordCount: this.countWords(plainContent),
                language: this.detectLanguage(plainContent),
            },
            sections,
        };
    }

    /**
     * Parse CSV file
     */
    async parseCsv(buffer: Buffer): Promise<ParsedDocument> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        // Convert to readable text
        const content = jsonData
            .map((row) => (Array.isArray(row) ? row.join(', ') : String(row)))
            .join('\n');

        return {
            content,
            metadata: {
                wordCount: this.countWords(content),
                language: this.detectLanguage(content),
            },
            sections: [{ content, heading: 'Data' }],
        };
    }

    /**
     * Parse Excel file
     */
    async parseExcel(buffer: Buffer): Promise<ParsedDocument> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sections: ParsedDocument['sections'] = [];
        let allContent = '';

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
            const sheetContent = jsonData
                .map((row) => (Array.isArray(row) ? row.join(', ') : String(row)))
                .join('\n');

            sections.push({ heading: sheetName, content: sheetContent });
            allContent += `${sheetName}\n${sheetContent}\n\n`;
        }

        return {
            content: allContent.trim(),
            metadata: {
                wordCount: this.countWords(allContent),
                language: this.detectLanguage(allContent),
            },
            sections,
        };
    }

    /**
     * Extract sections from text content
     */
    private extractSections(content: string): ParsedDocument['sections'] {
        const lines = content.split('\n');
        const sections: ParsedDocument['sections'] = [];
        let currentSection: { heading?: string; content: string } = { content: '' };

        for (const line of lines) {
            // Detect headings (uppercase lines, numbered sections, etc.)
            const isHeading =
                /^[A-Z][A-Z\s]{10,}$/.test(line.trim()) || // ALL CAPS
                /^\d+\.\s+[A-Z]/.test(line.trim()) ||      // 1. Title
                /^(Chapter|Section|Part)\s+\d+/i.test(line.trim());

            if (isHeading && currentSection.content.trim()) {
                sections.push(currentSection);
                currentSection = { heading: line.trim(), content: '' };
            } else if (isHeading) {
                currentSection.heading = line.trim();
            } else {
                currentSection.content += line + '\n';
            }
        }

        if (currentSection.content.trim() || currentSection.heading) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Parse markdown-specific sections
     */
    private parseMarkdownSections(content: string): ParsedDocument['sections'] {
        const lines = content.split('\n');
        const sections: ParsedDocument['sections'] = [];
        let currentSection: { heading?: string; content: string; level?: number } = { content: '' };

        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

            if (headingMatch) {
                if (currentSection.content.trim() || currentSection.heading) {
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: headingMatch[2],
                    content: '',
                    level: headingMatch[1].length,
                };
            } else {
                currentSection.content += line + '\n';
            }
        }

        if (currentSection.content.trim() || currentSection.heading) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Count words in text
     */
    private countWords(text: string): number {
        return text
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
    }

    /**
     * Detect language based on text content
     */
    private detectLanguage(text: string): string {
        // Simple heuristic based on character ranges
        const sample = text.slice(0, 1000);

        // Korean
        if (/[\u3131-\uD79D]/.test(sample)) {
            return 'ko';
        }

        // Japanese
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) {
            return 'ja';
        }

        // Chinese
        if (/[\u4E00-\u9FFF]/.test(sample)) {
            return 'zh';
        }

        // Default to English
        return 'en';
    }
}
