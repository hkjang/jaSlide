import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminAssetsService } from './admin-assets.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaginationDto } from '../dto';

@Controller('admin/assets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAssetsController {
    constructor(private assetsService: AdminAssetsService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { type?: string; search?: string }) {
        return this.assetsService.findAll(filter);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.assetsService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.assetsService.delete(id);
    }
}
