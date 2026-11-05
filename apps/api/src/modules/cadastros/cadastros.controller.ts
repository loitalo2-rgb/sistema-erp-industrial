import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @Put('itens/:id')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.cadastrosService.updateItem(id, body);
  }

  @Patch('itens/:id/desativar')
  deactivateItem(@Param('id') id: string) {
    return this.cadastrosService.deactivateItem(id);
  }

  @Get('parceiros')
  getPartners(@Query('type') type?: PartnerType) {
    return this.cadastrosService.getPartners(type);
  }

  @Get('parceiros/:id')
  getPartnerById(@Param('id') id: string) {
    return this.cadastrosService.getPartnerById(id);
  }

  @Post('parceiros')
  createPartner(@Body() body: any) {
    return this.cadastrosService.createPartner(body);
  }

  @Put('parceiros/:id')
  updatePartner(@Param('id') id: string, @Body() body: any) {
    return this.cadastrosService.updatePartner(id, body);
  }

  @Patch('parceiros/:id/desativar')
  deactivatePartner(@Param('id') id: string) {
    return this.cadastrosService.deactivatePartner(id);
  }
}
