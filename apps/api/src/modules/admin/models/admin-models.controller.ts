import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminModelsService } from './admin-models.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreateLlmModelDto, AdminUpdateLlmModelDto, PaginationDto } from '../dto';

@Controller('admin/models')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminModelsController {
    constructor(private modelsService: AdminModelsService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { provider?: string }) {
        return this.modelsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.modelsService.findById(id);
    }

    @Post()
    async create(@Body() dto: AdminCreateLlmModelDto) {
        return this.modelsService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdateLlmModelDto) {
        return this.modelsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.modelsService.delete(id);
    }

    @Post(':id/set-default')
    async setDefault(@Param('id') id: string) {
        return this.modelsService.setDefault(id);
    }
}
