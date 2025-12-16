import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecentWorksService } from './recent-works.service';

@Controller('recent-works')
@UseGuards(JwtAuthGuard)
export class RecentWorksController {
    constructor(private readonly recentWorksService: RecentWorksService) { }

    @Get()
    async findAll(@Query('limit') limit: string, @Request() req: any) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.recentWorksService.findAll(req.user.id, limitNum);
    }

    @Post(':presentationId')
    async recordAccess(
        @Param('presentationId') presentationId: string,
        @Request() req: any,
    ) {
        return this.recentWorksService.recordAccess(req.user.id, presentationId);
    }

    @Delete(':presentationId')
    async remove(
        @Param('presentationId') presentationId: string,
        @Request() req: any,
    ) {
        return this.recentWorksService.remove(req.user.id, presentationId);
    }

    @Delete()
    async clearAll(@Request() req: any) {
        return this.recentWorksService.clearAll(req.user.id);
    }
}
