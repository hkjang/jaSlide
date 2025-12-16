import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFavoriteDto, UpdateFavoriteDto } from './dto/favorites.dto';

@Injectable()
export class FavoritesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateFavoriteDto) {
        const validTypes = ['template', 'palette', 'font'];
        if (!validTypes.includes(dto.resourceType)) {
            throw new BadRequestException('Invalid resource type');
        }

        // Check for duplicate
        const existing = await this.prisma.favorite.findUnique({
            where: {
                userId_resourceType_resourceId: {
                    userId,
                    resourceType: dto.resourceType,
                    resourceId: dto.resourceId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Already in favorites');
        }

        // Get next order
        const lastFavorite = await this.prisma.favorite.findFirst({
            where: { userId, resourceType: dto.resourceType },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const order = dto.order ?? (lastFavorite ? lastFavorite.order + 1 : 0);

        const favorite = await this.prisma.favorite.create({
            data: {
                userId,
                resourceType: dto.resourceType,
                resourceId: dto.resourceId,
                order,
            },
        });

        return favorite;
    }

    async findAll(userId: string, resourceType?: string) {
        const where: any = { userId };
        if (resourceType) {
            where.resourceType = resourceType;
        }

        const favorites = await this.prisma.favorite.findMany({
            where,
            orderBy: [{ resourceType: 'asc' }, { order: 'asc' }],
        });

        return favorites;
    }

    async update(id: string, userId: string, dto: UpdateFavoriteDto) {
        const favorite = await this.prisma.favorite.findUnique({
            where: { id },
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        if (favorite.userId !== userId) {
            throw new NotFoundException('Favorite not found');
        }

        const updated = await this.prisma.favorite.update({
            where: { id },
            data: { order: dto.order },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const favorite = await this.prisma.favorite.findUnique({
            where: { id },
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        if (favorite.userId !== userId) {
            throw new NotFoundException('Favorite not found');
        }

        await this.prisma.favorite.delete({ where: { id } });

        return { success: true };
    }

    async reorder(userId: string, resourceType: string, orderedIds: string[]) {
        await this.prisma.$transaction(
            orderedIds.map((id, index) =>
                this.prisma.favorite.updateMany({
                    where: { id, userId, resourceType },
                    data: { order: index },
                }),
            ),
        );

        return this.findAll(userId, resourceType);
    }
}
