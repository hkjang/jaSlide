/**
 * 사용성 분석 서비스
 * 사용자 행동 로그를 수집하여 UX 개선에 활용합니다.
 */

export interface AnalyticsEvent {
    type: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
    timestamp: number;
    sessionId: string;
}

export interface BehaviorMetrics {
    clickFlow: string[];
    dropOffPoints: string[];
    dwellTime: Record<string, number>;
    undoCount: number;
    redoCount: number;
    exportCount: number;
    regenerateCount: number;
}

const ANALYTICS_STORAGE_KEY = 'jaslide_analytics_events';
const SESSION_ID_KEY = 'jaslide_session_id';
const MAX_STORED_EVENTS = 500;

class AnalyticsService {
    private sessionId: string;
    private events: AnalyticsEvent[] = [];
    private startTimes: Map<string, number> = new Map();
    private metrics: BehaviorMetrics = {
        clickFlow: [],
        dropOffPoints: [],
        dwellTime: {},
        undoCount: 0,
        redoCount: 0,
        exportCount: 0,
        regenerateCount: 0,
    };

    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.loadStoredEvents();
    }

    /**
     * 세션 ID 생성 또는 가져오기
     */
    private getOrCreateSessionId(): string {
        if (typeof window === 'undefined') return 'ssr';

        let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        return sessionId;
    }

    /**
     * 저장된 이벤트 로드
     */
    private loadStoredEvents(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
            if (stored) {
                this.events = JSON.parse(stored);
            }
        } catch {
            this.events = [];
        }
    }

    /**
     * 이벤트 저장
     */
    private saveEvents(): void {
        if (typeof window === 'undefined') return;

        try {
            // 최대 개수 제한
            if (this.events.length > MAX_STORED_EVENTS) {
                this.events = this.events.slice(-MAX_STORED_EVENTS);
            }
            localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.events));
        } catch {
            // 스토리지 용량 초과 시 오래된 이벤트 삭제
            this.events = this.events.slice(-100);
            try {
                localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.events));
            } catch {
                // 무시
            }
        }
    }

    /**
     * 이벤트 추적
     */
    track(
        category: string,
        action: string,
        label?: string,
        value?: number,
        metadata?: Record<string, unknown>
    ): void {
        const event: AnalyticsEvent = {
            type: 'track',
            category,
            action,
            label,
            value,
            metadata,
            timestamp: Date.now(),
            sessionId: this.sessionId,
        };

        this.events.push(event);
        this.saveEvents();

        // 클릭 흐름 업데이트
        this.metrics.clickFlow.push(`${category}:${action}`);
        if (this.metrics.clickFlow.length > 50) {
            this.metrics.clickFlow = this.metrics.clickFlow.slice(-50);
        }

        // 특정 액션 카운트
        if (action === 'undo') this.metrics.undoCount++;
        if (action === 'redo') this.metrics.redoCount++;
        if (action === 'export') this.metrics.exportCount++;
        if (action === 'regenerate') this.metrics.regenerateCount++;
    }

    /**
     * 페이지 뷰 추적
     */
    trackPageView(pageName: string, metadata?: Record<string, unknown>): void {
        this.track('page', 'view', pageName, undefined, metadata);
    }

    /**
     * 체류 시간 시작
     */
    startDwellTime(stepName: string): void {
        this.startTimes.set(stepName, Date.now());
    }

    /**
     * 체류 시간 종료
     */
    endDwellTime(stepName: string): number {
        const startTime = this.startTimes.get(stepName);
        if (!startTime) return 0;

        const duration = Date.now() - startTime;
        this.startTimes.delete(stepName);

        // 체류 시간 기록
        this.metrics.dwellTime[stepName] = (this.metrics.dwellTime[stepName] || 0) + duration;

        this.track('dwell', 'complete', stepName, duration);

        return duration;
    }

    /**
     * 중단 지점 기록
     */
    trackDropOff(stepName: string, reason?: string): void {
        this.metrics.dropOffPoints.push(stepName);
        this.track('dropoff', 'exit', stepName, undefined, { reason });
    }

    /**
     * 만족 신호 추적
     */
    trackSatisfaction(action: 'download' | 'share' | 'regenerate' | 'cancel', success: boolean): void {
        this.track('satisfaction', action, success ? 'success' : 'failure');
    }

    /**
     * 오류 추적
     */
    trackError(errorType: string, errorMessage: string, context?: Record<string, unknown>): void {
        this.track('error', errorType, errorMessage, undefined, context);
    }

    /**
     * 현재 세션 지표 가져오기
     */
    getMetrics(): BehaviorMetrics {
        return { ...this.metrics };
    }

    /**
     * 분석 데이터 서버 전송
     */
    async flush(): Promise<boolean> {
        if (this.events.length === 0) return true;

        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events: this.events,
                    metrics: this.metrics,
                    sessionId: this.sessionId,
                }),
            });

            if (response.ok) {
                this.events = [];
                this.saveEvents();
                return true;
            }
        } catch (error) {
            console.warn('Analytics flush failed:', error);
        }

        return false;
    }

    /**
     * 모든 데이터 초기화
     */
    reset(): void {
        this.events = [];
        this.metrics = {
            clickFlow: [],
            dropOffPoints: [],
            dwellTime: {},
            undoCount: 0,
            redoCount: 0,
            exportCount: 0,
            regenerateCount: 0,
        };
        this.saveEvents();
    }
}

// 싱글톤 인스턴스
export const analytics = new AnalyticsService();

// React 훅
export function useAnalytics() {
    return {
        track: analytics.track.bind(analytics),
        trackPageView: analytics.trackPageView.bind(analytics),
        startDwellTime: analytics.startDwellTime.bind(analytics),
        endDwellTime: analytics.endDwellTime.bind(analytics),
        trackDropOff: analytics.trackDropOff.bind(analytics),
        trackSatisfaction: analytics.trackSatisfaction.bind(analytics),
        trackError: analytics.trackError.bind(analytics),
        getMetrics: analytics.getMetrics.bind(analytics),
        flush: analytics.flush.bind(analytics),
    };
}

export default analytics;
