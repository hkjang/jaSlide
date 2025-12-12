// Slide type constants

import { SlideType } from '../types/slide';

export const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
    [SlideType.TITLE]: '타이틀',
    [SlideType.CONTENT]: '콘텐츠',
    [SlideType.TWO_COLUMN]: '2단 컬럼',
    [SlideType.IMAGE]: '이미지',
    [SlideType.CHART]: '차트',
    [SlideType.QUOTE]: '인용문',
    [SlideType.BULLET_LIST]: '글머리 기호',
    [SlideType.COMPARISON]: '비교',
    [SlideType.TIMELINE]: '타임라인',
    [SlideType.SECTION_HEADER]: '섹션 헤더',
    [SlideType.BLANK]: '빈 슬라이드',
};

export const SLIDE_TYPE_LABELS_EN: Record<SlideType, string> = {
    [SlideType.TITLE]: 'Title',
    [SlideType.CONTENT]: 'Content',
    [SlideType.TWO_COLUMN]: 'Two Column',
    [SlideType.IMAGE]: 'Image',
    [SlideType.CHART]: 'Chart',
    [SlideType.QUOTE]: 'Quote',
    [SlideType.BULLET_LIST]: 'Bullet List',
    [SlideType.COMPARISON]: 'Comparison',
    [SlideType.TIMELINE]: 'Timeline',
    [SlideType.SECTION_HEADER]: 'Section Header',
    [SlideType.BLANK]: 'Blank',
};

export const SLIDE_TYPE_ICONS: Record<SlideType, string> = {
    [SlideType.TITLE]: 'heading',
    [SlideType.CONTENT]: 'file-text',
    [SlideType.TWO_COLUMN]: 'columns',
    [SlideType.IMAGE]: 'image',
    [SlideType.CHART]: 'bar-chart',
    [SlideType.QUOTE]: 'quote',
    [SlideType.BULLET_LIST]: 'list',
    [SlideType.COMPARISON]: 'git-compare',
    [SlideType.TIMELINE]: 'clock',
    [SlideType.SECTION_HEADER]: 'bookmark',
    [SlideType.BLANK]: 'square',
};

export const DEFAULT_SLIDE_ORDER = [
    SlideType.TITLE,
    SlideType.CONTENT,
    SlideType.BULLET_LIST,
    SlideType.TWO_COLUMN,
    SlideType.IMAGE,
    SlideType.CHART,
    SlideType.QUOTE,
    SlideType.COMPARISON,
    SlideType.TIMELINE,
    SlideType.SECTION_HEADER,
];
