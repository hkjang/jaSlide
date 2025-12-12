import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationDto } from '../dto';

@Injectable()
export class AdminTemplatesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { category?: string; isPublic?: boolean }) {
        const { page = 1, limit = 20, category, isPublic } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (category) where.category = category;
        if (isPublic !== undefined) where.isPublic = isPublic;

        const [templates, total] = await Promise.all([
            this.prisma.template.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    organization: { select: { id: true, name: true } },
                    _count: { select: { presentations: true } },
                },
            }),
            this.prisma.template.count({ where }),
        ]);

        return { data: templates, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: {
                organization: { select: { id: true, name: true } },
                _count: { select: { presentations: true } },
            },
        });

        if (!template) throw new NotFoundException('Template not found');
        return template;
    }

    async create(data: { name: string; description?: string; category: string; config: any; isPublic?: boolean; organizationId?: string }) {
        return this.prisma.template.create({ data });
    }

    async update(id: string, data: { name?: string; description?: string; category?: string; config?: any; isPublic?: boolean }) {
        const existing = await this.prisma.template.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Template not found');
        return this.prisma.template.update({ where: { id }, data });
    }

    async delete(id: string) {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: { _count: { select: { presentations: true } } },
        });

        if (!template) throw new NotFoundException('Template not found');
        if (template._count.presentations > 0) {
            throw new NotFoundException('Cannot delete template in use');
        }

        await this.prisma.template.delete({ where: { id } });
        return { success: true };
    }

    // Color Palettes
    async findColorPalettes(filter: PaginationDto) {
        const { page = 1, limit = 20 } = filter;
        const skip = (page - 1) * limit;

        const [palettes, total] = await Promise.all([
            this.prisma.colorPalette.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.colorPalette.count(),
        ]);

        return { data: palettes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createColorPalette(data: { name: string; colors: string[]; isPublic?: boolean; organizationId?: string }) {
        return this.prisma.colorPalette.create({ data });
    }

    async deleteColorPalette(id: string) {
        await this.prisma.colorPalette.delete({ where: { id } });
        return { success: true };
    }

    // Layout Rules
    async findLayoutRules(filter: PaginationDto) {
        const { page = 1, limit = 20 } = filter;
        const skip = (page - 1) * limit;

        const [rules, total] = await Promise.all([
            this.prisma.layoutRule.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.layoutRule.count(),
        ]);

        return { data: rules, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createLayoutRule(data: { name: string; slideType: string; config: any; isDefault?: boolean }) {
        return this.prisma.layoutRule.create({ data });
    }

    async deleteLayoutRule(id: string) {
        await this.prisma.layoutRule.delete({ where: { id } });
        return { success: true };
    }
}
