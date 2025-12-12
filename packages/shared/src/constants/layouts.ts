// Layout constants

export const LAYOUT_TYPES = {
    CENTER: 'center',
    LEFT: 'left',
    RIGHT: 'right',
    IMAGE_LEFT: 'image-left',
    IMAGE_RIGHT: 'image-right',
    IMAGE_TOP: 'image-top',
    IMAGE_BOTTOM: 'image-bottom',
    IMAGE_FULL: 'image-full',
    IMAGE_BACKGROUND: 'image-background',
    CHART_FULL: 'chart-full',
    CHART_LEFT: 'chart-left',
    CHART_RIGHT: 'chart-right',
    TWO_COLUMN_EQUAL: 'two-column-equal',
    TWO_COLUMN_LEFT_WIDE: 'two-column-left-wide',
    TWO_COLUMN_RIGHT_WIDE: 'two-column-right-wide',
    THREE_COLUMN: 'three-column',
    GRID_2X2: 'grid-2x2',
    TIMELINE_HORIZONTAL: 'timeline-horizontal',
    TIMELINE_VERTICAL: 'timeline-vertical',
} as const;

export type LayoutType = (typeof LAYOUT_TYPES)[keyof typeof LAYOUT_TYPES];

export const LAYOUT_LABELS: Record<LayoutType, string> = {
    [LAYOUT_TYPES.CENTER]: '중앙 정렬',
    [LAYOUT_TYPES.LEFT]: '왼쪽 정렬',
    [LAYOUT_TYPES.RIGHT]: '오른쪽 정렬',
    [LAYOUT_TYPES.IMAGE_LEFT]: '이미지 왼쪽',
    [LAYOUT_TYPES.IMAGE_RIGHT]: '이미지 오른쪽',
    [LAYOUT_TYPES.IMAGE_TOP]: '이미지 상단',
    [LAYOUT_TYPES.IMAGE_BOTTOM]: '이미지 하단',
    [LAYOUT_TYPES.IMAGE_FULL]: '이미지 전체',
    [LAYOUT_TYPES.IMAGE_BACKGROUND]: '배경 이미지',
    [LAYOUT_TYPES.CHART_FULL]: '차트 전체',
    [LAYOUT_TYPES.CHART_LEFT]: '차트 왼쪽',
    [LAYOUT_TYPES.CHART_RIGHT]: '차트 오른쪽',
    [LAYOUT_TYPES.TWO_COLUMN_EQUAL]: '2단 균등',
    [LAYOUT_TYPES.TWO_COLUMN_LEFT_WIDE]: '2단 왼쪽 넓게',
    [LAYOUT_TYPES.TWO_COLUMN_RIGHT_WIDE]: '2단 오른쪽 넓게',
    [LAYOUT_TYPES.THREE_COLUMN]: '3단',
    [LAYOUT_TYPES.GRID_2X2]: '2x2 그리드',
    [LAYOUT_TYPES.TIMELINE_HORIZONTAL]: '타임라인 가로',
    [LAYOUT_TYPES.TIMELINE_VERTICAL]: '타임라인 세로',
};

// Standard slide dimensions (in points, 16:9 aspect ratio)
export const SLIDE_DIMENSIONS = {
    WIDTH: 960,
    HEIGHT: 540,
    ASPECT_RATIO: 16 / 9,
};

// Standard margins (in points)
export const DEFAULT_MARGINS = {
    TOP: 40,
    RIGHT: 40,
    BOTTOM: 40,
    LEFT: 40,
};

// Font size presets
export const FONT_SIZES = {
    TITLE: {
        XL: 44,
        LG: 36,
        MD: 28,
        SM: 24,
    },
    BODY: {
        XL: 24,
        LG: 20,
        MD: 18,
        SM: 16,
        XS: 14,
    },
    CAPTION: 12,
};
