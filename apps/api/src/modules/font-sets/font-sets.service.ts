import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFontSetDto, UpdateFontSetDto } from './dto/font-sets.dto';

@Injectable()
export class FontSetsService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, userId: string, dto: CreateFontSetDto) {
        await this.checkOrgAccess(organizationId, userId);

        const fontSet = await this.prisma.fontSet.create({
            data: {
                organizationId,
                name: dto.name,
                titleFont: dto.headingFont,
                bodyFont: dto.bodyFont,
                headingFont: dto.accentFont,
                isPublic: dto.isDefault || false,
            },
        });

        return fontSet;
    }

    async findAll(organizationId: string, userId: string) {
        await this.checkOrgAccess(organizationId, userId);

        const fontSets = await this.prisma.fontSet.findMany({
            where: { organizationId },
            orderBy: [{ name: 'asc' }],
        });

        return fontSets;
    }

    async findById(id: string, userId: string) {
        const fontSet = await this.prisma.fontSet.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!fontSet) {
            throw new NotFoundException('Font set not found');
        }

        if (fontSet.organizationId) {
            await this.checkOrgAccess(fontSet.organizationId, userId);
        }

        return fontSet;
    }

    async update(id: string, userId: string, dto: UpdateFontSetDto) {
        const fontSet = await this.prisma.fontSet.findUnique({
            where: { id },
        });

        if (!fontSet) {
            throw new NotFoundException('Font set not found');
        }

        if (fontSet.organizationId) {
            await this.checkOrgAccess(fontSet.organizationId, userId);
        }

        const updated = await this.prisma.fontSet.update({
            where: { id },
            data: {
                name: dto.name,
                titleFont: dto.headingFont,
                bodyFont: dto.bodyFont,
                headingFont: dto.accentFont,
                isPublic: dto.isDefault,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const fontSet = await this.prisma.fontSet.findUnique({
            where: { id },
        });

        if (!fontSet) {
            throw new NotFoundException('Font set not found');
        }

        if (fontSet.organizationId) {
            await this.checkOrgAccess(fontSet.organizationId, userId);
        }

        await this.prisma.fontSet.delete({ where: { id } });

        return { success: true };
    }

    private async checkOrgAccess(organizationId: string, userId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId },
        });

        if (!user) {
            throw new ForbiddenException('Access denied');
        }
    }
}
