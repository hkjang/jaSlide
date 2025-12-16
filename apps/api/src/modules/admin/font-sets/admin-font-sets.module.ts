import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminFontSetsController } from './admin-font-sets.controller';
import { AdminFontSetsService } from './admin-font-sets.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminFontSetsController],
    providers: [AdminFontSetsService],
    exports: [AdminFontSetsService],
})
export class AdminFontSetsModule { }
