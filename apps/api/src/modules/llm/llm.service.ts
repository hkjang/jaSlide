import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PromptTemplateService } from './prompt-template.service';
import { PrismaService } from '../../prisma/prisma.service';

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

interface LlmModelConfig {
    provider: string;
    modelId: string;
    endpoint?: string | null;
    apiKey?: string | null;
    maxTokens: number;
}

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private cachedClient: OpenAI | null = null;
    private cachedModel: string | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(
        private configService: ConfigService,
        private promptTemplates: PromptTemplateService,
        private prisma: PrismaService,
    ) { }

    private async getDefaultLlmModel(): Promise<LlmModelConfig | null> {
        // Find default or first active model
        const model = await this.prisma.llmModel.findFirst({
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        });

        if (!model) {
            return null;
        }

        // Get API key: prioritize direct apiKey, then env var, then config
        let apiKey = model.apiKey;
        if (!apiKey && model.apiKeyEnvVar) {
            apiKey = process.env[model.apiKeyEnvVar] || null;
        }
        if (!apiKey) {
            apiKey = this.configService.get<string>('OPENAI_API_KEY') || null;
        }

        return {
            provider: model.provider,
            modelId: model.modelId,
            endpoint: model.endpoint,
            apiKey,
            maxTokens: model.maxTokens,
        };
    }

    // Providers that don't require API keys (local LLMs)
    private readonly LOCAL_PROVIDERS = ['vllm', 'ollama', 'local', 'lmstudio', 'localai'];

    private isLocalProvider(provider: string): boolean {
        return this.LOCAL_PROVIDERS.includes(provider.toLowerCase());
    }

    private async getOpenAIClient(): Promise<{ client: OpenAI; model: string }> {
        const now = Date.now();

        // Return cached client if still valid
        if (this.cachedClient && this.cachedModel && now < this.cacheExpiry) {
            return { client: this.cachedClient, model: this.cachedModel };
        }

        // Fetch from database
        const llmConfig = await this.getDefaultLlmModel();

        if (llmConfig) {
            // For local providers (vLLM, Ollama, etc.), API key is optional
            if (this.isLocalProvider(llmConfig.provider)) {
                if (!llmConfig.endpoint) {
                    throw new Error(
                        `Local LLM provider '${llmConfig.provider}' requires an endpoint. ` +
                        'Please configure the endpoint in Admin Settings (e.g., http://localhost:11434/v1 for Ollama).'
                    );
                }

                const clientConfig: any = {
                    baseURL: llmConfig.endpoint,
                    apiKey: llmConfig.apiKey || 'not-needed', // Some local servers require a dummy key
                };

                this.cachedClient = new OpenAI(clientConfig);
                this.cachedModel = llmConfig.modelId;
                this.cacheExpiry = now + this.CACHE_TTL;

                this.logger.log(`Using local LLM: ${llmConfig.provider} at ${llmConfig.endpoint}`);
                return { client: this.cachedClient, model: this.cachedModel };
            }

            // For cloud providers, API key is required
            if (llmConfig.apiKey) {
                const clientConfig: any = { apiKey: llmConfig.apiKey };

                // Support custom endpoints (for Azure, etc.)
                if (llmConfig.endpoint) {
                    clientConfig.baseURL = llmConfig.endpoint;
                }

                this.cachedClient = new OpenAI(clientConfig);
                this.cachedModel = llmConfig.modelId;
                this.cacheExpiry = now + this.CACHE_TTL;

                return { client: this.cachedClient, model: this.cachedModel };
            }
        }

        // Fallback to environment variable
        const envApiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (envApiKey) {
            this.cachedClient = new OpenAI({ apiKey: envApiKey });
            this.cachedModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4-turbo-preview';
            this.cacheExpiry = now + this.CACHE_TTL;

            return { client: this.cachedClient, model: this.cachedModel };
        }

        throw new Error(
            'No LLM configured. Please configure a model in Admin Settings:\n' +
            '- For cloud providers (OpenAI, Anthropic): Set API key\n' +
            '- For local providers (vLLM, Ollama): Set endpoint (e.g., http://localhost:11434/v1)'
        );
    }

    async generateOutline(input: GenerateOutlineInput): Promise<SlideOutline> {
        const prompt = this.promptTemplates.getOutlinePrompt(input);

        try {
            const { client, model } = await this.getOpenAIClient();
            const response = await client.chat.completions.create({
                model,
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
            const { client, model } = await this.getOpenAIClient();
            const response = await client.chat.completions.create({
                model,
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
            const { client, model } = await this.getOpenAIClient();
            const response = await client.chat.completions.create({
                model,
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
            const { client, model } = await this.getOpenAIClient();
            const response = await client.chat.completions.create({
                model,
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
