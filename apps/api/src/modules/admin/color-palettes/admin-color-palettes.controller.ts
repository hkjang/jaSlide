import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminColorPalettesService, ColorPaletteDto, ColorPaletteFilterDto } from './admin-color-palettes.service';

@Controller('admin/color-palettes')
export class AdminColorPalettesController {
    constructor(private readonly colorPalettesService: AdminColorPalettesService) { }

    @Get()
    async findAll(@Query() filter: ColorPaletteFilterDto) {
        return this.colorPalettesService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.colorPalettesService.findById(id);
    }

    @Post()
    async create(@Body() dto: ColorPaletteDto) {
        return this.colorPalettesService.create(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<ColorPaletteDto>) {
        return this.colorPalettesService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.colorPalettesService.delete(id);
    }
}
