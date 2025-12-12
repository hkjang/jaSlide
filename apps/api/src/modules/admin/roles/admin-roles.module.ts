import { Module } from '@nestjs/common';
import { AdminRolesController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminRolesController],
    providers: [AdminRolesService],
    exports: [AdminRolesService],
})
export class AdminRolesModule { }
