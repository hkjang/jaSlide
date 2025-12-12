import { Injectable, Logger } from '@nestjs/common';

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
    title?: string;
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
    }[];
}

export interface ChartConfig {
    width?: number;
    height?: number;
    theme?: 'light' | 'dark';
    showLegend?: boolean;
    showGridLines?: boolean;
}

export interface GeneratedChart {
    svgCode: string;
    imageUrl?: string;
    config: ChartData;
}

// Color palettes for charts
const CHART_PALETTES = {
    default: [
        '#8B5CF6', // Purple
        '#06B6D4', // Cyan
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#10B981', // Emerald
        '#6366F1', // Indigo
        '#EC4899', // Pink
        '#14B8A6', // Teal
    ],
    pastel: [
        '#C4B5FD', // Purple-200
        '#A5F3FC', // Cyan-200
        '#FDE68A', // Amber-200
        '#FECACA', // Red-200
        '#A7F3D0', // Emerald-200
        '#C7D2FE', // Indigo-200
        '#FBCFE8', // Pink-200
        '#99F6E4', // Teal-200
    ],
    vibrant: [
        '#7C3AED', // Violet-600
        '#0891B2', // Cyan-600
        '#D97706', // Amber-600
        '#DC2626', // Red-600
        '#059669', // Emerald-600
        '#4F46E5', // Indigo-600
        '#DB2777', // Pink-600
        '#0D9488', // Teal-600
    ],
};

@Injectable()
export class ChartService {
    private readonly logger = new Logger(ChartService.name);

