import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EngenhariaService } from './engenharia.service';
import { JwtAuthGuard, Roles } from '../auth/guards';
import { UserRole } from '../../common/enums';

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

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP)
  @Post('bom')
  createBOM(@Body() body: any) {
    return this.engenhariaService.createBOM(body);
  }

  @Get('centros-trabalho')
  getWorkCenters() {
    return this.engenhariaService.getWorkCenters();
  }

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP)
  @Post('centros-trabalho')
  createWorkCenter(@Body() body: any) {
    return this.engenhariaService.createWorkCenter(body);
  }

  @Get('roteiros')
  getRoutings(@Query('itemId') itemId?: string) {
    return this.engenhariaService.getRoutings(itemId);
  }

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP)
  @Post('roteiros')
  createRouting(@Body() body: any) {
    return this.engenhariaService.createRouting(body);
  }
}
