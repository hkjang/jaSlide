import { IsOptional, IsString } from 'class-validator';

export class CreateInputPromptDto {
    @IsString()
    text: string;

    @IsOptional()
    @IsString()
    category?: string;
}

export class UpdateInputPromptDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    category?: string;
}
