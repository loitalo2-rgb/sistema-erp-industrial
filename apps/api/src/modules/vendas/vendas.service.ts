import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaleOrderStatus, FinancialType, FinancialStatus, DRECategory } from '../../common/enums';

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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(data: {
    orderNumber: string;
    partnerId: string;
    deliveryDate?: Date;
    notes?: string;
    items: Array<{ itemId: string; quantity: number; unitPrice: number }>;
  }) {
    const totalAmount = data.items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );

    const order = await this.prisma.saleOrder.create({
      data: {
        orderNumber: data.orderNumber,
        partnerId: data.partnerId,
        deliveryDate: data.deliveryDate,
        notes: data.notes,
        totalAmount,
        status: SaleOrderStatus.APROVADO,
        items: {
          create: data.items.map((it) => ({
            itemId: it.itemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.quantity * it.unitPrice,
          })),
        },
      },
      include: { items: { include: { item: true } } },
    });

    // Gera automaticamente o título a receber no Financeiro
    await this.prisma.financialTransaction.create({
      data: {
        code: `REC-${order.orderNumber}`,
        description: `Recebimento Ref. Pedido de Venda ${order.orderNumber}`,
        type: FinancialType.RECEBER,
        status: FinancialStatus.PENDENTE,
        dreCategory: DRECategory.RECEITA_BRUTA,
        amount: totalAmount,
        dueDate: data.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        partnerId: data.partnerId,
        saleOrderId: order.id,
      },
    });

    return order;
  }
}
