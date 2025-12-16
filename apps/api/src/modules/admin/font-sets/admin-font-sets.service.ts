import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface FontSetDto {
    name: string;
    titleFont: string;
    bodyFont: string;
    headingFont?: string;
    isPublic?: boolean;
    organizationId?: string;
}

export interface FontSetFilterDto {
    page?: number;
    limit?: number;
    isPublic?: boolean;
    organizationId?: string;
}

@Injectable()
export class AdminFontSetsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: FontSetFilterDto) {
        const { page = 1, limit = 20, isPublic, organizationId } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isPublic !== undefined) where.isPublic = isPublic;
        if (organizationId) where.organizationId = organizationId;

        const [fontSets, total] = await Promise.all([
            this.prisma.fontSet.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { organization: { select: { id: true, name: true } } },
            }),
            this.prisma.fontSet.count({ where }),
        ]);

        return { data: fontSets, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const fontSet = await this.prisma.fontSet.findUnique({
            where: { id },
            include: { organization: { select: { id: true, name: true } } },
        });
        if (!fontSet) throw new NotFoundException('Font set not found');
        return fontSet;
    }

    async create(dto: FontSetDto) {
        const fontSet = await this.prisma.fontSet.create({ data: dto });
        await this.createAuditLog('CREATE', 'FONT_SET', dto);
        return fontSet;
    }

    async update(id: string, dto: Partial<FontSetDto>) {
        const existing = await this.prisma.fontSet.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Font set not found');

        const fontSet = await this.prisma.fontSet.update({ where: { id }, data: dto });
        await this.createAuditLog('UPDATE', 'FONT_SET', { id, ...dto });
        return fontSet;
    }

    async delete(id: string) {
        await this.prisma.fontSet.delete({ where: { id } });
        await this.createAuditLog('DELETE', 'FONT_SET', { id });
        return { success: true };
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
