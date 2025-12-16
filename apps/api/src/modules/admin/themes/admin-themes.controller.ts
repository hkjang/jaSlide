import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminThemesService, ThemeDto, ThemeFilterDto } from './admin-themes.service';

@Controller('admin/themes')
export class AdminThemesController {
    constructor(private readonly themesService: AdminThemesService) { }

    @Get()
    async findAll(@Query() filter: ThemeFilterDto) {
        return this.themesService.findAll(filter);
    }

    @Get(':name')
    async findByName(@Param('name') name: string) {
        return this.themesService.findByName(name);
    }

    @Post()
    async create(@Body() dto: ThemeDto) {
        return this.themesService.create(dto);
    }

    @Put(':name')
    async update(@Param('name') name: string, @Body() dto: Partial<ThemeDto>) {
        return this.themesService.update(name, dto);
    }

    @Delete(':name')
    async delete(@Param('name') name: string) {
        return this.themesService.delete(name);
    }
}
