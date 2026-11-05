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

  async updateItem(id: string, data: any) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return this.prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        unit: data.unit,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : undefined,
        minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
        leadTimeDays:
          data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : undefined,
        ncm: data.ncm,
        active: data.active,
      },
    });
  }

  async deactivateItem(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return this.prisma.item.update({ where: { id }, data: { active: false } });
  }

  // ================= PARCEIROS (CLIENTES / FORNECEDORES) =================
  async getPartners(type?: PartnerType) {
    return this.prisma.partner.findMany({
      where: type ? { type, active: true } : { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPartnerById(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Parceiro não encontrado.');
    return partner;
  }

  async createPartner(data: any) {
    return this.prisma.partner.create({ data });
  }

  async updatePartner(id: string, data: any) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Parceiro não encontrado.');
    return this.prisma.partner.update({
      where: { id },
      data: {
        name: data.name,
        tradeName: data.tradeName,
        docNumber: data.docNumber,
        type: data.type,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        active: data.active,
      },
    });
  }

  async deactivatePartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Parceiro não encontrado.');
    return this.prisma.partner.update({
      where: { id },
      data: { active: false },
    });
  }
}
