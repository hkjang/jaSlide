import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateColorPaletteDto {
    @IsString()
    name: string;

    @IsArray()
    @IsString({ each: true })
    colors: string[];

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdateColorPaletteDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    colors?: string[];

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
