import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminThemesController } from './admin-themes.controller';
import { AdminThemesService } from './admin-themes.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminThemesController],
    providers: [AdminThemesService],
    exports: [AdminThemesService],
})
export class AdminThemesModule { }
