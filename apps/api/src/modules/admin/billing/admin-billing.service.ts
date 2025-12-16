import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PricingPlanDto {
    name: string;
    displayName: string;
    monthlyCredits: number;
    price: number;
    features?: string[];
    isActive?: boolean;
    sortOrder?: number;
}

export interface UsagePolicyDto {
    name: string;
    type: string;
    limit: number;
    period: string;
    action: string;
    description?: string;
}

export interface BillingFilterDto {
    page?: number;
    limit?: number;
    isActive?: boolean;
}

@Injectable()
export class AdminBillingService {
    constructor(private prisma: PrismaService) { }

    // ===============================
    // Pricing Plans
    // ===============================

    async findAllPlans(filter: BillingFilterDto) {
        const { page = 1, limit = 20, isActive } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;

        const [plans, total] = await Promise.all([
            this.prisma.pricingPlan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { sortOrder: 'asc' },
            }),
            this.prisma.pricingPlan.count({ where }),
        ]);

        return { data: plans, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findPlanById(id: string) {
        const plan = await this.prisma.pricingPlan.findUnique({ where: { id } });
        if (!plan) throw new NotFoundException('Pricing plan not found');
        return plan;
    }

    async createPlan(dto: PricingPlanDto) {
        const plan = await this.prisma.pricingPlan.create({
            data: {
                ...dto,
                price: new Decimal(dto.price),
                features: dto.features || [],
            },
        });
        await this.createAuditLog('CREATE', 'PRICING_PLAN', dto);
        return plan;
    }

    async updatePlan(id: string, dto: Partial<PricingPlanDto>) {
        const existing = await this.prisma.pricingPlan.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Pricing plan not found');

        const updateData: any = { ...dto };
        if (dto.price !== undefined) {
            updateData.price = new Decimal(dto.price);
        }

        const plan = await this.prisma.pricingPlan.update({ where: { id }, data: updateData });
        await this.createAuditLog('UPDATE', 'PRICING_PLAN', { id, ...dto });
        return plan;
    }

    async deletePlan(id: string) {
        await this.prisma.pricingPlan.delete({ where: { id } });
        await this.createAuditLog('DELETE', 'PRICING_PLAN', { id });
        return { success: true };
    }

    // ===============================
    // Credit Policies
    // ===============================

    async findAllCreditPolicies(filter: BillingFilterDto) {
        const { page = 1, limit = 20, isActive } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;

        const [policies, total] = await Promise.all([
            this.prisma.creditPolicy.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
            this.prisma.creditPolicy.count({ where }),
        ]);

        return { data: policies, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createCreditPolicy(dto: { name: string; modelType: string; modelName?: string; costPerUnit: number; description?: string }) {
        const policy = await this.prisma.creditPolicy.create({ data: dto });
        await this.createAuditLog('CREATE', 'CREDIT_POLICY', dto);
        return policy;
    }

    async updateCreditPolicy(id: string, dto: Partial<{ name: string; costPerUnit: number; description?: string; isActive?: boolean }>) {
        const policy = await this.prisma.creditPolicy.update({ where: { id }, data: dto });
        await this.createAuditLog('UPDATE', 'CREDIT_POLICY', { id, ...dto });
        return policy;
    }

    async deleteCreditPolicy(id: string) {
        await this.prisma.creditPolicy.delete({ where: { id } });
        await this.createAuditLog('DELETE', 'CREDIT_POLICY', { id });
        return { success: true };
    }

    // ===============================
    // Usage Policies
    // ===============================

    async getUsagePolicies() {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'billing.usage-policies' },
        });
        return policy?.value || [];
    }

    async setUsagePolicy(dto: UsagePolicyDto) {
        const policies = (await this.getUsagePolicies()) as unknown as UsagePolicyDto[];
        const index = policies.findIndex(p => p.name === dto.name);

        if (index >= 0) {
            policies[index] = dto;
        } else {
            policies.push(dto);
        }

        await this.prisma.systemPolicy.upsert({
            where: { key: 'billing.usage-policies' },
            create: { category: 'billing', key: 'billing.usage-policies', value: policies as unknown as any },
            update: { value: policies as unknown as any },
        });

        await this.createAuditLog('SET', 'USAGE_POLICY', dto);
        return dto;
    }

    async deleteUsagePolicy(name: string) {
        const policies = (await this.getUsagePolicies()) as unknown as UsagePolicyDto[];
        const filtered = policies.filter(p => p.name !== name);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'billing.usage-policies' },
            create: { category: 'billing', key: 'billing.usage-policies', value: filtered as unknown as any },
            update: { value: filtered as unknown as any },
        });

        await this.createAuditLog('DELETE', 'USAGE_POLICY', { name });
        return { success: true };
    }

    // ===============================
    // Billing Stats
    // ===============================

    async getBillingStats() {
        const [totalRevenue, activeUsers, creditsConsumed] = await Promise.all([
            this.prisma.creditTransaction.aggregate({
                where: { type: 'PURCHASE' },
                _sum: { amount: true },
            }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.creditTransaction.aggregate({
                where: { type: 'USAGE' },
                _sum: { amount: true },
            }),
        ]);

        return {
            totalCreditsPurchased: Math.abs(totalRevenue._sum.amount || 0),
            activeUsers,
            totalCreditsConsumed: Math.abs(creditsConsumed._sum.amount || 0),
        };
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
