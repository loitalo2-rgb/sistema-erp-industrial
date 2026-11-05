import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockMovementType } from '../../common/enums';
import { round4, stockEffect } from '../../common/inventory';

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
      orderBy: { name: 'asc' },
    });

    return items.map((item) => {
      const totalBalance = round4(
        item.stockMovements.reduce(
          (acc, mov) => acc + stockEffect(mov.type, mov.quantity),
          0,
        ),
      );
      const isUnderMinimum =
        Number(item.minStock) > 0 && totalBalance <= Number(item.minStock);

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        unit: item.unit,
        costPrice: Number(item.costPrice),
        salePrice: Number(item.salePrice),
        minStock: Number(item.minStock),
        currentStock: totalBalance,
        stockValue: round4(totalBalance * Number(item.costPrice)),
        isUnderMinimum,
        lotsCount: item.stockLots.filter((lot) => Number(lot.quantity) > 0).length,
      };
    });
  }

  async getLowStock() {
    const balances = await this.getBalances();
    return balances.filter((item) => item.isUnderMinimum);
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
    const quantity = Math.abs(Number(data.quantity) || 0);
    if (!data.itemId) throw new BadRequestException('Informe o item da movimentação.');
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }
    if (!Object.values(StockMovementType).includes(data.type)) {
      throw new BadRequestException('Tipo de movimentação inválido.');
    }

    const item = await this.prisma.item.findUnique({ where: { id: data.itemId } });
    if (!item) throw new NotFoundException('Item não encontrado.');

    if (data.stockLotId) {
      const lot = await this.prisma.stockLot.findUnique({
        where: { id: data.stockLotId },
      });
      if (!lot) throw new NotFoundException('Lote não encontrado.');
      if (lot.itemId !== data.itemId) {
        throw new BadRequestException('O lote informado pertence a outro item.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          stockLotId: data.stockLotId,
          productionOrderId: data.productionOrderId,
          type: data.type,
          quantity,
          unitCost: data.unitCost || 0,
          documentRef: data.documentRef,
        },
        include: { item: true, stockLot: true },
      });

      if (data.stockLotId) {
        await tx.stockLot.update({
          where: { id: data.stockLotId },
          data: {
            quantity: {
              increment: stockEffect(data.type, quantity),
            },
          },
        });
      }

      return movement;
    });
  }

  async getMovements(itemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: itemId ? { itemId } : undefined,
      include: {
        item: true,
        stockLot: true,
        productionOrder: { select: { id: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getLots(itemId?: string) {
    return this.prisma.stockLot.findMany({
      where: itemId ? { itemId } : undefined,
      include: { item: true },
      orderBy: [{ expirationAt: 'asc' }, { createdAt: 'asc' }], // FIFO
    });
  }

  async createLot(data: {
    lotNumber: string;
    itemId: string;
    quantity?: number;
    expirationAt?: string | Date;
  }) {
    if (!data.lotNumber || !data.itemId) {
      throw new BadRequestException('Informe o número do lote e o item.');
    }

    const existing = await this.prisma.stockLot.findUnique({
      where: {
        lotNumber_itemId: {
          lotNumber: data.lotNumber,
          itemId: data.itemId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Já existe um lote com este número para o item.');
    }

    const quantity = Math.abs(Number(data.quantity) || 0);

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.create({
        data: {
          lotNumber: data.lotNumber,
          itemId: data.itemId,
          quantity,
          expirationAt: data.expirationAt ? new Date(data.expirationAt) : null,
        },
        include: { item: true },
      });

      if (quantity > 0) {
        await tx.stockMovement.create({
          data: {
            itemId: data.itemId,
            stockLotId: lot.id,
            type: StockMovementType.ENTRADA_COMPRA,
            quantity,
            documentRef: `LOTE-${data.lotNumber}`,
          },
        });
      }

      return lot;
    });
  }
}
