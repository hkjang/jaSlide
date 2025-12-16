import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InviteCollaboratorDto, UpdateCollaboratorDto, CollaboratorRole } from './dto/collaborators.dto';

@Injectable()
export class CollaboratorsService {
    constructor(private prisma: PrismaService) { }

    async invite(presentationId: string, userId: string, dto: InviteCollaboratorDto) {
        // Check ownership
        await this.checkPresentationOwnership(presentationId, userId);

        // Find user by email
        const invitedUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!invitedUser) {
            throw new NotFoundException('User not found');
        }

        if (invitedUser.id === userId) {
            throw new BadRequestException('Cannot invite yourself');
        }

        // Check if already collaborator
        const existing = await this.prisma.collaborator.findUnique({
            where: {
                presentationId_userId: { presentationId, userId: invitedUser.id },
            },
        });

        if (existing) {
            throw new BadRequestException('User is already a collaborator');
        }

        const collaborator = await this.prisma.collaborator.create({
            data: {
                presentationId,
                userId: invitedUser.id,
                role: (dto.role as any) || 'VIEWER',
                invitedBy: userId,
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return collaborator;
    }

    async findAll(presentationId: string, userId: string) {
        await this.checkPresentationAccess(presentationId, userId);

        const collaborators = await this.prisma.collaborator.findMany({
            where: { presentationId },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });

        // Also include owner
        const presentation = await this.prisma.presentation.findUnique({
            where: { id: presentationId },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return {
            owner: presentation!.user,
            collaborators,
        };
    }

    async update(id: string, userId: string, dto: UpdateCollaboratorDto) {
        const collaborator = await this.prisma.collaborator.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true } },
            },
        });

        if (!collaborator) {
            throw new NotFoundException('Collaborator not found');
        }

        // Only presentation owner can change roles
        if (collaborator.presentation.userId !== userId) {
            throw new ForbiddenException('Only the owner can change collaborator roles');
        }

        const updated = await this.prisma.collaborator.update({
            where: { id },
            data: { role: dto.role as any },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return updated;
    }

    async remove(id: string, userId: string) {
        const collaborator = await this.prisma.collaborator.findUnique({
            where: { id },
            include: {
                presentation: { select: { userId: true } },
            },
        });

        if (!collaborator) {
            throw new NotFoundException('Collaborator not found');
        }

        // Check if user is owner or the collaborator themselves
        const isOwner = collaborator.presentation.userId === userId;
        const isSelf = collaborator.userId === userId;

        if (!isOwner && !isSelf) {
            throw new ForbiddenException('Access denied');
        }

        await this.prisma.collaborator.delete({ where: { id } });

        return { success: true };
    }

    private async checkPresentationOwnership(presentationId: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id: presentationId },
            select: { userId: true },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found');
        }

        if (presentation.userId !== userId) {
            throw new ForbiddenException('Only the owner can manage collaborators');
        }
    }

    private async checkPresentationAccess(presentationId: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id: presentationId },
            select: { userId: true, isPublic: true },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found');
        }

        if (presentation.userId === userId || presentation.isPublic) {
            return;
        }

        const collaborator = await this.prisma.collaborator.findUnique({
            where: {
                presentationId_userId: { presentationId, userId },
            },
        });

        if (!collaborator) {
            throw new ForbiddenException('Access denied');
        }
    }
}
