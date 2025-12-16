import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminSeedDataController } from './admin-seed-data.controller';
import { AdminSeedDataService } from './admin-seed-data.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminSeedDataController],
    providers: [AdminSeedDataService],
    exports: [AdminSeedDataService],
})
export class AdminSeedDataModule { }
