import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCreatePolicyDto, AdminUpdatePolicyDto, PaginationDto } from '../dto';

@Injectable()
export class AdminPoliciesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { category?: string }) {
        const { page = 1, limit = 20, category } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (category) where.category = category;

        const [policies, total] = await Promise.all([
            this.prisma.systemPolicy.findMany({ where, skip, take: limit, orderBy: { key: 'asc' } }),
            this.prisma.systemPolicy.count({ where }),
        ]);

        return { data: policies, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async create(dto: AdminCreatePolicyDto) {
        return this.prisma.systemPolicy.create({ data: dto });
    }

    async update(id: string, dto: AdminUpdatePolicyDto) {
        const existing = await this.prisma.systemPolicy.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Policy not found');
        return this.prisma.systemPolicy.update({ where: { id }, data: dto });
    }

    async delete(id: string) {
        await this.prisma.systemPolicy.delete({ where: { id } });
        return { success: true };
    }
}
