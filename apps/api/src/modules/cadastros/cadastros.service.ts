import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ItemType, PartnerType } from '../../common/enums';

@Injectable()
export class CadastrosService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= ITENS =================
  async getItems(type?: ItemType) {
    return this.prisma.item.findMany({
      where: type ? { type, active: true } : { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getItemById(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        boms: { include: { items: { include: { component: true } } } },
        routings: { include: { workCenter: true } },
      },
    });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async createItem(data: any) {
    return this.prisma.item.create({ data });
  }

  // ================= PARCEIROS (CLIENTES / FORNECEDORES) =================
  async getPartners(type?: PartnerType) {
    return this.prisma.partner.findMany({
      where: type ? { type, active: true } : { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createPartner(data: any) {
    return this.prisma.partner.create({ data });
  }
}
