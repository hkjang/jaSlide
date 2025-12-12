import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from './llm.service';
import { PromptTemplateService } from './prompt-template.service';

@Module({
    imports: [ConfigModule],
    providers: [LlmService, PromptTemplateService],
    exports: [LlmService, PromptTemplateService],
})
export class LlmModule { }
