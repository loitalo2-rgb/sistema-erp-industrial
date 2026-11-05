import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { FinancialType, FinancialStatus, UserRole } from '../../common/enums';

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

  @Get('titulos/:id')
  getTransactionById(@Param('id') id: string) {
    return this.financeiroService.getTransactionById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Post('titulos')
  createTransaction(@Body() body: any) {
    return this.financeiroService.createTransaction(body);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch('titulos/:id/pagar')
  payTransaction(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount?: number,
    @Body('paymentDate') paymentDate?: string,
  ) {
    return this.financeiroService.payTransaction(id, paidAmount, paymentDate);
  }

  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @Patch('titulos/:id/cancelar')
  cancelTransaction(@Param('id') id: string) {
    return this.financeiroService.cancelTransaction(id);
  }

  @Get('resumo')
  getSummary() {
    return this.financeiroService.getSummary();
  }

  @Get('dre')
  getDRE(@Query('from') from?: string, @Query('to') to?: string) {
    return this.financeiroService.getDRE(from, to);
  }
}
