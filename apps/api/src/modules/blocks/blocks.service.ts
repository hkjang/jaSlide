import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from './dto/blocks.dto';

@Injectable()
export class BlocksService {
    constructor(private prisma: PrismaService) { }

    async create(slideId: string, userId: string, dto: CreateBlockDto) {
        // Check slide ownership
        await this.checkSlideOwnership(slideId, userId);

        // Get current max order
        const lastBlock = await this.prisma.block.findFirst({
            where: { slideId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const order = dto.order ?? (lastBlock ? lastBlock.order + 1 : 0);

        const block = await this.prisma.block.create({
            data: {
                slideId,
                type: dto.type,
                order,
                content: (dto.content as any) || {},
                style: (dto.style as any) || {},
            },
        });

        return block;
    }

    async findAllBySlide(slideId: string, userId: string) {
        await this.checkSlideOwnership(slideId, userId, true);

        const blocks = await this.prisma.block.findMany({
            where: { slideId },
            orderBy: { order: 'asc' },
        });

        return blocks;
    }

    async findById(id: string, userId: string) {
        const block = await this.prisma.block.findUnique({
            where: { id },
            include: {
                slide: {
                    include: {
                        presentation: { select: { userId: true, isPublic: true } },
                    },
                },
            },
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.slide.presentation.userId !== userId && !block.slide.presentation.isPublic) {
            throw new ForbiddenException('Access denied');
        }

        return block;
    }

    async update(id: string, userId: string, dto: UpdateBlockDto) {
        const block = await this.prisma.block.findUnique({
            where: { id },
            include: {
                slide: {
                    include: {
                        presentation: { select: { userId: true } },
                    },
                },
            },
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        const updated = await this.prisma.block.update({
            where: { id },
            data: {
                type: dto.type,
                order: dto.order,
                content: dto.content as any,
                style: dto.style as any,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const block = await this.prisma.block.findUnique({
            where: { id },
            include: {
                slide: {
                    include: {
                        presentation: { select: { userId: true } },
                    },
                },
            },
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.block.delete({ where: { id } });

        // Reorder remaining blocks
        await this.prisma.block.updateMany({
            where: {
                slideId: block.slideId,
                order: { gt: block.order },
            },
            data: { order: { decrement: 1 } },
        });

        return { success: true };
    }

    async reorder(slideId: string, userId: string, dto: ReorderBlocksDto) {
        await this.checkSlideOwnership(slideId, userId);

        // Update all block orders in a transaction
        await this.prisma.$transaction(
            dto.blockOrders.map(({ blockId, order }) =>
                this.prisma.block.update({
                    where: { id: blockId },
                    data: { order },
                }),
            ),
        );

        // Return updated blocks
        return this.findAllBySlide(slideId, userId);
    }

    async duplicate(id: string, userId: string) {
        const block = await this.prisma.block.findUnique({
            where: { id },
            include: {
                slide: {
                    include: {
                        presentation: { select: { userId: true } },
                    },
                },
            },
        });

        if (!block) {
            throw new NotFoundException('Block not found');
        }

        if (block.slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        // Get max order
        const lastBlock = await this.prisma.block.findFirst({
            where: { slideId: block.slideId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const newBlock = await this.prisma.block.create({
            data: {
                slideId: block.slideId,
                type: block.type,
                order: (lastBlock?.order ?? 0) + 1,
                content: block.content as any,
                style: block.style as any,
            },
        });

        return newBlock;
    }

    private async checkSlideOwnership(slideId: string, userId: string, allowPublic = false) {
        const slide = await this.prisma.slide.findUnique({
            where: { id: slideId },
            include: {
                presentation: { select: { userId: true, isPublic: true } },
            },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId && !(allowPublic && slide.presentation.isPublic)) {
            throw new ForbiddenException('Access denied');
        }
    }
}
