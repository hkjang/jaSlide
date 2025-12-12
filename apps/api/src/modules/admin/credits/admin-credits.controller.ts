import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminCreditsService } from './admin-credits.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
    AdminCreateCreditPolicyDto,
    AdminUpdateCreditPolicyDto,
    AdminCreatePricingPlanDto,
    AdminUpdatePricingPlanDto,
    PaginationDto,
} from '../dto';

@Controller('admin/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCreditsController {
    constructor(private creditsService: AdminCreditsService) { }

    // Credit Policies
    @Get('policies')
    async findAllPolicies(@Query() filter: PaginationDto & { modelType?: string }) {
        return this.creditsService.findAllPolicies(filter);
    }

    @Post('policies')
    async createPolicy(@Body() dto: AdminCreateCreditPolicyDto) {
        return this.creditsService.createPolicy(dto);
    }

    @Patch('policies/:id')
    async updatePolicy(@Param('id') id: string, @Body() dto: AdminUpdateCreditPolicyDto) {
        return this.creditsService.updatePolicy(id, dto);
    }

    @Delete('policies/:id')
    async deletePolicy(@Param('id') id: string) {
        return this.creditsService.deletePolicy(id);
    }

    // Pricing Plans
    @Get('plans')
    async findAllPlans(@Query() filter: PaginationDto) {
        return this.creditsService.findAllPlans(filter);
    }

    @Post('plans')
    async createPlan(@Body() dto: AdminCreatePricingPlanDto) {
        return this.creditsService.createPlan(dto);
    }

    @Patch('plans/:id')
    async updatePlan(@Param('id') id: string, @Body() dto: AdminUpdatePricingPlanDto) {
        return this.creditsService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    async deletePlan(@Param('id') id: string) {
        return this.creditsService.deletePlan(id);
    }

    // Statistics
    @Get('stats')
    async getCreditStats() {
        return this.creditsService.getCreditStats();
    }
}
