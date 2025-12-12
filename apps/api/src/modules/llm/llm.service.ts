import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PromptTemplateService } from './prompt-template.service';

export interface GenerateOutlineInput {
    content: string;
    slideCount: number;
    language: string;
    style?: string;
}

export interface SlideOutline {
    title: string;
    slides: {
        order: number;
        title: string;
        type: string;
        keyPoints: string[];
    }[];
}

export interface GenerateSlideContentInput {
    title: string;
    type: string;
    keyPoints: string[];
    language: string;
}

export interface SlideContent {
    heading?: string;
    subheading?: string;
    body?: string;
    bullets?: { text: string; level: number }[];
}

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private openai: OpenAI | null = null;
    private model: string;
    private apiKeyAvailable: boolean;

    constructor(
        private configService: ConfigService,
        private promptTemplates: PromptTemplateService,
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.apiKeyAvailable = !!apiKey;
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
        this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo-preview';
    }

    private ensureOpenAI(): OpenAI {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
        }
        return this.openai;
    }

    async generateOutline(input: GenerateOutlineInput): Promise<SlideOutline> {
        const prompt = this.promptTemplates.getOutlinePrompt(input);

        try {
            const response = await this.ensureOpenAI().chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional presentation consultant. Generate structured presentation outlines in JSON format. Always respond with valid JSON only, no additional text.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from LLM');
            }

            return JSON.parse(content) as SlideOutline;
        } catch (error) {
            this.logger.error('Failed to generate outline', error);
            throw error;
        }
    }

    async generateSlideContent(input: GenerateSlideContentInput): Promise<SlideContent> {
        const prompt = this.promptTemplates.getSlideContentPrompt(input);

        try {
            const response = await this.ensureOpenAI().chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional presentation content writer. Generate slide content in JSON format. Always respond with valid JSON only.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from LLM');
            }

            return JSON.parse(content) as SlideContent;
        } catch (error) {
            this.logger.error('Failed to generate slide content', error);
            throw error;
        }
    }

    async editContent(currentContent: string, instruction: string): Promise<string> {
        const prompt = this.promptTemplates.getEditPrompt(currentContent, instruction);

        try {
            const response = await this.ensureOpenAI().chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful editor. Apply the requested edit to the content and return the result as JSON with a "content" field.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.5,
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from LLM');
            }

            const result = JSON.parse(content);
            return result.content || currentContent;
        } catch (error) {
            this.logger.error('Failed to edit content', error);
            throw error;
        }
    }

    async suggestLayout(content: SlideContent, slideType: string): Promise<string> {
        const prompt = `Based on this slide content: ${JSON.stringify(content)}
And slide type: ${slideType}
Suggest the best layout from: center, left, right, image-left, image-right, two-column-equal
Return JSON with "layout" field only.`;

        try {
            const response = await this.ensureOpenAI().chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a presentation design expert.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            });

            const result = JSON.parse(response.choices[0]?.message?.content || '{}');
            return result.layout || 'center';
        } catch (error) {
            this.logger.error('Failed to suggest layout', error);
            return 'center';
        }
    }

    async detectLanguage(text: string): Promise<string> {
        // Simple detection based on character range
        const koreanRegex = /[\uAC00-\uD7AF]/;
        if (koreanRegex.test(text)) {
            return 'ko';
        }
        return 'en';
    }
}
