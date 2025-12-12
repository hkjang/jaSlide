import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminLogsService } from './admin-logs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminAuditLogFilterDto, AdminApiLogFilterDto } from '../dto';

@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminLogsController {
    constructor(private logsService: AdminLogsService) { }

    @Get('audit')
    async findAuditLogs(@Query() filter: AdminAuditLogFilterDto) {
        return this.logsService.findAuditLogs(filter);
    }

    @Get('api')
    async findApiLogs(@Query() filter: AdminApiLogFilterDto) {
        return this.logsService.findApiLogs(filter);
    }

    @Get('export/audit')
    async exportAuditLogs(
        @Query('format') format: 'json' | 'csv' = 'json',
        @Query() filter: AdminAuditLogFilterDto,
    ) {
        return this.logsService.exportLogs('audit', filter, format);
    }

    @Get('export/api')
    async exportApiLogs(
        @Query('format') format: 'json' | 'csv' = 'json',
        @Query() filter: AdminApiLogFilterDto,
    ) {
        return this.logsService.exportLogs('api', filter, format);
    }
}
