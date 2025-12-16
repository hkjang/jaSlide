import { IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum BlockType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    CHART = 'CHART',
    TABLE = 'TABLE',
    ICON = 'ICON',
    SHAPE = 'SHAPE',
}

export class BlockContentDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    src?: string;

    @IsOptional()
    @IsString()
    alt?: string;

    @IsOptional()
    chartType?: string;

    @IsOptional()
    chartData?: any;

    @IsOptional()
    tableData?: any[][];
}

export class BlockStyleDto {
    @IsOptional()
    @IsString()
    fontSize?: string;

    @IsOptional()
    @IsString()
    fontWeight?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    backgroundColor?: string;

    @IsOptional()
    @IsString()
    textAlign?: string;

    @IsOptional()
    @IsInt()
    width?: number;

    @IsOptional()
    @IsInt()
    height?: number;

    @IsOptional()
    @IsInt()
    x?: number;

    @IsOptional()
    @IsInt()
    y?: number;
}

export class CreateBlockDto {
    @IsEnum(BlockType)
    type: BlockType;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => BlockContentDto)
    content?: BlockContentDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => BlockStyleDto)
    style?: BlockStyleDto;
}

export class UpdateBlockDto {
    @IsOptional()
    @IsEnum(BlockType)
    type?: BlockType;

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => BlockContentDto)
    content?: BlockContentDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => BlockStyleDto)
    style?: BlockStyleDto;
}

export class ReorderBlocksDto {
    blockOrders: { blockId: string; order: number }[];
}

export class NaturalLanguageEditDto {
    @IsString()
    instruction: string;
}
