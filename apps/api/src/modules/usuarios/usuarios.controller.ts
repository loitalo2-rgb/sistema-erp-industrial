import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { UserRole } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('perfis')
  getPerfis() {
    return this.usuariosService.getPerfis();
  }

  @Post()
  create(@Body() body: any) {
    return this.usuariosService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.usuariosService.update(id, body, req.user?.id);
  }
}
