import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GoogleSlidesPage {
    pageId: string;
    title?: string;
    pageElements?: GoogleSlidesElement[];
}

export interface GoogleSlidesElement {
    objectId: string;
    size?: { width: number; height: number };
    transform?: { scaleX: number; scaleY: number; translateX: number; translateY: number };
    shape?: any;
    image?: any;
    table?: any;
}

export interface GoogleSlidesPresentation {
    presentationId: string;
    title: string;
    slides: GoogleSlidesPage[];
    pageSize?: { width: number; height: number };
}

@Injectable()
export class GoogleSlidesService {
    private readonly logger = new Logger(GoogleSlidesService.name);
    private readonly apiBaseUrl = 'https://slides.googleapis.com/v1';

    constructor(private configService: ConfigService) { }

    /**
     * Create a new Google Slides presentation
     */
    async createPresentation(
        accessToken: string,
        title: string,
    ): Promise<GoogleSlidesPresentation> {
        try {
            const response = await axios.post(
                `${this.apiBaseUrl}/presentations`,
                { title },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error: any) {
            this.logger.error('Failed to create Google Slides presentation', error.message);
            throw error;
        }
    }

    /**
     * Add a slide to an existing presentation
     */
    async addSlide(
        accessToken: string,
        presentationId: string,
        layoutId?: string,
    ): Promise<string> {
        const requests = [
            {
                createSlide: {
                    slideLayoutReference: layoutId ? { layoutId } : undefined,
                    insertionIndex: 0,
                },
            },
        ];

        const response = await this.batchUpdate(accessToken, presentationId, requests);
        return response.replies[0]?.createSlide?.objectId;
    }

    /**
     * Add text to a slide
     */
    async addTextBox(
        accessToken: string,
        presentationId: string,
        pageId: string,
        text: string,
        position: { x: number; y: number; width: number; height: number },
    ): Promise<string> {
        const elementId = `text_${Date.now()}`;
        const requests = [
            {
                createShape: {
                    objectId: elementId,
                    shapeType: 'TEXT_BOX',
                    elementProperties: {
                        pageObjectId: pageId,
                        size: {
                            width: { magnitude: position.width, unit: 'PT' },
                            height: { magnitude: position.height, unit: 'PT' },
                        },
                        transform: {
                            scaleX: 1,
                            scaleY: 1,
                            translateX: position.x,
                            translateY: position.y,
                            unit: 'PT',
                        },
                    },
                },
            },
            {
                insertText: {
                    objectId: elementId,
                    text,
                    insertionIndex: 0,
                },
            },
        ];

        await this.batchUpdate(accessToken, presentationId, requests);
        return elementId;
    }

    /**
     * Add an image to a slide
     */
    async addImage(
        accessToken: string,
        presentationId: string,
        pageId: string,
        imageUrl: string,
        position: { x: number; y: number; width: number; height: number },
    ): Promise<string> {
        const elementId = `image_${Date.now()}`;
        const requests = [
            {
                createImage: {
                    objectId: elementId,
                    url: imageUrl,
                    elementProperties: {
                        pageObjectId: pageId,
                        size: {
                            width: { magnitude: position.width, unit: 'PT' },
                            height: { magnitude: position.height, unit: 'PT' },
                        },
                        transform: {
                            scaleX: 1,
                            scaleY: 1,
                            translateX: position.x,
                            translateY: position.y,
                            unit: 'PT',
                        },
                    },
                },
            },
        ];

        await this.batchUpdate(accessToken, presentationId, requests);
        return elementId;
    }

    /**
     * Update text style (font, color, size)
     */
    async updateTextStyle(
        accessToken: string,
        presentationId: string,
        objectId: string,
        style: {
            fontFamily?: string;
            fontSize?: number;
            fontColor?: { r: number; g: number; b: number };
            bold?: boolean;
            italic?: boolean;
        },
    ): Promise<void> {
        const textStyle: any = {};
        const fields: string[] = [];

        if (style.fontFamily) {
            textStyle.fontFamily = style.fontFamily;
            fields.push('fontFamily');
        }
        if (style.fontSize) {
            textStyle.fontSize = { magnitude: style.fontSize, unit: 'PT' };
            fields.push('fontSize');
        }
        if (style.fontColor) {
            textStyle.foregroundColor = {
                opaqueColor: {
                    rgbColor: {
                        red: style.fontColor.r / 255,
                        green: style.fontColor.g / 255,
                        blue: style.fontColor.b / 255,
                    },
                },
            };
            fields.push('foregroundColor');
        }
        if (style.bold !== undefined) {
            textStyle.bold = style.bold;
            fields.push('bold');
        }
        if (style.italic !== undefined) {
            textStyle.italic = style.italic;
            fields.push('italic');
        }

        const requests = [
            {
                updateTextStyle: {
                    objectId,
                    style: textStyle,
                    textRange: { type: 'ALL' },
                    fields: fields.join(','),
                },
            },
        ];

        await this.batchUpdate(accessToken, presentationId, requests);
    }

    /**
     * Delete an element from a slide
     */
    async deleteElement(
        accessToken: string,
        presentationId: string,
        objectId: string,
    ): Promise<void> {
        const requests = [{ deleteObject: { objectId } }];
        await this.batchUpdate(accessToken, presentationId, requests);
    }

    /**
     * Get presentation details
     */
    async getPresentation(
        accessToken: string,
        presentationId: string,
    ): Promise<GoogleSlidesPresentation> {
        const response = await axios.get(
            `${this.apiBaseUrl}/presentations/${presentationId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

        return response.data;
    }

    /**
     * Export JaSlide presentation to Google Slides
     */
    async exportToGoogleSlides(
        accessToken: string,
        presentation: {
            title: string;
            slides: Array<{
                type: string;
                title?: string;
                content: any;
            }>;
        },
    ): Promise<{ presentationId: string; url: string }> {
        // Create new presentation
        const created = await this.createPresentation(accessToken, presentation.title);
        const presentationId = created.presentationId;

        // Add slides
        for (const slide of presentation.slides) {
            const pageId = await this.addSlide(accessToken, presentationId);
            await this.convertSlideContent(accessToken, presentationId, pageId, slide);
        }

        return {
            presentationId,
            url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
        };
    }

    private async convertSlideContent(
        accessToken: string,
        presentationId: string,
        pageId: string,
        slide: { type: string; title?: string; content: any },
    ): Promise<void> {
        const { type, title, content } = slide;

        // Add title
        if (title || content.heading) {
            await this.addTextBox(
                accessToken,
                presentationId,
                pageId,
                title || content.heading,
                { x: 50, y: 30, width: 620, height: 60 },
            );
        }

        // Add body content
        if (content.body) {
            await this.addTextBox(
                accessToken,
                presentationId,
                pageId,
                content.body,
                { x: 50, y: 120, width: 620, height: 300 },
            );
        }

        // Add bullets
        if (content.bullets && content.bullets.length > 0) {
            const bulletText = content.bullets
                .map((b: any) => `• ${typeof b === 'string' ? b : b.text}`)
                .join('\n');
            await this.addTextBox(
                accessToken,
                presentationId,
                pageId,
                bulletText,
                { x: 50, y: 120, width: 620, height: 300 },
            );
        }
    }

    private async batchUpdate(
        accessToken: string,
        presentationId: string,
        requests: any[],
    ): Promise<any> {
        const response = await axios.post(
            `${this.apiBaseUrl}/presentations/${presentationId}:batchUpdate`,
            { requests },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        return response.data;
    }
}
