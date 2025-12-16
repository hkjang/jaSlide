/**
 * 텍스트 길이 대비 폰트 크기 자동 조정 유틸리티
 * 가독성을 유지하면서 콘텐츠가 슬라이드에 잘 맞도록 폰트 크기를 조정합니다.
 */

export interface FontOptimizationConfig {
    containerWidth: number;
    containerHeight: number;
    minFontSize?: number;
    maxFontSize?: number;
    lineHeight?: number;
    padding?: number;
}

export interface FontOptimizationResult {
    fontSize: number;
    lineHeight: number;
    overflow: boolean;
    textTruncated: boolean;
    lines: number;
}

const DEFAULT_CONFIG: Required<Omit<FontOptimizationConfig, 'containerWidth' | 'containerHeight'>> = {
    minFontSize: 12,
    maxFontSize: 48,
    lineHeight: 1.5,
    padding: 20,
};

/**
 * 텍스트 길이에 따른 최적 폰트 크기 계산
 */
export function calculateOptimalFontSize(
    text: string,
    config: FontOptimizationConfig
): FontOptimizationResult {
    const {
        containerWidth,
        containerHeight,
        minFontSize = DEFAULT_CONFIG.minFontSize,
        maxFontSize = DEFAULT_CONFIG.maxFontSize,
        lineHeight = DEFAULT_CONFIG.lineHeight,
        padding = DEFAULT_CONFIG.padding,
    } = config;

    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    // 텍스트 길이와 단어 수 분석
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).length;
    const avgCharsPerWord = charCount / Math.max(wordCount, 1);

    // 초기 폰트 크기 추정 (문자당 평균 너비 0.5em 가정)
    const charsPerLine = Math.floor(availableWidth / (maxFontSize * 0.5));
    const estimatedLines = Math.ceil(charCount / charsPerLine);
    const lineHeightPx = maxFontSize * lineHeight;
    const estimatedHeight = estimatedLines * lineHeightPx;

    let optimalFontSize = maxFontSize;
    let overflow = false;
    let textTruncated = false;

    // 높이에 맞게 폰트 크기 조정
    if (estimatedHeight > availableHeight) {
        const maxLines = Math.floor(availableHeight / (minFontSize * lineHeight));
        const targetCharsPerLine = Math.ceil(charCount / maxLines);
        const targetCharWidth = availableWidth / targetCharsPerLine;
        optimalFontSize = Math.max(minFontSize, Math.min(maxFontSize, targetCharWidth * 2));
    }

    // 폰트 크기 범위 보장
    optimalFontSize = Math.max(minFontSize, Math.min(maxFontSize, optimalFontSize));

    // 텍스트가 매우 긴 경우
    if (charCount > 500) {
        optimalFontSize = Math.min(optimalFontSize, 24);
    } else if (charCount > 300) {
        optimalFontSize = Math.min(optimalFontSize, 28);
    } else if (charCount > 150) {
        optimalFontSize = Math.min(optimalFontSize, 32);
    } else if (charCount < 50) {
        optimalFontSize = Math.min(optimalFontSize, maxFontSize);
    }

    // 최종 라인 수 계산
    const finalCharsPerLine = Math.floor(availableWidth / (optimalFontSize * 0.55));
    const finalLines = Math.ceil(charCount / finalCharsPerLine);
    const finalHeight = finalLines * (optimalFontSize * lineHeight);

    if (finalHeight > availableHeight) {
        overflow = true;
        textTruncated = true;
    }

    return {
        fontSize: Math.round(optimalFontSize),
        lineHeight,
        overflow,
        textTruncated,
        lines: finalLines,
    };
}

/**
 * 슬라이드 타입별 기본 폰트 크기 가져오기
 */
export function getDefaultFontSizeBySlideType(
    slideType: string
): { title: number; body: number; subtitle: number } {
    const configs: Record<string, { title: number; body: number; subtitle: number }> = {
        TITLE: { title: 48, body: 24, subtitle: 28 },
        CONTENT: { title: 36, body: 18, subtitle: 22 },
        TWO_COLUMN: { title: 32, body: 16, subtitle: 20 },
        IMAGE: { title: 32, body: 16, subtitle: 20 },
        CHART: { title: 32, body: 14, subtitle: 18 },
        QUOTE: { title: 28, body: 20, subtitle: 16 },
        BULLET_LIST: { title: 32, body: 18, subtitle: 20 },
        COMPARISON: { title: 28, body: 16, subtitle: 18 },
        TIMELINE: { title: 28, body: 14, subtitle: 16 },
        SECTION_HEADER: { title: 44, body: 20, subtitle: 24 },
        BLANK: { title: 36, body: 18, subtitle: 22 },
    };

    return configs[slideType] || { title: 36, body: 18, subtitle: 22 };
}

/**
 * 텍스트 콘텐츠에 폰트 최적화 적용
 */
export function optimizeTextContent(
    content: {
        title?: string;
        body?: string;
        bullets?: string[];
    },
    containerWidth: number,
    containerHeight: number,
    slideType: string = 'CONTENT'
): {
    title?: { text: string; fontSize: number };
    body?: { text: string; fontSize: number };
    bullets?: { text: string; fontSize: number }[];
} {
    const defaultSizes = getDefaultFontSizeBySlideType(slideType);
    const result: ReturnType<typeof optimizeTextContent> = {};

    // 타이틀 최적화 (상단 30% 영역)
    if (content.title) {
        const titleHeight = containerHeight * 0.3;
        const titleResult = calculateOptimalFontSize(content.title, {
            containerWidth,
            containerHeight: titleHeight,
            minFontSize: 24,
            maxFontSize: defaultSizes.title,
        });
        result.title = {
            text: content.title,
            fontSize: titleResult.fontSize,
        };
    }

    // 본문 최적화 (하단 70% 영역)
    if (content.body) {
        const bodyHeight = containerHeight * 0.7;
        const bodyResult = calculateOptimalFontSize(content.body, {
            containerWidth,
            containerHeight: bodyHeight,
            minFontSize: 14,
            maxFontSize: defaultSizes.body,
        });
        result.body = {
            text: content.body,
            fontSize: bodyResult.fontSize,
        };
    }

    // 불릿 리스트 최적화
    if (content.bullets && content.bullets.length > 0) {
        const bulletHeight = containerHeight * 0.7 / content.bullets.length;
        result.bullets = content.bullets.map((bullet) => {
            const bulletResult = calculateOptimalFontSize(bullet, {
                containerWidth: containerWidth * 0.9, // 불릿 마커 공간
                containerHeight: bulletHeight,
                minFontSize: 14,
                maxFontSize: defaultSizes.body,
            });
            return {
                text: bullet,
                fontSize: bulletResult.fontSize,
            };
        });
    }

    return result;
}

/**
 * CSS 스타일 객체 생성
 */
export function createFontStyle(
    fontSize: number,
    lineHeight: number = 1.5
): React.CSSProperties {
    return {
        fontSize: `${fontSize}px`,
        lineHeight,
    };
}

export default {
    calculateOptimalFontSize,
    getDefaultFontSizeBySlideType,
    optimizeTextContent,
    createFontStyle,
};
