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
} from '@nestjs/common';
import { AdminOrganizationsService } from './admin-organizations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreateOrganizationDto, AdminUpdateOrganizationDto, PaginationDto } from '../dto';

@Controller('admin/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrganizationsController {
    constructor(private organizationsService: AdminOrganizationsService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { search?: string }) {
        return this.organizationsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.organizationsService.findById(id);
    }

    @Post()
    async create(@Body() dto: AdminCreateOrganizationDto) {
        return this.organizationsService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdateOrganizationDto) {
        return this.organizationsService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.organizationsService.delete(id);
    }

    @Get(':id/members')
    async getMembers(
        @Param('id') id: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.organizationsService.getMembers(id, page, limit);
    }
}
