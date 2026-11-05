import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProductionOrderStatus,
  ProductionLogType,
  StockMovementType,
} from '../../common/enums';
import { consumeFifo, receiveStock } from '../../common/stock.helpers';
import { round4 } from '../../common/inventory';

@Injectable()
export class ProducaoService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= ORDENS DE PRODUÇÃO (OP) =================
  async getProductionOrders(status?: ProductionOrderStatus) {
    return this.prisma.productionOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        product: true,
        saleOrder: { include: { partner: true } },
        logs: {
          include: { workCenter: true, operator: true },
          orderBy: { startTime: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductionOrderById(id: string) {
    const op = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            boms: { include: { items: { include: { component: true } } } },
            routings: { include: { workCenter: true } },
          },
        },
        saleOrder: { include: { partner: true } },
        logs: { include: { workCenter: true, operator: true } },
        stockMovements: { include: { item: true } },
      },
    });
    if (!op) throw new NotFoundException('Ordem de produção não encontrada.');
    return op;
  }

  async createProductionOrder(data: {
    code?: string;
    productId: string;
    quantityPlanned: number;
    saleOrderId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    status?: ProductionOrderStatus;
  }) {
    if (!data.productId) {
      throw new BadRequestException('Informe o produto da ordem de produção.');
    }
    if (!data.quantityPlanned || Number(data.quantityPlanned) <= 0) {
      throw new BadRequestException('A quantidade planejada deve ser maior que zero.');
    }

    const product = await this.prisma.item.findUnique({
      where: { id: data.productId },
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');

    const code = data.code?.trim() || (await this.generateCode());

    return this.prisma.productionOrder.create({
      data: {
        code,
        productId: data.productId,
        quantityPlanned: Number(data.quantityPlanned),
        saleOrderId: data.saleOrderId || undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || ProductionOrderStatus.PLANEJADA,
      },
      include: { product: true },
    });
  }

  async updateStatus(id: string, status: ProductionOrderStatus) {
    const op = await this.prisma.productionOrder.findUnique({ where: { id } });
    if (!op) throw new NotFoundException('Ordem de produção não encontrada.');
    if (!Object.values(ProductionOrderStatus).includes(status)) {
      throw new BadRequestException('Status de produção inválido.');
    }
    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        status,
        endDate:
          status === ProductionOrderStatus.CONCLUIDA
            ? new Date()
            : status === ProductionOrderStatus.CANCELADA
              ? undefined
              : op.endDate,
      },
    });
  }

  // ================= APONTAMENTOS DE CHÃO DE FÁBRICA =================
  async createLog(data: {
    productionOrderId: string;
    workCenterId: string;
    operatorId: string;
    type?: ProductionLogType;
    startTime: Date | string;
    endTime?: Date | string;
    quantityGood: number;
    quantityScrapped?: number;
    stopReason?: string;
    scrapReason?: string;
    notes?: string;
  }) {
    if (!data.productionOrderId || !data.workCenterId || !data.operatorId) {
      throw new BadRequestException(
        'Informe a OP, o centro de trabalho e o operador.',
      );
    }

    const op = await this.prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: {
        product: {
          include: {
            boms: {
              where: { active: true },
              include: { items: { include: { component: true } } },
            },
          },
        },
      },
    });

    if (!op) throw new NotFoundException('OP não encontrada.');
    if (
      op.status === ProductionOrderStatus.CONCLUIDA ||
      op.status === ProductionOrderStatus.CANCELADA
    ) {
      throw new BadRequestException(
        'Não é possível apontar em uma OP concluída ou cancelada.',
      );
    }

    const [workCenter, operator] = await Promise.all([
      this.prisma.workCenter.findUnique({ where: { id: data.workCenterId } }),
      this.prisma.user.findUnique({ where: { id: data.operatorId } }),
    ]);
    if (!workCenter) throw new NotFoundException('Centro de trabalho não encontrado.');
    if (!operator) throw new NotFoundException('Operador não encontrado.');

    const quantityGood = Math.abs(Number(data.quantityGood) || 0);
    const quantityScrapped = Math.abs(Number(data.quantityScrapped) || 0);
    const type = data.type || ProductionLogType.PRODUCAO;

    if (type === ProductionLogType.PRODUCAO && quantityGood + quantityScrapped <= 0) {
      throw new BadRequestException('Informe a quantidade produzida ou refugada.');
    }
    if (type === ProductionLogType.PARADA && !data.stopReason?.trim()) {
      throw new BadRequestException('Informe o motivo da parada.');
    }

    return this.prisma.$transaction(async (tx) => {
      const log = await tx.productionLog.create({
        data: {
          productionOrderId: data.productionOrderId,
          workCenterId: data.workCenterId,
          operatorId: data.operatorId,
          type,
          startTime: new Date(data.startTime || new Date()),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          quantityGood,
          quantityScrapped,
          stopReason: data.stopReason,
          scrapReason: data.scrapReason,
          notes: data.notes,
        },
        include: {
          workCenter: true,
          operator: { select: { id: true, name: true } },
        },
      });

      const consumption: Array<{
        itemId: string;
        itemCode: string;
        quantity: number;
      }> = [];

      // Consome insumos da BOM (FIFO) apenas em apontamentos de produção/ajuste.
      if (
        quantityGood > 0 &&
        (type === ProductionLogType.PRODUCAO || type === ProductionLogType.AJUSTE)
      ) {
        const activeBOM = op.product.boms[0];
        if (activeBOM) {
          for (const bomItem of activeBOM.items) {
            const scrapFactor = 1 + Number(bomItem.scrapRate) / 100;
            const required = round4(
              Number(bomItem.quantity) * quantityGood * scrapFactor,
            );
            if (required <= 0) continue;

            await consumeFifo(tx, {
              itemId: bomItem.componentId,
              quantity: required,
              type: StockMovementType.SAIDA_PRODUCAO,
              documentRef: `OP-${op.code}`,
              productionOrderId: op.id,
            });

            consumption.push({
              itemId: bomItem.componentId,
              itemCode: bomItem.component.code,
              quantity: required,
            });
          }
        }
      }

      // Entrada do produto acabado em lote próprio da OP.
      if (quantityGood > 0) {
        const lotNumber = `OP-${op.code}-${Date.now()}`;
        await receiveStock(tx, {
          itemId: op.productId,
          quantity: quantityGood,
          type: StockMovementType.ENTRADA_PRODUCAO,
          unitCost: Number(op.product.costPrice),
          lotNumber,
          documentRef: `OP-${op.code}`,
          productionOrderId: op.id,
        });
      }

      const updatedQuantityProduced = round4(
        Number(op.quantityProduced) + quantityGood,
      );
      const updatedQuantityScrapped = round4(
        Number(op.quantityScrapped) + quantityScrapped,
      );
      const isFinished =
        updatedQuantityProduced >= Number(op.quantityPlanned);

      await tx.productionOrder.update({
        where: { id: op.id },
        data: {
          quantityProduced: updatedQuantityProduced,
          quantityScrapped: updatedQuantityScrapped,
          status: isFinished
            ? ProductionOrderStatus.CONCLUIDA
            : ProductionOrderStatus.EM_ANDAMENTO,
          startDate: op.startDate || new Date(data.startTime || new Date()),
          endDate: isFinished ? new Date() : op.endDate,
        },
      });

      return { ...log, consumption };
    });
  }

  private async generateCode() {
    const year = new Date().getFullYear();
    const count = await this.prisma.productionOrder.count({
      where: { code: { startsWith: `OP-${year}-` } },
    });
    return `OP-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
