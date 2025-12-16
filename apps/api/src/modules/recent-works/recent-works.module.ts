import { Module } from '@nestjs/common';
import { RecentWorksController } from './recent-works.controller';
import { RecentWorksService } from './recent-works.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RecentWorksController],
    providers: [RecentWorksService],
    exports: [RecentWorksService],
})
export class RecentWorksModule { }
