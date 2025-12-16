import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CollaboratorRole {
    OWNER = 'OWNER',
    EDITOR = 'EDITOR',
    COMMENTER = 'COMMENTER',
    VIEWER = 'VIEWER',
}

export class InviteCollaboratorDto {
    @IsString()
    email: string;

    @IsOptional()
    @IsEnum(CollaboratorRole)
    role?: CollaboratorRole;
}

export class UpdateCollaboratorDto {
    @IsEnum(CollaboratorRole)
    role: CollaboratorRole;
}
