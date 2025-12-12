import { Module } from '@nestjs/common';
import { AdminPromptsController } from './admin-prompts.controller';
import { AdminPromptsService } from './admin-prompts.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminPromptsController],
    providers: [AdminPromptsService],
    exports: [AdminPromptsService],
})
export class AdminPromptsModule { }
