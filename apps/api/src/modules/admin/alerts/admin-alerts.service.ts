import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCreateAlertDto, AdminUpdateAlertDto, PaginationDto } from '../dto';

@Injectable()
export class AdminAlertsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { eventType?: string }) {
        const { page = 1, limit = 20, eventType } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (eventType) where.eventType = eventType;

        const [alerts, total] = await Promise.all([
            this.prisma.alertConfig.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.alertConfig.count({ where }),
        ]);

        return { data: alerts, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(dto: AdminCreateAlertDto) {
        return this.prisma.alertConfig.create({ data: dto });
    }

    async update(id: string, dto: AdminUpdateAlertDto) {
        const existing = await this.prisma.alertConfig.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Alert config not found');
        return this.prisma.alertConfig.update({ where: { id }, data: dto });
    }

    async delete(id: string) {
        await this.prisma.alertConfig.delete({ where: { id } });
        return { success: true };
    }
}
