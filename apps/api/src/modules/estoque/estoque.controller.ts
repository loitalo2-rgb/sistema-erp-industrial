import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { UserRole } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get('saldos')
  getBalances() {
    return this.estoqueService.getBalances();
  }

  @Get('saldos/criticos')
  getLowStock() {
    return this.estoqueService.getLowStock();
  }

  @Get('movimentacoes')
  getMovements(@Query('itemId') itemId?: string) {
    return this.estoqueService.getMovements(itemId);
  }

  @Roles(UserRole.ADMIN, UserRole.COMPRAS, UserRole.PCP, UserRole.OPERADOR)
  @Post('movimentacoes')
  createMovement(@Body() body: any) {
    return this.estoqueService.createMovement(body);
  }

  @Get('lotes')
  getLots(@Query('itemId') itemId?: string) {
    return this.estoqueService.getLots(itemId);
  }

  @Roles(UserRole.ADMIN, UserRole.COMPRAS, UserRole.PCP, UserRole.OPERADOR)
  @Post('lotes')
  createLot(@Body() body: any) {
    return this.estoqueService.createLot(body);
  }
}
