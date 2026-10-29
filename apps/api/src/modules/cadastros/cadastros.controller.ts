import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CadastrosService } from './cadastros.service';
import { JwtAuthGuard } from '../auth/guards';
import { ItemType, PartnerType } from '../../common/enums';

@UseGuards(JwtAuthGuard)
@Controller('cadastros')
export class CadastrosController {
  constructor(private readonly cadastrosService: CadastrosService) {}

  @Get('itens')
  getItems(@Query('type') type?: ItemType) {
    return this.cadastrosService.getItems(type);
  }

  @Get('itens/:id')
  getItemById(@Param('id') id: string) {
    return this.cadastrosService.getItemById(id);
  }

  @Post('itens')
  createItem(@Body() body: any) {
    return this.cadastrosService.createItem(body);
  }

  @Get('parceiros')
  getPartners(@Query('type') type?: PartnerType) {
    return this.cadastrosService.getPartners(type);
  }

  @Post('parceiros')
  createPartner(@Body() body: any) {
    return this.cadastrosService.createPartner(body);
  }
}
