import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EngenhariaService } from './engenharia.service';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('engenharia')
export class EngenhariaController {
  constructor(private readonly engenhariaService: EngenhariaService) {}

  @Get('bom')
  getBOMs() {
    return this.engenhariaService.getBOMs();
  }

  @Get('bom/produto/:productId')
  getBOMByProductId(@Param('productId') productId: string) {
    return this.engenhariaService.getBOMByProductId(productId);
  }

  @Post('bom')
  createBOM(@Body() body: any) {
    return this.engenhariaService.createBOM(body);
  }

  @Get('centros-trabalho')
  getWorkCenters() {
    return this.engenhariaService.getWorkCenters();
  }

  @Post('centros-trabalho')
  createWorkCenter(@Body() body: any) {
    return this.engenhariaService.createWorkCenter(body);
  }

  @Get('roteiros')
  getRoutings(@Query('itemId') itemId?: string) {
    return this.engenhariaService.getRoutings(itemId);
  }

  @Post('roteiros')
  createRouting(@Body() body: any) {
    return this.engenhariaService.createRouting(body);
  }
}
