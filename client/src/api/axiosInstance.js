import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Browser automatically attaches the HTTP-only auth cookie on every request
  withCredentials: true,
});

// Response interceptor — handle 401 globally (cookie expired / invalid)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cookie is expired or missing — the store's checkAuth will handle clearing state
    if (error.response?.status === 401) {
      // Dispatch a custom event so the store can react without circular imports
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
