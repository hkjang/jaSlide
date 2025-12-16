import { Module } from '@nestjs/common';
import { ExportPresetsController } from './export-presets.controller';
import { ExportPresetsService } from './export-presets.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ExportPresetsController],
    providers: [ExportPresetsService],
    exports: [ExportPresetsService],
})
export class ExportPresetsModule { }
