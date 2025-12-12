import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    AdminCreateCreditPolicyDto,
    AdminUpdateCreditPolicyDto,
    AdminCreatePricingPlanDto,
    AdminUpdatePricingPlanDto,
    PaginationDto,
} from '../dto';

@Injectable()
export class AdminCreditsService {
    constructor(private prisma: PrismaService) { }

    // Credit Policies
    async findAllPolicies(filter: PaginationDto & { modelType?: string }) {
        const { page = 1, limit = 20, modelType } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (modelType) {
            where.modelType = modelType;
        }

        const [policies, total] = await Promise.all([
            this.prisma.creditPolicy.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.creditPolicy.count({ where }),
        ]);

        return { data: policies, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createPolicy(dto: AdminCreateCreditPolicyDto) {
        return this.prisma.creditPolicy.create({
            data: {
                name: dto.name,
                modelType: dto.modelType,
                modelName: dto.modelName,
                costPerUnit: dto.costPerUnit,
                description: dto.description,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async updatePolicy(id: string, dto: AdminUpdateCreditPolicyDto) {
        const existing = await this.prisma.creditPolicy.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Credit policy not found');
        }

        return this.prisma.creditPolicy.update({
            where: { id },
            data: dto,
        });
    }

    async deletePolicy(id: string) {
        await this.prisma.creditPolicy.delete({ where: { id } });
        return { success: true };
    }

    // Pricing Plans
    async findAllPlans(filter: PaginationDto) {
        const { page = 1, limit = 20 } = filter;
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.pricingPlan.findMany({
                skip,
                take: limit,
                orderBy: { sortOrder: 'asc' },
            }),
            this.prisma.pricingPlan.count(),
        ]);

        return { data: plans, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createPlan(dto: AdminCreatePricingPlanDto) {
        return this.prisma.pricingPlan.create({
            data: {
                name: dto.name,
                displayName: dto.displayName,
                monthlyCredits: dto.monthlyCredits,
                price: dto.price,
                features: dto.features || [],
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    async updatePlan(id: string, dto: AdminUpdatePricingPlanDto) {
        const existing = await this.prisma.pricingPlan.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Pricing plan not found');
        }

        return this.prisma.pricingPlan.update({
            where: { id },
            data: dto,
        });
    }

    async deletePlan(id: string) {
        await this.prisma.pricingPlan.delete({ where: { id } });
        return { success: true };
    }

    // Credit statistics
    async getCreditStats() {
        const last30d = new Date();
        last30d.setDate(last30d.getDate() - 30);

        const [totalUsage, transactionCounts] = await Promise.all([
            this.prisma.creditTransaction.aggregate({
                where: { type: 'USAGE', createdAt: { gte: last30d } },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.creditTransaction.groupBy({
                by: ['type'],
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        return {
            last30Days: {
                totalUsage: Math.abs(totalUsage._sum.amount || 0),
                transactionCount: totalUsage._count,
            },
            byType: transactionCounts,
        };
    }
}
