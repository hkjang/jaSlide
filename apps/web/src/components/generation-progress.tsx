'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Palette,
    Layers,
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
} from 'lucide-react';

interface GenerationStep {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    status: 'pending' | 'active' | 'completed' | 'error';
}

interface GenerationProgressProps {
    currentStep: string;
    progress: number;
    status: 'idle' | 'generating' | 'completed' | 'failed';
    onCancel?: () => void;
    estimatedTime?: number; // seconds
    startTime?: Date;
}

const GENERATION_STEPS: GenerationStep[] = [
    {
        id: 'analyzing',
        name: '콘텐츠 분석',
        description: '입력된 내용을 분석하고 있습니다',
        icon: FileText,
        status: 'pending',
    },
    {
        id: 'structuring',
        name: '구조화',
        description: '슬라이드 구조를 설계하고 있습니다',
        icon: Layers,
        status: 'pending',
    },
    {
        id: 'designing',
        name: '디자인 적용',
        description: '템플릿과 스타일을 적용하고 있습니다',
        icon: Palette,
        status: 'pending',
    },
    {
        id: 'rendering',
        name: '최종 렌더링',
        description: '슬라이드를 최종 생성하고 있습니다',
        icon: Layers,
        status: 'pending',
    },
];

function getStepFromProgress(progress: number): string {
    if (progress < 20) return 'analyzing';
    if (progress < 50) return 'structuring';
    if (progress < 80) return 'designing';
    return 'rendering';
}

export function GenerationProgress({
    currentStep,
    progress,
    status,
    onCancel,
    estimatedTime = 30,
    startTime,
}: GenerationProgressProps) {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (status !== 'generating' || !startTime) return;

        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [status, startTime]);

    const activeStep = getStepFromProgress(progress);

    const steps = GENERATION_STEPS.map((step) => {
        const stepIndex = GENERATION_STEPS.findIndex((s) => s.id === step.id);
        const activeIndex = GENERATION_STEPS.findIndex((s) => s.id === activeStep);

        let stepStatus: 'pending' | 'active' | 'completed' | 'error' = 'pending';
        if (status === 'failed') {
            stepStatus = stepIndex <= activeIndex ? 'error' : 'pending';
        } else if (stepIndex < activeIndex) {
            stepStatus = 'completed';
        } else if (stepIndex === activeIndex) {
            stepStatus = 'active';
        }

        return { ...step, status: stepStatus };
    });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
    };

    const remainingTime = Math.max(0, estimatedTime - elapsedTime);

    return (
        <div className="bg-white rounded-xl border shadow-lg p-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                {status === 'generating' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            프레젠테이션 생성 중
                        </h2>
                        <p className="text-sm text-gray-500">
                            AI가 최적의 슬라이드를 만들고 있습니다
                        </p>
                    </>
                )}

                {status === 'completed' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            생성 완료!
                        </h2>
                        <p className="text-sm text-gray-500">
                            프레젠테이션이 성공적으로 생성되었습니다
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            생성 실패
                        </h2>
                        <p className="text-sm text-gray-500">
                            오류가 발생했습니다. 다시 시도해주세요.
                        </p>
                    </>
                )}
            </div>

            {/* Progress Bar */}
            {status === 'generating' && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            {progress}% 완료
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>약 {formatTime(remainingTime)} 남음</span>
                        </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Steps */}
            <div className="space-y-3 mb-6">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.status === 'active';
                    const isCompleted = step.status === 'completed';
                    const isError = step.status === 'error';

                    return (
                        <div
                            key={step.id}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg transition-all
                                ${isActive ? 'bg-purple-50 border border-purple-200' : ''}
                                ${isCompleted ? 'bg-green-50' : ''}
                                ${isError ? 'bg-red-50' : ''}
                            `}
                        >
                            {/* Step indicator */}
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                ${isActive ? 'bg-purple-500' : ''}
                                ${isCompleted ? 'bg-green-500' : ''}
                                ${isError ? 'bg-red-500' : ''}
                                ${step.status === 'pending' ? 'bg-gray-200' : ''}
                            `}>
                                {isActive && <Loader2 className="h-4 w-4 text-white animate-spin" />}
                                {isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
                                {isError && <XCircle className="h-4 w-4 text-white" />}
                                {step.status === 'pending' && (
                                    <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                                )}
                            </div>

                            {/* Step info */}
                            <div className="flex-1 min-w-0">
                                <p className={`
                                    text-sm font-medium
                                    ${isActive ? 'text-purple-700' : ''}
                                    ${isCompleted ? 'text-green-700' : ''}
                                    ${isError ? 'text-red-700' : ''}
                                    ${step.status === 'pending' ? 'text-gray-400' : ''}
                                `}>
                                    {step.name}
                                </p>
                                {isActive && (
                                    <p className="text-xs text-purple-500">{step.description}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            {status === 'generating' && onCancel && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        className="text-gray-500"
                    >
                        생성 취소
                    </Button>
                </div>
            )}

            {/* Background info */}
            {status === 'generating' && (
                <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-xs text-gray-400">
                        💡 다른 탭에서 작업을 계속할 수 있습니다. 완료되면 알림을 보내드릴게요.
                    </p>
                </div>
            )}
        </div>
    );
}
