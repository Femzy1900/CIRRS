import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authApi from '../api/authApi';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem('token') || null,
      isAuthenticated: !!localStorage.getItem('token'),
      loading: false,
      error: null,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.login(credentials);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.register(userData);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.forgotPassword(email);
          set({ loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to send reset email';
          set({ error: message, loading: false });
          throw error;
        }
      },

      resetPassword: async (token, password) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.resetPassword(token, password);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to reset password';
          set({ error: message, loading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        if (!get().token) return;
        set({ loading: true });
        try {
          const data = await authApi.getMe();
          set({ user: data.data, isAuthenticated: true, loading: false });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, loading: false });
        }
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
