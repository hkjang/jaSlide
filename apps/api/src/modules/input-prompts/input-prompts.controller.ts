import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InputPromptsService } from './input-prompts.service';
import { CreateInputPromptDto, UpdateInputPromptDto } from './dto/input-prompts.dto';

@Controller('input-prompts')
@UseGuards(JwtAuthGuard)
export class InputPromptsController {
    constructor(private readonly inputPromptsService: InputPromptsService) { }

    @Post()
    async create(@Body() dto: CreateInputPromptDto, @Request() req: any) {
        return this.inputPromptsService.create(req.user.id, dto);
    }

    @Get()
    async findAll(@Query('category') category: string, @Request() req: any) {
        return this.inputPromptsService.findAll(req.user.id, category);
    }

    @Get('recent')
    async getRecent(@Query('limit') limit: string, @Request() req: any) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.inputPromptsService.getRecent(req.user.id, limitNum);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.inputPromptsService.findById(id, req.user.id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateInputPromptDto,
        @Request() req: any,
    ) {
        return this.inputPromptsService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.inputPromptsService.delete(id, req.user.id);
    }
}
