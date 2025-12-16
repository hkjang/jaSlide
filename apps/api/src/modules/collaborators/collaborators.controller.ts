import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaboratorsService } from './collaborators.service';
import { InviteCollaboratorDto, UpdateCollaboratorDto } from './dto/collaborators.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CollaboratorsController {
    constructor(private readonly collaboratorsService: CollaboratorsService) { }

    @Post('presentations/:presentationId/collaborators')
    async invite(
        @Param('presentationId') presentationId: string,
        @Body() dto: InviteCollaboratorDto,
        @Request() req: any,
    ) {
        return this.collaboratorsService.invite(presentationId, req.user.id, dto);
    }

    @Get('presentations/:presentationId/collaborators')
    async findAll(
        @Param('presentationId') presentationId: string,
        @Request() req: any,
    ) {
        return this.collaboratorsService.findAll(presentationId, req.user.id);
    }

    @Patch('collaborators/:id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCollaboratorDto,
        @Request() req: any,
    ) {
        return this.collaboratorsService.update(id, req.user.id, dto);
    }

    @Delete('collaborators/:id')
    async remove(@Param('id') id: string, @Request() req: any) {
        return this.collaboratorsService.remove(id, req.user.id);
    }
}
