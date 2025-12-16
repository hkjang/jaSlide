import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'ADMIN' | 'ORG_ADMIN' | 'SYSTEM_ADMIN' | 'OPERATOR' | 'AUDITOR';

interface User {
    id: string;
    email: string;
    name: string | null;
    creditsRemaining: number;
    role: UserRole;
}

// Helper to determine if user has admin-level access
export const isAdminRole = (role?: UserRole | string): boolean =>
    ['ADMIN', 'SYSTEM_ADMIN', 'ORG_ADMIN', 'OPERATOR'].includes(role || '');

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    hasHydrated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    updateCredits: (credits: number) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            hasHydrated: false,
            setAuth: (user, token) => {
                localStorage.setItem('accessToken', token);
                set({ user, accessToken: token, isAuthenticated: true });
            },
            clearAuth: () => {
                localStorage.removeItem('accessToken');
                set({ user: null, accessToken: null, isAuthenticated: false });
            },
            updateCredits: (credits) =>
                set((state) => ({
                    user: state.user ? { ...state.user, creditsRemaining: credits } : null,
                })),
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

