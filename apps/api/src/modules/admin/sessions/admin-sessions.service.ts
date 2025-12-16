import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface SessionFilterDto {
    page?: number;
    limit?: number;
    userId?: string;
    search?: string;
}

@Injectable()
export class AdminSessionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: SessionFilterDto) {
        const { page = 1, limit = 20, userId, search } = filter;
        const skip = (page - 1) * limit;

        const where: any = {
            expires: { gt: new Date() }, // Only active sessions
        };

        if (userId) {
            where.userId = userId;
        }

        if (search) {
            where.user = {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [sessions, total] = await Promise.all([
            this.prisma.session.findMany({
                where,
                skip,
                take: limit,
                orderBy: { expires: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            }),
            this.prisma.session.count({ where }),
        ]);

        return {
            data: sessions.map(s => ({
                id: s.id,
                sessionToken: s.sessionToken.substring(0, 8) + '...', // Mask token
                userId: s.userId,
                user: s.user,
                expires: s.expires,
                isActive: s.expires > new Date(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findByUserId(userId: string) {
        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                expires: { gt: new Date() },
            },
            orderBy: { expires: 'desc' },
        });

        return sessions.map(s => ({
            id: s.id,
            sessionToken: s.sessionToken.substring(0, 8) + '...',
            expires: s.expires,
        }));
    }

    async terminateSession(sessionId: string) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.prisma.session.delete({
            where: { id: sessionId },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'TERMINATE_SESSION',
                resource: 'SESSION',
                resourceId: sessionId,
                details: { userId: session.userId },
            },
        });

        return { success: true, message: 'Session terminated' };
    }

    async terminateAllUserSessions(userId: string) {
        const result = await this.prisma.session.deleteMany({
            where: { userId },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'TERMINATE_ALL_SESSIONS',
                resource: 'SESSION',
                details: { userId, count: result.count },
            },
        });

        return { success: true, terminatedCount: result.count };
    }

    async extendSession(sessionId: string, extensionMinutes: number = 60) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const newExpiry = new Date(session.expires.getTime() + extensionMinutes * 60 * 1000);

        const updated = await this.prisma.session.update({
            where: { id: sessionId },
            data: { expires: newExpiry },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'EXTEND_SESSION',
                resource: 'SESSION',
                resourceId: sessionId,
                details: { userId: session.userId, extensionMinutes, newExpiry },
            },
        });

        return {
            id: updated.id,
            expires: updated.expires,
            message: `Session extended by ${extensionMinutes} minutes`,
        };
    }

    async getSessionStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [activeSessions, totalUsers, recentLogins] = await Promise.all([
            this.prisma.session.count({ where: { expires: { gt: now } } }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.loginLog.count({
                where: { success: true, createdAt: { gte: last24h } },
            }),
        ]);

        const sessionsByRole = await this.prisma.session.groupBy({
            by: ['userId'],
            where: { expires: { gt: now } },
        });

        return {
            activeSessions,
            totalActiveUsers: totalUsers,
            recentLogins24h: recentLogins,
            sessionCount: sessionsByRole.length,
        };
    }
}
