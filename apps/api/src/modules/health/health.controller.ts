import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Health check' })
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'jaslide-api',
            version: '0.1.0',
        };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check' })
    ready() {
        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness check' })
    live() {
        return {
            status: 'live',
            timestamp: new Date().toISOString(),
        };
    }
}
