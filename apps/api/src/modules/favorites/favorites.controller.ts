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
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto, UpdateFavoriteDto } from './dto/favorites.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Post()
    async create(@Body() dto: CreateFavoriteDto, @Request() req: any) {
        return this.favoritesService.create(req.user.id, dto);
    }

    @Get()
    async findAll(@Query('type') resourceType: string, @Request() req: any) {
        return this.favoritesService.findAll(req.user.id, resourceType);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateFavoriteDto,
        @Request() req: any,
    ) {
        return this.favoritesService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.favoritesService.delete(id, req.user.id);
    }

    @Post('reorder')
    async reorder(
        @Body() body: { resourceType: string; orderedIds: string[] },
        @Request() req: any,
    ) {
        return this.favoritesService.reorder(req.user.id, body.resourceType, body.orderedIds);
    }
}
