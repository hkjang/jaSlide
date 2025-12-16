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
import { ColorPalettesService } from './color-palettes.service';
import { CreateColorPaletteDto, UpdateColorPaletteDto } from './dto/color-palettes.dto';

@Controller('organizations/:organizationId/color-palettes')
@UseGuards(JwtAuthGuard)
export class ColorPalettesController {
    constructor(private readonly colorPalettesService: ColorPalettesService) { }

    @Post()
    async create(
        @Param('organizationId') organizationId: string,
        @Body() dto: CreateColorPaletteDto,
        @Request() req: any,
    ) {
        return this.colorPalettesService.create(organizationId, req.user.id, dto);
    }

    @Get()
    async findAll(
        @Param('organizationId') organizationId: string,
        @Request() req: any,
    ) {
        return this.colorPalettesService.findAll(organizationId, req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.colorPalettesService.findById(id, req.user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateColorPaletteDto,
        @Request() req: any,
    ) {
        return this.colorPalettesService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.colorPalettesService.delete(id, req.user.id);
    }
}
