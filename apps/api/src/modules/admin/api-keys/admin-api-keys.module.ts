import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminApiKeysController } from './admin-api-keys.controller';
import { AdminApiKeysService } from './admin-api-keys.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminApiKeysController],
    providers: [AdminApiKeysService],
    exports: [AdminApiKeysService],
})
export class AdminApiKeysModule { }
