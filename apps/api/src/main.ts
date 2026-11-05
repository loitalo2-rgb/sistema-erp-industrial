import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/** Origens autorizadas a chamar a API com credenciais (cookies). */
function resolveOrigins() {
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (envOrigins.length > 0) return envOrigins;

  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS restrito às origens do frontend, com credenciais para o cookie de sessão.
  app.enableCors({
    origin: resolveOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // Prefixo global para todas as rotas da API
  app.setGlobalPrefix('api');

  // Confia no proxy reverso para identificar HTTPS/IP reais.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Headers de segurança também na API (defesa em profundidade).
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Validação automática de payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`[ERP INDUSTRIAL API] Backend rodando com sucesso em http://localhost:${port}/api`);
}

bootstrap();
