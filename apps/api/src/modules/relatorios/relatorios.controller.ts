import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('consolidado')
  getConsolidated(@Query('from') from?: string, @Query('to') to?: string) {
    return this.relatoriosService.getConsolidated(from, to);
  }

  @Get('dre')
  getDre(@Query('from') from?: string, @Query('to') to?: string) {
    return this.relatoriosService.getDre(from, to);
  }

  @Get('estoque')
  getInventory() {
    return this.relatoriosService.getInventory();
  }

  @Get('producao')
  getProduction(@Query('from') from?: string, @Query('to') to?: string) {
    return this.relatoriosService.getProduction(from, to);
  }

  @Get('vendas')
  getSales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.relatoriosService.getSales(from, to);
  }

  @Get('financeiro')
  getFinancial(@Query('from') from?: string, @Query('to') to?: string) {
    return this.relatoriosService.getFinancial(from, to);
  }
}
