import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductionOrderStatus, ProductionLogType, StockMovementType } from '../../common/enums';

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
        logs: { include: { workCenter: true, operator: true } },
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
      },
    });
    if (!op) throw new NotFoundException('Ordem de produção não encontrada.');
    return op;
  }

  async createProductionOrder(data: {
    code: string;
    productId: string;
    quantityPlanned: number;
    saleOrderId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.productionOrder.create({
      data: {
        code: data.code,
        productId: data.productId,
        quantityPlanned: data.quantityPlanned,
        saleOrderId: data.saleOrderId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: ProductionOrderStatus.PLANEJADA,
      },
      include: { product: true },
    });
  }

  async updateStatus(id: string, status: ProductionOrderStatus) {
    return this.prisma.productionOrder.update({
      where: { id },
      data: { status },
    });
  }

  // ================= APONTAMENTOS DE CHÃO DE FÁBRICA =================
  async createLog(data: {
    productionOrderId: string;
    workCenterId: string;
    operatorId: string;
    type?: ProductionLogType;
    startTime: Date;
    endTime?: Date;
    quantityGood: number;
    quantityScrapped?: number;
    stopReason?: string;
    scrapReason?: string;
    notes?: string;
  }) {
    const op = await this.prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: { product: true },
    });

    if (!op) throw new NotFoundException('OP não encontrada.');

    // 1. Criar o apontamento
    const log = await this.prisma.productionLog.create({
      data: {
        productionOrderId: data.productionOrderId,
        workCenterId: data.workCenterId,
        operatorId: data.operatorId,
        type: data.type || ProductionLogType.PRODUCAO,
        startTime: data.startTime,
        endTime: data.endTime,
        quantityGood: data.quantityGood,
        quantityScrapped: data.quantityScrapped || 0,
        stopReason: data.stopReason,
        scrapReason: data.scrapReason,
        notes: data.notes,
      },
      include: {
        workCenter: true,
        operator: { select: { id: true, name: true } },
      },
    });

    // 2. Atualizar acumulados na OP
    const updatedQuantityProduced = Number(op.quantityProduced) + Number(data.quantityGood);
    const updatedQuantityScrapped = Number(op.quantityScrapped) + Number(data.quantityScrapped || 0);

    const isFinished = updatedQuantityProduced >= Number(op.quantityPlanned);

    await this.prisma.productionOrder.update({
      where: { id: op.id },
      data: {
        quantityProduced: updatedQuantityProduced,
        quantityScrapped: updatedQuantityScrapped,
        status: isFinished ? ProductionOrderStatus.CONCLUIDA : ProductionOrderStatus.EM_ANDAMENTO,
      },
    });

    // 3. Registrar entrada do produto acabado no estoque se houve produção boa
    if (data.quantityGood > 0) {
      await this.prisma.stockMovement.create({
        data: {
          itemId: op.productId,
          productionOrderId: op.id,
          type: StockMovementType.ENTRADA_PRODUCAO,
          quantity: data.quantityGood,
          documentRef: `OP-${op.code}`,
        },
      });
    }

    return log;
  }
}
