import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_COOKIE } from './auth.constants';

/** Lê o JWT do cookie HttpOnly, mantendo compatibilidade com Bearer token. */
function cookieExtractor(req: any): string | null {
  const cookieHeader: string | undefined = req?.headers?.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === AUTH_COOKIE) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'segredo_super_seguro_erp_industrial_token_jwt_2026',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Acesso não autorizado.');
    }

    return user;
  }
}
