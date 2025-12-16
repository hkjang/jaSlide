import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminBillingController } from './admin-billing.controller';
import { AdminBillingService } from './admin-billing.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminBillingController],
    providers: [AdminBillingService],
    exports: [AdminBillingService],
})
export class AdminBillingModule { }
