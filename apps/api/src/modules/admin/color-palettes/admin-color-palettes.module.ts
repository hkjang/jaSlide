import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminColorPalettesController } from './admin-color-palettes.controller';
import { AdminColorPalettesService } from './admin-color-palettes.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminColorPalettesController],
    providers: [AdminColorPalettesService],
    exports: [AdminColorPalettesService],
})
export class AdminColorPalettesModule { }
