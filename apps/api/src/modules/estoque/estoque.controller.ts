import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Get('saldos')
  getBalances() {
    return this.estoqueService.getBalances();
  }

  @Get('movimentacoes')
  getMovements(@Query('itemId') itemId?: string) {
    return this.estoqueService.getMovements(itemId);
  }

  @Post('movimentacoes')
  createMovement(@Body() body: any) {
    return this.estoqueService.createMovement(body);
  }

  @Get('lotes')
  getLots(@Query('itemId') itemId?: string) {
    return this.estoqueService.getLots(itemId);
  }
}
