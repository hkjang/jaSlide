import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ColorPaletteDto {
    name: string;
    colors: string[];
    isPublic?: boolean;
    organizationId?: string;
}

export interface ColorPaletteFilterDto {
    page?: number;
    limit?: number;
    isPublic?: boolean;
    organizationId?: string;
}

@Injectable()
export class AdminColorPalettesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: ColorPaletteFilterDto) {
        const { page = 1, limit = 20, isPublic, organizationId } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isPublic !== undefined) where.isPublic = isPublic;
        if (organizationId) where.organizationId = organizationId;

        const [palettes, total] = await Promise.all([
            this.prisma.colorPalette.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { organization: { select: { id: true, name: true } } },
            }),
            this.prisma.colorPalette.count({ where }),
        ]);

        return { data: palettes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const palette = await this.prisma.colorPalette.findUnique({
            where: { id },
            include: { organization: { select: { id: true, name: true } } },
        });
        if (!palette) throw new NotFoundException('Color palette not found');
        return palette;
    }

    async create(dto: ColorPaletteDto) {
        const palette = await this.prisma.colorPalette.create({ data: dto });
        await this.createAuditLog('CREATE', 'COLOR_PALETTE', dto);
        return palette;
    }

    async update(id: string, dto: Partial<ColorPaletteDto>) {
        const existing = await this.prisma.colorPalette.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Color palette not found');

        const palette = await this.prisma.colorPalette.update({ where: { id }, data: dto });
        await this.createAuditLog('UPDATE', 'COLOR_PALETTE', { id, ...dto });
        return palette;
    }

    async delete(id: string) {
        await this.prisma.colorPalette.delete({ where: { id } });
        await this.createAuditLog('DELETE', 'COLOR_PALETTE', { id });
        return { success: true };
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
