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

// ── Renovação de sessão ─────────────────────────────────────────────
// O refresh token é rotativo (cada renovação invalida o anterior). Se vários pedidos
// recebessem 401 ao mesmo tempo e cada um renovasse por si, só o primeiro acertava e
// os restantes falhavam — a pessoa era enviada para o login. Por isso há UMA renovação
// partilhada, e o token é renovado um pouco antes de expirar.
let renovacaoEmCurso: Promise<string> | null = null;

function expiraEm(token: string): number | null {
  try {
    const base = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(decodeURIComponent(escape(window.atob(base))));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function terminarSessao() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('mastchieve-auth');
  // O middleware decide a autenticação por este cookie; sem o limpar, /login volta a
  // reenviar para /dashboard e entra-se num ciclo de redirecionamentos.
  document.cookie = 'mastchieve-role=; path=/; max-age=0';
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

export function renovarSessao(): Promise<string> {
  if (renovacaoEmCurso) return renovacaoEmCurso;
  renovacaoEmCurso = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('no_refresh_token');
    const { data } = await axios.post(`${API_URL}/auth/refresh`, null, {
      timeout: 120000,
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const payload = data?.data ?? data ?? {};
    if (!payload.accessToken) throw new Error('invalid_refresh_response');
    localStorage.setItem('accessToken', payload.accessToken);
    if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
    return payload.accessToken as string;
  })();
  // Liberta a renovação quando terminar (com sucesso ou erro).
  renovacaoEmCurso.then(
    () => { renovacaoEmCurso = null; },
    () => { renovacaoEmCurso = null; },
  );
  return renovacaoEmCurso;
}

const eAuth = (url: string) =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/register-visitor') ||
  url.includes('/auth/google') ||
  url.includes('/auth/refresh');

// Adicionar access token aos pedidos autenticados (renovando antes de expirar)
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('accessToken');
    const url = String(config.url || '');
    if (token && !eAuth(url) && localStorage.getItem('refreshToken')) {
      const exp = expiraEm(token);
      if (exp && exp - Date.now() < 30_000) {
        try { token = await renovarSessao(); } catch { /* o 401 trata a seguir */ }
      }
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

    // Sessão expirada: renovar uma vez (partilhado) e repetir o pedido.
    if (error.response.status === 401 && !eAuth(url) && !original._retry) {
      original._retry = true;
      try {
        const token = await renovarSessao();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        terminarSessao();
      }
    }

    // Preservar o erro original da API
    return Promise.reject(error);
  }
);

export default api;
