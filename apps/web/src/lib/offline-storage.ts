/**
 * 오프라인 저장소 서비스
 * IndexedDB 기반으로 오프라인 상태에서도 데이터를 저장하고 재접속 시 복원합니다.
 */

const DB_NAME = 'jaslide_offline_storage';
const DB_VERSION = 1;
const STORE_NAME = 'presentations';
const PENDING_CHANGES_STORE = 'pending_changes';

interface OfflineData {
    id: string;
    type: 'presentation' | 'slide' | 'block';
    data: unknown;
    timestamp: number;
    syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
}

interface PendingChange {
    id: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete';
    data: unknown;
    timestamp: number;
    retryCount: number;
}

class OfflineStorageService {
    private db: IDBDatabase | null = null;
    private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private syncInProgress: boolean = false;
    private listeners: Set<(online: boolean) => void> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.initDB();
            this.setupOnlineListener();
        }
    }

    /**
     * IndexedDB 초기화
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // 프레젠테이션 저장소
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                // 대기 중인 변경사항 저장소
                if (!db.objectStoreNames.contains(PENDING_CHANGES_STORE)) {
                    const pendingStore = db.createObjectStore(PENDING_CHANGES_STORE, { keyPath: 'id' });
                    pendingStore.createIndex('entityId', 'entityId', { unique: false });
                    pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * 온라인 상태 리스너 설정
     */
    private setupOnlineListener(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyListeners(true);
            this.syncPendingChanges();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyListeners(false);
        });
    }

    /**
     * 온라인 상태 변경 리스너 등록
     */
    onOnlineStatusChange(callback: (online: boolean) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * 리스너 알림
     */
    private notifyListeners(online: boolean): void {
        this.listeners.forEach((listener) => listener(online));
    }

    /**
     * 데이터 저장
     */
    async save(id: string, type: OfflineData['type'], data: unknown): Promise<void> {
        if (!this.db) await this.initDB();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const offlineData: OfflineData = {
                id,
                type,
                data,
                timestamp: Date.now(),
                syncStatus: this.isOnline ? 'synced' : 'pending',
            };

            const request = store.put(offlineData);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                // 오프라인 상태에서는 대기 중인 변경사항에 추가
                if (!this.isOnline) {
                    this.addPendingChange(type, id, 'update', data);
                }
                resolve();
            };
        });
    }

    /**
     * 데이터 로드
     */
    async load(id: string): Promise<OfflineData | null> {
        if (!this.db) await this.initDB();
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    /**
     * 데이터 삭제
     */
    async delete(id: string): Promise<void> {
        if (!this.db) await this.initDB();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * 모든 저장된 데이터 가져오기
     */
    async getAll(): Promise<OfflineData[]> {
        if (!this.db) await this.initDB();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * 대기 중인 변경사항 추가
     */
    private async addPendingChange(
        entityType: string,
        entityId: string,
        action: PendingChange['action'],
        data: unknown
    ): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([PENDING_CHANGES_STORE], 'readwrite');
            const store = transaction.objectStore(PENDING_CHANGES_STORE);

            const change: PendingChange = {
                id: `${entityType}_${entityId}_${Date.now()}`,
                entityType,
                entityId,
                action,
                data,
                timestamp: Date.now(),
                retryCount: 0,
            };

            const request = store.add(change);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * 대기 중인 변경사항 동기화
     */
    async syncPendingChanges(): Promise<{ success: number; failed: number }> {
        if (!this.isOnline || this.syncInProgress) {
            return { success: 0, failed: 0 };
        }

        this.syncInProgress = true;
        let success = 0;
        let failed = 0;

        try {
            if (!this.db) await this.initDB();
            if (!this.db) return { success: 0, failed: 0 };

            const transaction = this.db.transaction([PENDING_CHANGES_STORE], 'readonly');
            const store = transaction.objectStore(PENDING_CHANGES_STORE);
            const changes: PendingChange[] = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || []);
            });

            // 시간순 정렬
            changes.sort((a, b) => a.timestamp - b.timestamp);

            for (const change of changes) {
                try {
                    await this.syncChange(change);
                    await this.removePendingChange(change.id);
                    success++;
                } catch (error) {
                    console.error('Sync change failed:', error);
                    await this.incrementRetryCount(change.id);
                    failed++;
                }
            }
        } finally {
            this.syncInProgress = false;
        }

        return { success, failed };
    }

    /**
     * 개별 변경사항 동기화
     */
    private async syncChange(change: PendingChange): Promise<void> {
        const endpoint = this.getEndpoint(change);
        const method = this.getMethod(change.action);

        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: change.action !== 'delete' ? JSON.stringify(change.data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
        }
    }

    /**
     * API 엔드포인트 결정
     */
    private getEndpoint(change: PendingChange): string {
        const baseUrl = '/api';
        switch (change.entityType) {
            case 'presentation':
                return `${baseUrl}/presentations/${change.entityId}`;
            case 'slide':
                return `${baseUrl}/slides/${change.entityId}`;
            case 'block':
                return `${baseUrl}/blocks/${change.entityId}`;
            default:
                return `${baseUrl}/${change.entityType}/${change.entityId}`;
        }
    }

    /**
     * HTTP 메서드 결정
     */
    private getMethod(action: PendingChange['action']): string {
        switch (action) {
            case 'create':
                return 'POST';
            case 'update':
                return 'PATCH';
            case 'delete':
                return 'DELETE';
            default:
                return 'PATCH';
        }
    }

    /**
     * 대기 중인 변경사항 삭제
     */
    private async removePendingChange(id: string): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([PENDING_CHANGES_STORE], 'readwrite');
            const store = transaction.objectStore(PENDING_CHANGES_STORE);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * 재시도 횟수 증가
     */
    private async incrementRetryCount(id: string): Promise<void> {
        if (!this.db) return;

        const transaction = this.db.transaction([PENDING_CHANGES_STORE], 'readwrite');
        const store = transaction.objectStore(PENDING_CHANGES_STORE);

        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const change = getRequest.result;
            if (change) {
                change.retryCount++;
                store.put(change);
            }
        };
    }

    /**
     * 온라인 상태 확인
     */
    isOnlineStatus(): boolean {
        return this.isOnline;
    }

    /**
     * 대기 중인 변경사항 수 확인
     */
    async getPendingChangesCount(): Promise<number> {
        if (!this.db) await this.initDB();
        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([PENDING_CHANGES_STORE], 'readonly');
            const store = transaction.objectStore(PENDING_CHANGES_STORE);
            const request = store.count();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// 싱글톤 인스턴스
export const offlineStorage = new OfflineStorageService();

// React 훅
export function useOfflineStorage() {
    return {
        save: offlineStorage.save.bind(offlineStorage),
        load: offlineStorage.load.bind(offlineStorage),
        delete: offlineStorage.delete.bind(offlineStorage),
        getAll: offlineStorage.getAll.bind(offlineStorage),
        sync: offlineStorage.syncPendingChanges.bind(offlineStorage),
        isOnline: () => offlineStorage.isOnlineStatus(),
        onOnlineStatusChange: offlineStorage.onOnlineStatusChange.bind(offlineStorage),
        getPendingCount: offlineStorage.getPendingChangesCount.bind(offlineStorage),
    };
}

export default offlineStorage;
