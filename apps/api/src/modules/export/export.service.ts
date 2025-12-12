import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportService {
    private rendererUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.rendererUrl = this.configService.get<string>('RENDERER_URL') || 'http://localhost:8000';
    }

    async exportToPptx(presentationId: string, userId: string) {
        const presentation = await this.getPresentation(presentationId, userId);

        try {
            // Call Python renderer service
            const response = await axios.post(
                `${this.rendererUrl}/api/render/pptx`,
                {
                    presentation: {
                        id: presentation.id,
                        title: presentation.title,
                        slides: presentation.slides,
                        template: presentation.template,
                    },
                },
                {
                    responseType: 'arraybuffer',
                },
            );

            return {
                buffer: response.data,
                filename: `${presentation.title}.pptx`,
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            };
        } catch (error) {
            throw new BadRequestException('Failed to export to PPTX');
        }
    }

    async exportToPdf(presentationId: string, userId: string) {
        const presentation = await this.getPresentation(presentationId, userId);

        try {
            const response = await axios.post(
                `${this.rendererUrl}/api/render/pdf`,
                {
                    presentation: {
                        id: presentation.id,
                        title: presentation.title,
                        slides: presentation.slides,
                        template: presentation.template,
                    },
                },
                {
                    responseType: 'arraybuffer',
                },
            );

            return {
                buffer: response.data,
                filename: `${presentation.title}.pdf`,
                mimeType: 'application/pdf',
            };
        } catch (error) {
            throw new BadRequestException('Failed to export to PDF');
        }
    }

    async exportToGoogleSlides(presentationId: string, userId: string, accessToken: string) {
        const presentation = await this.getPresentation(presentationId, userId);

        // This would integrate with Google Slides API
        // For now, return placeholder
        return {
            success: true,
            googleSlidesUrl: `https://docs.google.com/presentation/d/placeholder`,
            message: 'Google Slides export would be created here',
        };
    }

    async getExportPreview(presentationId: string, userId: string, slideIndex?: number) {
        const presentation = await this.getPresentation(presentationId, userId);

        try {
            const response = await axios.post(
                `${this.rendererUrl}/api/render/preview`,
                {
                    presentation: {
                        id: presentation.id,
                        title: presentation.title,
                        slides: presentation.slides,
                        template: presentation.template,
                    },
                    slideIndex: slideIndex ?? 0,
                },
                {
                    responseType: 'arraybuffer',
                },
            );

            return {
                buffer: response.data,
                mimeType: 'image/png',
            };
        } catch (error) {
            throw new BadRequestException('Failed to generate preview');
        }
    }

    private async getPresentation(id: string, userId: string) {
        const presentation = await this.prisma.presentation.findFirst({
            where: { id, userId },
            include: {
                slides: { orderBy: { order: 'asc' } },
                template: true,
            },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found');
        }

        return presentation;
    }
}
