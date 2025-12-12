import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminCreatePromptDto, AdminCreatePromptVersionDto, PaginationDto } from '../dto';

@Injectable()
export class AdminPromptsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filter: PaginationDto & { category?: string }) {
        const { page = 1, limit = 20, category } = filter;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (category) where.category = category;

        const [prompts, total] = await Promise.all([
            this.prisma.promptRegistry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    versions: { orderBy: { version: 'desc' }, take: 1 },
                    _count: { select: { versions: true } },
                },
            }),
            this.prisma.promptRegistry.count({ where }),
        ]);

        return { data: prompts, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const prompt = await this.prisma.promptRegistry.findUnique({
            where: { id },
            include: { versions: { orderBy: { version: 'desc' } } },
        });

        if (!prompt) throw new NotFoundException('Prompt not found');
        return prompt;
    }

    async create(dto: AdminCreatePromptDto) {
        const prompt = await this.prisma.promptRegistry.create({
            data: {
                name: dto.name,
                category: dto.category,
                description: dto.description,
                versions: { create: { version: 1, content: dto.content, variables: dto.variables || [] } },
            },
            include: { versions: true },
        });

        return prompt;
    }

    async createVersion(id: string, dto: AdminCreatePromptVersionDto) {
        const prompt = await this.prisma.promptRegistry.findUnique({
            where: { id },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
        });

        if (!prompt) throw new NotFoundException('Prompt not found');

        const nextVersion = (prompt.versions[0]?.version || 0) + 1;

        const version = await this.prisma.promptTemplateVersion.create({
            data: {
                templateId: id,
                version: nextVersion,
                content: dto.content,
                variables: dto.variables || [],
            },
        });

        return version;
    }

    async rollback(id: string, version: number) {
        const targetVersion = await this.prisma.promptTemplateVersion.findFirst({
            where: { templateId: id, version },
        });

        if (!targetVersion) throw new NotFoundException('Version not found');

        // Deactivate all versions
        await this.prisma.promptTemplateVersion.updateMany({
            where: { templateId: id },
            data: { isActive: false },
        });

        // Activate target version
        await this.prisma.promptTemplateVersion.update({
            where: { id: targetVersion.id },
            data: { isActive: true },
        });

        return { success: true, activeVersion: version };
    }

    async testPrompt(id: string, input: Record<string, any>) {
        const prompt = await this.prisma.promptRegistry.findUnique({
            where: { id },
            include: { versions: { where: { isActive: true }, take: 1 } },
        });

        if (!prompt || !prompt.versions[0]) {
            throw new NotFoundException('Active prompt version not found');
        }

        let result = prompt.versions[0].content;
        const variables = prompt.versions[0].variables as string[];

        for (const variable of variables) {
            if (input[variable]) {
                result = result.replace(new RegExp(`{{${variable}}}`, 'g'), input[variable]);
            }
        }

        return { rendered: result, variables };
    }

    async delete(id: string) {
        await this.prisma.promptRegistry.delete({ where: { id } });
        return { success: true };
    }
}
