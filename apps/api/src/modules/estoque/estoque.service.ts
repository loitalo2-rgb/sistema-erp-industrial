import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementType } from '../../common/enums';

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalances() {
    const items = await this.prisma.item.findMany({
      where: { active: true },
      include: {
        stockLots: true,
        stockMovements: true,
      },
    });

    return items.map((item) => {
      const totalBalance = item.stockMovements.reduce(
        (acc, mov) => acc + Number(mov.quantity),
        0,
      );
      const isUnderMinimum = totalBalance <= Number(item.minStock);

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        unit: item.unit,
        minStock: Number(item.minStock),
        currentStock: totalBalance,
        isUnderMinimum,
        lotsCount: item.stockLots.length,
      };
    });
  }

  async createMovement(data: {
    itemId: string;
    stockLotId?: string;
    productionOrderId?: string;
    type: StockMovementType;
    quantity: number;
    unitCost?: number;
    documentRef?: string;
  }) {
    return this.prisma.stockMovement.create({
      data: {
        itemId: data.itemId,
        stockLotId: data.stockLotId,
        productionOrderId: data.productionOrderId,
        type: data.type,
        quantity: data.quantity,
        unitCost: data.unitCost || 0,
        documentRef: data.documentRef,
      },
    });
  }

  async getMovements(itemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: itemId ? { itemId } : undefined,
      include: { item: true, stockLot: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getLots(itemId?: string) {
    return this.prisma.stockLot.findMany({
      where: itemId ? { itemId } : undefined,
      include: { item: true },
      orderBy: { expirationAt: 'asc' }, // FIFO
    });
  }
}
