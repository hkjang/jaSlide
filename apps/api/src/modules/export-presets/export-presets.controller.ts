import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportPresetsService } from './export-presets.service';
import { CreateExportPresetDto, UpdateExportPresetDto } from './dto/export-presets.dto';

@Controller('export-presets')
@UseGuards(JwtAuthGuard)
export class ExportPresetsController {
    constructor(private readonly exportPresetsService: ExportPresetsService) { }

    @Post()
    async create(@Body() dto: CreateExportPresetDto, @Request() req: any) {
        return this.exportPresetsService.create(req.user.id, dto);
    }

    @Get()
    async findAll(@Request() req: any) {
        return this.exportPresetsService.findAll(req.user.id);
    }

    @Get('default')
    async findDefault(@Query('format') format: string, @Request() req: any) {
        return this.exportPresetsService.findDefault(req.user.id, format);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.exportPresetsService.findById(id, req.user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateExportPresetDto,
        @Request() req: any,
    ) {
        return this.exportPresetsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.exportPresetsService.delete(id, req.user.id);
    }
}
