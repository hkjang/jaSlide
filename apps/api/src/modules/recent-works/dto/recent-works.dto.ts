import { IsOptional, IsString } from 'class-validator';

export class CreateRecentWorkDto {
    @IsString()
    presentationId: string;
}

export class RecentWorkQueryDto {
    @IsOptional()
    @IsString()
    limit?: string;
}
