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
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto, NaturalLanguageEditDto } from './dto/blocks.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class BlocksController {
    constructor(private readonly blocksService: BlocksService) { }

    @Post('slides/:slideId/blocks')
    async create(
        @Param('slideId') slideId: string,
        @Body() dto: CreateBlockDto,
        @Request() req: any,
    ) {
        return this.blocksService.create(slideId, req.user.id, dto);
    }

    @Get('slides/:slideId/blocks')
    async findAll(@Param('slideId') slideId: string, @Request() req: any) {
        return this.blocksService.findAllBySlide(slideId, req.user.id);
    }

    @Get('blocks/:id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.blocksService.findById(id, req.user.id);
    }

    @Patch('blocks/:id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateBlockDto,
        @Request() req: any,
    ) {
        return this.blocksService.update(id, req.user.id, dto);
    }

    @Delete('blocks/:id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.blocksService.delete(id, req.user.id);
    }

    @Post('slides/:slideId/blocks/reorder')
    async reorder(
        @Param('slideId') slideId: string,
        @Body() dto: ReorderBlocksDto,
        @Request() req: any,
    ) {
        return this.blocksService.reorder(slideId, req.user.id, dto);
    }

    @Post('blocks/:id/duplicate')
    async duplicate(@Param('id') id: string, @Request() req: any) {
        return this.blocksService.duplicate(id, req.user.id);
    }
}
