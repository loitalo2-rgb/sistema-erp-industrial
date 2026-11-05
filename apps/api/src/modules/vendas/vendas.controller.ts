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
import { VendasService } from './vendas.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { SaleOrderStatus, UserRole } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('vendas')
export class VendasController {
  constructor(private readonly vendasService: VendasService) {}

  @Get('pedidos')
  getOrders(@Query('status') status?: SaleOrderStatus) {
    return this.vendasService.getOrders(status);
  }

  @Get('pedidos/:id')
  getOrderById(@Param('id') id: string) {
    return this.vendasService.getOrderById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.VENDAS)
  @Post('pedidos')
  createOrder(@Body() body: any) {
    return this.vendasService.createOrder(body);
  }

  @Roles(UserRole.ADMIN, UserRole.VENDAS, UserRole.FINANCEIRO)
  @Post('pedidos/:id/faturar')
  faturarOrder(@Param('id') id: string) {
    return this.vendasService.faturarOrder(id);
  }

  @Roles(UserRole.ADMIN, UserRole.VENDAS)
  @Patch('pedidos/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: SaleOrderStatus) {
    return this.vendasService.updateStatus(id, status);
  }
}
