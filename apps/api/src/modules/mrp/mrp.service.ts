import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ItemType } from '../../common/enums';
import { getItemBalance } from '../../common/stock.helpers';
import { round4 } from '../../common/inventory';

export interface MRPCalculationResult {
  productId: string;
  productName: string;
  productCode: string;
  quantityRequested: number;
  bomCode: string | null;
  totalEstimatedCost: number;
  components: Array<{
    componentId: string;
    componentName: string;
    componentCode: string;
    unit: string;
    type: ItemType;
    unitCost: number;
    grossRequirement: number;
    currentStock: number;
    netRequirement: number;
    estimatedCost: number;
    leadTimeDays: number;
    suggestedAction:
      | 'EMITIR_ORDEM_COMPRA'
      | 'EMITIR_ORDEM_PRODUCAO'
      | 'ESTOQUE_SUFICIENTE';
  }>;
}

@Injectable()
export class MrpService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateForProduct(
    productId: string,
    quantity: number,
  ): Promise<MRPCalculationResult> {
    if (!productId) throw new NotFoundException('Informe o produto para o cálculo.');
    if (!quantity || quantity <= 0) {
      throw new NotFoundException('A quantidade deve ser maior que zero.');
    }

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
      throw new NotFoundException(
        'Nenhuma estrutura (BOM) ativa encontrada para este produto.',
      );
    }

    const components: MRPCalculationResult['components'] = [];
    let totalEstimatedCost = 0;

    for (const bomItem of activeBOM.items) {
      const comp = bomItem.component;
      const scrapFactor = 1 + Number(bomItem.scrapRate) / 100;
      const grossReq = Number(bomItem.quantity) * quantity * scrapFactor;

      const currentStock = await getItemBalance(this.prisma, comp.id);
      const netReq = Math.max(0, grossReq - currentStock);

      let suggestedAction: MRPCalculationResult['components'][number]['suggestedAction'] =
        'ESTOQUE_SUFICIENTE';
      if (netReq > 0) {
        suggestedAction =
          comp.type === ItemType.MATERIA_PRIMA ||
          comp.type === ItemType.EMBALAGEM ||
          comp.type === ItemType.CONSUMO
            ? 'EMITIR_ORDEM_COMPRA'
            : 'EMITIR_ORDEM_PRODUCAO';
      }

      const estimatedCost = round4(netReq * Number(comp.costPrice));
      totalEstimatedCost = round4(totalEstimatedCost + estimatedCost);

      components.push({
        componentId: comp.id,
        componentName: comp.name,
        componentCode: comp.code,
        unit: comp.unit,
        type: comp.type as ItemType,
        unitCost: Number(comp.costPrice),
        grossRequirement: round4(grossReq),
        currentStock: round4(currentStock),
        netRequirement: round4(netReq),
        estimatedCost,
        leadTimeDays: comp.leadTimeDays,
        suggestedAction,
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      quantityRequested: quantity,
      bomCode: activeBOM.code,
      totalEstimatedCost,
      components,
    };
  }
}
