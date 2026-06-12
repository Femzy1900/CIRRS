import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authApi from '../api/authApi';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          // Token is set as an HTTP-only cookie by the server — never stored client-side
          const data = await authApi.login(credentials);
          set({ user: data.user, isAuthenticated: true, loading: false });
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
          set({ loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();  // server clears the HTTP-only cookie
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false });
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
          // Server sets a new HTTP-only cookie after successful reset
          const data = await authApi.resetPassword(token, password);
          set({ user: data.user, isAuthenticated: true, loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to reset password';
          set({ error: message, loading: false });
          throw error;
        }
      },

      verifyEmail: async (token) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.verifyEmail(token);
          set({ loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Verification failed';
          set({ error: message, loading: false });
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ loading: true, error: null });
        try {
          const data = await authApi.updateProfile(profileData);
          set({ user: data.data, loading: false });
          return data;
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to update profile';
          set({ error: message, loading: false });
          throw error;
        }
      },

      deleteAccount: async () => {
        try {
          await authApi.deleteAccount();
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      // Called on app mount — verifies the HTTP-only cookie with the server
      checkAuth: async () => {
        set({ loading: true });
        try {
          const data = await authApi.getMe();
          set({ user: data.data, isAuthenticated: true, loading: false });
        } catch {
          // Cookie absent, expired, or invalid — clear state
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      // Only persist the user object and auth flag for fast initial render
      // Authentication is validated server-side via cookie on every app load
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Listen for 401 events dispatched by axiosInstance and clear auth state
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

export default useAuthStore;
