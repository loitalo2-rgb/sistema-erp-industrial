import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PurchaseOrderStatus,
  FinancialType,
  FinancialStatus,
  DRECategory,
  StockMovementType,
} from '../../common/enums';
import { getItemBalance, receiveStock } from '../../common/stock.helpers';
import { round4 } from '../../common/inventory';

@Injectable()
export class ComprasService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(status?: PurchaseOrderStatus) {
    return this.prisma.purchaseOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        partner: true,
        items: { include: { item: true } },
        financials: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        partner: true,
        items: { include: { item: true } },
        financials: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado.');
    return order;
  }

  async createOrder(data: {
    orderNumber?: string;
    partnerId: string;
    status?: PurchaseOrderStatus;
    deliveryDate?: string | Date;
    notes?: string;
    items: Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
      lotNumber?: string;
      expirationAt?: string | Date;
    }>;
  }) {
    if (!data.partnerId) {
      throw new BadRequestException('Informe o fornecedor do pedido.');
    }
    if (!data.items?.length) {
      throw new BadRequestException('O pedido precisa ter ao menos um item.');
    }

    const partner = await this.prisma.partner.findUnique({
      where: { id: data.partnerId },
    });
    if (!partner) throw new NotFoundException('Fornecedor não encontrado.');

    const normalizedItems = data.items
      .filter((item) => item.itemId && Number(item.quantity) > 0)
      .map((item) => ({
        itemId: item.itemId,
        quantity: round4(Number(item.quantity)),
        unitPrice: Number(item.unitPrice) || 0,
        lotNumber: item.lotNumber,
        expirationAt: item.expirationAt,
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
    const status = data.status || PurchaseOrderStatus.APROVADO;

    const order = await this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        partnerId: data.partnerId,
        status,
        totalAmount,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        notes: data.notes,
        items: {
          create: normalizedItems.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: round4(it.quantity * it.unitPrice),
          })),
        },
      },
      include: { partner: true, items: { include: { item: true } } },
    });

    if (
      status === PurchaseOrderStatus.APROVADO ||
      status === PurchaseOrderStatus.RECEBIDO
    ) {
      await this.ensurePayable(order.id);
    }
    if (status === PurchaseOrderStatus.RECEBIDO) {
      await this.receiveOrder(order.id);
    }

    return this.getOrderById(order.id);
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    const order = await this.getOrderById(id);
    if (!Object.values(PurchaseOrderStatus).includes(status)) {
      throw new BadRequestException('Status de compra inválido.');
    }
    if (status === PurchaseOrderStatus.RECEBIDO) {
      return this.receiveOrder(id);
    }
    if (order.status === PurchaseOrderStatus.RECEBIDO && status !== PurchaseOrderStatus.CANCELADO) {
      throw new BadRequestException('Pedido recebido não pode retornar de status.');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { partner: true, items: { include: { item: true } } },
    });

    if (status === PurchaseOrderStatus.APROVADO) {
      await this.ensurePayable(id);
    }
    if (status === PurchaseOrderStatus.CANCELADO) {
      await this.prisma.financialTransaction.updateMany({
        where: { purchaseOrderId: id, status: FinancialStatus.PENDENTE },
        data: { status: FinancialStatus.CANCELADO },
      });
    }

    return updated;
  }

  async receiveOrder(id: string) {
    const order = await this.getOrderById(id);
    if (order.status === PurchaseOrderStatus.RECEBIDO) return order;
    if (order.status === PurchaseOrderStatus.CANCELADO) {
      throw new BadRequestException('Pedido cancelado não pode ser recebido.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < order.items.length; index++) {
        const item = order.items[index];
        const lotNumber =
          (item as any).lotNumber ||
          `LT-${order.orderNumber}-${String(index + 1).padStart(2, '0')}`;

        const beforeBalance = await getItemBalance(tx, item.itemId);
        const beforeCost = Number(item.item.costPrice);
        const receivedQty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        await receiveStock(tx, {
          itemId: item.itemId,
          quantity: receivedQty,
          type: StockMovementType.ENTRADA_COMPRA,
          unitCost: unitPrice,
          lotNumber,
          expirationAt: (item as any).expirationAt || null,
          documentRef: `COMPRA-${order.orderNumber}`,
        });

        // Custo médio ponderado após o recebimento.
        if (unitPrice > 0 && beforeBalance + receivedQty > 0) {
          const newAverage =
            (beforeBalance * beforeCost + receivedQty * unitPrice) /
            (beforeBalance + receivedQty);
          await tx.item.update({
            where: { id: item.itemId },
            data: { costPrice: round4(newAverage) },
          });
        }
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: PurchaseOrderStatus.RECEBIDO },
      });
    });

    return this.getOrderById(id);
  }

  async ensurePayable(purchaseOrderId: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado.');

    const existing = await this.prisma.financialTransaction.findFirst({
      where: { purchaseOrderId, type: FinancialType.PAGAR },
    });
    const dueDate =
      order.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (!existing) {
      return this.prisma.financialTransaction.create({
        data: {
          code: `PAG-${order.orderNumber}`,
          description: `Pagamento Ref. Pedido de Compra ${order.orderNumber}`,
          type: FinancialType.PAGAR,
          status: FinancialStatus.PENDENTE,
          dreCategory: DRECategory.CUSTO_PRODUCAO_CPV,
          amount: Number(order.totalAmount),
          dueDate,
          partnerId: order.partnerId,
          purchaseOrderId: order.id,
        },
      });
    }

    if (existing.status === FinancialStatus.CANCELADO) {
      return this.prisma.financialTransaction.update({
        where: { id: existing.id },
        data: {
          status: FinancialStatus.PENDENTE,
          amount: Number(order.totalAmount),
          dueDate,
        },
      });
    }

    return existing;
  }

  private async generateOrderNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { orderNumber: { startsWith: `COT-${year}-` } },
    });
    return `COT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
}
