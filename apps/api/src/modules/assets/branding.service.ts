import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage.service';

export interface BrandingConfig {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    headingFont?: string;
    logoUrl?: string;
    faviconUrl?: string;
    footerText?: string;
}

@Injectable()
export class BrandingService {
    private readonly logger = new Logger(BrandingService.name);

    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
    ) { }

    async getBranding(organizationId: string): Promise<BrandingConfig | null> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { brandSettings: true },
        });

        return (org?.brandSettings as BrandingConfig) || null;
    }

    async updateBranding(organizationId: string, config: Partial<BrandingConfig>): Promise<BrandingConfig> {
        const current = await this.getBranding(organizationId);
        const updated = { ...current, ...config };

        await this.prisma.organization.update({
            where: { id: organizationId },
            data: { brandSettings: updated as any },
        });

        return updated as BrandingConfig;
    }

    async uploadLogo(
        organizationId: string,
        file: Express.Multer.File,
    ): Promise<{ url: string }> {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Only image files are allowed');
        }

        const result = await this.storageService.upload(file, `branding/${organizationId}`);

        // Update organization branding
        await this.updateBranding(organizationId, { logoUrl: result.publicUrl });

        return { url: result.publicUrl };
    }

    async getDefaultBranding(): Promise<BrandingConfig> {
        return {
            primaryColor: '#8B5CF6',
            secondaryColor: '#6366F1',
            accentColor: '#06B6D4',
            backgroundColor: '#FFFFFF',
            textColor: '#111827',
            fontFamily: 'Inter, sans-serif',
            headingFont: 'Inter, sans-serif',
            footerText: 'Created with JaSlide',
        };
    }

    // Apply branding to presentation template
    async applyBrandingToTemplate(organizationId: string, templateConfig: any): Promise<any> {
        const branding = await this.getBranding(organizationId) || await this.getDefaultBranding();

        return {
            ...templateConfig,
            colors: {
                ...(templateConfig.colors || {}),
                primary: branding.primaryColor,
                secondary: branding.secondaryColor,
                accent: branding.accentColor,
                background: branding.backgroundColor,
                text: branding.textColor,
            },
            typography: {
                ...(templateConfig.typography || {}),
                fontFamily: branding.fontFamily,
                headingFont: branding.headingFont,
            },
            branding: {
                logoUrl: branding.logoUrl,
                footerText: branding.footerText,
            },
        };
    }
}
