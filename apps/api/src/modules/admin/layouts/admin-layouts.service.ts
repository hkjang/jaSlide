import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface LayoutDto {
    name: string;
    slideType: string;
    config: Record<string, any>;
    isDefault?: boolean;
}

export interface LayoutFilterDto {
    page?: number;
    limit?: number;
    slideType?: string;
}

@Injectable()
export class AdminLayoutsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: LayoutFilterDto) {
        const { page = 1, limit = 20, slideType } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (slideType) where.slideType = slideType;

        const [layouts, total] = await Promise.all([
            this.prisma.layoutRule.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            }),
            this.prisma.layoutRule.count({ where }),
        ]);

        return { data: layouts, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const layout = await this.prisma.layoutRule.findUnique({ where: { id } });
        if (!layout) throw new NotFoundException('Layout not found');
        return layout;
    }

    async create(dto: LayoutDto) {
        if (dto.isDefault) {
            await this.prisma.layoutRule.updateMany({
                where: { slideType: dto.slideType, isDefault: true },
                data: { isDefault: false },
            });
        }

        const layout = await this.prisma.layoutRule.create({ data: dto });
        await this.createAuditLog('CREATE', 'LAYOUT', dto);
        return layout;
    }

    async update(id: string, dto: Partial<LayoutDto>) {
        const existing = await this.prisma.layoutRule.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Layout not found');

        if (dto.isDefault) {
            await this.prisma.layoutRule.updateMany({
                where: { slideType: existing.slideType, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const layout = await this.prisma.layoutRule.update({ where: { id }, data: dto });
        await this.createAuditLog('UPDATE', 'LAYOUT', { id, ...dto });
        return layout;
    }

    async delete(id: string) {
        await this.prisma.layoutRule.delete({ where: { id } });
        await this.createAuditLog('DELETE', 'LAYOUT', { id });
        return { success: true };
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
