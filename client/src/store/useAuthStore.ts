import { create } from 'zustand';
import { UserSession } from '@watchtogether/shared';
import { authApi } from '../lib/api.js';

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  setSession: (session: UserSession) => void;
  clearSession: () => void;
  initAuth: () => Promise<UserSession | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setSession: (session) => {
    set({ user: session, isLoading: false });
  },

  clearSession: () => {
    localStorage.removeItem('wt_session_token');
    localStorage.removeItem('wt_user_display_name');
    set({ user: null, isLoading: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('wt_session_token');
    const storedName = localStorage.getItem('wt_user_display_name');

    if (!token) {
      set({ user: null, isLoading: false });
      return null;
    }

    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false });
      return user;
    } catch {
      // Stale or invalid session: clean up tokens cleanly
      localStorage.removeItem('wt_session_token');
      localStorage.removeItem('wt_user_display_name');
      set({ user: null, isLoading: false });
      return null;
    }
  },
}));
