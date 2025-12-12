import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AdminOperationsService } from './admin-operations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOperationsController {
    constructor(private operationsService: AdminOperationsService) { }

    @Get('health')
    async getSystemHealth() {
        return this.operationsService.getSystemHealth();
    }

    @Post('cache/clear')
    async clearCache(@Body('type') type: 'templates' | 'models' | 'all' = 'all') {
        return this.operationsService.clearCache(type);
    }

    @Post('model-test')
    async testModel(@Body('modelId') modelId: string) {
        return this.operationsService.testModel(modelId);
    }

    @Post('jobs/force-stop')
    async forceStopJobs() {
        return this.operationsService.forceStopJobs();
    }

    @Get('queue')
    async getQueueStatus() {
        return this.operationsService.getQueueStatus();
    }
}
