/** Nome do cookie de sessão do ERP. */
export const AUTH_COOKIE = 'erp_token';

/** Duração da sessão em segundos (7 dias). */
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * O cookie só recebe a flag Secure em conexões HTTPS ou em hosts locais
 * (localhost/127.0.0.1 são considerados contexto seguro pelos navegadores).
 * Em produção com HTTPS a flag é sempre aplicada, evitando tráfego em claro.
 */
export function isSecureRequest(req: any): boolean {
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  if (proto === 'https' || req?.secure) return true;

  const host: string = (req?.headers?.host || '').split(':')[0];
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}
