'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { settings, hasHydrated } = useSettingsStore();

    useEffect(() => {
        if (!hasHydrated) return;

        const root = document.documentElement;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (settings.theme === 'dark' || (settings.theme === 'system' && systemDark)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Set language
        root.lang = settings.language;
    }, [settings.theme, settings.language, hasHydrated]);

    // Listen for system theme changes
    useEffect(() => {
        if (!hasHydrated) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (settings.theme === 'system') {
                const root = document.documentElement;
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [settings.theme, hasHydrated]);

    return <>{children}</>;
}
