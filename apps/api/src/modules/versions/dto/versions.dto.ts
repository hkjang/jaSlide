import { IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
    @IsOptional()
    @IsString()
    name?: string;
}

export class RestoreVersionDto {
    @IsOptional()
    @IsString()
    newVersionName?: string;
}
