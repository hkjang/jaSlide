/**
 * 슬라이드 콘텐츠 자동 분할 유틸리티
 * 슬라이드 길이 초과 시 자동으로 여러 슬라이드로 분할합니다.
 */

export interface SlideContent {
    id?: string;
    type: string;
    title?: string;
    content: {
        text?: string;
        bullets?: string[];
        items?: unknown[];
    };
    layout?: string;
}

export interface SplitConfig {
    maxBulletsPerSlide?: number;
    maxCharsPerSlide?: number;
    maxItemsPerSlide?: number;
    preserveTitle?: boolean;
    continuationPrefix?: string;
}

const DEFAULT_SPLIT_CONFIG: Required<SplitConfig> = {
    maxBulletsPerSlide: 6,
    maxCharsPerSlide: 500,
    maxItemsPerSlide: 4,
    preserveTitle: true,
    continuationPrefix: '(계속)',
};

/**
 * 슬라이드 분할이 필요한지 확인
 */
export function needsSplit(slide: SlideContent, config?: SplitConfig): boolean {
    const mergedConfig = { ...DEFAULT_SPLIT_CONFIG, ...config };
    const content = slide.content;

    // 불릿 리스트 확인
    if (content.bullets && content.bullets.length > mergedConfig.maxBulletsPerSlide) {
        return true;
    }

    // 텍스트 길이 확인
    if (content.text && content.text.length > mergedConfig.maxCharsPerSlide) {
        return true;
    }

    // 아이템 수 확인
    if (content.items && content.items.length > mergedConfig.maxItemsPerSlide) {
        return true;
    }

    return false;
}

/**
 * 불릿 리스트 슬라이드 분할
 */
function splitBulletSlide(
    slide: SlideContent,
    config: Required<SplitConfig>
): SlideContent[] {
    const bullets = slide.content.bullets || [];
    const result: SlideContent[] = [];
    const { maxBulletsPerSlide, preserveTitle, continuationPrefix } = config;

    for (let i = 0; i < bullets.length; i += maxBulletsPerSlide) {
        const isFirstSlide = i === 0;
        const chunk = bullets.slice(i, i + maxBulletsPerSlide);

        result.push({
            ...slide,
            id: undefined, // 새 ID 생성 필요
            title: isFirstSlide || !preserveTitle
                ? slide.title
                : `${slide.title} ${continuationPrefix}`,
            content: {
                ...slide.content,
                bullets: chunk,
            },
        });
    }

    return result;
}

/**
 * 텍스트 슬라이드 분할
 */
function splitTextSlide(
    slide: SlideContent,
    config: Required<SplitConfig>
): SlideContent[] {
    const text = slide.content.text || '';
    const result: SlideContent[] = [];
    const { maxCharsPerSlide, preserveTitle, continuationPrefix } = config;

    // 문단 단위로 분할 시도
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let slideIndex = 0;

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxCharsPerSlide && currentChunk.length > 0) {
            // 현재 청크 저장
            result.push({
                ...slide,
                id: undefined,
                title: slideIndex === 0 || !preserveTitle
                    ? slide.title
                    : `${slide.title} ${continuationPrefix}`,
                content: {
                    ...slide.content,
                    text: currentChunk.trim(),
                },
            });
            slideIndex++;
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }

    // 마지막 청크 저장
    if (currentChunk.trim()) {
        result.push({
            ...slide,
            id: undefined,
            title: slideIndex === 0 || !preserveTitle
                ? slide.title
                : `${slide.title} ${continuationPrefix}`,
            content: {
                ...slide.content,
                text: currentChunk.trim(),
            },
        });
    }

    // 문단 분할이 실패한 경우 (하나의 긴 텍스트)
    if (result.length === 0 && text.length > 0) {
        // 문장 단위로 분할
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        currentChunk = '';
        slideIndex = 0;

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxCharsPerSlide && currentChunk.length > 0) {
                result.push({
                    ...slide,
                    id: undefined,
                    title: slideIndex === 0 || !preserveTitle
                        ? slide.title
                        : `${slide.title} ${continuationPrefix}`,
                    content: {
                        ...slide.content,
                        text: currentChunk.trim(),
                    },
                });
                slideIndex++;
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk.trim()) {
            result.push({
                ...slide,
                id: undefined,
                title: slideIndex === 0 || !preserveTitle
                    ? slide.title
                    : `${slide.title} ${continuationPrefix}`,
                content: {
                    ...slide.content,
                    text: currentChunk.trim(),
                },
            });
        }
    }

    return result.length > 0 ? result : [slide];
}

/**
 * 아이템 리스트 슬라이드 분할
 */
function splitItemSlide(
    slide: SlideContent,
    config: Required<SplitConfig>
): SlideContent[] {
    const items = slide.content.items || [];
    const result: SlideContent[] = [];
    const { maxItemsPerSlide, preserveTitle, continuationPrefix } = config;

    for (let i = 0; i < items.length; i += maxItemsPerSlide) {
        const isFirstSlide = i === 0;
        const chunk = items.slice(i, i + maxItemsPerSlide);

        result.push({
            ...slide,
            id: undefined,
            title: isFirstSlide || !preserveTitle
                ? slide.title
                : `${slide.title} ${continuationPrefix}`,
            content: {
                ...slide.content,
                items: chunk,
            },
        });
    }

    return result;
}

/**
 * 슬라이드 분할 실행
 */
export function splitSlide(
    slide: SlideContent,
    config?: SplitConfig
): SlideContent[] {
    const mergedConfig = { ...DEFAULT_SPLIT_CONFIG, ...config };

    if (!needsSplit(slide, mergedConfig)) {
        return [slide];
    }

    const content = slide.content;

    // 불릿 리스트 분할
    if (content.bullets && content.bullets.length > mergedConfig.maxBulletsPerSlide) {
        return splitBulletSlide(slide, mergedConfig);
    }

    // 텍스트 분할
    if (content.text && content.text.length > mergedConfig.maxCharsPerSlide) {
        return splitTextSlide(slide, mergedConfig);
    }

    // 아이템 분할
    if (content.items && content.items.length > mergedConfig.maxItemsPerSlide) {
        return splitItemSlide(slide, mergedConfig);
    }

    return [slide];
}

/**
 * 여러 슬라이드 일괄 분할
 */
export function splitSlides(
    slides: SlideContent[],
    config?: SplitConfig
): SlideContent[] {
    return slides.flatMap((slide) => splitSlide(slide, config));
}

/**
 * 분할 미리보기 (실제 분할하지 않고 예상 결과 반환)
 */
export function previewSplit(
    slides: SlideContent[],
    config?: SplitConfig
): {
    originalCount: number;
    resultCount: number;
    slidesToSplit: number;
    details: Array<{ originalIndex: number; splitCount: number }>;
} {
    const mergedConfig = { ...DEFAULT_SPLIT_CONFIG, ...config };
    const details: Array<{ originalIndex: number; splitCount: number }> = [];
    let resultCount = 0;
    let slidesToSplit = 0;

    slides.forEach((slide, index) => {
        const splitResult = splitSlide(slide, mergedConfig);
        resultCount += splitResult.length;
        if (splitResult.length > 1) {
            slidesToSplit++;
            details.push({ originalIndex: index, splitCount: splitResult.length });
        }
    });

    return {
        originalCount: slides.length,
        resultCount,
        slidesToSplit,
        details,
    };
}

export default {
    needsSplit,
    splitSlide,
    splitSlides,
    previewSplit,
};
