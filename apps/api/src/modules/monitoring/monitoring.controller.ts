import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('monitoring')
@Controller('health')
export class MonitoringController {
    constructor(private monitoringService: MonitoringService) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    async health() {
        return this.monitoringService.getHealth();
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness probe' })
    live() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness probe' })
    async ready() {
        const health = await this.monitoringService.getHealth();
        const allServicesUp = Object.values(health.services).every(
            (s) => s.status === 'up',
        );

        return {
            ready: allServicesUp,
            services: health.services,
        };
    }

    @Get('metrics')
    @ApiOperation({ summary: 'Get system metrics' })
    async metrics() {
        return this.monitoringService.getSystemSummary();
    }
}
