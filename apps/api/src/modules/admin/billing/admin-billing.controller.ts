import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminBillingService, PricingPlanDto, UsagePolicyDto, BillingFilterDto } from './admin-billing.service';

@Controller('admin/billing')
export class AdminBillingController {
    constructor(private readonly billingService: AdminBillingService) { }

    // Pricing Plans
    @Get('plans')
    async findAllPlans(@Query() filter: BillingFilterDto) {
        return this.billingService.findAllPlans(filter);
    }

    @Get('plans/:id')
    async findPlanById(@Param('id') id: string) {
        return this.billingService.findPlanById(id);
    }

    @Post('plans')
    async createPlan(@Body() dto: PricingPlanDto) {
        return this.billingService.createPlan(dto);
    }

    @Put('plans/:id')
    async updatePlan(@Param('id') id: string, @Body() dto: Partial<PricingPlanDto>) {
        return this.billingService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    async deletePlan(@Param('id') id: string) {
        return this.billingService.deletePlan(id);
    }

    // Credit Policies
    @Get('credit-policies')
    async findAllCreditPolicies(@Query() filter: BillingFilterDto) {
        return this.billingService.findAllCreditPolicies(filter);
    }

    @Post('credit-policies')
    async createCreditPolicy(@Body() dto: any) {
        return this.billingService.createCreditPolicy(dto);
    }

    @Put('credit-policies/:id')
    async updateCreditPolicy(@Param('id') id: string, @Body() dto: any) {
        return this.billingService.updateCreditPolicy(id, dto);
    }

    @Delete('credit-policies/:id')
    async deleteCreditPolicy(@Param('id') id: string) {
        return this.billingService.deleteCreditPolicy(id);
    }

    // Usage Policies
    @Get('usage-policies')
    async getUsagePolicies() {
        return this.billingService.getUsagePolicies();
    }

    @Put('usage-policies')
    async setUsagePolicy(@Body() dto: UsagePolicyDto) {
        return this.billingService.setUsagePolicy(dto);
    }

    @Delete('usage-policies/:name')
    async deleteUsagePolicy(@Param('name') name: string) {
        return this.billingService.deleteUsagePolicy(name);
    }

    // Stats
    @Get('stats')
    async getBillingStats() {
        return this.billingService.getBillingStats();
    }
}
