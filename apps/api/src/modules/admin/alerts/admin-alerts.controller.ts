import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminAlertsService } from './admin-alerts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreateAlertDto, AdminUpdateAlertDto, PaginationDto } from '../dto';

@Controller('admin/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAlertsController {
    constructor(private alertsService: AdminAlertsService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { eventType?: string }) {
        return this.alertsService.findAll(filter);
    }

    @Post()
    async create(@Body() dto: AdminCreateAlertDto) {
        return this.alertsService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdateAlertDto) {
        return this.alertsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.alertsService.delete(id);
    }
}
