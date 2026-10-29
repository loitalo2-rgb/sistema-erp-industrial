import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ItemType } from '../../common/enums';

export interface MRPCalculationResult {
  productId: string;
  productName: string;
  productCode: string;
  quantityRequested: number;
  components: Array<{
    componentId: string;
    componentName: string;
    componentCode: string;
    unit: string;
    type: ItemType;
    grossRequirement: number;
    currentStock: number;
    netRequirement: number;
    leadTimeDays: number;
    suggestedAction: 'EMITIR_ORDEM_COMPRA' | 'EMITIR_ORDEM_PRODUCAO' | 'ESTOQUE_SUFICIENTE';
  }>;
}

@Injectable()
export class MrpService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForProduct(productId: string, quantity: number): Promise<MRPCalculationResult> {
    const product = await this.prisma.item.findUnique({
      where: { id: productId },
      include: {
        boms: {
          where: { active: true },
          include: {
            items: {
              include: { component: true },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Produto não encontrado.');

    const activeBOM = product.boms[0];
    if (!activeBOM || !activeBOM.items.length) {
      throw new NotFoundException('Nenhuma estrutura (BOM) ativa encontrada para este produto.');
    }

    const components = [];

    for (const bomItem of activeBOM.items) {
      const comp = bomItem.component;
      const scrapFactor = 1 + Number(bomItem.scrapRate) / 100;
      const grossReq = Number(bomItem.quantity) * quantity * scrapFactor;

      // Calcular saldo atual em estoque baseado no histórico de movimentações
      const stockAgg = await this.prisma.stockMovement.aggregate({
        where: { itemId: comp.id },
        _sum: { quantity: true },
      });

      const currentStock = Number(stockAgg._sum.quantity || 0);
      const netReq = Math.max(0, grossReq - currentStock);

      let suggestedAction: 'EMITIR_ORDEM_COMPRA' | 'EMITIR_ORDEM_PRODUCAO' | 'ESTOQUE_SUFICIENTE' = 'ESTOQUE_SUFICIENTE';
      if (netReq > 0) {
        suggestedAction = comp.type === ItemType.MATERIA_PRIMA || comp.type === ItemType.EMBALAGEM
          ? 'EMITIR_ORDEM_COMPRA'
          : 'EMITIR_ORDEM_PRODUCAO';
      }

      components.push({
        componentId: comp.id,
        componentName: comp.name,
        componentCode: comp.code,
        unit: comp.unit,
        type: comp.type,
        grossRequirement: Number(grossReq.toFixed(4)),
        currentStock: Number(currentStock.toFixed(4)),
        netRequirement: Number(netReq.toFixed(4)),
        leadTimeDays: comp.leadTimeDays,
        suggestedAction,
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantityRequested: quantity,
      components,
    };
  }
}
