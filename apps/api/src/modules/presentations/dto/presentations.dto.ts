import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SourceType {
    TEXT = 'TEXT',
    DOCX = 'DOCX',
    PDF = 'PDF',
    MARKDOWN = 'MARKDOWN',
    CSV = 'CSV',
    URL = 'URL',
}

export class CreatePresentationDto {
    @ApiPropertyOptional({ example: 'My Presentation' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: 'A presentation about AI' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: SourceType, example: SourceType.TEXT })
    @IsEnum(SourceType)
    sourceType: SourceType;

    @ApiProperty({ example: 'Content to generate slides from...' })
    @IsString()
    content: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    templateId?: string;
}

export class UpdatePresentationDto {
    @ApiPropertyOptional({ example: 'Updated Title' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    templateId?: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
