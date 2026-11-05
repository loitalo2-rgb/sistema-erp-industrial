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

function getToken() {
  return typeof window !== 'undefined'
    ? localStorage.getItem('erp_token')
    : null;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
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
