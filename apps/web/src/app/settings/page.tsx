'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import {
    ArrowLeft,
    Sparkles,
    User,
    Palette,
    Bell,
    Shield,
    Keyboard,
    Globe,
    Save,
    Check,
    Moon,
    Sun,
    Monitor,
} from 'lucide-react';

// Setting sections
type SettingSection = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'shortcuts' | 'language';

interface UserSettings {
    displayName: string;
    email: string;
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en' | 'ja';
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

const defaultSettings: UserSettings = {
    displayName: '',
    email: '',
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

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, hasHydrated } = useAuthStore();
    const [activeSection, setActiveSection] = useState<SettingSection>('profile');
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Load user settings from localStorage or user data
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        } else {
            setSettings({
                ...defaultSettings,
                displayName: user?.name || '',
                email: user?.email || '',
            });
        }
    }, [hasHydrated, isAuthenticated, router, user]);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        localStorage.setItem('userSettings', JSON.stringify(settings));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateSettings = <K extends keyof UserSettings>(
        key: K,
        value: UserSettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateNestedSettings = <
        K extends 'notifications' | 'privacy' | 'shortcuts',
        NK extends keyof UserSettings[K]
    >(
        key: K,
        nestedKey: NK,
        value: UserSettings[K][NK]
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: { ...prev[key], [nestedKey]: value },
        }));
    };

    const sections = [
        { id: 'profile' as const, label: '프로필', icon: User },
        { id: 'appearance' as const, label: '외관', icon: Palette },
        { id: 'notifications' as const, label: '알림', icon: Bell },
        { id: 'privacy' as const, label: '개인정보', icon: Shield },
        { id: 'shortcuts' as const, label: '키보드 단축키', icon: Keyboard },
        { id: 'language' as const, label: '언어', icon: Globe },
    ];

    if (!hasHydrated || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span className="hidden sm:inline">대시보드로 돌아가기</span>
                        </Link>
                    </div>

                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <span className="text-xl font-bold">JaSlide</span>
                    </Link>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 min-w-[100px]"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : saved ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                저장됨
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                저장
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">설정</h1>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar */}
                        <nav className="md:w-64 flex-shrink-0">
                            <ul className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <li key={section.id}>
                                            <button
                                                onClick={() => setActiveSection(section.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeSection === section.id
                                                        ? 'bg-purple-100 text-purple-700 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                                {section.label}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        {/* Main Content */}
                        <main className="flex-1 bg-white rounded-xl border p-6 shadow-sm">
                            {/* Profile Section */}
                            {activeSection === 'profile' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">프로필 설정</h2>

                                    <div className="space-y-6">
                                        {/* Avatar */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">
                                                    {settings.displayName?.[0] || user?.email?.[0] || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <Button variant="outline" size="sm">
                                                    사진 변경
                                                </Button>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    JPG, PNG 또는 GIF. 최대 2MB
                                                </p>
                                            </div>
                                        </div>

                                        {/* Display Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                표시 이름
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.displayName}
                                                onChange={(e) => updateSettings('displayName', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                                placeholder="이름을 입력하세요"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                이메일
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) => updateSettings('email', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                                disabled
                                            />
                                            <p className="text-xs text-gray-500 mt-2">
                                                이메일은 변경할 수 없습니다
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance Section */}
                            {activeSection === 'appearance' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">외관 설정</h2>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-4">
                                                테마
                                            </label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'light' as const, label: '라이트', icon: Sun },
                                                    { id: 'dark' as const, label: '다크', icon: Moon },
                                                    { id: 'system' as const, label: '시스템', icon: Monitor },
                                                ].map((theme) => {
                                                    const Icon = theme.icon;
                                                    return (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => updateSettings('theme', theme.id)}
                                                            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === theme.id
                                                                    ? 'border-purple-500 bg-purple-50'
                                                                    : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <Icon className={`h-6 w-6 ${settings.theme === theme.id
                                                                    ? 'text-purple-600'
                                                                    : 'text-gray-500'
                                                                }`} />
                                                            <span className={`text-sm font-medium ${settings.theme === theme.id
                                                                    ? 'text-purple-700'
                                                                    : 'text-gray-600'
                                                                }`}>
                                                                {theme.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Section */}
                            {activeSection === 'notifications' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">알림 설정</h2>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'email' as const, label: '이메일 알림', description: '프레젠테이션 상태 변경 시 이메일로 알림을 받습니다' },
                                            { key: 'push' as const, label: '푸시 알림', description: '브라우저 푸시 알림을 받습니다' },
                                            { key: 'marketing' as const, label: '마케팅 알림', description: '새로운 기능 및 프로모션 정보를 받습니다' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.label}</p>
                                                    <p className="text-sm text-gray-500">{item.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => updateNestedSettings('notifications', item.key, !settings.notifications[item.key])}
                                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifications[item.key]
                                                            ? 'bg-purple-600'
                                                            : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notifications[item.key]
                                                                ? 'translate-x-7'
                                                                : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Privacy Section */}
                            {activeSection === 'privacy' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">개인정보 설정</h2>

                                    <div className="space-y-4">
                                        {[
                                            { key: 'shareAnalytics' as const, label: '사용 분석 데이터 공유', description: '서비스 개선을 위해 익명화된 사용 데이터를 공유합니다' },
                                            { key: 'showProfile' as const, label: '프로필 공개', description: '다른 사용자가 내 프로필을 볼 수 있습니다' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.label}</p>
                                                    <p className="text-sm text-gray-500">{item.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => updateNestedSettings('privacy', item.key, !settings.privacy[item.key])}
                                                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.privacy[item.key]
                                                            ? 'bg-purple-600'
                                                            : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.privacy[item.key]
                                                                ? 'translate-x-7'
                                                                : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                                        <h3 className="font-medium text-red-800 mb-2">위험 구역</h3>
                                        <p className="text-sm text-red-600 mb-4">
                                            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                                        </p>
                                        <Button variant="destructive" size="sm">
                                            계정 삭제
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Shortcuts Section */}
                            {activeSection === 'shortcuts' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">키보드 단축키</h2>

                                    <div className="mb-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">키보드 단축키 활성화</p>
                                                <p className="text-sm text-gray-500">단축키를 사용하여 빠르게 작업할 수 있습니다</p>
                                            </div>
                                            <button
                                                onClick={() => updateNestedSettings('shortcuts', 'enabled', !settings.shortcuts.enabled)}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${settings.shortcuts.enabled
                                                        ? 'bg-purple-600'
                                                        : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.shortcuts.enabled
                                                            ? 'translate-x-7'
                                                            : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">사용 가능한 단축키</h3>
                                        {[
                                            { keys: ['Ctrl', 'N'], description: '새 프레젠테이션' },
                                            { keys: ['Ctrl', 'S'], description: '저장' },
                                            { keys: ['Ctrl', 'Z'], description: '실행 취소' },
                                            { keys: ['Ctrl', 'Y'], description: '다시 실행' },
                                            { keys: ['Ctrl', 'D'], description: '슬라이드 복제' },
                                            { keys: ['Delete'], description: '슬라이드 삭제' },
                                            { keys: ['←', '→'], description: '슬라이드 이동' },
                                        ].map((shortcut, index) => (
                                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                                <span className="text-gray-600">{shortcut.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, i) => (
                                                        <span key={i}>
                                                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700">
                                                                {key}
                                                            </kbd>
                                                            {i < shortcut.keys.length - 1 && (
                                                                <span className="mx-1 text-gray-400">+</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Language Section */}
                            {activeSection === 'language' && (
                                <div className="animate-in">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">언어 설정</h2>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-4">
                                            인터페이스 언어
                                        </label>
                                        <div className="space-y-3">
                                            {[
                                                { id: 'ko' as const, label: '한국어', flag: '🇰🇷' },
                                                { id: 'en' as const, label: 'English', flag: '🇺🇸' },
                                                { id: 'ja' as const, label: '日本語', flag: '🇯🇵' },
                                            ].map((lang) => (
                                                <button
                                                    key={lang.id}
                                                    onClick={() => updateSettings('language', lang.id)}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${settings.language === lang.id
                                                            ? 'border-purple-500 bg-purple-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{lang.flag}</span>
                                                    <span className={`font-medium ${settings.language === lang.id
                                                            ? 'text-purple-700'
                                                            : 'text-gray-700'
                                                        }`}>
                                                        {lang.label}
                                                    </span>
                                                    {settings.language === lang.id && (
                                                        <Check className="h-5 w-5 text-purple-600 ml-auto" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
