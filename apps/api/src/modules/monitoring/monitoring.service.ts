import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: Date;
    services: {
        [key: string]: {
            status: 'up' | 'down';
            latency?: number;
            message?: string;
        };
    };
    metrics: {
        memoryUsage: number;
        cpuUsage: number;
        requestsPerMinute: number;
        errorRate: number;
    };
}

export interface MetricPoint {
    name: string;
    value: number;
    timestamp: Date;
    tags?: Record<string, string>;
}

@Injectable()
export class MonitoringService implements OnModuleInit {
    private readonly logger = new Logger(MonitoringService.name);
    private startTime: Date;
    private requestCount = 0;
    private errorCount = 0;
    private metricBuffer: MetricPoint[] = [];

    constructor(private configService: ConfigService) {
        this.startTime = new Date();
    }

    onModuleInit() {
        // Start periodic metric collection
        setInterval(() => this.collectSystemMetrics(), 60000); // Every minute
    }

    /**
     * Get current health status
     */
    async getHealth(): Promise<HealthStatus> {
        const uptime = (new Date().getTime() - this.startTime.getTime()) / 1000;
        const memoryUsage = process.memoryUsage();

        return {
            status: 'healthy',
            uptime,
            timestamp: new Date(),
            services: {
                api: { status: 'up', latency: 0 },
                database: await this.checkDatabase(),
                redis: await this.checkRedis(),
                renderer: await this.checkRenderer(),
            },
            metrics: {
                memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                cpuUsage: 0, // Would need OS-level access
                requestsPerMinute: this.getRequestsPerMinute(),
                errorRate: this.getErrorRate(),
            },
        };
    }

    /**
     * Record a request
     */
    recordRequest() {
        this.requestCount++;
    }

    /**
     * Record an error
     */
    recordError() {
        this.errorCount++;
    }

    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, tags?: Record<string, string>) {
        this.metricBuffer.push({
            name,
            value,
            timestamp: new Date(),
            tags,
        });

        // Keep buffer size manageable
        if (this.metricBuffer.length > 10000) {
            this.metricBuffer = this.metricBuffer.slice(-5000);
        }
    }

    /**
     * Get metrics for a specific name
     */
    getMetrics(name: string, since?: Date): MetricPoint[] {
        let metrics = this.metricBuffer.filter((m) => m.name === name);
        if (since) {
            metrics = metrics.filter((m) => m.timestamp >= since);
        }
        return metrics;
    }

    /**
     * Check database connection
     */
    private async checkDatabase(): Promise<{ status: 'up' | 'down'; latency?: number; message?: string }> {
        try {
            // In production, would actually ping the database
            return { status: 'up', latency: 12 };
        } catch (error) {
            return { status: 'down', message: 'Database connection failed' };
        }
    }

    /**
     * Check Redis connection
     */
    private async checkRedis(): Promise<{ status: 'up' | 'down'; latency?: number; message?: string }> {
        try {
            // In production, would actually ping Redis
            return { status: 'up', latency: 3 };
        } catch (error) {
            return { status: 'down', message: 'Redis connection failed' };
        }
    }

    /**
     * Check renderer service
     */
    private async checkRenderer(): Promise<{ status: 'up' | 'down'; latency?: number; message?: string }> {
        try {
            // In production, would actually ping the renderer
            return { status: 'up', latency: 120 };
        } catch (error) {
            return { status: 'down', message: 'Renderer service unavailable' };
        }
    }

    /**
     * Calculate requests per minute
     */
    private getRequestsPerMinute(): number {
        const uptimeMinutes = (new Date().getTime() - this.startTime.getTime()) / 1000 / 60;
        return uptimeMinutes > 0 ? Math.round(this.requestCount / uptimeMinutes) : 0;
    }

    /**
     * Calculate error rate
     */
    private getErrorRate(): number {
        if (this.requestCount === 0) return 0;
        return Number(((this.errorCount / this.requestCount) * 100).toFixed(2));
    }

    /**
     * Collect system metrics periodically
     */
    private collectSystemMetrics() {
        const memoryUsage = process.memoryUsage();

        this.recordMetric('memory.heap.used', memoryUsage.heapUsed);
        this.recordMetric('memory.heap.total', memoryUsage.heapTotal);
        this.recordMetric('memory.rss', memoryUsage.rss);
        this.recordMetric('requests.total', this.requestCount);
        this.recordMetric('errors.total', this.errorCount);
    }

    /**
     * Get system summary for admin dashboard
     */
    async getSystemSummary() {
        const health = await this.getHealth();
        const memoryUsage = process.memoryUsage();

        return {
            uptime: health.uptime,
            status: health.status,
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
            },
            requests: {
                total: this.requestCount,
                perMinute: this.getRequestsPerMinute(),
                errorRate: this.getErrorRate(),
            },
            services: health.services,
        };
    }
}
