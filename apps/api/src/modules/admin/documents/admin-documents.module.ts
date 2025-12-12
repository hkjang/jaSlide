import { Module } from '@nestjs/common';
import { AdminDocumentsController } from './admin-documents.controller';
import { AdminDocumentsService } from './admin-documents.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminDocumentsController],
    providers: [AdminDocumentsService],
    exports: [AdminDocumentsService],
})
export class AdminDocumentsModule { }
