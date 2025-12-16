import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminApiKeysService, ApiKeyDto, ApiKeyFilterDto } from './admin-api-keys.service';

@Controller('admin/api-keys')
export class AdminApiKeysController {
    constructor(private readonly apiKeysService: AdminApiKeysService) { }

    @Get()
    async findAll(@Query() filter: ApiKeyFilterDto) {
        return this.apiKeysService.findAll(filter);
    }

    @Post()
    async create(@Body() dto: ApiKeyDto) {
        return this.apiKeysService.create(dto);
    }

    @Post(':id/regenerate')
    async regenerate(@Param('id') id: string) {
        return this.apiKeysService.regenerate(id);
    }

    @Post(':id/revoke')
    async revoke(@Param('id') id: string) {
        return this.apiKeysService.revoke(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.apiKeysService.delete(id);
    }
}
