import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInputPromptDto, UpdateInputPromptDto } from './dto/input-prompts.dto';

@Injectable()
export class InputPromptsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateInputPromptDto) {
        const prompt = await this.prisma.inputPrompt.create({
            data: {
                userId,
                content: dto.text,
                metadata: dto.category ? { category: dto.category } : undefined,
            },
        });

        return prompt;
    }

    async findAll(userId: string, category?: string) {
        const prompts = await this.prisma.inputPrompt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        // Filter by category in metadata if provided
        if (category) {
            return prompts.filter((p: any) => p.metadata?.category === category);
        }

        return prompts;
    }

    async findById(id: string, userId: string) {
        const prompt = await this.prisma.inputPrompt.findFirst({
            where: { id, userId },
        });

        if (!prompt) {
            throw new NotFoundException('Input prompt not found');
        }

        return prompt;
    }

    async update(id: string, userId: string, dto: UpdateInputPromptDto) {
        const existing = await this.prisma.inputPrompt.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundException('Input prompt not found');
        }

        const updated = await this.prisma.inputPrompt.update({
            where: { id },
            data: {
                content: dto.text,
                metadata: dto.category ? { category: dto.category } : undefined,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const existing = await this.prisma.inputPrompt.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundException('Input prompt not found');
        }

        await this.prisma.inputPrompt.delete({ where: { id } });

        return { success: true };
    }

    async getRecent(userId: string, limit = 10) {
        const prompts = await this.prisma.inputPrompt.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return prompts;
    }
}
