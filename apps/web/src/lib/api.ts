import axios, { AxiosInstance } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,

  // TEMPORARIAMENTE maior porque o hosting esta a responder lentamente.
  // Depois de optimizarmos o servidor podemos reduzir.
  timeout: 120000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar access token aos pedidos autenticados
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error?.config || {};
    const url = String(original?.url || '');

    // Timeout
    if (
      error?.code === 'ECONNABORTED' ||
      String(error?.message || '').toLowerCase().includes('timeout')
    ) {
      return Promise.reject(
        Object.assign(
          new Error(
            'O servidor demorou demasiado a responder. Tenta novamente.'
          ),
          {
            code: 'ERR_TIMEOUT',
            config: original,
          }
        )
      );
    }

    // Verdadeiro erro de rede
    if (!error.response) {
      return Promise.reject(
        Object.assign(
          new Error(
            'Não foi possível comunicar com a API. Tenta novamente.'
          ),
          {
            code: 'ERR_NETWORK',
            config: original,
          }
        )
      );
    }

    // Nunca tentar refresh token durante login/registo
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/register-visitor') ||
      url.includes('/auth/google') ||
      url.includes('/auth/refresh');

    if (
      error.response.status === 401 &&
      !isAuthEndpoint &&
      !original._retry
    ) {
      original._retry = true;

      try {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refreshToken')
            : null;

        if (!refreshToken) {
          throw new Error('no_refresh_token');
        }

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          null,
          {
            timeout: 120000,
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const payload = data?.data ?? data ?? {};

        if (!payload.accessToken) {
          throw new Error('invalid_refresh_response');
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'accessToken',
            payload.accessToken
          );

          if (payload.refreshToken) {
            localStorage.setItem(
              'refreshToken',
              payload.refreshToken
            );
          }
        }

        original.headers =
          original.headers || {};

        original.headers.Authorization =
          `Bearer ${payload.accessToken}`;

        return api(original);

      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('mastchieve-auth');
          // O middleware (middleware.ts) decide autenticação por este cookie, não
          // pelo localStorage — sem o limpar aqui, ele reenvia /login -> /dashboard
          // (cookie ainda diz "autenticado") e o dashboard volta a pedir notifications
          // sem token válido, causando um loop infinito de redirecionamento.
          document.cookie = 'mastchieve-role=; path=/; max-age=0';

          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    // Preservar o erro original da API
    return Promise.reject(error);
  }
);

export default api;
