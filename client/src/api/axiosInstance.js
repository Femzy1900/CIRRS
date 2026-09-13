import axios from 'axios';
import { auth } from '../config/firebase';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach a fresh Firebase ID token to every outgoing request.
// Waits for Firebase Auth to finish initializing before checking currentUser,
// preventing the race condition where currentUser is null on page refresh.
axiosInstance.interceptors.request.use(async (config) => {
  // authStateReady() resolves once Firebase has restored auth state from storage
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // auto-refreshes when expired
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — only log out if Firebase truly has no active user.
// This prevents spurious logouts caused by race conditions during initialization.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Wait for Firebase auth to settle before deciding to log out
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
      // Only fire logout event if Firebase confirms no signed-in user
      if (!auth.currentUser) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
