import { Module } from '@nestjs/common';
import { ColorPalettesController } from './color-palettes.controller';
import { ColorPalettesService } from './color-palettes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ColorPalettesController],
    providers: [ColorPalettesService],
    exports: [ColorPalettesService],
})
export class ColorPalettesModule { }
