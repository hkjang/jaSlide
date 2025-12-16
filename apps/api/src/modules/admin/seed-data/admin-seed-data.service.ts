import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type SeedDataType = 'industry' | 'job' | 'sample' | 'demo';

export interface SeedDataDto {
    type: SeedDataType;
    category: string;
    title: string;
    content: Record<string, any>;
    isActive?: boolean;
    sortOrder?: number;
}

export interface SeedDataFilterDto {
    page?: number;
    limit?: number;
    type?: SeedDataType;
    category?: string;
    isActive?: boolean;
    search?: string;
}

@Injectable()
export class AdminSeedDataService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: SeedDataFilterDto) {
        const { page = 1, limit = 20, type, category, isActive, search } = filter;
        const skip = (page - 1) * limit;

        // Store seed data in SystemPolicy as JSON array
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });

        let seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];

        // Apply filters
        if (type) seedData = seedData.filter(s => s.type === type);
        if (category) seedData = seedData.filter(s => s.category === category);
        if (isActive !== undefined) seedData = seedData.filter(s => s.isActive === isActive);
        if (search) {
            const searchLower = search.toLowerCase();
            seedData = seedData.filter(s =>
                s.title.toLowerCase().includes(searchLower) ||
                s.category.toLowerCase().includes(searchLower)
            );
        }

        // Sort and paginate
        seedData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const paginated = seedData.slice(skip, skip + limit);

        return {
            data: paginated,
            total: seedData.length,
            page,
            limit,
            totalPages: Math.ceil(seedData.length / limit),
        };
    }

    async findById(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];
        const item = seedData.find(s => s.id === id);
        if (!item) throw new NotFoundException('Seed data not found');
        return item;
    }

    async create(dto: SeedDataDto) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];

        const newItem = {
            id: this.generateId(),
            ...dto,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
        };

        seedData.push(newItem);

        await this.prisma.systemPolicy.upsert({
            where: { key: 'content.seed-data' },
            create: { category: 'content', key: 'content.seed-data', value: seedData as unknown as any },
            update: { value: seedData as unknown as any },
        });

        await this.createAuditLog('CREATE', 'SEED_DATA', dto);
        return newItem;
    }

    async update(id: string, dto: Partial<SeedDataDto>) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];
        const index = seedData.findIndex(s => s.id === id);

        if (index === -1) throw new NotFoundException('Seed data not found');

        seedData[index] = { ...seedData[index], ...dto };

        await this.prisma.systemPolicy.update({
            where: { key: 'content.seed-data' },
            data: { value: seedData as unknown as any },
        });

        await this.createAuditLog('UPDATE', 'SEED_DATA', { id, ...dto });
        return seedData[index];
    }

    async delete(id: string) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];
        const filtered = seedData.filter(s => s.id !== id);

        if (filtered.length === seedData.length) {
            throw new NotFoundException('Seed data not found');
        }

        await this.prisma.systemPolicy.update({
            where: { key: 'content.seed-data' },
            data: { value: filtered as unknown as any },
        });

        await this.createAuditLog('DELETE', 'SEED_DATA', { id });
        return { success: true };
    }

    // Get categories by type
    async getCategoriesByType(type: SeedDataType) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];
        const categories = [...new Set(seedData.filter(s => s.type === type).map(s => s.category))];
        return categories;
    }

    // Bulk import
    async bulkImport(items: SeedDataDto[]) {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'content.seed-data' },
        });
        const seedData = ((policy?.value) as unknown as (SeedDataDto & { id: string })[]) || [];

        const newItems = items.map(item => ({
            id: this.generateId(),
            ...item,
            isActive: item.isActive ?? true,
            sortOrder: item.sortOrder ?? 0,
        }));

        const updated = [...seedData, ...newItems];

        await this.prisma.systemPolicy.upsert({
            where: { key: 'content.seed-data' },
            create: { category: 'content', key: 'content.seed-data', value: updated as unknown as any },
            update: { value: updated as unknown as any },
        });

        await this.createAuditLog('BULK_IMPORT', 'SEED_DATA', { count: items.length });
        return { imported: items.length, total: updated.length };
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({ data: { action, resource, details } });
    }
}
