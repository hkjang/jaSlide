import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminWebhooksController } from './admin-webhooks.controller';
import { AdminWebhooksService } from './admin-webhooks.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminWebhooksController],
    providers: [AdminWebhooksService],
    exports: [AdminWebhooksService],
})
export class AdminWebhooksModule { }
