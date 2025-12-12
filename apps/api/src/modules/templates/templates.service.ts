import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) { }

    async findAll(category?: string, isPublic = true) {
        const where: any = {};
        if (category) where.category = category;
        if (isPublic) where.isPublic = true;

        return this.prisma.template.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                thumbnail: true,
                category: true,
                isPublic: true,
            },
        });
    }

    async findById(id: string) {
        const template = await this.prisma.template.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        return template;
    }

    async create(data: {
        name: string;
        description?: string;
        thumbnail?: string;
        category: string;
        config: any;
        isPublic?: boolean;
        organizationId?: string;
    }) {
        return this.prisma.template.create({
            data: {
                name: data.name,
                description: data.description,
                thumbnail: data.thumbnail,
                category: data.category as any,
                config: data.config,
                isPublic: data.isPublic ?? false,
                organizationId: data.organizationId,
            },
        });
    }

    async getDefaultTemplates() {
        // Return built-in default templates
        return [
            {
                id: 'default-professional',
                name: 'Professional',
                description: 'Clean and professional design for business presentations',
                thumbnail: '/templates/professional.png',
                category: 'BUSINESS',
                config: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#64748b',
                        accent: '#0ea5e9',
                        background: '#ffffff',
                        text: '#1e293b',
                        textSecondary: '#64748b',
                    },
                    typography: {
                        titleFont: 'Inter',
                        bodyFont: 'Inter',
                        titleSize: { xl: 44, lg: 36, md: 28, sm: 24, xs: 20 },
                        bodySize: { xl: 24, lg: 20, md: 18, sm: 16, xs: 14 },
                        lineHeight: 1.5,
                    },
                    layouts: {
                        margins: { top: 40, right: 40, bottom: 40, left: 40 },
                        spacing: 20,
                        contentWidth: 880,
                        contentAlignment: 'left',
                    },
                    backgrounds: {
                        type: 'solid',
                        value: '#ffffff',
                    },
                },
            },
            {
                id: 'default-minimal',
                name: 'Minimal',
                description: 'Simple and clean minimal design',
                thumbnail: '/templates/minimal.png',
                category: 'MINIMAL',
                config: {
                    colors: {
                        primary: '#18181b',
                        secondary: '#71717a',
                        accent: '#18181b',
                        background: '#fafafa',
                        text: '#18181b',
                        textSecondary: '#71717a',
                    },
                    typography: {
                        titleFont: 'Inter',
                        bodyFont: 'Inter',
                        titleSize: { xl: 48, lg: 40, md: 32, sm: 24, xs: 20 },
                        bodySize: { xl: 20, lg: 18, md: 16, sm: 14, xs: 12 },
                        lineHeight: 1.6,
                    },
                    layouts: {
                        margins: { top: 60, right: 60, bottom: 60, left: 60 },
                        spacing: 24,
                        contentWidth: 840,
                        contentAlignment: 'center',
                    },
                    backgrounds: {
                        type: 'solid',
                        value: '#fafafa',
                    },
                },
            },
            {
                id: 'default-creative',
                name: 'Creative',
                description: 'Bold and colorful creative design',
                thumbnail: '/templates/creative.png',
                category: 'CREATIVE',
                config: {
                    colors: {
                        primary: '#7c3aed',
                        secondary: '#ec4899',
                        accent: '#f59e0b',
                        background: '#1e1b4b',
                        text: '#ffffff',
                        textSecondary: '#c4b5fd',
                    },
                    typography: {
                        titleFont: 'Poppins',
                        bodyFont: 'Inter',
                        titleSize: { xl: 52, lg: 44, md: 36, sm: 28, xs: 24 },
                        bodySize: { xl: 22, lg: 20, md: 18, sm: 16, xs: 14 },
                        lineHeight: 1.4,
                    },
                    layouts: {
                        margins: { top: 48, right: 48, bottom: 48, left: 48 },
                        spacing: 28,
                        contentWidth: 864,
                        contentAlignment: 'left',
                    },
                    backgrounds: {
                        type: 'gradient',
                        value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    },
                },
            },
        ];
    }
}
