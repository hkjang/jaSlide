import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
    constructor(private creditsService: CreditsService) { }

    @Get('balance')
    @ApiOperation({ summary: 'Get current credit balance' })
    async getBalance(@CurrentUser() user: any) {
        return this.creditsService.getBalance(user.id);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get credit transaction history' })
    async getHistory(
        @CurrentUser() user: any,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.creditsService.getTransactionHistory(user.id, page || 1, limit || 20);
    }

    @Get('usage')
    @ApiOperation({ summary: 'Get credit usage summary' })
    async getUsage(@CurrentUser() user: any, @Query('days') days?: number) {
        return this.creditsService.getUsageSummary(user.id, days || 30);
    }
}
