import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4301/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with refresh, swallow network errors cleanly
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Network error (API down / ERR_CONNECTION_REFUSED) — reject without extra logging
    if (!error.response) {
      return Promise.reject(Object.assign(new Error('API indisponível'), { code: 'ERR_NETWORK', config: error.config }));
    }

    const original = error.config;
    if (error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) throw new Error('no_refresh');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
