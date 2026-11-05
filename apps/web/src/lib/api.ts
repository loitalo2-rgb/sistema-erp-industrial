const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const SESSION_USER_KEY = 'erp_user';

export function clearSession() {
  if (typeof window === 'undefined') return;
  // O token JWT fica em cookie HttpOnly (inacessível ao JS). Aqui só guardamos
  // dados não sensíveis do usuário para exibição e gating visual da UI.
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem('erp_token'); // remove resíduo de versões anteriores
}

export function storeSessionUser(user: any) {
  if (typeof window === 'undefined' || !user) return;
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getSessionUser(): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      // Envia/recebe o cookie de sessão (HttpOnly) em todas as chamadas.
      credentials: 'include',
      // Dados operacionais mudam a todo momento: nunca reaproveitar cache HTTP
      // (evita respostas 304 sem corpo que travavam as telas em "Carregando").
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Verifique se o backend está rodando na porta 3001.',
      0,
    );
  }

  if (res.status === 401) {
    clearSession();
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      `Erro na requisição (${res.status})`;
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message,
      res.status,
    );
  }

  return data as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: <T = any>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};

export { API_URL };
