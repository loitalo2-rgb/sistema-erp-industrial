import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { VendasService } from './vendas.service';
import { JwtAuthGuard } from '../auth/guards';
import { SaleOrderStatus } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('vendas')
export class VendasController {
  constructor(private readonly vendasService: VendasService) {}

  @Get('pedidos')
  getOrders(@Query('status') status?: SaleOrderStatus) {
    return this.vendasService.getOrders(status);
  }

  @Post('pedidos')
  createOrder(@Body() body: any) {
    return this.vendasService.createOrder(body);
  }
}
