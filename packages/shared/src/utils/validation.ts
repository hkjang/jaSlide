// Validation utilities

import { SourceType } from '../types/presentation';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate presentation title
 */
export function isValidPresentationTitle(title: string): boolean {
    return title.length >= 1 && title.length <= 200;
}

/**
 * Validate slide count
 */
export function isValidSlideCount(count: number): boolean {
    return count >= 1 && count <= 50;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Determine source type from file extension
 */
export function getSourceTypeFromExtension(extension: string): SourceType | null {
    const extensionMap: Record<string, SourceType> = {
        docx: SourceType.DOCX,
        doc: SourceType.DOCX,
        pdf: SourceType.PDF,
        md: SourceType.MARKDOWN,
        markdown: SourceType.MARKDOWN,
        csv: SourceType.CSV,
        txt: SourceType.TEXT,
    };
    return extensionMap[extension] || null;
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 50): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return size > 0 && size <= maxBytes;
}

/**
 * Validate content length for generation
 */
export function isValidContentLength(content: string): boolean {
    // Minimum 10 characters, maximum 100,000 characters
    return content.length >= 10 && content.length <= 100000;
}

/**
 * Sanitize string for safe usage
 */
export function sanitizeString(str: string): string {
    return str
        .trim()
        .replace(/[<>]/g, '')
        .slice(0, 10000);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
}
