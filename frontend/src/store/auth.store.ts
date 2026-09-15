import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN';
  isEmailVerified: boolean;
  phone?: string;
  whatsappNumber?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response: any = await authApi.login({ email, password });
          const { accessToken, user } = response.data;
          set({ user, accessToken, isAuthenticated: true });
          if (typeof window !== 'undefined') localStorage.setItem('accessToken', accessToken);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {}
        set({ user: null, accessToken: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('auth-storage');
        }
      },

      refreshProfile: async () => {
        try {
          const response: any = await authApi.me();
          set({ user: response.data, isAuthenticated: true });
        } catch {
          get().reset();
        }
      },

      reset: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
