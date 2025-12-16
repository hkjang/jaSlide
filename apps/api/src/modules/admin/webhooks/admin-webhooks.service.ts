import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface WebhookDto {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    secret?: string;
    isActive?: boolean;
}

export interface WebhookFilterDto {
    page?: number;
    limit?: number;
    isActive?: boolean;
}

@Injectable()
export class AdminWebhooksService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: WebhookFilterDto) {
        const { page = 1, limit = 20, isActive } = filter;
        const skip = (page - 1) * limit;

        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.webhooks' },
        });

        let webhooks = (policy?.value as any[]) || [];
        if (isActive !== undefined) webhooks = webhooks.filter(w => w.isActive === isActive);

        const paginated = webhooks.slice(skip, skip + limit);

        return {
            data: paginated.map(w => ({ ...w, secret: w.secret ? '***' : undefined })),
            total: webhooks.length,
            page,
            limit,
            totalPages: Math.ceil(webhooks.length / limit),
        };
    }

    async findById(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.webhooks' },
        });
        const webhooks = (policy?.value as any[]) || [];
        const webhook = webhooks.find(w => w.id === id);
        if (!webhook) throw new NotFoundException('Webhook not found');
        return { ...webhook, secret: webhook.secret ? '***' : undefined };
    }

    async create(dto: WebhookDto) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.webhooks' },
        });
        const webhooks = (policy?.value as any[]) || [];

        const newWebhook = {
            id: this.generateId(),
            ...dto,
            isActive: dto.isActive ?? true,
            createdAt: new Date().toISOString(),
        };

        webhooks.push(newWebhook);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'system.webhooks' },
            create: { category: 'system', key: 'system.webhooks', value: webhooks },
            update: { value: webhooks },
        });

        await this.createAuditLog('CREATE', 'WEBHOOK', { name: dto.name, url: dto.url });
        return { ...newWebhook, secret: newWebhook.secret ? '***' : undefined };
    }

    async update(id: string, dto: Partial<WebhookDto>) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.webhooks' },
        });
        const webhooks = (policy?.value as any[]) || [];
        const index = webhooks.findIndex(w => w.id === id);

        if (index === -1) throw new NotFoundException('Webhook not found');

        webhooks[index] = { ...webhooks[index], ...dto, updatedAt: new Date().toISOString() };

        await this.prisma.systemPolicy.update({
            where: { key: 'system.webhooks' },
            data: { value: webhooks },
        });

        await this.createAuditLog('UPDATE', 'WEBHOOK', { id, ...dto });
        return { ...webhooks[index], secret: webhooks[index].secret ? '***' : undefined };
    }

    async delete(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.webhooks' },
        });
        const webhooks = (policy?.value as any[]) || [];
        const filtered = webhooks.filter(w => w.id !== id);

        await this.prisma.systemPolicy.update({
            where: { key: 'system.webhooks' },
            data: { value: filtered },
        });

        await this.createAuditLog('DELETE', 'WEBHOOK', { id });
        return { success: true };
    }

    async test(id: string) {
        const webhook = await this.findById(id);
        // In production, you would actually make an HTTP request here
        return {
            id,
            tested: true,
            message: `Webhook ${webhook.name} test triggered`,
        };
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
