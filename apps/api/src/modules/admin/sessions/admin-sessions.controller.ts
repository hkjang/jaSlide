import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { AdminSessionsService, SessionFilterDto } from './admin-sessions.service';

@Controller('admin/sessions')
export class AdminSessionsController {
    constructor(private readonly sessionsService: AdminSessionsService) { }

    @Get()
    async findAll(@Query() filter: SessionFilterDto) {
        return this.sessionsService.findAll(filter);
    }

    @Get('stats')
    async getStats() {
        return this.sessionsService.getSessionStats();
    }

    @Get('user/:userId')
    async findByUser(@Param('userId') userId: string) {
        return this.sessionsService.findByUserId(userId);
    }

    @Delete(':id')
    async terminate(@Param('id') id: string) {
        return this.sessionsService.terminateSession(id);
    }

    @Delete('user/:userId/all')
    async terminateAllForUser(@Param('userId') userId: string) {
        return this.sessionsService.terminateAllUserSessions(userId);
    }

    @Post(':id/extend')
    async extend(
        @Param('id') id: string,
        @Body('minutes') minutes?: number,
    ) {
        return this.sessionsService.extendSession(id, minutes);
    }
}
