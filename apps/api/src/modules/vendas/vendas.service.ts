import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SaleOrderStatus,
  FinancialType,
  FinancialStatus,
  DRECategory,
  StockMovementType,
} from '../../common/enums';
import { consumeFifo } from '../../common/stock.helpers';
import { round4 } from '../../common/inventory';

@Injectable()
export class VendasService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(status?: SaleOrderStatus) {
    return this.prisma.saleOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        partner: true,
        items: { include: { item: true } },
        productionOrders: true,
        financials: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: {
        partner: true,
        items: { include: { item: true } },
        productionOrders: true,
        financials: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido de venda não encontrado.');
    return order;
  }

  async createOrder(data: {
    orderNumber?: string;
    partnerId: string;
    deliveryDate?: Date | string;
    notes?: string;
    status?: SaleOrderStatus;
    items: Array<{ itemId: string; quantity: number; unitPrice: number }>;
  }) {
    if (!data.partnerId) {
      throw new BadRequestException('Informe o cliente do pedido.');
    }
    if (!data.items?.length) {
      throw new BadRequestException('O pedido precisa ter ao menos um item.');
    }

    const partner = await this.prisma.partner.findUnique({
      where: { id: data.partnerId },
    });
    if (!partner) throw new NotFoundException('Cliente não encontrado.');

    const normalizedItems = data.items
      .filter((item) => item.itemId && Number(item.quantity) > 0)
      .map((item) => ({
        itemId: item.itemId,
        quantity: round4(Number(item.quantity)),
        unitPrice: Number(item.unitPrice) || 0,
      }));

    if (!normalizedItems.length) {
      throw new BadRequestException('Informe itens e quantidades válidas.');
    }

    const totalAmount = round4(
      normalizedItems.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0,
      ),
    );

    const orderNumber =
      data.orderNumber?.trim() || (await this.generateOrderNumber());

    const status = data.status || SaleOrderStatus.APROVADO;

    const order = await this.prisma.saleOrder.create({
      data: {
        orderNumber,
        partnerId: data.partnerId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        notes: data.notes,
        totalAmount,
        status,
        items: {
          create: normalizedItems.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: round4(it.quantity * it.unitPrice),
          })),
        },
      },
      include: {
        partner: true,
        items: { include: { item: true } },
      },
    });

    if (status === SaleOrderStatus.FATURADO) {
      await this.faturarOrder(order.id);
    }

    return order;
  }

  async updateStatus(id: string, status: SaleOrderStatus) {
    const order = await this.getOrderById(id);
    if (!Object.values(SaleOrderStatus).includes(status)) {
      throw new BadRequestException('Status de venda inválido.');
    }
    if (status === SaleOrderStatus.FATURADO) {
      return this.faturarOrder(id);
    }
    if (order.status === SaleOrderStatus.FATURADO && status !== SaleOrderStatus.CANCELADO) {
      throw new BadRequestException('Pedido faturado não pode retornar de status.');
    }

    const updated = await this.prisma.saleOrder.update({
      where: { id },
      data: { status },
    });

    if (status === SaleOrderStatus.CANCELADO) {
      await this.prisma.financialTransaction.updateMany({
        where: { saleOrderId: id, status: FinancialStatus.PENDENTE },
        data: { status: FinancialStatus.CANCELADO },
      });
    }

    return updated;
  }

  async faturarOrder(id: string) {
    const order = await this.getOrderById(id);
    if (order.status === SaleOrderStatus.CANCELADO) {
      throw new BadRequestException('Pedido cancelado não pode ser faturado.');
    }
    if (order.status === SaleOrderStatus.FATURADO) return order;

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await consumeFifo(tx, {
          itemId: item.itemId,
          quantity: Number(item.quantity),
          type: StockMovementType.SAIDA_VENDA,
          documentRef: `PED-${order.orderNumber}`,
        });
      }

      const updated = await tx.saleOrder.update({
        where: { id },
        data: { status: SaleOrderStatus.FATURADO },
        include: {
          partner: true,
          items: { include: { item: true } },
          productionOrders: true,
          financials: true,
        },
      });

      const existing = await tx.financialTransaction.findFirst({
        where: { saleOrderId: id, type: FinancialType.RECEBER },
      });

      const dueDate =
        order.deliveryDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (!existing) {
        await tx.financialTransaction.create({
          data: {
            code: `REC-${order.orderNumber}`,
            description: `Recebimento Ref. Pedido de Venda ${order.orderNumber}`,
            type: FinancialType.RECEBER,
            status: FinancialStatus.PENDENTE,
            dreCategory: DRECategory.RECEITA_BRUTA,
            amount: Number(order.totalAmount),
            dueDate,
            partnerId: order.partnerId,
            saleOrderId: order.id,
          },
        });
      } else if (existing.status === FinancialStatus.CANCELADO) {
        await tx.financialTransaction.update({
          where: { id: existing.id },
          data: { status: FinancialStatus.PENDENTE, amount: Number(order.totalAmount) },
        });
      }

      return updated;
    });
  }

  private async generateOrderNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.saleOrder.count({
      where: { orderNumber: { startsWith: `PED-${year}-` } },
    });
    return `PED-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
