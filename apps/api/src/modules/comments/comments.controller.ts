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
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post('presentations/:presentationId/comments')
    async create(
        @Param('presentationId') presentationId: string,
        @Body() dto: CreateCommentDto,
        @Request() req: any,
    ) {
        return this.commentsService.create(presentationId, req.user.id, dto);
    }

    @Get('presentations/:presentationId/comments')
    async findAllByPresentation(
        @Param('presentationId') presentationId: string,
        @Request() req: any,
    ) {
        return this.commentsService.findAllByPresentation(presentationId, req.user.id);
    }

    @Get('slides/:slideId/comments')
    async findAllBySlide(@Param('slideId') slideId: string, @Request() req: any) {
        return this.commentsService.findAllBySlide(slideId, req.user.id);
    }

    @Patch('comments/:id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCommentDto,
        @Request() req: any,
    ) {
        return this.commentsService.update(id, req.user.id, dto);
    }

    @Delete('comments/:id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.commentsService.delete(id, req.user.id);
    }

    @Post('comments/:id/resolve')
    async resolve(@Param('id') id: string, @Request() req: any) {
        return this.commentsService.resolve(id, req.user.id);
    }

    @Post('comments/:id/unresolve')
    async unresolve(@Param('id') id: string, @Request() req: any) {
        return this.commentsService.unresolve(id, req.user.id);
    }
}
