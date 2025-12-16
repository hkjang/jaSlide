import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async create(presentationId: string, userId: string, dto: CreateCommentDto) {
        // Check presentation access
        await this.checkPresentationAccess(presentationId, userId);

        const comment = await this.prisma.comment.create({
            data: {
                presentationId,
                slideId: dto.slideId,
                userId,
                content: dto.content,
                parentId: dto.parentId,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return comment;
    }

    async findAllByPresentation(presentationId: string, userId: string) {
        await this.checkPresentationAccess(presentationId, userId, true);

        const comments = await this.prisma.comment.findMany({
            where: { presentationId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return comments;
    }

    async findAllBySlide(slideId: string, userId: string) {
        const slide = await this.prisma.slide.findUnique({
            where: { id: slideId },
            include: { presentation: { select: { userId: true, isPublic: true } } },
        });

        if (!slide) {
            throw new NotFoundException('Slide not found');
        }

        if (slide.presentation.userId !== userId && !slide.presentation.isPublic) {
            throw new ForbiddenException('Access denied');
        }

        const comments = await this.prisma.comment.findMany({
            where: { slideId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return comments;
    }

    async update(id: string, userId: string, dto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true } },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Only comment owner or presentation owner can update
        const isOwner = comment.userId === userId;
        const isPresentationOwner = comment.presentation.userId === userId;

        if (!isOwner && !isPresentationOwner) {
            throw new ForbiddenException('Access denied');
        }

        // Only presentation owner can resolve
        if (dto.isResolved !== undefined && !isPresentationOwner) {
            throw new ForbiddenException('Only presentation owner can resolve comments');
        }

        const updated = await this.prisma.comment.update({
            where: { id },
            data: {
                content: dto.content,
                isResolved: dto.isResolved,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true } },
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Only comment owner or presentation owner can delete
        if (comment.userId !== userId && comment.presentation.userId !== userId) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.comment.delete({ where: { id } });

        return { success: true };
    }

    async resolve(id: string, userId: string) {
        return this.update(id, userId, { isResolved: true });
    }

    async unresolve(id: string, userId: string) {
        return this.update(id, userId, { isResolved: false });
    }

    private async checkPresentationAccess(
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

        // Check if user is owner, collaborator, or if presentation is public
        const collaborator = await this.prisma.collaborator.findUnique({
            where: {
                presentationId_userId: { presentationId, userId },
            },
        });

        const hasAccess =
            presentation.userId === userId ||
            collaborator !== null ||
            (allowPublic && presentation.isPublic);

        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }
    }
}
