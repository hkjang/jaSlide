import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminSeedDataService, SeedDataDto, SeedDataFilterDto, SeedDataType } from './admin-seed-data.service';

@Controller('admin/seed-data')
export class AdminSeedDataController {
    constructor(private readonly seedDataService: AdminSeedDataService) { }

    @Get()
    async findAll(@Query() filter: SeedDataFilterDto) {
        return this.seedDataService.findAll(filter);
    }

    @Get('categories/:type')
    async getCategoriesByType(@Param('type') type: SeedDataType) {
        return this.seedDataService.getCategoriesByType(type);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.seedDataService.findById(id);
    }

    @Post()
    async create(@Body() dto: SeedDataDto) {
        return this.seedDataService.create(dto);
    }

    @Post('bulk')
    async bulkImport(@Body() items: SeedDataDto[]) {
        return this.seedDataService.bulkImport(items);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<SeedDataDto>) {
        return this.seedDataService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.seedDataService.delete(id);
    }
}
