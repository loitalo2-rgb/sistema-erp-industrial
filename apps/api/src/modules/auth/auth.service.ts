import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums';

const VALID_ROLES = Object.values(UserRole);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      throw new UnauthorizedException(
        'Credenciais inválidas ou usuário inativo.',
      );
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }) {
    if (!registerDto.name || !registerDto.email || !registerDto.password) {
      throw new BadRequestException(
        'Nome, e-mail e senha são obrigatórios.',
      );
    }

    if (registerDto.password.length < 6) {
      throw new BadRequestException('A senha deve ter ao menos 6 caracteres.');
    }

    const role = registerDto.role || UserRole.OPERADOR;
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException('Perfil de acesso inválido.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado no sistema.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(
    userId: string,
    body: { currentPassword: string; newPassword: string },
  ) {
    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException(
        'Informe a senha atual e a nova senha.',
      );
    }
    if (body.newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter ao menos 6 caracteres.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    const match = await bcrypt.compare(body.currentPassword, user.password);
    if (!match) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(body.newPassword, 10) },
    });

    return { message: 'Senha alterada com sucesso.' };
  }
}
