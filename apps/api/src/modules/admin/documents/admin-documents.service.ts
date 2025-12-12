import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminDocumentFilterDto } from '../dto';

@Injectable()
export class AdminDocumentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: AdminDocumentFilterDto) {
        const { page = 1, limit = 20, userId, search, status, startDate, endDate } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (userId) where.userId = userId;
        if (status) where.status = status;
        if (search) where.title = { contains: search, mode: 'insensitive' };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [documents, total] = await Promise.all([
            this.prisma.presentation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true, name: true } },
                    _count: { select: { slides: true } },
                },
            }),
            this.prisma.presentation.count({ where }),
        ]);

        return { data: documents, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const doc = await this.prisma.presentation.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, name: true } },
                slides: true,
                template: { select: { id: true, name: true } },
            },
        });

        if (!doc) throw new NotFoundException('Document not found');
        return doc;
    }

    async delete(id: string) {
        await this.prisma.presentation.delete({ where: { id } });
        return { success: true };
    }
}
