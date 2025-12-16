'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Lightbulb,
    AlertTriangle,
    CheckCircle,
    Sparkles,
    ChevronRight,
} from 'lucide-react';

interface InputGuideProps {
    inputText: string;
    purpose?: string;
    onExampleClick?: (example: string) => void;
}

interface InputQuality {
    score: 'poor' | 'fair' | 'good' | 'excellent';
    message: string;
    suggestions: string[];
}

const PURPOSE_EXAMPLES: Record<string, string[]> = {
    'business-report': [
        '2024년 4분기 매출 실적 분석 및 2025년 전망',
        '신규 프로젝트 A의 진행 현황과 주요 성과',
        '고객 만족도 조사 결과 및 개선 방안',
    ],
    'investment-pitch': [
        'AI 기반 헬스케어 스타트업 시리즈 A 투자 제안',
        '온라인 교육 플랫폼 사업 계획 및 성장 전략',
        'SaaS B2B 솔루션의 시장 기회와 경쟁 우위',
    ],
    education: [
        '머신러닝 기초 개념과 실습 가이드',
        '효과적인 프레젠테이션 스킬 워크샵',
        'Python 프로그래밍 입문 강좌',
    ],
    marketing: [
        '신제품 런칭 캠페인 전략 및 실행 계획',
        '2025년 브랜드 리뉴얼 제안서',
        '소셜 미디어 마케팅 성과 분석',
    ],
    'team-meeting': [
        '이번 스프린트 회고 및 다음 스프린트 계획',
        '팀 OKR 설정 및 분기 목표',
        '신규 입사자 온보딩 프로세스 공유',
    ],
    'idea-proposal': [
        '고객 경험 개선을 위한 신규 기능 제안',
        '업무 자동화를 통한 생산성 향상 방안',
        '친환경 사무실 전환 프로젝트 기획',
    ],
};

const DEFAULT_EXAMPLES = [
    'AI 기술의 비즈니스 활용 방안과 사례',
    '효과적인 팀 협업 도구 소개',
    '디지털 트랜스포메이션 전략',
];

function analyzeInputQuality(text: string): InputQuality {
    const length = text.trim().length;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const hasSpecificDetails = /\d+|구체적|분석|전략|방안|결과/.test(text);
    const hasTopic = wordCount >= 3;

    if (length < 10) {
        return {
            score: 'poor',
            message: '더 구체적인 주제를 입력해주세요',
            suggestions: ['발표 주제를 명확히 작성해주세요', '키워드보다 문장으로 작성하면 좋아요'],
        };
    }

    if (length < 30 || wordCount < 5) {
        return {
            score: 'fair',
            message: '괜찮아요! 조금 더 상세하면 좋겠어요',
            suggestions: ['목적이나 대상을 추가해보세요', '핵심 포인트를 언급해주세요'],
        };
    }

    if (!hasSpecificDetails) {
        return {
            score: 'good',
            message: '좋아요! 구체적인 수치나 목표가 있으면 더 좋아요',
            suggestions: ['구체적인 수치나 기간을 추가해보세요'],
        };
    }

    return {
        score: 'excellent',
        message: '훌륭해요! AI가 최적의 슬라이드를 생성할 수 있어요',
        suggestions: [],
    };
}

export function InputGuidePanel({ inputText, purpose, onExampleClick }: InputGuideProps) {
    const [showHints, setShowHints] = useState(true);

    const examples = useMemo(() => {
        if (purpose && PURPOSE_EXAMPLES[purpose]) {
            return PURPOSE_EXAMPLES[purpose];
        }
        return DEFAULT_EXAMPLES;
    }, [purpose]);

    const quality = useMemo(() => {
        return analyzeInputQuality(inputText);
    }, [inputText]);

    const qualityColors = {
        poor: 'text-red-500 bg-red-50',
        fair: 'text-yellow-600 bg-yellow-50',
        good: 'text-blue-500 bg-blue-50',
        excellent: 'text-green-500 bg-green-50',
    };

    const qualityIcons = {
        poor: AlertTriangle,
        fair: Lightbulb,
        good: Sparkles,
        excellent: CheckCircle,
    };

    const QualityIcon = qualityIcons[quality.score];

    return (
        <div className="space-y-4">
            {/* Quality Indicator */}
            {inputText.length > 0 && (
                <div className={`flex items-start gap-3 p-3 rounded-lg ${qualityColors[quality.score]}`}>
                    <QualityIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-sm">{quality.message}</p>
                        {quality.suggestions.length > 0 && (
                            <ul className="mt-1 space-y-1">
                                {quality.suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-xs opacity-80">
                                        • {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Example Prompts */}
            {showHints && inputText.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-700">예시 프롬프트</span>
                        </div>
                        <button
                            onClick={() => setShowHints(false)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            닫기
                        </button>
                    </div>
                    <div className="space-y-2">
                        {examples.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => onExampleClick?.(example)}
                                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-purple-700">
                                    {example}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Stats */}
            {inputText.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{inputText.length} 글자</span>
                    <span>{inputText.trim().split(/\s+/).filter(Boolean).length} 단어</span>
                </div>
            )}
        </div>
    );
}
