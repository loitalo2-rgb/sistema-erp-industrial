import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EngenhariaService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= BOM (ESTRUTURA DE PRODUTOS) =================
  async getBOMs() {
    return this.prisma.bOM.findMany({
      include: {
        product: true,
        items: {
          include: { component: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getBOMByProductId(productId: string) {
    return this.prisma.bOM.findFirst({
      where: { productId, active: true },
      include: {
        product: true,
        items: {
          include: { component: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createBOM(data: {
    code: string;
    productId: string;
    version?: string;
    description?: string;
    items: Array<{ componentId: string; quantity: number; scrapRate?: number; order?: number }>;
  }) {
    return this.prisma.bOM.create({
      data: {
        code: data.code,
        productId: data.productId,
        version: data.version || '1.0',
        description: data.description,
        items: {
          create: data.items.map((item, idx) => ({
            componentId: item.componentId,
            quantity: item.quantity,
            scrapRate: item.scrapRate || 0,
            order: item.order || idx + 1,
          })),
        },
      },
      include: {
        items: { include: { component: true } },
      },
    });
  }

  // ================= CENTROS DE TRABALHO & ROTEIROS =================
  async getWorkCenters() {
    return this.prisma.workCenter.findMany({ where: { active: true } });
  }

  async createWorkCenter(data: any) {
    return this.prisma.workCenter.create({ data });
  }

  async getRoutings(itemId?: string) {
    return this.prisma.routing.findMany({
      where: itemId ? { itemId } : undefined,
      include: { workCenter: true, item: true },
      orderBy: { sequence: 'asc' },
    });
  }

  async createRouting(data: any) {
    return this.prisma.routing.create({ data });
  }
}
