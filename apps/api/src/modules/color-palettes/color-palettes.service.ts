import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColorPaletteDto, UpdateColorPaletteDto } from './dto/color-palettes.dto';

@Injectable()
export class ColorPalettesService {
    constructor(private prisma: PrismaService) { }

    async create(organizationId: string, userId: string, dto: CreateColorPaletteDto) {
        await this.checkOrgAccess(organizationId, userId);

        const palette = await this.prisma.colorPalette.create({
            data: {
                organizationId,
                name: dto.name,
                colors: dto.colors,
                isPublic: dto.isDefault || false,
            },
        });

        return palette;
    }

    async findAll(organizationId: string, userId: string) {
        await this.checkOrgAccess(organizationId, userId);

        const palettes = await this.prisma.colorPalette.findMany({
            where: { organizationId },
            orderBy: [{ name: 'asc' }],
        });

        return palettes;
    }

    async findById(id: string, userId: string) {
        const palette = await this.prisma.colorPalette.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!palette) {
            throw new NotFoundException('Color palette not found');
        }

        if (palette.organizationId) {
            await this.checkOrgAccess(palette.organizationId, userId);
        }

        return palette;
    }

    async update(id: string, userId: string, dto: UpdateColorPaletteDto) {
        const palette = await this.prisma.colorPalette.findUnique({
            where: { id },
        });

        if (!palette) {
            throw new NotFoundException('Color palette not found');
        }

        if (palette.organizationId) {
            await this.checkOrgAccess(palette.organizationId, userId);
        }

        const updated = await this.prisma.colorPalette.update({
            where: { id },
            data: {
                name: dto.name,
                colors: dto.colors,
                isPublic: dto.isDefault,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const palette = await this.prisma.colorPalette.findUnique({
            where: { id },
        });

        if (!palette) {
            throw new NotFoundException('Color palette not found');
        }

        if (palette.organizationId) {
            await this.checkOrgAccess(palette.organizationId, userId);
        }

        await this.prisma.colorPalette.delete({ where: { id } });

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
