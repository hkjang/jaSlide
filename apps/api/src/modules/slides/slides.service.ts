import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSlideDto, UpdateSlideDto, ReorderSlidesDto } from './dto/slides.dto';

@Injectable()
export class SlidesService {
    constructor(private prisma: PrismaService) { }

    async create(presentationId: string, userId: string, dto: CreateSlideDto) {
        // Check presentation ownership
        await this.checkPresentationOwnership(presentationId, userId);

        // Get current max order
        const lastSlide = await this.prisma.slide.findFirst({
            where: { presentationId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const order = dto.order ?? (lastSlide ? lastSlide.order + 1 : 0);

        const slide = await this.prisma.slide.create({
            data: {
                presentationId,
                order,
                type: dto.type,
                title: dto.title,
                content: dto.content as any,
                layout: dto.layout || 'center',
                notes: dto.notes,
            },
        });

        return slide;
    }

    async findAll(presentationId: string, userId: string) {
        await this.checkPresentationOwnership(presentationId, userId, true);

        const slides = await this.prisma.slide.findMany({
            where: { presentationId },
            orderBy: { order: 'asc' },
        });

        return slides;
    }

    async findById(id: string, userId: string) {
        const slide = await this.prisma.slide.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true, isPublic: true } },
            },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId && !slide.presentation.isPublic) {
            throw new ForbiddenException('Access denied');
        }

        return slide;
    }

    async update(id: string, userId: string, dto: UpdateSlideDto) {
        const slide = await this.prisma.slide.findUnique({
            where: { id },
            include: { presentation: { select: { userId: true } } },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        const updated = await this.prisma.slide.update({
            where: { id },
            data: {
                type: dto.type,
                title: dto.title,
                content: dto.content as any,
                layout: dto.layout,
                notes: dto.notes,
                order: dto.order,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const slide = await this.prisma.slide.findUnique({
            where: { id },
            include: { presentation: { select: { userId: true } } },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.slide.delete({ where: { id } });

        // Reorder remaining slides
        await this.prisma.slide.updateMany({
            where: {
                presentationId: slide.presentationId,
                order: { gt: slide.order },
            },
            data: { order: { decrement: 1 } },
        });

        return { success: true };
    }

    async reorder(presentationId: string, userId: string, dto: ReorderSlidesDto) {
        await this.checkPresentationOwnership(presentationId, userId);

        // Update all slide orders in a transaction
        await this.prisma.$transaction(
            dto.slideOrders.map(({ slideId, order }) =>
                this.prisma.slide.update({
                    where: { id: slideId },
                    data: { order },
                }),
            ),
        );

        // Return updated slides
        return this.findAll(presentationId, userId);
    }

    async duplicate(id: string, userId: string) {
        const slide = await this.prisma.slide.findUnique({
            where: { id },
            include: { presentation: { select: { userId: true } } },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        // Get max order
        const lastSlide = await this.prisma.slide.findFirst({
            where: { presentationId: slide.presentationId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const newSlide = await this.prisma.slide.create({
            data: {
                presentationId: slide.presentationId,
                order: (lastSlide?.order ?? 0) + 1,
                type: slide.type,
                title: slide.title ? `${slide.title} (Copy)` : null,
                content: slide.content as any,
                layout: slide.layout,
                notes: slide.notes,
            },
        });

        return newSlide;
    }

    private async checkPresentationOwnership(
        presentationId: string,
        userId: string,
        allowPublic = false,
    ) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id: presentationId },
            select: { userId: true, isPublic: true },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found');
        }

        if (presentation.userId !== userId && !(allowPublic && presentation.isPublic)) {
            throw new ForbiddenException('Access denied');
        }
    }
}
