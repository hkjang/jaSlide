import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecentWorksService {
    constructor(private prisma: PrismaService) { }

    async recordAccess(userId: string, presentationId: string) {
        // Check if presentation exists and user has access
        const presentation = await this.prisma.presentation.findFirst({
            where: {
                id: presentationId,
                OR: [
                    { userId },
                    { isPublic: true },
                    { collaborators: { some: { userId } } },
                ],
            },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found');
        }

        // Upsert recent work record
        const recentWork = await this.prisma.recentWork.upsert({
            where: {
                userId_presentationId: { userId, presentationId },
            },
            update: {
                accessedAt: new Date(),
            },
            create: {
                userId,
                presentationId,
            },
            include: {
                presentation: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return recentWork;
    }

    async findAll(userId: string, limit = 10) {
        const recentWorks = await this.prisma.recentWork.findMany({
            where: { userId },
            orderBy: { accessedAt: 'desc' },
            take: limit,
            include: {
                presentation: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        updatedAt: true,
                        status: true,
                    },
                },
            },
        });

        return recentWorks;
    }

    async remove(userId: string, presentationId: string) {
        const existing = await this.prisma.recentWork.findUnique({
            where: {
                userId_presentationId: { userId, presentationId },
            },
        });

        if (!existing) {
            throw new NotFoundException('Recent work not found');
        }

        await this.prisma.recentWork.delete({
            where: {
                userId_presentationId: { userId, presentationId },
            },
        });

        return { success: true };
    }

    async clearAll(userId: string) {
        await this.prisma.recentWork.deleteMany({
            where: { userId },
        });

        return { success: true };
    }
}
