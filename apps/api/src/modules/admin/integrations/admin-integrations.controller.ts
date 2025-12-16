import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminIntegrationsService, IntegrationDto, IntegrationFilterDto } from './admin-integrations.service';

@Controller('admin/integrations')
export class AdminIntegrationsController {
    constructor(private readonly integrationsService: AdminIntegrationsService) { }

    @Get()
    async findAll(@Query() filter: IntegrationFilterDto) {
        return this.integrationsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.integrationsService.findById(id);
    }

    @Post()
    async create(@Body() dto: IntegrationDto) {
        return this.integrationsService.create(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<IntegrationDto>) {
        return this.integrationsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.integrationsService.delete(id);
    }

    @Post(':id/test')
    async test(@Param('id') id: string) {
        return this.integrationsService.test(id);
    }
}
