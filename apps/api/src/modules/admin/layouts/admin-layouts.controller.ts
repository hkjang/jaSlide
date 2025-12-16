import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminLayoutsService, LayoutDto, LayoutFilterDto } from './admin-layouts.service';

@Controller('admin/layouts')
export class AdminLayoutsController {
    constructor(private readonly layoutsService: AdminLayoutsService) { }

    @Get()
    async findAll(@Query() filter: LayoutFilterDto) {
        return this.layoutsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.layoutsService.findById(id);
    }

    @Post()
    async create(@Body() dto: LayoutDto) {
        return this.layoutsService.create(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<LayoutDto>) {
        return this.layoutsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.layoutsService.delete(id);
    }
}
