import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExportPresetDto, UpdateExportPresetDto } from './dto/export-presets.dto';

@Injectable()
export class ExportPresetsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateExportPresetDto) {
        // If setting as default, unset other defaults for this format
        if (dto.isDefault) {
            await this.prisma.exportPreset.updateMany({
                where: { userId, format: dto.format, isDefault: true },
                data: { isDefault: false },
            });
        }

        const preset = await this.prisma.exportPreset.create({
            data: {
                userId,
                name: dto.name,
                format: dto.format,
                config: (dto.config as any) || {},
                isDefault: dto.isDefault || false,
            },
        });

        return preset;
    }

    async findAll(userId: string) {
        const presets = await this.prisma.exportPreset.findMany({
            where: { userId },
            orderBy: [{ format: 'asc' }, { name: 'asc' }],
        });

        return presets;
    }

    async findById(id: string, userId: string) {
        const preset = await this.prisma.exportPreset.findFirst({
            where: { id, userId },
        });

        if (!preset) {
            throw new NotFoundException('Export preset not found');
        }

        return preset;
    }

    async findDefault(userId: string, format: string) {
        const preset = await this.prisma.exportPreset.findFirst({
            where: { userId, format, isDefault: true },
        });

        return preset;
    }

    async update(id: string, userId: string, dto: UpdateExportPresetDto) {
        const existing = await this.prisma.exportPreset.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundException('Export preset not found');
        }

        // If setting as default, unset other defaults for this format
        if (dto.isDefault) {
            const format = dto.format || existing.format;
            await this.prisma.exportPreset.updateMany({
                where: { userId, format, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        const updated = await this.prisma.exportPreset.update({
            where: { id },
            data: {
                name: dto.name,
                format: dto.format,
                config: dto.config as any,
                isDefault: dto.isDefault,
            },
        });

        return updated;
    }

    async delete(id: string, userId: string) {
        const existing = await this.prisma.exportPreset.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundException('Export preset not found');
        }

        await this.prisma.exportPreset.delete({ where: { id } });

        return { success: true };
    }
}
