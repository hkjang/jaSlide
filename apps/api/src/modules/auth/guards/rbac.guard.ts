import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

// Role hierarchy
export enum Role {
    VIEWER = 'VIEWER',
    EDITOR = 'EDITOR',
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
}

// Permission types
export enum Permission {
    // Presentation permissions
    PRESENTATION_VIEW = 'presentation:view',
    PRESENTATION_CREATE = 'presentation:create',
    PRESENTATION_EDIT = 'presentation:edit',
    PRESENTATION_DELETE = 'presentation:delete',
    PRESENTATION_SHARE = 'presentation:share',
    PRESENTATION_EXPORT = 'presentation:export',

    // Slide permissions
    SLIDE_VIEW = 'slide:view',
    SLIDE_CREATE = 'slide:create',
    SLIDE_EDIT = 'slide:edit',
    SLIDE_DELETE = 'slide:delete',

    // Asset permissions
    ASSET_UPLOAD = 'asset:upload',
    ASSET_DELETE = 'asset:delete',

    // Admin permissions
    USER_MANAGE = 'user:manage',
    ORG_MANAGE = 'org:manage',
    BILLING_MANAGE = 'billing:manage',
    TEMPLATE_MANAGE = 'template:manage',
}

// Role-permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.VIEWER]: [
        Permission.PRESENTATION_VIEW,
        Permission.SLIDE_VIEW,
    ],
    [Role.EDITOR]: [
        Permission.PRESENTATION_VIEW,
        Permission.PRESENTATION_CREATE,
        Permission.PRESENTATION_EDIT,
        Permission.PRESENTATION_EXPORT,
        Permission.SLIDE_VIEW,
        Permission.SLIDE_CREATE,
        Permission.SLIDE_EDIT,
        Permission.ASSET_UPLOAD,
    ],
    [Role.ADMIN]: [
        Permission.PRESENTATION_VIEW,
        Permission.PRESENTATION_CREATE,
        Permission.PRESENTATION_EDIT,
        Permission.PRESENTATION_DELETE,
        Permission.PRESENTATION_SHARE,
        Permission.PRESENTATION_EXPORT,
        Permission.SLIDE_VIEW,
        Permission.SLIDE_CREATE,
        Permission.SLIDE_EDIT,
        Permission.SLIDE_DELETE,
        Permission.ASSET_UPLOAD,
        Permission.ASSET_DELETE,
        Permission.USER_MANAGE,
        Permission.TEMPLATE_MANAGE,
    ],
    [Role.OWNER]: Object.values(Permission),
};

export const PERMISSIONS_KEY = 'permissions';

// Decorator for requiring permissions
export function RequirePermissions(...permissions: Permission[]) {
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
        Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor?.value || target);
    };
}

@Injectable()
export class RbacGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<Permission[]>(
            PERMISSIONS_KEY,
            context.getHandler(),
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Get user's role (from token or database)
        const userRole = await this.getUserRole(user.id, request.params.presentationId);

        // Check if user has required permissions
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];
        const hasPermission = requiredPermissions.every((p) =>
            userPermissions.includes(p),
        );

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }

    private async getUserRole(userId: string, presentationId?: string): Promise<Role> {
        // If presentation ID is provided, check resource-specific role
        if (presentationId) {
            const presentation = await this.prisma.presentation.findUnique({
                where: { id: presentationId },
                select: { userId: true },
            });

            // Check if user is owner of presentation
            if (presentation?.userId === userId) {
                return Role.OWNER;
            }

            // For shared access, check if presentation is public
            if ((presentation as any)?.isPublic) {
                return Role.VIEWER;
            }
        }

        // Check user's organization and role
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true, role: true },
        });

        if (user?.organizationId) {
            // User is part of an organization
            if (user.role === 'ORG_ADMIN') {
                return Role.ADMIN;
            }
            return Role.EDITOR;
        }

        // Default role for authenticated users
        return Role.EDITOR;
    }

    private mapSharePermissionToRole(permission: string): Role {
        switch (permission) {
            case 'EDIT':
                return Role.EDITOR;
            case 'VIEW':
            default:
                return Role.VIEWER;
        }
    }

    private mapOrgRoleToRole(role: string): Role {
        switch (role) {
            case 'OWNER':
                return Role.OWNER;
            case 'ADMIN':
                return Role.ADMIN;
            case 'MEMBER':
                return Role.EDITOR;
            default:
                return Role.VIEWER;
        }
    }
}

@Injectable()
export class RbacService {
    constructor(private prisma: PrismaService) { }

    // Check if user has permission for a resource
    async hasPermission(
        userId: string,
        permission: Permission,
        resourceId?: string,
    ): Promise<boolean> {
        const role = await this.getUserRole(userId, resourceId);
        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    }

    private async getUserRole(userId: string, resourceId?: string): Promise<Role> {
        if (resourceId) {
            const presentation = await this.prisma.presentation.findUnique({
                where: { id: resourceId },
                select: { userId: true },
            });

            if (presentation?.userId === userId) {
                return Role.OWNER;
            }
        }

        return Role.EDITOR;
    }

    // Get user's permissions
    async getUserPermissions(userId: string): Promise<Permission[]> {
        const role = await this.getUserRole(userId);
        return ROLE_PERMISSIONS[role] || [];
    }

    // Assign role to user for organization (simplified without organizationMember table)
    async assignOrgRole(
        organizationId: string,
        userId: string,
        role: 'ADMIN' | 'USER',
    ): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                organizationId,
                role: role === 'ADMIN' ? 'ORG_ADMIN' : 'USER',
            },
        });
    }
}
