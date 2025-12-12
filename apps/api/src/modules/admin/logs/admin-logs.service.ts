import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditLogFilterDto, AdminApiLogFilterDto } from '../dto';

@Injectable()
export class AdminLogsService {
    constructor(private prisma: PrismaService) { }

    async findAuditLogs(filter: AdminAuditLogFilterDto) {
        const { page = 1, limit = 20, userId, action, resource, startDate, endDate } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = { contains: action, mode: 'insensitive' };
        if (resource) where.resource = resource;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, name: true } } },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findApiLogs(filter: AdminApiLogFilterDto) {
        const { page = 1, limit = 20, userId, path, statusCode, startDate, endDate } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (userId) where.userId = userId;
        if (path) where.path = { contains: path, mode: 'insensitive' };
        if (statusCode) where.statusCode = statusCode;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            this.prisma.apiLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.apiLog.count({ where }),
        ]);

        return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async exportLogs(type: 'audit' | 'api', filter: any, format: 'json' | 'csv' = 'json') {
        let data: any[];

        if (type === 'audit') {
            data = await this.prisma.auditLog.findMany({
                where: this.buildWhereClause(filter),
                orderBy: { createdAt: 'desc' },
                take: 10000,
            });
        } else {
            data = await this.prisma.apiLog.findMany({
                where: this.buildWhereClause(filter),
                orderBy: { createdAt: 'desc' },
                take: 10000,
            });
        }

        if (format === 'json') {
            return { data, format: 'json' };
        }

        // CSV format
        if (data.length === 0) return { data: '', format: 'csv' };

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(v => JSON.stringify(v ?? '')).join(',')
        );

        return { data: [headers, ...rows].join('\n'), format: 'csv' };
    }

    private buildWhereClause(filter: any) {
        const where: any = {};
        if (filter.startDate) where.createdAt = { gte: new Date(filter.startDate) };
        if (filter.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filter.endDate) };
        return where;
    }
}
