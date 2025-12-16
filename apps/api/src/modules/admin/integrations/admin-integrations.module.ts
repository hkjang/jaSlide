import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminIntegrationsController } from './admin-integrations.controller';
import { AdminIntegrationsService } from './admin-integrations.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminIntegrationsController],
    providers: [AdminIntegrationsService],
    exports: [AdminIntegrationsService],
})
export class AdminIntegrationsModule { }
