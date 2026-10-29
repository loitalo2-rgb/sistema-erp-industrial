import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { MrpService } from './mrp.service';
import { JwtAuthGuard } from '../auth/guards';

@UseGuards(JwtAuthGuard)
@Controller('mrp')
export class MrpController {
  constructor(private readonly mrpService: MrpService) {}

  @Get('calcular')
  calculate(
    @Query('productId') productId: string,
    @Query('quantity') quantity: string,
  ) {
    if (!productId || !quantity) {
      throw new BadRequestException('Informe productId e quantity.');
    }
    return this.mrpService.calculateForProduct(productId, parseFloat(quantity));
  }
}
