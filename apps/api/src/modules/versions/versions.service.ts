import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVersionDto } from './dto/versions.dto';

@Injectable()
export class VersionsService {
    constructor(private prisma: PrismaService) { }

    async create(presentationId: string, userId: string, dto: CreateVersionDto) {
        // Check ownership
        const presentation = await this.checkPresentationOwnership(presentationId, userId);

        // Get next version number
        const lastVersion = await this.prisma.version.findFirst({
            where: { presentationId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
        });

        const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

        // Create snapshot of current presentation state
        const fullPresentation = await this.prisma.presentation.findUnique({
            where: { id: presentationId },
            include: {
                slides: {
                    orderBy: { order: 'asc' },
                    include: { blocks: { orderBy: { order: 'asc' } } },
                },
            },
        });

        const snapshot = {
            title: fullPresentation!.title,
            description: fullPresentation!.description,
            templateId: fullPresentation!.templateId,
            slides: fullPresentation!.slides.map((slide) => ({
                id: slide.id,
                order: slide.order,
                type: slide.type,
                title: slide.title,
                content: slide.content,
                layout: slide.layout,
                notes: slide.notes,
                blocks: slide.blocks.map((block) => ({
                    id: block.id,
                    type: block.type,
                    order: block.order,
                    content: block.content,
                    style: block.style,
                })),
            })),
        };

        const version = await this.prisma.version.create({
            data: {
                presentationId,
                versionNumber,
                name: dto.name || `Version ${versionNumber}`,
                snapshot: snapshot as any,
                createdBy: userId,
            },
        });

        return version;
    }

    async findAll(presentationId: string, userId: string) {
        await this.checkPresentationOwnership(presentationId, userId, true);

        const versions = await this.prisma.version.findMany({
            where: { presentationId },
            orderBy: { versionNumber: 'desc' },
            select: {
                id: true,
                versionNumber: true,
                name: true,
                createdBy: true,
                createdAt: true,
            },
        });

        return versions;
    }

    async findById(id: string, userId: string) {
        const version = await this.prisma.version.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true, isPublic: true } },
            },
        });

        if (!version) {
            throw new NotFoundException('Version not found');
        }

        if (version.presentation.userId !== userId && !version.presentation.isPublic) {
            throw new ForbiddenException('Access denied');
        }

        return version;
    }

    async restore(id: string, userId: string) {
        const version = await this.prisma.version.findUnique({
            where: { id },
            include: {
                presentation: { select: { id: true, userId: true } },
            },
        });

        if (!version) {
            throw new NotFoundException('Version not found');
        }

        if (version.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        const snapshot = version.snapshot as any;

        // Delete existing slides and blocks
        await this.prisma.slide.deleteMany({
            where: { presentationId: version.presentationId },
        });

        // Restore from snapshot
        await this.prisma.presentation.update({
            where: { id: version.presentationId },
            data: {
                title: snapshot.title,
                description: snapshot.description,
                templateId: snapshot.templateId,
            },
        });

        // Recreate slides with blocks
        for (const slideData of snapshot.slides) {
            const slide = await this.prisma.slide.create({
                data: {
                    presentationId: version.presentationId,
                    order: slideData.order,
                    type: slideData.type,
                    title: slideData.title,
                    content: slideData.content,
                    layout: slideData.layout,
                    notes: slideData.notes,
                },
            });

            if (slideData.blocks && slideData.blocks.length > 0) {
                await this.prisma.block.createMany({
                    data: slideData.blocks.map((block: any) => ({
                        slideId: slide.id,
                        type: block.type,
                        order: block.order,
                        content: block.content,
                        style: block.style,
                    })),
                });
            }
        }

        return { success: true, restoredVersionId: id };
    }

    async delete(id: string, userId: string) {
        const version = await this.prisma.version.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true } },
            },
        });

        if (!version) {
            throw new NotFoundException('Version not found');
        }

        if (version.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.version.delete({ where: { id } });

        return { success: true };
    }

    async compare(id1: string, id2: string, userId: string) {
        const [version1, version2] = await Promise.all([
            this.findById(id1, userId),
            this.findById(id2, userId),
        ]);

        const snapshot1 = version1.snapshot as any;
        const snapshot2 = version2.snapshot as any;

        // Simple diff - count changed slides
        const changes = {
            version1: { id: id1, name: version1.name, createdAt: version1.createdAt },
            version2: { id: id2, name: version2.name, createdAt: version2.createdAt },
            slideCountDiff: snapshot2.slides.length - snapshot1.slides.length,
            titleChanged: snapshot1.title !== snapshot2.title,
            slidesAdded: snapshot2.slides.filter(
                (s2: any) => !snapshot1.slides.find((s1: any) => s1.id === s2.id),
            ).length,
            slidesRemoved: snapshot1.slides.filter(
                (s1: any) => !snapshot2.slides.find((s2: any) => s2.id === s1.id),
            ).length,
        };

        return changes;
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

        return presentation;
    }
}
