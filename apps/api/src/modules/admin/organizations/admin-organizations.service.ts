import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCreateOrganizationDto, AdminUpdateOrganizationDto, PaginationDto } from '../dto';

@Injectable()
export class AdminOrganizationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { search?: string }) {
        const { page: rawPage = 1, limit: rawLimit = 20, search, sortBy, sortOrder } = filter;
        const page = Number(rawPage);
        const limit = Number(rawLimit);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { domain: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take: limit,
                orderBy: sortBy ? { [sortBy]: sortOrder || 'desc' } : { createdAt: 'desc' },
                include: {
                    _count: { select: { users: true, templates: true, assets: true } },
                },
            }),
            this.prisma.organization.count({ where }),
        ]);

        return {
            data: organizations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string) {
        const organization = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, templates: true, assets: true } },
                colorPalettes: true,
            },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization;
    }

    async create(dto: AdminCreateOrganizationDto) {
        const existing = await this.prisma.organization.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new BadRequestException('Organization slug already exists');
        }

        const organization = await this.prisma.organization.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                domain: dto.domain,
                logo: dto.logo,
                brandSettings: dto.brandSettings || {},
                plan: dto.plan || 'FREE',
            },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'ORGANIZATION',
                resourceId: organization.id,
                details: { name: dto.name, slug: dto.slug },
            },
        });

        return organization;
    }

    async update(id: string, dto: AdminUpdateOrganizationDto) {
        const existing = await this.prisma.organization.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Organization not found');
        }

        const organization = await this.prisma.organization.update({
            where: { id },
            data: {
                name: dto.name,
                domain: dto.domain,
                logo: dto.logo,
                brandSettings: dto.brandSettings,
                plan: dto.plan,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                resource: 'ORGANIZATION',
                resourceId: id,
                details: { ...dto },
            },
        });

        return organization;
    }

    async delete(id: string) {
        const existing = await this.prisma.organization.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });

        if (!existing) {
            throw new NotFoundException('Organization not found');
        }

        if (existing._count.users > 0) {
            throw new BadRequestException('Cannot delete organization with users. Remove users first.');
        }

        await this.prisma.organization.delete({ where: { id } });

        await this.prisma.auditLog.create({
            data: {
                action: 'DELETE',
                resource: 'ORGANIZATION',
                resourceId: id,
            },
        });

        return { success: true, message: 'Organization deleted successfully' };
    }

    async getMembers(orgId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { organizationId: orgId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where: { organizationId: orgId } }),
        ]);

        return {
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
