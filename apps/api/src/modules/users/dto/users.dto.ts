import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'John Doe' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    preferences?: Record<string, any>;
}
