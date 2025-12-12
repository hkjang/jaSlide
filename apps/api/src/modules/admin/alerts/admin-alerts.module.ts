import { Module } from '@nestjs/common';
import { AdminAlertsController } from './admin-alerts.controller';
import { AdminAlertsService } from './admin-alerts.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminAlertsController],
    providers: [AdminAlertsService],
    exports: [AdminAlertsService],
})
export class AdminAlertsModule { }
