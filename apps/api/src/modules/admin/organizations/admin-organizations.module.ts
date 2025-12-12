import { Module } from '@nestjs/common';
import { AdminOrganizationsController } from './admin-organizations.controller';
import { AdminOrganizationsService } from './admin-organizations.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminOrganizationsController],
    providers: [AdminOrganizationsService],
    exports: [AdminOrganizationsService],
})
export class AdminOrganizationsModule { }
