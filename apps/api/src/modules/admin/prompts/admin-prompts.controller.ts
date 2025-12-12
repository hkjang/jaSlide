import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminPromptsService } from './admin-prompts.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreatePromptDto, AdminCreatePromptVersionDto, PaginationDto } from '../dto';

@Controller('admin/prompts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPromptsController {
    constructor(private promptsService: AdminPromptsService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { category?: string }) {
        return this.promptsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.promptsService.findById(id);
    }

    @Post()
    async create(@Body() dto: AdminCreatePromptDto) {
        return this.promptsService.create(dto);
    }

    @Post(':id/versions')
    async createVersion(@Param('id') id: string, @Body() dto: AdminCreatePromptVersionDto) {
        return this.promptsService.createVersion(id, dto);
    }

    @Post(':id/rollback/:version')
    async rollback(@Param('id') id: string, @Param('version') version: string) {
        return this.promptsService.rollback(id, parseInt(version));
    }

    @Post(':id/test')
    async testPrompt(@Param('id') id: string, @Body() input: Record<string, any>) {
        return this.promptsService.testPrompt(id, input);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.promptsService.delete(id);
    }
}
