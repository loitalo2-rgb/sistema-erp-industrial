import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Roles, Public } from './guards';
import { UserRole } from '../../common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
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
  ) {
    return this.authService.changePassword(req.user.id, body);
  }
}
