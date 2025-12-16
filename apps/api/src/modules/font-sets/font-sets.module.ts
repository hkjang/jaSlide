import { Module } from '@nestjs/common';
import { FontSetsController } from './font-sets.controller';
import { FontSetsService } from './font-sets.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FontSetsController],
    providers: [FontSetsService],
    exports: [FontSetsService],
})
export class FontSetsModule { }
