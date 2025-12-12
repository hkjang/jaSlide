import { Module } from '@nestjs/common';
import { AdminLogsController } from './admin-logs.controller';
import { AdminLogsService } from './admin-logs.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminLogsController],
    providers: [AdminLogsService],
    exports: [AdminLogsService],
})
export class AdminLogsModule { }
