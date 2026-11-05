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
import { JwtAuthGuard, Roles } from '../auth/guards';
import { ItemType, PartnerType, UserRole } from '../../common/enums';

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

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP, UserRole.COMPRAS)
  @Post('itens')
  createItem(@Body() body: any) {
    return this.cadastrosService.createItem(body);
  }

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP, UserRole.COMPRAS)
  @Put('itens/:id')
  updateItem(@Param('id') id: string, @Body() body: any) {
    return this.cadastrosService.updateItem(id, body);
  }

  @Roles(UserRole.ADMIN, UserRole.ENGENHARIA, UserRole.PCP, UserRole.COMPRAS)
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

  @Roles(UserRole.ADMIN, UserRole.COMPRAS, UserRole.VENDAS, UserRole.FINANCEIRO)
  @Post('parceiros')
  createPartner(@Body() body: any) {
    return this.cadastrosService.createPartner(body);
  }

  @Roles(UserRole.ADMIN, UserRole.COMPRAS, UserRole.VENDAS, UserRole.FINANCEIRO)
  @Put('parceiros/:id')
  updatePartner(@Param('id') id: string, @Body() body: any) {
    return this.cadastrosService.updatePartner(id, body);
  }

  @Roles(UserRole.ADMIN, UserRole.COMPRAS, UserRole.VENDAS, UserRole.FINANCEIRO)
  @Patch('parceiros/:id/desativar')
  deactivatePartner(@Param('id') id: string) {
    return this.cadastrosService.deactivatePartner(id);
  }
}
