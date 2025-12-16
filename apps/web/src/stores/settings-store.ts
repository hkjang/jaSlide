import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'ko' | 'en' | 'ja';

export interface UserSettings {
    displayName: string;
    email: string;
    avatarUrl: string | null;
    theme: Theme;
    language: Language;
    notifications: {
        email: boolean;
        push: boolean;
        marketing: boolean;
    };
    privacy: {
        shareAnalytics: boolean;
        showProfile: boolean;
    };
    shortcuts: {
        enabled: boolean;
    };
}

interface SettingsState {
    settings: UserSettings;
    hasHydrated: boolean;
    setSettings: (settings: Partial<UserSettings>) => void;
    setTheme: (theme: Theme) => void;
    setLanguage: (language: Language) => void;
    updateNotification: (key: keyof UserSettings['notifications'], value: boolean) => void;
    updatePrivacy: (key: keyof UserSettings['privacy'], value: boolean) => void;
    toggleShortcuts: () => void;
    resetSettings: () => void;
    setHasHydrated: (state: boolean) => void;
}

const defaultSettings: UserSettings = {
    displayName: '',
    email: '',
    avatarUrl: null,
    theme: 'system',
    language: 'ko',
    notifications: {
        email: true,
        push: true,
        marketing: false,
    },
    privacy: {
        shareAnalytics: true,
        showProfile: true,
    },
    shortcuts: {
        enabled: true,
    },
};

// Apply theme to document
const applyTheme = (theme: Theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && systemDark)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
};

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const settings = useSettingsStore.getState().settings;
        if (settings.theme === 'system') {
            applyTheme('system');
        }
    });
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            hasHydrated: false,

            setSettings: (newSettings) => {
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                }));
                if (newSettings.theme) {
                    applyTheme(newSettings.theme);
                }
            },

            setTheme: (theme) => {
                set((state) => ({
                    settings: { ...state.settings, theme },
                }));
                applyTheme(theme);
            },

            setLanguage: (language) => {
                set((state) => ({
                    settings: { ...state.settings, language },
                }));
                // Update document lang attribute
                if (typeof document !== 'undefined') {
                    document.documentElement.lang = language;
                }
            },

            updateNotification: (key, value) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        notifications: {
                            ...state.settings.notifications,
                            [key]: value,
                        },
                    },
                }));
            },

            updatePrivacy: (key, value) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        privacy: {
                            ...state.settings.privacy,
                            [key]: value,
                        },
                    },
                }));
            },

            toggleShortcuts: () => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        shortcuts: {
                            enabled: !state.settings.shortcuts.enabled,
                        },
                    },
                }));
            },

            resetSettings: () => {
                set({ settings: defaultSettings });
                applyTheme(defaultSettings.theme);
            },

            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'settings-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
                // Apply theme on hydration
                if (state?.settings.theme) {
                    applyTheme(state.settings.theme);
                }
            },
        }
    )
);

