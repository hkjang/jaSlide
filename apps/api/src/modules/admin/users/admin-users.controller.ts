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
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
    AdminCreateUserDto,
    AdminUpdateUserDto,
    AdminUserFilterDto,
    AdminCreditAdjustmentDto,
} from '../dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
    constructor(private usersService: AdminUsersService) { }

    @Get()
    async findAll(@Query() filter: AdminUserFilterDto) {
        return this.usersService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post()
    async create(@Body() dto: AdminCreateUserDto) {
        return this.usersService.create(dto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.usersService.delete(id);
    }

    @Post(':id/credits/adjust')
    async adjustCredits(
        @Param('id') id: string,
        @Body() dto: AdminCreditAdjustmentDto,
        @Request() req: any,
    ) {
        return this.usersService.adjustCredits(id, dto, req.user.id);
    }

    @Get(':id/credits/history')
    async getCreditHistory(
        @Param('id') id: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.usersService.getCreditHistory(id, page, limit);
    }
}
