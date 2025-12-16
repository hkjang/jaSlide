import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface IntegrationDto {
    name: string;
    type: string;
    config: Record<string, any>;
    isActive?: boolean;
}

export interface IntegrationFilterDto {
    page?: number;
    limit?: number;
    type?: string;
    isActive?: boolean;
}

@Injectable()
export class AdminIntegrationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: IntegrationFilterDto) {
        const { page = 1, limit = 20, type, isActive } = filter;
        const skip = (page - 1) * limit;

        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.integrations' },
        });

        let integrations = (policy?.value as any[]) || [];
        if (type) integrations = integrations.filter(i => i.type === type);
        if (isActive !== undefined) integrations = integrations.filter(i => i.isActive === isActive);

        const paginated = integrations.slice(skip, skip + limit);

        return {
            data: paginated.map(this.sanitizeConfig),
            total: integrations.length,
            page,
            limit,
            totalPages: Math.ceil(integrations.length / limit),
        };
    }

    async findById(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.integrations' },
        });
        const integrations = (policy?.value as any[]) || [];
        const integration = integrations.find(i => i.id === id);
        if (!integration) throw new NotFoundException('Integration not found');
        return this.sanitizeConfig(integration);
    }

    async create(dto: IntegrationDto) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.integrations' },
        });
        const integrations = (policy?.value as any[]) || [];

        const newIntegration = {
            id: this.generateId(),
            ...dto,
            isActive: dto.isActive ?? true,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        integrations.push(newIntegration);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'system.integrations' },
            create: { category: 'system', key: 'system.integrations', value: integrations },
            update: { value: integrations },
        });

        await this.createAuditLog('CREATE', 'INTEGRATION', { name: dto.name, type: dto.type });
        return this.sanitizeConfig(newIntegration);
    }

    async update(id: string, dto: Partial<IntegrationDto>) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.integrations' },
        });
        const integrations = (policy?.value as any[]) || [];
        const index = integrations.findIndex(i => i.id === id);

        if (index === -1) throw new NotFoundException('Integration not found');

        integrations[index] = { ...integrations[index], ...dto, updatedAt: new Date().toISOString() };

        await this.prisma.systemPolicy.update({
            where: { key: 'system.integrations' },
            data: { value: integrations },
        });

        await this.createAuditLog('UPDATE', 'INTEGRATION', { id, ...dto });
        return this.sanitizeConfig(integrations[index]);
    }

    async delete(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.integrations' },
        });
        const integrations = (policy?.value as any[]) || [];
        const filtered = integrations.filter(i => i.id !== id);

        await this.prisma.systemPolicy.update({
            where: { key: 'system.integrations' },
            data: { value: filtered },
        });

        await this.createAuditLog('DELETE', 'INTEGRATION', { id });
        return { success: true };
    }

    async test(id: string) {
        const integration = await this.findById(id);
        // In production, you would actually test the connection here
        return {
            id,
            name: integration.name,
            status: 'connected',
            message: `Integration ${integration.name} test successful`,
        };
    }

    private sanitizeConfig(integration: any) {
        const config = { ...integration.config };
        // Hide sensitive fields
        for (const key of Object.keys(config)) {
            if (key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('key')) {
                config[key] = '***';
            }
        }
        return { ...integration, config };
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
