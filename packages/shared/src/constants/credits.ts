// Credit cost constants

export const CREDIT_COSTS = {
    // Per slide generation
    SLIDE_BASIC: 1,
    SLIDE_WITH_IMAGE: 3,
    SLIDE_WITH_CHART: 2,

    // Image generation
    IMAGE_SEARCH: 1,
    IMAGE_AI_GENERATE: 5,

    // Chart generation
    CHART_SIMPLE: 1,
    CHART_COMPLEX: 2,

    // Research and fact-checking
    WEB_RESEARCH: 3,
    FACT_CHECK: 2,

    // Export
    EXPORT_PPTX: 0,
    EXPORT_PDF: 2,
    EXPORT_GOOGLE_SLIDES: 3,

    // AI Edit
    AI_EDIT_SIMPLE: 1,
    AI_EDIT_COMPLEX: 2,
};

export const CREDIT_LIMITS = {
    FREE_TIER: 100,
    STARTER_TIER: 500,
    PROFESSIONAL_TIER: 2000,
    ENTERPRISE_TIER: -1, // unlimited
};

export const CREDIT_PLANS = [
    {
        id: 'free',
        name: '무료',
        credits: 100,
        price: 0,
        currency: 'KRW',
        features: ['월 100 크레딧', '기본 템플릿', 'PPTX 내보내기'],
    },
    {
        id: 'starter',
        name: '스타터',
        credits: 500,
        price: 9900,
        currency: 'KRW',
        features: ['월 500 크레딧', '모든 템플릿', 'PDF 내보내기', '우선 처리'],
    },
    {
        id: 'professional',
        name: '프로페셔널',
        credits: 2000,
        price: 29900,
        currency: 'KRW',
        popular: true,
        features: [
            '월 2000 크레딧',
            '모든 템플릿',
            '모든 내보내기',
            'AI 이미지 생성',
            '브랜드 설정',
        ],
    },
    {
        id: 'enterprise',
        name: '엔터프라이즈',
        credits: -1,
        price: 99900,
        currency: 'KRW',
        features: [
            '무제한 크레딧',
            '커스텀 템플릿',
            'SSO 연동',
            '전용 지원',
            'API 액세스',
        ],
    },
];

// Estimate credit cost for a generation job
export function estimateCreditCost(params: {
    slideCount: number;
    includeImages: boolean;
    includeCharts: boolean;
    includeResearch: boolean;
    exportFormat: 'pptx' | 'pdf' | 'google-slides';
}): number {
    let cost = 0;

    // Base slide cost
    cost += params.slideCount * CREDIT_COSTS.SLIDE_BASIC;

    // Image cost (estimate 30% of slides have images)
    if (params.includeImages) {
        const imageSlides = Math.ceil(params.slideCount * 0.3);
        cost += imageSlides * CREDIT_COSTS.IMAGE_SEARCH;
    }

    // Chart cost (estimate 20% of slides have charts)
    if (params.includeCharts) {
        const chartSlides = Math.ceil(params.slideCount * 0.2);
        cost += chartSlides * CREDIT_COSTS.CHART_SIMPLE;
    }

    // Research cost
    if (params.includeResearch) {
        cost += CREDIT_COSTS.WEB_RESEARCH;
    }

    // Export cost
    switch (params.exportFormat) {
        case 'pdf':
            cost += CREDIT_COSTS.EXPORT_PDF;
            break;
        case 'google-slides':
            cost += CREDIT_COSTS.EXPORT_GOOGLE_SLIDES;
            break;
        default:
            cost += CREDIT_COSTS.EXPORT_PPTX;
    }

    return cost;
}
