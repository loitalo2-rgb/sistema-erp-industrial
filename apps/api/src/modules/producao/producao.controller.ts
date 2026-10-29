import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProducaoService } from './producao.service';
import { JwtAuthGuard } from '../auth/guards';
import { ProductionOrderStatus } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('producao')
export class ProducaoController {
  constructor(private readonly producaoService: ProducaoService) {}

  @Get('ordens')
  getProductionOrders(@Query('status') status?: ProductionOrderStatus) {
    return this.producaoService.getProductionOrders(status);
  }

  @Get('ordens/:id')
  getProductionOrderById(@Param('id') id: string) {
    return this.producaoService.getProductionOrderById(id);
  }

  @Post('ordens')
  createProductionOrder(@Body() body: any) {
    return this.producaoService.createProductionOrder(body);
  }

  @Patch('ordens/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: ProductionOrderStatus) {
    return this.producaoService.updateStatus(id, status);
  }

  @Post('apontamentos')
  createLog(@Body() body: any) {
    return this.producaoService.createLog(body);
  }
}
