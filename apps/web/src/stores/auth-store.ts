import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string | null;
    creditsRemaining: number;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    updateCredits: (credits: number) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
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
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
