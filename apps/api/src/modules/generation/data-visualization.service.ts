import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChartService, ChartData } from '../assets/chart.service';
import * as XLSX from 'xlsx';

export interface ExcelSheetData {
    name: string;
    headers: string[];
    rows: (string | number)[][];
}

export interface ExcelToChartResult {
    charts: Array<{
        sheetName: string;
        chartData: ChartData;
        svgCode: string;
    }>;
    summary: {
        totalSheets: number;
        totalCharts: number;
        processedRows: number;
    };
}

@Injectable()
export class DataVisualizationService {
    private readonly logger = new Logger(DataVisualizationService.name);

    constructor(
        private configService: ConfigService,
        private chartService: ChartService,
    ) { }

    /**
     * Parse Excel file and extract sheet data
     */
    parseExcel(buffer: Buffer): ExcelSheetData[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheets: ExcelSheetData[] = [];

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });

            if (jsonData.length > 0) {
                const headers = (jsonData[0] as (string | number)[]).map(String);
                const rows = jsonData.slice(1) as (string | number)[][];

                sheets.push({
                    name: sheetName,
                    headers,
                    rows,
                });
            }
        }

        return sheets;
    }

    /**
     * Automatically detect chart type based on data structure
     */
    detectChartType(data: ExcelSheetData): ChartData['type'] {
        const { headers, rows } = data;

        // If single numeric column, pie chart works well
        if (headers.length === 2 && this.isNumericColumn(rows, 1)) {
            const numRows = rows.length;
            if (numRows <= 8) {
                return 'pie';
            }
        }

        // If time-series data (dates in first column), use line
        if (this.isDateColumn(rows, 0)) {
            return 'line';
        }

        // If comparing multiple series, use grouped bar
        if (headers.length > 2 && this.isNumericColumn(rows, 1)) {
            return 'bar';
        }

        // Default to bar chart
        return 'bar';
    }

    /**
     * Convert Excel data to chart configurations
     */
    async excelToCharts(buffer: Buffer): Promise<ExcelToChartResult> {
        const sheets = this.parseExcel(buffer);
        const charts: ExcelToChartResult['charts'] = [];
        let totalRows = 0;

        for (const sheet of sheets) {
            if (sheet.rows.length === 0) continue;

            const chartType = this.detectChartType(sheet);
            const chartData = this.convertToChartData(sheet, chartType);

            const result = await this.chartService.generateChart(chartData, {
                width: 600,
                height: 400,
                showLegend: true,
            });

            charts.push({
                sheetName: sheet.name,
                chartData,
                svgCode: result.svgCode,
            });

            totalRows += sheet.rows.length;
        }

        return {
            charts,
            summary: {
                totalSheets: sheets.length,
                totalCharts: charts.length,
                processedRows: totalRows,
            },
        };
    }

    /**
     * Convert sheet data to chart configuration
     */
    private convertToChartData(sheet: ExcelSheetData, chartType: ChartData['type']): ChartData {
        const { headers, rows } = sheet;

        // Labels from first column
        const labels = rows.map((row) => String(row[0] || ''));

        // Datasets from remaining columns
        const datasets = headers.slice(1).map((header, index) => ({
            label: header,
            data: rows.map((row) => {
                const value = row[index + 1];
                return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
            }),
        }));

        return {
            type: chartType,
            title: sheet.name,
            labels,
            datasets,
        };
    }

    /**
     * Check if a column contains primarily numeric values
     */
    private isNumericColumn(rows: (string | number)[][], colIndex: number): boolean {
        const numericCount = rows.filter((row) => {
            const value = row[colIndex];
            return typeof value === 'number' || !isNaN(parseFloat(String(value)));
        }).length;

        return numericCount / rows.length > 0.8;
    }

    /**
     * Check if a column contains date values
     */
    private isDateColumn(rows: (string | number)[][], colIndex: number): boolean {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
            /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
        ];

        const dateCount = rows.filter((row) => {
            const value = String(row[colIndex]);
            return datePatterns.some((pattern) => pattern.test(value));
        }).length;

        return dateCount / rows.length > 0.5;
    }

    /**
     * Generate charts from CSV data
     */
    async csvToCharts(csvContent: string): Promise<ExcelToChartResult> {
        const workbook = XLSX.read(csvContent, { type: 'string' });
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return this.excelToCharts(buffer);
    }

    /**
     * Smart chart recommendation based on data characteristics
     */
    recommendChartTypes(data: ExcelSheetData): {
        recommended: ChartData['type'];
        alternatives: ChartData['type'][];
        reason: string;
    } {
        const { headers, rows } = data;
        const numericCols = headers.slice(1).filter((_, i) =>
            this.isNumericColumn(rows, i + 1)
        ).length;

        // Category + single value: pie or doughnut
        if (numericCols === 1 && rows.length <= 8) {
            return {
                recommended: 'pie',
                alternatives: ['doughnut', 'bar'],
                reason: '단일 수치 데이터로 비율 비교에 적합',
            };
        }

        // Time series: line or area
        if (this.isDateColumn(rows, 0)) {
            return {
                recommended: 'line',
                alternatives: ['area', 'bar'],
                reason: '시계열 데이터로 추세 표현에 적합',
            };
        }

        // Multiple series: grouped bar
        if (numericCols > 1) {
            return {
                recommended: 'bar',
                alternatives: ['line', 'area'],
                reason: '다중 계열 비교에 적합',
            };
        }

        return {
            recommended: 'bar',
            alternatives: ['line', 'pie'],
            reason: '일반적인 범주형 데이터 비교',
        };
    }
}
