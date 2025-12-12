import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers,
            totalPresentations,
            totalGenerations,
            completedGenerations,
            failedGenerations,
            recentCreditsUsed,
        ] = await Promise.all([
            // Total users
            this.prisma.user.count(),
            // Active users (logged in within 24h)
            this.prisma.user.count({
                where: {
                    OR: [
                        { lastLoginAt: { gte: last24h } },
                        { updatedAt: { gte: last24h } },
                    ],
                },
            }),
            // Total presentations
            this.prisma.presentation.count(),
            // Total generation jobs
            this.prisma.generationJob.count(),
            // Completed generations
            this.prisma.generationJob.count({
                where: { status: 'COMPLETED' },
            }),
            // Failed generations
            this.prisma.generationJob.count({
                where: { status: 'FAILED' },
            }),
            // Credits used in last 30 days
            this.prisma.creditTransaction.aggregate({
                where: {
                    type: 'USAGE',
                    createdAt: { gte: last30d },
                },
                _sum: { amount: true },
            }),
        ]);

        const errorRate = totalGenerations > 0
            ? Number(((failedGenerations / totalGenerations) * 100).toFixed(2))
            : 0;

        return {
            totalUsers,
            activeUsers,
            totalPresentations,
            totalGenerations,
            creditsConsumed: Math.abs(recentCreditsUsed._sum.amount || 0),
            errorRate,
        };
    }

    async getRecentActivity(limit = 10) {
        const [recentLogs, recentJobs] = await Promise.all([
            this.prisma.auditLog.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, name: true },
                    },
                },
            }),
            this.prisma.generationJob.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { email: true, name: true },
                    },
                },
            }),
        ]);

        // Merge and sort by createdAt
        const activities = [
            ...recentLogs.map(log => ({
                type: 'audit' as const,
                id: log.id,
                message: `${log.user?.email || 'System'} ${log.action} ${log.resource}`,
                createdAt: log.createdAt,
            })),
            ...recentJobs.map(job => ({
                type: 'job' as const,
                id: job.id,
                message: `Generation job ${job.status.toLowerCase()} for ${job.user?.email}`,
                createdAt: job.createdAt,
            })),
        ]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);

        return activities;
    }

    async getSystemHealth() {
        // Check database connection
        let dbStatus = 'up';
        let dbLatency = 0;
        try {
            const start = Date.now();
            await this.prisma.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - start;
        } catch {
            dbStatus = 'down';
        }

        return {
            services: {
                api: { status: 'up', latency: 0 },
                database: { status: dbStatus, latency: dbLatency },
                redis: { status: 'up', latency: 3 }, // Placeholder
                renderer: { status: 'up', latency: 120 }, // Placeholder
            },
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };
    }

    async getUsageChartData(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dailyUsage = await this.prisma.creditTransaction.groupBy({
            by: ['createdAt'],
            where: {
                type: 'USAGE',
                createdAt: { gte: startDate },
            },
            _sum: { amount: true },
            _count: true,
        });

        const dailyGenerations = await this.prisma.generationJob.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
            },
            _count: true,
        });

        return {
            creditUsage: dailyUsage,
            generations: dailyGenerations,
        };
    }
}
