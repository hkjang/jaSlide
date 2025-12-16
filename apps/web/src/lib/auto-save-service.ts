/**
 * 자동 저장 서비스
 * 디바운스 기반으로 편집 내용을 자동 저장하고 로컬 스토리지와 서버에 동기화합니다.
 */

const AUTO_SAVE_DELAY = 5000; // 5초
const LOCAL_STORAGE_KEY_PREFIX = 'jaslide_autosave_';

interface AutoSaveState {
    presentationId: string;
    data: unknown;
    timestamp: number;
    isDirty: boolean;
}

type AutoSaveCallback = (success: boolean, message: string) => void;

class AutoSaveService {
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private callbacks: Map<string, AutoSaveCallback[]> = new Map();
    private states: Map<string, AutoSaveState> = new Map();
    private isSaving: Map<string, boolean> = new Map();

    /**
     * 자동 저장 예약 (디바운스)
     */
    scheduleAutoSave(
        presentationId: string,
        data: unknown,
        options?: {
            delay?: number;
            onSave?: AutoSaveCallback;
            immediate?: boolean;
        }
    ): void {
        const delay = options?.delay ?? AUTO_SAVE_DELAY;
        const immediate = options?.immediate ?? false;

        // 기존 타이머 취소
        const existingTimer = this.timers.get(presentationId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // 콜백 등록
        if (options?.onSave) {
            const callbacks = this.callbacks.get(presentationId) || [];
            callbacks.push(options.onSave);
            this.callbacks.set(presentationId, callbacks);
        }

        // 상태 업데이트
        this.states.set(presentationId, {
            presentationId,
            data,
            timestamp: Date.now(),
            isDirty: true,
        });

        // 로컬 스토리지에 임시 저장 (즉시)
        this.saveToLocalStorage(presentationId, data);

        if (immediate) {
            this.executeSave(presentationId);
        } else {
            // 새 타이머 설정
            const timer = setTimeout(() => {
                this.executeSave(presentationId);
            }, delay);
            this.timers.set(presentationId, timer);
        }
    }

    /**
     * 저장 실행
     */
    private async executeSave(presentationId: string): Promise<void> {
        if (this.isSaving.get(presentationId)) {
            return;
        }

        const state = this.states.get(presentationId);
        if (!state?.isDirty) {
            return;
        }

        this.isSaving.set(presentationId, true);

        try {
            await this.saveToServer(presentationId, state.data);

            // 성공 시 상태 업데이트
            this.states.set(presentationId, {
                ...state,
                isDirty: false,
            });

            // 콜백 호출
            this.notifyCallbacks(presentationId, true, '자동 저장 완료');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.notifyCallbacks(presentationId, false, '자동 저장 실패');
        } finally {
            this.isSaving.set(presentationId, false);
            this.timers.delete(presentationId);
        }
    }

    /**
     * 로컬 스토리지에 저장
     */
    private saveToLocalStorage(presentationId: string, data: unknown): void {
        try {
            const key = `${LOCAL_STORAGE_KEY_PREFIX}${presentationId}`;
            const value = JSON.stringify({
                data,
                timestamp: Date.now(),
            });
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('Local storage save failed:', error);
        }
    }

    /**
     * 로컬 스토리지에서 복원
     */
    restoreFromLocalStorage(presentationId: string): {
        data: unknown;
        timestamp: number;
    } | null {
        try {
            const key = `${LOCAL_STORAGE_KEY_PREFIX}${presentationId}`;
            const value = localStorage.getItem(key);
            if (value) {
                return JSON.parse(value);
            }
        } catch (error) {
            console.warn('Local storage restore failed:', error);
        }
        return null;
    }

    /**
     * 로컬 스토리지 데이터 삭제
     */
    clearLocalStorage(presentationId: string): void {
        try {
            const key = `${LOCAL_STORAGE_KEY_PREFIX}${presentationId}`;
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Local storage clear failed:', error);
        }
    }

    /**
     * 서버에 저장
     */
    private async saveToServer(presentationId: string, data: unknown): Promise<void> {
        const response = await fetch(`/api/presentations/${presentationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Save failed: ${response.statusText}`);
        }
    }

    /**
     * 콜백 알림
     */
    private notifyCallbacks(presentationId: string, success: boolean, message: string): void {
        const callbacks = this.callbacks.get(presentationId) || [];
        callbacks.forEach((callback) => callback(success, message));
        this.callbacks.delete(presentationId);
    }

    /**
     * 자동 저장 취소
     */
    cancelAutoSave(presentationId: string): void {
        const timer = this.timers.get(presentationId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(presentationId);
        }
        this.states.delete(presentationId);
        this.callbacks.delete(presentationId);
    }

    /**
     * 저장 중인지 확인
     */
    isSavingPresentation(presentationId: string): boolean {
        return this.isSaving.get(presentationId) || false;
    }

    /**
     * 더티 상태 확인
     */
    isDirty(presentationId: string): boolean {
        return this.states.get(presentationId)?.isDirty || false;
    }

    /**
     * 모든 보류 중인 저장 강제 실행
     */
    async flushAll(): Promise<void> {
        const promises = Array.from(this.states.keys()).map((id) =>
            this.executeSave(id)
        );
        await Promise.all(promises);
    }

    /**
     * 리소스 정리
     */
    destroy(): void {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.states.clear();
        this.callbacks.clear();
        this.isSaving.clear();
    }
}

// 싱글톤 인스턴스
export const autoSaveService = new AutoSaveService();

// React 훅
export function useAutoSave(presentationId: string | null) {
    const save = (data: unknown, options?: { immediate?: boolean; onSave?: AutoSaveCallback }) => {
        if (!presentationId) return;
        autoSaveService.scheduleAutoSave(presentationId, data, options);
    };

    const cancel = () => {
        if (!presentationId) return;
        autoSaveService.cancelAutoSave(presentationId);
    };

    const restore = () => {
        if (!presentationId) return null;
        return autoSaveService.restoreFromLocalStorage(presentationId);
    };

    const clear = () => {
        if (!presentationId) return;
        autoSaveService.clearLocalStorage(presentationId);
    };

    const isSaving = () => {
        if (!presentationId) return false;
        return autoSaveService.isSavingPresentation(presentationId);
    };

    const isDirty = () => {
        if (!presentationId) return false;
        return autoSaveService.isDirty(presentationId);
    };

    return {
        save,
        cancel,
        restore,
        clear,
        isSaving,
        isDirty,
    };
}

export default autoSaveService;
