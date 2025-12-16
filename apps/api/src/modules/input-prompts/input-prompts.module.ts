import { Module } from '@nestjs/common';
import { InputPromptsController } from './input-prompts.controller';
import { InputPromptsService } from './input-prompts.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [InputPromptsController],
    providers: [InputPromptsService],
    exports: [InputPromptsService],
})
export class InputPromptsModule { }
