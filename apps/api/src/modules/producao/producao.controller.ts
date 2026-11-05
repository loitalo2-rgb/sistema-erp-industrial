import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProducaoService } from './producao.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { ProductionOrderStatus, UserRole } from '../../common/enums';

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

  @Roles(UserRole.ADMIN, UserRole.PCP)
  @Post('ordens')
  createProductionOrder(@Body() body: any) {
    return this.producaoService.createProductionOrder(body);
  }

  @Roles(UserRole.ADMIN, UserRole.PCP)
  @Patch('ordens/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: ProductionOrderStatus) {
    return this.producaoService.updateStatus(id, status);
  }

  @Roles(UserRole.ADMIN, UserRole.PCP, UserRole.OPERADOR)
  @Post('apontamentos')
  createLog(@Body() body: any) {
    return this.producaoService.createLog(body);
  }
}
