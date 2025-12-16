import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminSessionsController } from './admin-sessions.controller';
import { AdminSessionsService } from './admin-sessions.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminSessionsController],
    providers: [AdminSessionsService],
    exports: [AdminSessionsService],
})
export class AdminSessionsModule { }
