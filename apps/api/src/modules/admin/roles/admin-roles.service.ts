import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCreateRoleDto, AdminUpdateRoleDto, PaginationDto } from '../dto';

@Injectable()
export class AdminRolesService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto) {
        const { page = 1, limit = 20 } = filter;
        const skip = (page - 1) * limit;

        const [roles, total] = await Promise.all([
            this.prisma.role.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { users: true } },
                },
            }),
            this.prisma.role.count(),
        ]);

        return {
            data: roles,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true } },
            },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return role;
    }

    async create(dto: AdminCreateRoleDto) {
        const existing = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });

        if (existing) {
            throw new BadRequestException('Role name already exists');
        }

        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissions || [],
            },
        });

        return role;
    }

    async update(id: string, dto: AdminUpdateRoleDto) {
        const existing = await this.prisma.role.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Role not found');
        }

        if (existing.isSystem) {
            throw new BadRequestException('Cannot modify system role');
        }

        const role = await this.prisma.role.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissions,
            },
        });

        return role;
    }

    async delete(id: string) {
        const existing = await this.prisma.role.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });

        if (!existing) {
            throw new NotFoundException('Role not found');
        }

        if (existing.isSystem) {
            throw new BadRequestException('Cannot delete system role');
        }

        if (existing._count.users > 0) {
            throw new BadRequestException('Cannot delete role with assigned users');
        }

        await this.prisma.role.delete({ where: { id } });

        return { success: true, message: 'Role deleted successfully' };
    }

    async assignToUser(userId: string, roleId: string) {
        await this.prisma.userRoleAssignment.upsert({
            where: { userId_roleId: { userId, roleId } },
            create: { userId, roleId },
            update: {},
        });

        return { success: true };
    }

    async removeFromUser(userId: string, roleId: string) {
        await this.prisma.userRoleAssignment.delete({
            where: { userId_roleId: { userId, roleId } },
        });

        return { success: true };
    }
}
