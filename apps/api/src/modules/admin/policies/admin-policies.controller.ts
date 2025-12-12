import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminPoliciesService } from './admin-policies.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminCreatePolicyDto, AdminUpdatePolicyDto, PaginationDto } from '../dto';

@Controller('admin/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPoliciesController {
    constructor(private policiesService: AdminPoliciesService) { }

    @Get()
    async findAll(@Query() filter: PaginationDto & { category?: string }) {
        return this.policiesService.findAll(filter);
    }

    @Post()
    async create(@Body() dto: AdminCreatePolicyDto) {
        return this.policiesService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdatePolicyDto) {
        return this.policiesService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.policiesService.delete(id);
    }
}
