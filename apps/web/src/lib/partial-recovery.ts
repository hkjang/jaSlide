/**
 * 부분 복구 메커니즘
 * 렌더링 오류 시 해당 슬라이드만 재시도하고 전체 프레젠테이션을 보호합니다.
 */

export interface SlideRecoveryState {
    slideId: string;
    status: 'healthy' | 'error' | 'recovering' | 'recovered' | 'failed';
    errorType?: string;
    errorMessage?: string;
    retryCount: number;
    lastAttempt?: number;
}

export interface RecoveryResult {
    slideId: string;
    success: boolean;
    message: string;
    recoveredData?: unknown;
}

export interface RecoveryOptions {
    maxRetries?: number;
    retryDelay?: number;
    onProgress?: (slideId: string, status: SlideRecoveryState['status']) => void;
    fallbackStrategy?: 'skip' | 'placeholder' | 'previous';
}

const DEFAULT_OPTIONS: Required<Omit<RecoveryOptions, 'onProgress'>> = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackStrategy: 'placeholder',
};

class PartialRecoveryService {
    private states: Map<string, SlideRecoveryState> = new Map();
    private previousVersions: Map<string, unknown> = new Map();

    /**
     * 슬라이드 복구 상태 초기화
     */
    initializeSlide(slideId: string, previousData?: unknown): void {
        this.states.set(slideId, {
            slideId,
            status: 'healthy',
            retryCount: 0,
        });
        if (previousData) {
            this.previousVersions.set(slideId, previousData);
        }
    }

    /**
     * 슬라이드 오류 보고
     */
    reportError(
        slideId: string,
        errorType: string,
        errorMessage: string
    ): SlideRecoveryState {
        const currentState = this.states.get(slideId) || {
            slideId,
            status: 'healthy',
            retryCount: 0,
        };

        const newState: SlideRecoveryState = {
            ...currentState,
            status: 'error',
            errorType,
            errorMessage,
            lastAttempt: Date.now(),
        };

        this.states.set(slideId, newState);
        return newState;
    }

    /**
     * 단일 슬라이드 복구 시도
     */
    async recoverSlide(
        slideId: string,
        recoveryAction: () => Promise<unknown>,
        options?: RecoveryOptions
    ): Promise<RecoveryResult> {
        const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
        const state = this.states.get(slideId);

        if (!state || state.status === 'healthy') {
            return {
                slideId,
                success: true,
                message: '슬라이드가 정상 상태입니다',
            };
        }

        // 최대 재시도 초과 확인
        if (state.retryCount >= mergedOptions.maxRetries) {
            return this.applyFallbackStrategy(slideId, mergedOptions.fallbackStrategy);
        }

        // 복구 상태로 전환
        this.updateState(slideId, 'recovering', options?.onProgress);

        try {
            // 재시도 딜레이
            if (state.retryCount > 0) {
                await this.delay(mergedOptions.retryDelay * state.retryCount);
            }

            const recoveredData = await recoveryAction();

            // 복구 성공
            this.updateState(slideId, 'recovered', options?.onProgress);
            this.states.set(slideId, {
                ...state,
                status: 'recovered',
                retryCount: state.retryCount + 1,
                lastAttempt: Date.now(),
            });

            return {
                slideId,
                success: true,
                message: '슬라이드가 복구되었습니다',
                recoveredData,
            };
        } catch (error) {
            // 복구 실패, 재시도 카운트 증가
            const newRetryCount = state.retryCount + 1;
            this.states.set(slideId, {
                ...state,
                status: newRetryCount >= mergedOptions.maxRetries ? 'failed' : 'error',
                retryCount: newRetryCount,
                lastAttempt: Date.now(),
                errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
            });

            if (newRetryCount >= mergedOptions.maxRetries) {
                return this.applyFallbackStrategy(slideId, mergedOptions.fallbackStrategy);
            }

            return {
                slideId,
                success: false,
                message: `복구 실패 (${newRetryCount}/${mergedOptions.maxRetries})`,
            };
        }
    }

