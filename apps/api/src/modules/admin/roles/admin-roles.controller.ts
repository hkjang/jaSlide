import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreateRoleDto, AdminUpdateRoleDto, PaginationDto } from '../dto';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminRolesController {
    constructor(private rolesService: AdminRolesService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto) {
        return this.rolesService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.rolesService.findById(id);
    }

    @Post()
    async create(@Body() dto: AdminCreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.rolesService.delete(id);
    }

    @Post(':roleId/users/:userId')
    async assignToUser(@Param('roleId') roleId: string, @Param('userId') userId: string) {
        return this.rolesService.assignToUser(userId, roleId);
    }

    @Delete(':roleId/users/:userId')
    async removeFromUser(@Param('roleId') roleId: string, @Param('userId') userId: string) {
        return this.rolesService.removeFromUser(userId, roleId);
    }
}
