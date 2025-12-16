import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

export interface ApiKeyDto {
    name: string;
    scopes?: string[];
    expiresAt?: Date;
}

export interface ApiKeyFilterDto {
    page?: number;
    limit?: number;
    isActive?: boolean;
    userId?: string;
}

@Injectable()
export class AdminApiKeysService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: ApiKeyFilterDto) {
        const { page = 1, limit = 20, isActive, userId } = filter;
        const skip = (page - 1) * limit;

        // Store API keys in SystemPolicy
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.api-keys' },
        });

        let apiKeys = (policy?.value as any[]) || [];

        if (isActive !== undefined) apiKeys = apiKeys.filter(k => k.isActive === isActive);
        if (userId) apiKeys = apiKeys.filter(k => k.userId === userId);

        const paginated = apiKeys.slice(skip, skip + limit);

        return {
            data: paginated.map(k => ({ ...k, keyHash: undefined })), // Don't expose hash
            total: apiKeys.length,
            page,
            limit,
            totalPages: Math.ceil(apiKeys.length / limit),
        };
    }

    async create(dto: ApiKeyDto, userId?: string) {
        const key = this.generateApiKey();
        const keyHash = this.hashKey(key);
        const keyPrefix = key.substring(0, 8);

        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.api-keys' },
        });
        const apiKeys = (policy?.value as any[]) || [];

        const newKey = {
            id: this.generateId(),
            name: dto.name,
            keyHash,
            keyPrefix,
            userId,
            scopes: dto.scopes || [],
            expiresAt: dto.expiresAt,
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        apiKeys.push(newKey);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'system.api-keys' },
            create: { category: 'system', key: 'system.api-keys', value: apiKeys },
            update: { value: apiKeys },
        });

        await this.createAuditLog('CREATE', 'API_KEY', { name: dto.name, userId });

        return {
            ...newKey,
            keyHash: undefined,
            key, // Return the key only once on creation
        };
    }

    async regenerate(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.api-keys' },
        });
        const apiKeys = (policy?.value as any[]) || [];
        const index = apiKeys.findIndex(k => k.id === id);

        if (index === -1) throw new NotFoundException('API key not found');

        const key = this.generateApiKey();
        const keyHash = this.hashKey(key);
        const keyPrefix = key.substring(0, 8);

        apiKeys[index] = {
            ...apiKeys[index],
            keyHash,
            keyPrefix,
            updatedAt: new Date().toISOString(),
        };

        await this.prisma.systemPolicy.update({
            where: { key: 'system.api-keys' },
            data: { value: apiKeys },
        });

        await this.createAuditLog('REGENERATE', 'API_KEY', { id });

        return {
            ...apiKeys[index],
            keyHash: undefined,
            key, // Return new key only once
        };
    }

    async revoke(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.api-keys' },
        });
        const apiKeys = (policy?.value as any[]) || [];
        const index = apiKeys.findIndex(k => k.id === id);

        if (index === -1) throw new NotFoundException('API key not found');

        apiKeys[index].isActive = false;
        apiKeys[index].revokedAt = new Date().toISOString();

        await this.prisma.systemPolicy.update({
            where: { key: 'system.api-keys' },
            data: { value: apiKeys },
        });

        await this.createAuditLog('REVOKE', 'API_KEY', { id });

        return { success: true };
    }

    async delete(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'system.api-keys' },
        });
        const apiKeys = (policy?.value as any[]) || [];
        const filtered = apiKeys.filter(k => k.id !== id);

        await this.prisma.systemPolicy.update({
            where: { key: 'system.api-keys' },
            data: { value: filtered },
        });

        await this.createAuditLog('DELETE', 'API_KEY', { id });

        return { success: true };
    }

    private generateApiKey(): string {
        return 'jsk_' + crypto.randomBytes(32).toString('hex');
    }

    private hashKey(key: string): string {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    private generateId(): string {
        return crypto.randomBytes(12).toString('hex');
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
