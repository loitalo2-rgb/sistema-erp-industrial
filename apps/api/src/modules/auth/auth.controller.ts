import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Roles, Public } from './guards';
import { UserRole } from '../../common/enums';
import {
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE,
  isSecureRequest,
} from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(body);

    // Sessão por cookie HttpOnly: o JWT não fica exposto ao JavaScript da página.
    res.cookie(AUTH_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE * 1000,
    });

    return result;
  }

  @Public()
  @Post('logout')
  logout(@Response({ passthrough: true }) res: any) {
    res.clearCookie(AUTH_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Sessão encerrada com sucesso.' };
  }

  // Cadastro de novos usuários é restrito ao ADMIN (evita escalonamento de privilégio).
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('senha')
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
    @Response({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.changePassword(req.user.id, body);

    // Invalida a sessão atual após a troca de senha: força novo login.
    res.clearCookie(AUTH_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }
}
