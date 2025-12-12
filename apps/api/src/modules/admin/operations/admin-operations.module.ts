import { Module } from '@nestjs/common';
import { AdminOperationsController } from './admin-operations.controller';
import { AdminOperationsService } from './admin-operations.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminOperationsController],
    providers: [AdminOperationsService],
    exports: [AdminOperationsService],
})
export class AdminOperationsModule { }
