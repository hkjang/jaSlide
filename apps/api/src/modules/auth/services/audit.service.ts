import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export enum AuditAction {
    // Auth events
    USER_LOGIN = 'user.login',
    USER_LOGOUT = 'user.logout',
    USER_REGISTER = 'user.register',
    PASSWORD_CHANGE = 'password.change',
    PASSWORD_RESET = 'password.reset',

    // Presentation events
    PRESENTATION_CREATE = 'presentation.create',
    PRESENTATION_UPDATE = 'presentation.update',
    PRESENTATION_DELETE = 'presentation.delete',
    PRESENTATION_SHARE = 'presentation.share',
    PRESENTATION_EXPORT = 'presentation.export',
    PRESENTATION_VIEW = 'presentation.view',

    // Slide events
    SLIDE_CREATE = 'slide.create',
    SLIDE_UPDATE = 'slide.update',
    SLIDE_DELETE = 'slide.delete',
    SLIDE_REORDER = 'slide.reorder',

    // Asset events
    ASSET_UPLOAD = 'asset.upload',
    ASSET_DELETE = 'asset.delete',

    // Admin events
    USER_INVITE = 'user.invite',
    USER_REMOVE = 'user.remove',
    ROLE_CHANGE = 'role.change',
    ORG_SETTINGS_UPDATE = 'org.settings.update',
    BILLING_UPDATE = 'billing.update',

    // Generation events
    AI_GENERATE = 'ai.generate',
    AI_EDIT = 'ai.edit',
}

export interface AuditLogEntry {
    userId: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log an audit event
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    resource: entry.resourceType || 'system',
                    resourceId: entry.resourceId || null,
                    details: entry.metadata || {},
                    ipAddress: entry.ipAddress || null,
                    userAgent: entry.userAgent || null,
                },
            });
        } catch (error) {
            // Don't fail the main operation if logging fails
            this.logger.error('Failed to create audit log', error);
        }
    }

    /**
     * Get audit logs for a user
     */
    async getUserLogs(
        userId: string,
        options: { limit?: number; offset?: number; action?: AuditAction } = {},
    ) {
        const { limit = 50, offset = 0, action } = options;

        return this.prisma.auditLog.findMany({
            where: {
                userId,
                ...(action && { action }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get audit logs for a resource
     */
    async getResourceLogs(
        resourceType: string,
        resourceId: string,
        options: { limit?: number; offset?: number } = {},
    ) {
        const { limit = 50, offset = 0 } = options;

        return this.prisma.auditLog.findMany({
            where: {
                resource: resourceType,
                resourceId,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    /**
     * Get organization audit logs
     */
    async getOrgLogs(
        organizationId: string,
        options: { limit?: number; offset?: number; startDate?: Date; endDate?: Date } = {},
    ) {
        const { limit = 100, offset = 0, startDate, endDate } = options;

        // Get all organization users
        const users = await this.prisma.user.findMany({
            where: { organizationId },
            select: { id: true },
        });

        const userIds = users.map((u: { id: string }) => u.id);

        return this.prisma.auditLog.findMany({
            where: {
                userId: { in: userIds },
                ...(startDate && { createdAt: { gte: startDate } }),
                ...(endDate && { createdAt: { lte: endDate } }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }

    /**
     * Get security-related logs (login, password changes, etc.)
     */
    async getSecurityLogs(userId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const securityActions = [
            AuditAction.USER_LOGIN,
            AuditAction.USER_LOGOUT,
            AuditAction.PASSWORD_CHANGE,
            AuditAction.PASSWORD_RESET,
            AuditAction.ROLE_CHANGE,
        ];

        return this.prisma.auditLog.findMany({
            where: {
                userId,
                action: { in: securityActions },
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Delete old audit logs (retention policy)
     */
    async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const result = await this.prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
            },
        });

        this.logger.log(`Cleaned up ${result.count} audit logs older than ${retentionDays} days`);
        return result.count;
    }

    /**
     * Export audit logs for compliance
     */
    async exportLogs(
        organizationId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<any[]> {
        const logs = await this.getOrgLogs(organizationId, {
            limit: 10000,
            startDate,
            endDate,
        });

        return logs.map((log: any) => ({
            timestamp: log.createdAt.toISOString(),
            user: log.user?.email || log.userId,
            action: log.action,
            resourceType: log.resource,
            resourceId: log.resourceId,
            ipAddress: log.ipAddress,
            details: log.details,
        }));
    }
}