    async generateChart(data: ChartData, config: ChartConfig = {}): Promise<GeneratedChart> {
        const { width = 600, height = 400, theme = 'light', showLegend = true, showGridLines = true } = config;

        // Apply default colors if not specified
        const coloredData = this.applyColors(data);

        // Generate SVG based on chart type
        let svgCode: string;
        switch (data.type) {
            case 'bar':
                svgCode = this.generateBarChart(coloredData, width, height, showGridLines);
                break;
            case 'line':
                svgCode = this.generateLineChart(coloredData, width, height, showGridLines);
                break;
            case 'pie':
            case 'doughnut':
                svgCode = this.generatePieChart(coloredData, width, height, data.type === 'doughnut');
                break;
            case 'area':
                svgCode = this.generateAreaChart(coloredData, width, height, showGridLines);
                break;
            default:
                svgCode = this.generateBarChart(coloredData, width, height, showGridLines);
        }

        // Wrap with SVG header
        const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${theme === 'dark' ? `<rect width="100%" height="100%" fill="#1F2937"/>` : ''}
${svgCode}
${showLegend ? this.generateLegend(coloredData, width, height) : ''}
</svg>`;

        return {
            svgCode: fullSvg,
            config: coloredData,
        };
    }

    private applyColors(data: ChartData): ChartData {
        return {
            ...data,
            datasets: data.datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: dataset.backgroundColor || CHART_PALETTES.default[index % CHART_PALETTES.default.length],
                borderColor: dataset.borderColor || CHART_PALETTES.default[index % CHART_PALETTES.default.length],
            })),
        };
    }

    private generateBarChart(data: ChartData, width: number, height: number, showGrid: boolean): string {
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxValue = Math.max(...data.datasets.flatMap((d) => d.data));
        const barGroupWidth = chartWidth / data.labels.length;
        const barWidth = (barGroupWidth * 0.8) / data.datasets.length;
        const barGap = barGroupWidth * 0.1;

        let bars = '';
        let gridLines = '';

        // Grid lines
        if (showGrid) {
            for (let i = 0; i <= 5; i++) {
                const y = margin.top + (chartHeight / 5) * i;
                gridLines += `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#E5E7EB" stroke-width="1"/>`;
            }
        }

        // Bars
        data.datasets.forEach((dataset, dsIndex) => {
            dataset.data.forEach((value, index) => {
                const barHeight = (value / maxValue) * chartHeight;
                const x = margin.left + barGap + index * barGroupWidth + dsIndex * barWidth;
                const y = margin.top + chartHeight - barHeight;
                const color = Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[index]
                    : dataset.backgroundColor;

                bars += `<rect x="${x}" y="${y}" width="${barWidth - 2}" height="${barHeight}" fill="${color}" rx="2"/>`;
            });
        });

        // X-axis labels
        let labels = '';
        data.labels.forEach((label, index) => {
            const x = margin.left + barGap + index * barGroupWidth + barGroupWidth / 2;
            labels += `<text x="${x}" y="${height - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${label}</text>`;
        });

        // Title
        const title = data.title
            ? `<text x="${width / 2}" y="24" text-anchor="middle" fill="#111827" font-size="16" font-weight="600">${data.title}</text>`
            : '';

        return `${gridLines}${bars}${labels}${title}`;
    }

    private generateLineChart(data: ChartData, width: number, height: number, showGrid: boolean): string {
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxValue = Math.max(...data.datasets.flatMap((d) => d.data));
        const stepX = chartWidth / (data.labels.length - 1);

        let lines = '';
        let gridLines = '';

        // Grid
        if (showGrid) {
            for (let i = 0; i <= 5; i++) {
                const y = margin.top + (chartHeight / 5) * i;
                gridLines += `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#E5E7EB" stroke-width="1"/>`;
            }
        }

        // Lines
        data.datasets.forEach((dataset) => {
            const points = dataset.data.map((value, index) => {
                const x = margin.left + index * stepX;
                const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
                return `${x},${y}`;
            }).join(' ');

            lines += `<polyline points="${points}" fill="none" stroke="${dataset.borderColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

            // Dots
            dataset.data.forEach((value, index) => {
                const x = margin.left + index * stepX;
                const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
                lines += `<circle cx="${x}" cy="${y}" r="5" fill="${dataset.borderColor}"/>`;
            });
        });

        // X-axis labels
        let labels = '';
        data.labels.forEach((label, index) => {
            const x = margin.left + index * stepX;
            labels += `<text x="${x}" y="${height - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${label}</text>`;
        });

        const title = data.title
            ? `<text x="${width / 2}" y="24" text-anchor="middle" fill="#111827" font-size="16" font-weight="600">${data.title}</text>`
            : '';

        return `${gridLines}${lines}${labels}${title}`;
    }

    private generatePieChart(data: ChartData, width: number, height: number, isDoughnut: boolean): string {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        const innerRadius = isDoughnut ? radius * 0.6 : 0;

        const dataset = data.datasets[0];
        const total = dataset.data.reduce((sum, val) => sum + val, 0);
        let currentAngle = -Math.PI / 2;

        let slices = '';

        dataset.data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + sliceAngle);
            const y2 = centerY + radius * Math.sin(currentAngle + sliceAngle);

            const ix1 = centerX + innerRadius * Math.cos(currentAngle);
            const iy1 = centerY + innerRadius * Math.sin(currentAngle);
            const ix2 = centerX + innerRadius * Math.cos(currentAngle + sliceAngle);
            const iy2 = centerY + innerRadius * Math.sin(currentAngle + sliceAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const color = Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor[index]
                : CHART_PALETTES.default[index % CHART_PALETTES.default.length];

            const path = isDoughnut
                ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
                : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            slices += `<path d="${path}" fill="${color}"/>`;

            currentAngle += sliceAngle;
        });

        const title = data.title
            ? `<text x="${width / 2}" y="24" text-anchor="middle" fill="#111827" font-size="16" font-weight="600">${data.title}</text>`
            : '';

        return `${slices}${title}`;
    }

    private generateAreaChart(data: ChartData, width: number, height: number, showGrid: boolean): string {
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxValue = Math.max(...data.datasets.flatMap((d) => d.data));
        const stepX = chartWidth / (data.labels.length - 1);

        let areas = '';
        let gridLines = '';

        if (showGrid) {
            for (let i = 0; i <= 5; i++) {
                const y = margin.top + (chartHeight / 5) * i;
                gridLines += `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="#E5E7EB" stroke-width="1"/>`;
            }
        }

        data.datasets.forEach((dataset) => {
            const points = dataset.data.map((value, index) => {
                const x = margin.left + index * stepX;
                const y = margin.top + chartHeight - (value / maxValue) * chartHeight;
                return `${x},${y}`;
            });

            const pathD = `M ${margin.left},${margin.top + chartHeight} L ${points.join(' L ')} L ${margin.left + chartWidth},${margin.top + chartHeight} Z`;
            areas += `<path d="${pathD}" fill="${dataset.backgroundColor}" fill-opacity="0.5"/>`;
            areas += `<polyline points="${points.join(' ')}" fill="none" stroke="${dataset.borderColor}" stroke-width="2"/>`;
        });

        let labels = '';
        data.labels.forEach((label, index) => {
            const x = margin.left + index * stepX;
            labels += `<text x="${x}" y="${height - 20}" text-anchor="middle" fill="#6B7280" font-size="12">${label}</text>`;
        });

        const title = data.title
            ? `<text x="${width / 2}" y="24" text-anchor="middle" fill="#111827" font-size="16" font-weight="600">${data.title}</text>`
            : '';

        return `${gridLines}${areas}${labels}${title}`;
    }

    private generateLegend(data: ChartData, width: number, height: number): string {
        if (data.type === 'pie' || data.type === 'doughnut') {
            // Legend for pie charts uses labels
            return data.labels.map((label, index) => {
                const color = Array.isArray(data.datasets[0].backgroundColor)
                    ? data.datasets[0].backgroundColor[index]
                    : CHART_PALETTES.default[index];
                const x = 20;
                const y = 50 + index * 20;
                return `<rect x="${x}" y="${y}" width="12" height="12" fill="${color}" rx="2"/>
<text x="${x + 18}" y="${y + 10}" fill="#6B7280" font-size="11">${label}</text>`;
            }).join('');
        }

        // Legend for other charts uses dataset labels
        return data.datasets.map((dataset, index) => {
            const x = width - 120;
            const y = 50 + index * 20;
            return `<rect x="${x}" y="${y}" width="12" height="12" fill="${dataset.backgroundColor}" rx="2"/>
<text x="${x + 18}" y="${y + 10}" fill="#6B7280" font-size="11">${dataset.label}</text>`;
        }).join('');
    }

    // Parse Excel-like data to chart config
    parseDataToChart(
        rows: (string | number)[][],
        chartType: ChartData['type'] = 'bar',
        hasHeaders: boolean = true,
    ): ChartData {
        const labels = hasHeaders
            ? rows.slice(1).map((row) => String(row[0]))
            : rows.map((row, i) => `Item ${i + 1}`);

        const datasets = hasHeaders
            ? rows[0].slice(1).map((header, colIndex) => ({
                label: String(header),
                data: rows.slice(1).map((row) => Number(row[colIndex + 1]) || 0),
            }))
            : [
                {
                    label: 'Values',
                    data: rows.map((row) => Number(row[1]) || 0),
                },
            ];

        return {
            type: chartType,
            labels,
            datasets,
        };
    }
}
