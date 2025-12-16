import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminFontSetsService, FontSetDto, FontSetFilterDto } from './admin-font-sets.service';

@Controller('admin/font-sets')
export class AdminFontSetsController {
    constructor(private readonly fontSetsService: AdminFontSetsService) { }

    @Get()
    async findAll(@Query() filter: FontSetFilterDto) {
        return this.fontSetsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.fontSetsService.findById(id);
    }

    @Post()
    async create(@Body() dto: FontSetDto) {
        return this.fontSetsService.create(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<FontSetDto>) {
        return this.fontSetsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.fontSetsService.delete(id);
    }
}
