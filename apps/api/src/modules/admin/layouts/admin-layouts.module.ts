import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminLayoutsController } from './admin-layouts.controller';
import { AdminLayoutsService } from './admin-layouts.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminLayoutsController],
    providers: [AdminLayoutsService],
    exports: [AdminLayoutsService],
})
export class AdminLayoutsModule { }
