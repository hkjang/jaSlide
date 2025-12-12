import { Module } from '@nestjs/common';
import { AdminModelsController } from './admin-models.controller';
import { AdminModelsService } from './admin-models.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminModelsController],
    providers: [AdminModelsService],
    exports: [AdminModelsService],
})
export class AdminModelsModule { }
