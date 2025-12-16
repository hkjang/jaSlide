import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AdminPermissionsService, PermissionDto, ResourcePolicyDto } from './admin-permissions.service';

@Controller('admin/permissions')
export class AdminPermissionsController {
    constructor(private readonly permissionsService: AdminPermissionsService) { }

    // ===============================
    // Permission Definitions
    // ===============================

    @Get()
    async getAllPermissions() {
        return this.permissionsService.getAllPermissions();
    }

    @Post()
    async createPermission(@Body() dto: PermissionDto) {
        return this.permissionsService.createPermission(dto);
    }

    @Put(':name')
    async updatePermission(
        @Param('name') name: string,
        @Body() dto: Partial<PermissionDto>,
    ) {
        return this.permissionsService.updatePermission(name, dto);
    }

    @Delete(':name')
    async deletePermission(@Param('name') name: string) {
        return this.permissionsService.deletePermission(name);
    }

    // ===============================
    // Role-Permission Mapping
    // ===============================

    @Get('role/:roleId')
    async getRolePermissions(@Param('roleId') roleId: string) {
        return this.permissionsService.getRolePermissions(roleId);
    }

    @Put('role/:roleId')
    async setRolePermissions(
        @Param('roleId') roleId: string,
        @Body('permissions') permissions: string[],
    ) {
        return this.permissionsService.setRolePermissions(roleId, permissions);
    }

    @Post('role/:roleId/add')
    async addPermissionToRole(
        @Param('roleId') roleId: string,
        @Body('permission') permission: string,
    ) {
        return this.permissionsService.addPermissionToRole(roleId, permission);
    }

    @Delete('role/:roleId/:permission')
    async removePermissionFromRole(
        @Param('roleId') roleId: string,
        @Param('permission') permission: string,
    ) {
        return this.permissionsService.removePermissionFromRole(roleId, permission);
    }

    // ===============================
    // Resource Policies
    // ===============================

    @Get('resources')
    async getResourcePolicies() {
        return this.permissionsService.getResourcePolicies();
    }

    @Put('resources/:resource')
    async setResourcePolicy(@Body() dto: ResourcePolicyDto) {
        return this.permissionsService.setResourcePolicy(dto);
    }

    @Delete('resources/:resource')
    async deleteResourcePolicy(@Param('resource') resource: string) {
        return this.permissionsService.deleteResourcePolicy(resource);
    }

    // ===============================
    // Permission Check
    // ===============================

    @Get('check/:userId/:resource/:action')
    async checkPermission(
        @Param('userId') userId: string,
        @Param('resource') resource: string,
        @Param('action') action: string,
    ) {
        const hasPermission = await this.permissionsService.checkUserPermission(userId, resource, action);
        return { userId, resource, action, hasPermission };
    }
}
