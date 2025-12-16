import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminWebhooksService, WebhookDto, WebhookFilterDto } from './admin-webhooks.service';

@Controller('admin/webhooks')
export class AdminWebhooksController {
    constructor(private readonly webhooksService: AdminWebhooksService) { }

    @Get()
    async findAll(@Query() filter: WebhookFilterDto) {
        return this.webhooksService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.webhooksService.findById(id);
    }

    @Post()
    async create(@Body() dto: WebhookDto) {
        return this.webhooksService.create(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: Partial<WebhookDto>) {
        return this.webhooksService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.webhooksService.delete(id);
    }

    @Post(':id/test')
    async test(@Param('id') id: string) {
        return this.webhooksService.test(id);
    }
}
