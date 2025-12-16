import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FontSetsService } from './font-sets.service';
import { CreateFontSetDto, UpdateFontSetDto } from './dto/font-sets.dto';

@Controller('organizations/:organizationId/font-sets')
@UseGuards(JwtAuthGuard)
export class FontSetsController {
    constructor(private readonly fontSetsService: FontSetsService) { }

    @Post()
    async create(
        @Param('organizationId') organizationId: string,
        @Body() dto: CreateFontSetDto,
        @Request() req: any,
    ) {
        return this.fontSetsService.create(organizationId, req.user.id, dto);
    }

    @Get()
    async findAll(
        @Param('organizationId') organizationId: string,
        @Request() req: any,
    ) {
        return this.fontSetsService.findAll(organizationId, req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.fontSetsService.findById(id, req.user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateFontSetDto,
        @Request() req: any,
    ) {
        return this.fontSetsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.fontSetsService.delete(id, req.user.id);
    }
}