// Translations
export const translations = {
    ko: {
        settings: {
            title: '설정',
            profile: '프로필',
            appearance: '외관',
            notifications: '알림',
            privacy: '개인정보',
            shortcuts: '키보드 단축키',
            language: '언어',
            save: '저장',
            saved: '저장됨',
            backToDashboard: '대시보드로 돌아가기',
        },
        profile: {
            title: '프로필 설정',
            displayName: '표시 이름',
            email: '이메일',
            changePhoto: '사진 변경',
            photoHint: 'JPG, PNG 또는 GIF. 최대 2MB',
            emailHint: '이메일은 변경할 수 없습니다',
        },
        appearance: {
            title: '외관 설정',
            theme: '테마',
            light: '라이트',
            dark: '다크',
            system: '시스템',
        },
        notifications: {
            title: '알림 설정',
            email: '이메일 알림',
            emailDesc: '프레젠테이션 상태 변경 시 이메일로 알림을 받습니다',
            push: '푸시 알림',
            pushDesc: '브라우저 푸시 알림을 받습니다',
            marketing: '마케팅 알림',
            marketingDesc: '새로운 기능 및 프로모션 정보를 받습니다',
        },
        privacy: {
            title: '개인정보 설정',
            shareAnalytics: '사용 분석 데이터 공유',
            shareAnalyticsDesc: '서비스 개선을 위해 익명화된 사용 데이터를 공유합니다',
            showProfile: '프로필 공개',
            showProfileDesc: '다른 사용자가 내 프로필을 볼 수 있습니다',
            dangerZone: '위험 구역',
            deleteWarning: '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.',
            deleteAccount: '계정 삭제',
        },
        shortcuts: {
            title: '키보드 단축키',
            enable: '키보드 단축키 활성화',
            enableDesc: '단축키를 사용하여 빠르게 작업할 수 있습니다',
            available: '사용 가능한 단축키',
            newPresentation: '새 프레젠테이션',
            save: '저장',
            undo: '실행 취소',
            redo: '다시 실행',
            duplicate: '슬라이드 복제',
            delete: '슬라이드 삭제',
            navigate: '슬라이드 이동',
        },
        language: {
            title: '언어 설정',
            interfaceLanguage: '인터페이스 언어',
        },
    },
    en: {
        settings: {
            title: 'Settings',
            profile: 'Profile',
            appearance: 'Appearance',
            notifications: 'Notifications',
            privacy: 'Privacy',
            shortcuts: 'Keyboard Shortcuts',
            language: 'Language',
            save: 'Save',
            saved: 'Saved',
            backToDashboard: 'Back to Dashboard',
        },
        profile: {
            title: 'Profile Settings',
            displayName: 'Display Name',
            email: 'Email',
            changePhoto: 'Change Photo',
            photoHint: 'JPG, PNG or GIF. Max 2MB',
            emailHint: 'Email cannot be changed',
        },
        appearance: {
            title: 'Appearance Settings',
            theme: 'Theme',
            light: 'Light',
            dark: 'Dark',
            system: 'System',
        },
        notifications: {
            title: 'Notification Settings',
            email: 'Email Notifications',
            emailDesc: 'Receive email notifications when presentation status changes',
            push: 'Push Notifications',
            pushDesc: 'Receive browser push notifications',
            marketing: 'Marketing Notifications',
            marketingDesc: 'Receive new features and promotional information',
        },
        privacy: {
            title: 'Privacy Settings',
            shareAnalytics: 'Share Analytics Data',
            shareAnalyticsDesc: 'Share anonymized usage data to help improve the service',
            showProfile: 'Public Profile',
            showProfileDesc: 'Allow other users to see your profile',
            dangerZone: 'Danger Zone',
            deleteWarning: 'Deleting your account will permanently remove all your data.',
            deleteAccount: 'Delete Account',
        },
        shortcuts: {
            title: 'Keyboard Shortcuts',
            enable: 'Enable Keyboard Shortcuts',
            enableDesc: 'Use shortcuts for faster work',
            available: 'Available Shortcuts',
            newPresentation: 'New Presentation',
            save: 'Save',
            undo: 'Undo',
            redo: 'Redo',
            duplicate: 'Duplicate Slide',
            delete: 'Delete Slide',
            navigate: 'Navigate Slides',
        },
        language: {
            title: 'Language Settings',
            interfaceLanguage: 'Interface Language',
        },
    },
    ja: {
        settings: {
            title: '設定',
            profile: 'プロフィール',
            appearance: '外観',
            notifications: '通知',
            privacy: 'プライバシー',
            shortcuts: 'キーボードショートカット',
            language: '言語',
            save: '保存',
            saved: '保存済み',
            backToDashboard: 'ダッシュボードに戻る',
        },
        profile: {
            title: 'プロフィール設定',
            displayName: '表示名',
            email: 'メール',
            changePhoto: '写真を変更',
            photoHint: 'JPG、PNG、またはGIF。最大2MB',
            emailHint: 'メールは変更できません',
        },
        appearance: {
            title: '外観設定',
            theme: 'テーマ',
            light: 'ライト',
            dark: 'ダーク',
            system: 'システム',
        },
        notifications: {
            title: '通知設定',
            email: 'メール通知',
            emailDesc: 'プレゼンテーションのステータス変更時にメールで通知を受け取る',
            push: 'プッシュ通知',
            pushDesc: 'ブラウザプッシュ通知を受け取る',
            marketing: 'マーケティング通知',
            marketingDesc: '新機能やプロモーション情報を受け取る',
        },
        privacy: {
            title: 'プライバシー設定',
            shareAnalytics: '分析データの共有',
            shareAnalyticsDesc: 'サービス改善のために匿名化された使用データを共有する',
            showProfile: 'プロフィール公開',
            showProfileDesc: '他のユーザーがあなたのプロフィールを見ることができます',
            dangerZone: '危険ゾーン',
            deleteWarning: 'アカウントを削除すると、すべてのデータが永久に削除されます。',
            deleteAccount: 'アカウント削除',
        },
        shortcuts: {
            title: 'キーボードショートカット',
            enable: 'キーボードショートカットを有効にする',
            enableDesc: 'ショートカットを使用して素早く作業できます',
            available: '使用可能なショートカット',
            newPresentation: '新規プレゼンテーション',
            save: '保存',
            undo: '元に戻す',
            redo: 'やり直し',
            duplicate: 'スライドの複製',
            delete: 'スライドの削除',
            navigate: 'スライド移動',
        },
        language: {
            title: '言語設定',
            interfaceLanguage: 'インターフェース言語',
        },
    },
};

export const useTranslation = () => {
    const { settings } = useSettingsStore();
    return translations[settings.language] || translations.ko;
};
