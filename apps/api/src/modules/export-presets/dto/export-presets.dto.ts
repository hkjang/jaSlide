import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateExportPresetDto {
    @IsString()
    name: string;

    @IsString()
    format: string; // 'pptx', 'pdf', 'images'

    @IsOptional()
    @IsObject()
    config?: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdateExportPresetDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    format?: string;

    @IsOptional()
    @IsObject()
    config?: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
