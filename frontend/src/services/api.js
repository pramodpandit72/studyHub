import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

const API_URL = isLocalhost
  ? 'http://127.0.0.1:5000/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyhub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Retry once for network timeouts/hiccups
    const config = error.config;
    if (config && !config._retry && (!error.response || error.code === 'ECONNABORTED')) {
      config._retry = true;
      await new Promise((r) => setTimeout(r, 1200));
      return api(config);
    }
    const url = error.config?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/verify');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('studyhub_token');
      const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
