import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationDto } from '../dto';

@Injectable()
export class AdminAssetsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { type?: string; search?: string; organizationId?: string }) {
        const { page = 1, limit = 20, type, search, organizationId } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (type) where.type = type;
        if (organizationId) where.organizationId = organizationId;
        if (search) where.name = { contains: search, mode: 'insensitive' };

        const [assets, total] = await Promise.all([
            this.prisma.asset.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true } }, organization: { select: { id: true, name: true } } },
            }),
            this.prisma.asset.count({ where }),
        ]);

        return { data: assets, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async update(id: string, data: { name?: string; licenseInfo?: any }) {
        const existing = await this.prisma.asset.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Asset not found');
        return this.prisma.asset.update({ where: { id }, data });
    }

    async delete(id: string) {
        await this.prisma.asset.delete({ where: { id } });
        return { success: true };
    }
}
