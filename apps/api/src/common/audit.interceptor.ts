import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../modules/auditoria/auditoria.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SENSITIVE_KEYS = [
  'password',
  'currentPassword',
  'newPassword',
  'accessToken',
  'token',
  'authorization',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditoria: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        void this.record(request, data, context);
      }),
    );
  }

  private async record(request: any, data: any, context: ExecutionContext) {
    try {
      const path: string = request.originalUrl || request.url || '';
      const cleanPath = path.split('?')[0];
      const segments = cleanPath.split('/').filter(Boolean); // api, modulo, ...
      const entity = segments[1] || 'sistema';
      const action = this.resolveAction(request.method, cleanPath);
      const user = request.user || data?.user || null;
      const isLogin = cleanPath.endsWith('/auth/login');

      const response = context.switchToHttp().getResponse();
      const forwarded = request.headers?.['x-forwarded-for'];
      const ip =
        (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
        request.ip ||
        request.socket?.remoteAddress ||
        null;

      await this.auditoria.log({
        userId: isLogin ? data?.user?.id || null : user?.id || null,
        userEmail: isLogin
          ? data?.user?.email || request.body?.email || null
          : user?.email || null,
        action: isLogin ? 'LOGIN' : action,
        entity: isLogin ? 'auth' : entity,
        entityId: request.params?.id || data?.id || null,
        method: request.method,
        path: cleanPath,
        statusCode: response?.statusCode || 200,
        payload: this.sanitize(request.body),
        ip,
      });
    } catch (err: any) {
      // Auditoria nunca deve derrubar a operação principal.
      this.logger.warn(`Falha ao registrar auditoria: ${err?.message}`);
    }
  }

  private resolveAction(method: string, path: string) {
    if (path.endsWith('/auth/logout')) return 'LOGOUT';
    if (path.endsWith('/faturar')) return 'FATURAR';
    if (path.endsWith('/receber')) return 'RECEBER';
    if (path.endsWith('/pagar')) return 'PAGAR';
    if (path.endsWith('/cancelar')) return 'CANCELAR';
    if (path.endsWith('/desativar')) return 'DESATIVAR';
    if (path.endsWith('/status')) return 'ALTERAR_STATUS';
    if (path.endsWith('/senha')) return 'ALTERAR_SENHA';
    if (method === 'POST') return 'CRIAR';
    if (method === 'PUT' || method === 'PATCH') return 'ATUALIZAR';
    if (method === 'DELETE') return 'EXCLUIR';
    return method;
  }

  private sanitize(body: any): string | null {
    if (!body || typeof body !== 'object') return null;

    const clone: Record<string, any> = Array.isArray(body)
      ? [...body]
      : { ...body };

    for (const key of Object.keys(clone)) {
      if (SENSITIVE_KEYS.includes(key)) {
        clone[key] = '***';
      } else if (clone[key] && typeof clone[key] === 'object') {
        clone[key] = JSON.parse(this.sanitize(clone[key]) || 'null');
      }
    }

    const text = JSON.stringify(clone);
    return text.length > 4000 ? `${text.slice(0, 4000)}...` : text;
  }
}
