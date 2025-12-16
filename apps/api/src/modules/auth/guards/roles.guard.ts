import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Role hierarchy: SYSTEM_ADMIN > ORG_ADMIN > ADMIN > OPERATOR > AUDITOR > USER
const ROLE_HIERARCHY: Record<string, string[]> = {
    'SYSTEM_ADMIN': ['SYSTEM_ADMIN', 'ORG_ADMIN', 'ADMIN', 'OPERATOR', 'AUDITOR', 'USER'],
    'ORG_ADMIN': ['ORG_ADMIN', 'ADMIN', 'OPERATOR', 'AUDITOR', 'USER'],
    'ADMIN': ['ADMIN', 'OPERATOR', 'AUDITOR', 'USER'],
    'OPERATOR': ['OPERATOR', 'AUDITOR', 'USER'],
    'AUDITOR': ['AUDITOR', 'USER'],
    'USER': ['USER'],
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Get all roles the user's role grants access to
        const userGrantedRoles = ROLE_HIERARCHY[user.role] || [user.role];

        // Check if any of the user's granted roles match any required role
        const hasRole = requiredRoles.some(role => userGrantedRoles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions - Admin access required');
        }

        return true;
    }
}
