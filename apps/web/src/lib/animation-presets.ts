// Animation Presets for JaSlide
// 각 프리셋은 CSS keyframes 기반 애니메이션을 정의합니다

export interface AnimationPreset {
    id: string;
    name: string;
    category: 'entrance' | 'emphasis' | 'exit';
    duration: number;      // ms
    delay: number;         // ms
    easing: string;
    keyframes: string;
    cssClass: string;
}

// CSS Keyframes 정의
export const KEYFRAMES = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes slideOutLeft {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes zoomIn {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes zoomOut {
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0); opacity: 0; }
}

@keyframes bounceIn {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes swing {
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-10deg); }
    60% { transform: rotate(5deg); }
    80% { transform: rotate(-5deg); }
    100% { transform: rotate(0deg); }
}

@keyframes flash {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0; }
}

@keyframes rubberBand {
    0% { transform: scale(1); }
    30% { transform: scaleX(1.25) scaleY(0.75); }
    40% { transform: scaleX(0.75) scaleY(1.25); }
    50% { transform: scaleX(1.15) scaleY(0.85); }
    65% { transform: scaleX(0.95) scaleY(1.05); }
    75% { transform: scaleX(1.05) scaleY(0.95); }
    100% { transform: scale(1); }
}

@keyframes flipInX {
    from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
    40% { transform: perspective(400px) rotateX(-10deg); }
    70% { transform: perspective(400px) rotateX(10deg); }
    to { transform: perspective(400px) rotateX(0deg); opacity: 1; }
}

@keyframes flipInY {
    from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
    40% { transform: perspective(400px) rotateY(-10deg); }
    70% { transform: perspective(400px) rotateY(10deg); }
    to { transform: perspective(400px) rotateY(0deg); opacity: 1; }
}
`;

// 등장 효과
export const ENTRANCE_PRESETS: AnimationPreset[] = [
    {
        id: 'fade-in',
        name: '페이드',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'fadeIn',
        cssClass: 'animate-fadeIn',
    },
    {
        id: 'slide-in-left',
        name: '왼쪽에서',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'slideInLeft',
        cssClass: 'animate-slideInLeft',
    },
    {
        id: 'slide-in-right',
        name: '오른쪽에서',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'slideInRight',
        cssClass: 'animate-slideInRight',
    },
    {
        id: 'slide-in-up',
        name: '아래에서',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'slideInUp',
        cssClass: 'animate-slideInUp',
    },
    {
        id: 'slide-in-down',
        name: '위에서',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'slideInDown',
        cssClass: 'animate-slideInDown',
    },
    {
        id: 'zoom-in',
        name: '확대',
        category: 'entrance',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'zoomIn',
        cssClass: 'animate-zoomIn',
    },
    {
        id: 'bounce-in',
        name: '바운스',
        category: 'entrance',
        duration: 750,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'bounceIn',
        cssClass: 'animate-bounceIn',
    },
    {
        id: 'flip-in-x',
        name: '플립 X',
        category: 'entrance',
        duration: 750,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'flipInX',
        cssClass: 'animate-flipInX',
    },
    {
        id: 'flip-in-y',
        name: '플립 Y',
        category: 'entrance',
        duration: 750,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'flipInY',
        cssClass: 'animate-flipInY',
    },
];

// 강조 효과
export const EMPHASIS_PRESETS: AnimationPreset[] = [
    {
        id: 'pulse',
        name: '펄스',
        category: 'emphasis',
        duration: 500,
        delay: 0,
        easing: 'ease-in-out',
        keyframes: 'pulse',
        cssClass: 'animate-pulse',
    },
    {
        id: 'shake',
        name: '흔들기',
        category: 'emphasis',
        duration: 500,
        delay: 0,
        easing: 'ease-in-out',
        keyframes: 'shake',
        cssClass: 'animate-shake',
    },
    {
        id: 'swing',
        name: '스윙',
        category: 'emphasis',
        duration: 500,
        delay: 0,
        easing: 'ease-in-out',
        keyframes: 'swing',
        cssClass: 'animate-swing',
    },
    {
        id: 'flash',
        name: '깜빡임',
        category: 'emphasis',
        duration: 750,
        delay: 0,
        easing: 'linear',
        keyframes: 'flash',
        cssClass: 'animate-flash',
    },
    {
        id: 'rubber-band',
        name: '탄성',
        category: 'emphasis',
        duration: 750,
        delay: 0,
        easing: 'ease-out',
        keyframes: 'rubberBand',
        cssClass: 'animate-rubberBand',
    },
];

// 퇴장 효과
export const EXIT_PRESETS: AnimationPreset[] = [
    {
        id: 'fade-out',
        name: '페이드 아웃',
        category: 'exit',
        duration: 500,
        delay: 0,
        easing: 'ease-in',
        keyframes: 'fadeOut',
        cssClass: 'animate-fadeOut',
    },
    {
        id: 'slide-out-left',
        name: '왼쪽으로',
        category: 'exit',
        duration: 500,
        delay: 0,
        easing: 'ease-in',
        keyframes: 'slideOutLeft',
        cssClass: 'animate-slideOutLeft',
    },
    {
        id: 'slide-out-right',
        name: '오른쪽으로',
        category: 'exit',
        duration: 500,
        delay: 0,
        easing: 'ease-in',
        keyframes: 'slideOutRight',
        cssClass: 'animate-slideOutRight',
    },
    {
        id: 'zoom-out',
        name: '축소',
        category: 'exit',
        duration: 500,
        delay: 0,
        easing: 'ease-in',
        keyframes: 'zoomOut',
        cssClass: 'animate-zoomOut',
    },
];

// 모든 프리셋
export const ALL_PRESETS: AnimationPreset[] = [
    ...ENTRANCE_PRESETS,
    ...EMPHASIS_PRESETS,
    ...EXIT_PRESETS,
];

// CSS 생성 유틸리티
export function generateAnimationCSS(preset: AnimationPreset, customDuration?: number, customDelay?: number): string {
    const duration = customDuration ?? preset.duration;
    const delay = customDelay ?? preset.delay;
    return `animation: ${preset.keyframes} ${duration}ms ${preset.easing} ${delay}ms forwards`;
}

// 프리셋 이름으로 찾기
export function getPresetById(id: string): AnimationPreset | undefined {
    return ALL_PRESETS.find(p => p.id === id);
}

// 카테고리별 프리셋
export function getPresetsByCategory(category: AnimationPreset['category']): AnimationPreset[] {
    return ALL_PRESETS.filter(p => p.category === category);
}
