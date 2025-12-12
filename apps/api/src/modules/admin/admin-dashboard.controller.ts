import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
    constructor(private dashboardService: AdminDashboardService) { }

    @Get('stats')
    async getStats() {
        return this.dashboardService.getStats();
    }

    @Get('activity')
    async getRecentActivity() {
        return this.dashboardService.getRecentActivity();
    }

    @Get('health')
    async getSystemHealth() {
        return this.dashboardService.getSystemHealth();
    }

    @Get('charts')
    async getChartData() {
        return this.dashboardService.getUsageChartData();
    }
}
