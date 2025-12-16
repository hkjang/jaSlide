import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/versions.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class VersionsController {
    constructor(private readonly versionsService: VersionsService) { }

    @Post('presentations/:presentationId/versions')
    async create(
        @Param('presentationId') presentationId: string,
        @Body() dto: CreateVersionDto,
        @Request() req: any,
    ) {
        return this.versionsService.create(presentationId, req.user.id, dto);
    }

    @Get('presentations/:presentationId/versions')
    async findAll(
        @Param('presentationId') presentationId: string,
        @Request() req: any,
    ) {
        return this.versionsService.findAll(presentationId, req.user.id);
    }

    @Get('versions/:id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.versionsService.findById(id, req.user.id);
    }

    @Post('versions/:id/restore')
    async restore(@Param('id') id: string, @Request() req: any) {
        return this.versionsService.restore(id, req.user.id);
    }

    @Delete('versions/:id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.versionsService.delete(id, req.user.id);
    }

    @Get('versions/:id1/compare/:id2')
    async compare(
        @Param('id1') id1: string,
        @Param('id2') id2: string,
        @Request() req: any,
    ) {
        return this.versionsService.compare(id1, id2, req.user.id);
    }
}
