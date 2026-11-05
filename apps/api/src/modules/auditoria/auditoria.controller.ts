import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { UserRole } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  findAll(
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditoriaService.findAll({
      entity,
      action,
      userId,
      from,
      to,
      search,
      page,
      limit,
    });
  }

  @Get('filtros')
  getFilterOptions() {
    return this.auditoriaService.getFilterOptions();
  }
}
