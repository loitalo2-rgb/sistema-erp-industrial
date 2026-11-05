import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/enums';
import * as bcrypt from 'bcryptjs';

const VALID_ROLES = Object.values(UserRole);

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  getPerfis() {
    return VALID_ROLES;
  }

  async create(body: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }) {
    if (!body?.name || !body?.email || !body?.password) {
      throw new BadRequestException('Nome, e-mail e senha são obrigatórios.');
    }
    if (body.password.length < 6) {
      throw new BadRequestException('A senha deve ter ao menos 6 caracteres.');
    }

    const role = body.role || UserRole.OPERADOR;
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException('Perfil de acesso inválido.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado no sistema.');
    }

    return this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: await bcrypt.hash(body.password, 10),
        role,
      },
      select: SAFE_SELECT,
    });
  }

  async update(
    id: string,
    body: {
      name?: string;
      role?: UserRole;
      active?: boolean;
      password?: string;
    },
    currentUserId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (body.role && !VALID_ROLES.includes(body.role)) {
      throw new BadRequestException('Perfil de acesso inválido.');
    }

    if (currentUserId === id) {
      if (body.active === false) {
        throw new BadRequestException(
          'Você não pode desativar o próprio usuário.',
        );
      }
      if (body.role && body.role !== UserRole.ADMIN) {
        throw new BadRequestException(
          'Você não pode remover o próprio perfil de administrador.',
        );
      }
    }

    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.role) data.role = body.role;
    if (typeof body.active === 'boolean') data.active = body.active;
    if (body.password) {
      if (body.password.length < 6) {
        throw new BadRequestException(
          'A nova senha deve ter ao menos 6 caracteres.',
        );
      }
      data.password = await bcrypt.hash(body.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }
}
