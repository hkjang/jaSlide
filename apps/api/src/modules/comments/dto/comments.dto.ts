import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    slideId?: string;

    @IsOptional()
    @IsString()
    parentId?: string;
}

export class UpdateCommentDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsBoolean()
    isResolved?: boolean;
}
