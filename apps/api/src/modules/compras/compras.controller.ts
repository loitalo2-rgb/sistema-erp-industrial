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
import { ComprasService } from './compras.service';
import { JwtAuthGuard } from '../auth/guards';
import { PurchaseOrderStatus } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get('pedidos')
  getOrders(@Query('status') status?: PurchaseOrderStatus) {
    return this.comprasService.getOrders(status);
  }

  @Get('pedidos/:id')
  getOrderById(@Param('id') id: string) {
    return this.comprasService.getOrderById(id);
  }

  @Post('pedidos')
  createOrder(@Body() body: any) {
    return this.comprasService.createOrder(body);
  }

  @Post('pedidos/:id/receber')
  receiveOrder(@Param('id') id: string) {
    return this.comprasService.receiveOrder(id);
  }

  @Patch('pedidos/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PurchaseOrderStatus,
  ) {
    return this.comprasService.updateStatus(id, status);
  }
}
