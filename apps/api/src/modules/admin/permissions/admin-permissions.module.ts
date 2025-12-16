import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminPermissionsController } from './admin-permissions.controller';
import { AdminPermissionsService } from './admin-permissions.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminPermissionsController],
    providers: [AdminPermissionsService],
    exports: [AdminPermissionsService],
})
export class AdminPermissionsModule { }
