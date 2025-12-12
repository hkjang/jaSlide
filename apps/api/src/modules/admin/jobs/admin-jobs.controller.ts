import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJobsService } from './admin-jobs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminJobFilterDto } from '../dto';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminJobsController {
    constructor(private jobsService: AdminJobsService) { }

    @Get()
    async findAll(@Query() filter: AdminJobFilterDto) {
        return this.jobsService.findAll(filter);
    }

    @Get('stats')
    async getStats() {
        return this.jobsService.getStats();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.jobsService.findById(id);
    }

    @Post(':id/retry')
    async retry(@Param('id') id: string) {
        return this.jobsService.retry(id);
    }

    @Post(':id/cancel')
    async cancel(@Param('id') id: string) {
        return this.jobsService.cancel(id);
    }
}
