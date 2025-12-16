import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFavoriteDto {
    @IsString()
    resourceType: string; // 'template', 'palette', 'font'

    @IsString()
    resourceId: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}

export class UpdateFavoriteDto {
    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;
}
