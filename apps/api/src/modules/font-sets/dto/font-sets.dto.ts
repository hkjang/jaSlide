import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateFontSetDto {
    @IsString()
    name: string;

    @IsString()
    headingFont: string;

    @IsString()
    bodyFont: string;

    @IsOptional()
    @IsString()
    accentFont?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdateFontSetDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    headingFont?: string;

    @IsOptional()
    @IsString()
    bodyFont?: string;

    @IsOptional()
    @IsString()
    accentFont?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
