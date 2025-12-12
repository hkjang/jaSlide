// Slide types

export enum SlideType {
    TITLE = 'TITLE',
    CONTENT = 'CONTENT',
    TWO_COLUMN = 'TWO_COLUMN',
    IMAGE = 'IMAGE',
    CHART = 'CHART',
    QUOTE = 'QUOTE',
    BULLET_LIST = 'BULLET_LIST',
    COMPARISON = 'COMPARISON',
    TIMELINE = 'TIMELINE',
    SECTION_HEADER = 'SECTION_HEADER',
    BLANK = 'BLANK',
}

export interface Slide {
    id: string;
    presentationId: string;
    order: number;
    type: SlideType;
    title?: string;
    content: SlideContent;
    layout: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SlideContent {
    heading?: string;
    subheading?: string;
    body?: string;
    bullets?: BulletPoint[];
    image?: SlideImage;
    chart?: SlideChart;
    quote?: SlideQuote;
    columns?: ColumnContent[];
    timeline?: TimelineItem[];
    comparison?: ComparisonContent;
}

export interface BulletPoint {
    text: string;
    level: number;
    icon?: string;
}

export interface SlideImage {
    url: string;
    alt: string;
    caption?: string;
    position?: 'left' | 'right' | 'center' | 'background';
    size?: 'small' | 'medium' | 'large' | 'full';
}

export interface SlideChart {
    type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
    title?: string;
    data: ChartData;
    options?: ChartOptions;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    color?: string;
}

export interface ChartOptions {
    showLegend?: boolean;
    showLabels?: boolean;
    showGrid?: boolean;
}

export interface SlideQuote {
    text: string;
    author?: string;
    source?: string;
}

export interface ColumnContent {
    heading?: string;
    body?: string;
    bullets?: BulletPoint[];
    image?: SlideImage;
}

export interface TimelineItem {
    date: string;
    title: string;
    description?: string;
}

export interface ComparisonContent {
    leftTitle: string;
    rightTitle: string;
    leftItems: string[];
    rightItems: string[];
}

export interface CreateSlideInput {
    type: SlideType;
    title?: string;
    content: SlideContent;
    layout?: string;
    notes?: string;
    order?: number;
}

export interface UpdateSlideInput {
    type?: SlideType;
    title?: string;
    content?: Partial<SlideContent>;
    layout?: string;
    notes?: string;
    order?: number;
}
