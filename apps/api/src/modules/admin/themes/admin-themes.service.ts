import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ThemeDto {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor?: string;
    fontFamily?: string;
    config?: Record<string, any>;
    isPublic?: boolean;
}

export interface ThemeFilterDto {
    page?: number;
    limit?: number;
    isPublic?: boolean;
    search?: string;
}

@Injectable()
export class AdminThemesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: ThemeFilterDto) {
        const { page = 1, limit = 20, isPublic, search } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isPublic !== undefined) where.isPublic = isPublic;
        if (search) where.name = { contains: search, mode: 'insensitive' };

        // Use SystemPolicy to store themes
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'design.themes' },
        });

        const themes = ((policy?.value) as unknown as ThemeDto[]) || [];
        const filtered = themes.filter(t => {
            if (isPublic !== undefined && t.isPublic !== isPublic) return false;
            if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });

        const paginated = filtered.slice(skip, skip + limit);

        return {
            data: paginated,
            total: filtered.length,
            page,
            limit,
            totalPages: Math.ceil(filtered.length / limit),
        };
    }

    async findByName(name: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'design.themes' },
        });
        const themes = ((policy?.value) as unknown as ThemeDto[]) || [];
        const theme = themes.find(t => t.name === name);
        if (!theme) throw new NotFoundException('Theme not found');
        return theme;
    }

    async create(dto: ThemeDto) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'design.themes' },
        });
        const themes = ((policy?.value) as unknown as ThemeDto[]) || [];
        themes.push(dto);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'design.themes' },
            create: { category: 'design', key: 'design.themes', value: themes as unknown as any },
            update: { value: themes as unknown as any },
        });

        await this.createAuditLog('CREATE', 'THEME', dto);
        return dto;
    }

    async update(name: string, dto: Partial<ThemeDto>) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'design.themes' },
        });
        const themes = ((policy?.value) as unknown as ThemeDto[]) || [];
        const index = themes.findIndex(t => t.name === name);
        if (index === -1) throw new NotFoundException('Theme not found');

        themes[index] = { ...themes[index], ...dto };

        await this.prisma.systemPolicy.update({
            where: { key: 'design.themes' },
            data: { value: themes as unknown as any },
        });

        await this.createAuditLog('UPDATE', 'THEME', { name, ...dto });
        return themes[index];
    }

    async delete(name: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'design.themes' },
        });
        const themes = ((policy?.value) as unknown as ThemeDto[]) || [];
        const filtered = themes.filter(t => t.name !== name);

        await this.prisma.systemPolicy.update({
            where: { key: 'design.themes' },
            data: { value: filtered as unknown as any },
        });

        await this.createAuditLog('DELETE', 'THEME', { name });
        return { success: true };
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
