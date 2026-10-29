import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard } from '../auth/guards';
import { FinancialType, FinancialStatus } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Get('titulos')
  getTransactions(
    @Query('type') type?: FinancialType,
    @Query('status') status?: FinancialStatus,
  ) {
    return this.financeiroService.getTransactions(type, status);
  }

  @Post('titulos')
  createTransaction(@Body() body: any) {
    return this.financeiroService.createTransaction(body);
  }

  @Patch('titulos/:id/pagar')
  payTransaction(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount?: number,
  ) {
    return this.financeiroService.payTransaction(id, paidAmount);
  }

  @Get('dre')
  getDRE() {
    return this.financeiroService.getDRE();
  }
}
