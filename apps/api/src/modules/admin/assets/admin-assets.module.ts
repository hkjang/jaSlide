import { Module } from '@nestjs/common';
import { AdminAssetsController } from './admin-assets.controller';
import { AdminAssetsService } from './admin-assets.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminAssetsController],
    providers: [AdminAssetsService],
    exports: [AdminAssetsService],
})
export class AdminAssetsModule { }
