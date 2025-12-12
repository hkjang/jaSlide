import { Module } from '@nestjs/common';
import { AdminCreditsController } from './admin-credits.controller';
import { AdminCreditsService } from './admin-credits.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminCreditsController],
    providers: [AdminCreditsService],
    exports: [AdminCreditsService],
})
export class AdminCreditsModule { }