    /**
     * 여러 슬라이드 일괄 복구
     */
    async recoverMultipleSlides(
        slideIds: string[],
        recoveryActionFactory: (slideId: string) => Promise<unknown>,
        options?: RecoveryOptions
    ): Promise<RecoveryResult[]> {
        const results: RecoveryResult[] = [];

        for (const slideId of slideIds) {
            const result = await this.recoverSlide(
                slideId,
                () => recoveryActionFactory(slideId),
                options
            );
            results.push(result);
        }

        return results;
    }

    /**
     * 폴백 전략 적용
     */
    private applyFallbackStrategy(
        slideId: string,
        strategy: Required<RecoveryOptions>['fallbackStrategy']
    ): RecoveryResult {
        switch (strategy) {
            case 'skip':
                return {
                    slideId,
                    success: false,
                    message: '슬라이드를 건너뜁니다',
                };

            case 'previous':
                const previousData = this.previousVersions.get(slideId);
                if (previousData) {
                    return {
                        slideId,
                        success: true,
                        message: '이전 버전으로 복원되었습니다',
                        recoveredData: previousData,
                    };
                }
                // 이전 버전이 없으면 placeholder로 폴백
                return this.createPlaceholder(slideId);

            case 'placeholder':
            default:
                return this.createPlaceholder(slideId);
        }
    }

    /**
     * 플레이스홀더 슬라이드 생성
     */
    private createPlaceholder(slideId: string): RecoveryResult {
        const placeholderData = {
            id: slideId,
            type: 'BLANK',
            title: '콘텐츠를 불러올 수 없습니다',
            content: {
                text: '이 슬라이드의 콘텐츠를 생성하는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
            },
            isPlaceholder: true,
        };

        return {
            slideId,
            success: true,
            message: '임시 슬라이드로 대체되었습니다',
            recoveredData: placeholderData,
        };
    }

    /**
     * 상태 업데이트 및 콜백 호출
     */
    private updateState(
        slideId: string,
        status: SlideRecoveryState['status'],
        onProgress?: RecoveryOptions['onProgress']
    ): void {
        const state = this.states.get(slideId);
        if (state) {
            state.status = status;
            onProgress?.(slideId, status);
        }
    }

    /**
     * 딜레이 유틸리티
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 특정 슬라이드 상태 가져오기
     */
    getSlideState(slideId: string): SlideRecoveryState | undefined {
        return this.states.get(slideId);
    }

    /**
     * 모든 슬라이드 상태 가져오기
     */
    getAllStates(): Map<string, SlideRecoveryState> {
        return new Map(this.states);
    }

    /**
     * 오류 상태인 슬라이드 목록
     */
    getErrorSlides(): string[] {
        return Array.from(this.states.entries())
            .filter(([, state]) => state.status === 'error' || state.status === 'failed')
            .map(([id]) => id);
    }

    /**
     * 모든 상태 초기화
     */
    reset(): void {
        this.states.clear();
        this.previousVersions.clear();
    }

    /**
     * 이전 버전 저장
     */
    savePreviousVersion(slideId: string, data: unknown): void {
        this.previousVersions.set(slideId, JSON.parse(JSON.stringify(data)));
    }
}

// 싱글톤 인스턴스
export const partialRecovery = new PartialRecoveryService();

// React 훅
export function usePartialRecovery() {
    return {
        initializeSlide: partialRecovery.initializeSlide.bind(partialRecovery),
        reportError: partialRecovery.reportError.bind(partialRecovery),
        recoverSlide: partialRecovery.recoverSlide.bind(partialRecovery),
        recoverMultiple: partialRecovery.recoverMultipleSlides.bind(partialRecovery),
        getSlideState: partialRecovery.getSlideState.bind(partialRecovery),
        getAllStates: partialRecovery.getAllStates.bind(partialRecovery),
        getErrorSlides: partialRecovery.getErrorSlides.bind(partialRecovery),
        savePreviousVersion: partialRecovery.savePreviousVersion.bind(partialRecovery),
        reset: partialRecovery.reset.bind(partialRecovery),
    };
}

export default partialRecovery;
