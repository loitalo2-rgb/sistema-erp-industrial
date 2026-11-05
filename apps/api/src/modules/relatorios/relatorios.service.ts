import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { EstoqueService } from '../estoque/estoque.service';
import {
  FinancialStatus,
  ProductionOrderStatus,
  SaleOrderStatus,
} from '../../common/enums';
import { round4 } from '../../common/inventory';
import { buildDateFilter } from '../../common/dates';

@Injectable()
export class RelatoriosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeiroService: FinanceiroService,
    private readonly estoqueService: EstoqueService,
  ) {}

  private buildDateFilter(from?: string, to?: string) {
    return buildDateFilter(from, to);
  }

  async getDre(from?: string, to?: string) {
    return this.financeiroService.getDRE(from, to);
  }

  async getInventory() {
    const balances = await this.estoqueService.getBalances();
    const byType: Record<string, { items: number; stockValue: number }> = {};

    for (const item of balances) {
      if (!byType[item.type]) byType[item.type] = { items: 0, stockValue: 0 };
      byType[item.type].items += 1;
      byType[item.type].stockValue = round4(
        byType[item.type].stockValue + item.stockValue,
      );
    }

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        items: balances.length,
        stockValue: round4(
          balances.reduce((acc, item) => acc + item.stockValue, 0),
        ),
        lowStockItems: balances.filter((item) => item.isUnderMinimum).length,
      },
      byType,
      items: balances,
    };
  }

  async getProduction(from?: string, to?: string) {
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        createdAt: this.buildDateFilter(from, to),
        status: { not: ProductionOrderStatus.CANCELADA },
      },
      include: {
        product: true,
        logs: {
          include: {
            workCenter: true,
            operator: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const planned = orders.reduce(
      (acc, op) => acc + Number(op.quantityPlanned),
      0,
    );
    const produced = orders.reduce(
      (acc, op) => acc + Number(op.quantityProduced),
      0,
    );
    const scrapped = orders.reduce(
      (acc, op) => acc + Number(op.quantityScrapped),
      0,
    );

    const workCenters: Record<
      string,
      { name: string; good: number; scrapped: number; logs: number }
    > = {};
    for (const order of orders) {
      for (const log of order.logs) {
        const key = log.workCenterId;
        if (!workCenters[key]) {
          workCenters[key] = {
            name: log.workCenter.name,
            good: 0,
            scrapped: 0,
            logs: 0,
          };
        }
        workCenters[key].good = round4(
          workCenters[key].good + Number(log.quantityGood),
        );
        workCenters[key].scrapped = round4(
          workCenters[key].scrapped + Number(log.quantityScrapped),
        );
        workCenters[key].logs += 1;
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        orders: orders.length,
        planned: round4(planned),
        produced: round4(produced),
        scrapped: round4(scrapped),
        qualityRate:
          produced + scrapped > 0
            ? round4((produced / (produced + scrapped)) * 100)
            : 0,
        adherenceRate: planned > 0 ? round4((produced / planned) * 100) : 0,
      },
      byStatus: orders.reduce(
        (acc, op) => {
          acc[op.status] = (acc[op.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byWorkCenter: Object.values(workCenters),
      orders: orders.map((op) => ({
        id: op.id,
        code: op.code,
        product: op.product.name,
        status: op.status,
        planned: Number(op.quantityPlanned),
        produced: Number(op.quantityProduced),
        scrapped: Number(op.quantityScrapped),
        createdAt: op.createdAt,
      })),
    };
  }

  async getSales(from?: string, to?: string) {
    const orders = await this.prisma.saleOrder.findMany({
      where: {
        createdAt: this.buildDateFilter(from, to),
        status: { not: SaleOrderStatus.CANCELADO },
      },
      include: {
        partner: true,
        items: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const products: Record<
      string,
      { code: string; name: string; quantity: number; revenue: number }
    > = {};

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.itemId;
        if (!products[key]) {
          products[key] = {
            code: item.item.code,
            name: item.item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        products[key].quantity = round4(
          products[key].quantity + Number(item.quantity),
        );
        products[key].revenue = round4(
          products[key].revenue + Number(item.totalPrice),
        );
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        orders: orders.length,
        revenue: round4(
          orders.reduce((acc, order) => acc + Number(order.totalAmount), 0),
        ),
        ticketMedio:
          orders.length > 0
            ? round4(
                orders.reduce(
                  (acc, order) => acc + Number(order.totalAmount),
                  0,
                ) / orders.length,
              )
            : 0,
      },
      byStatus: orders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      topProducts: Object.values(products)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        partner: order.partner.name,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        deliveryDate: order.deliveryDate,
        createdAt: order.createdAt,
      })),
    };
  }

  async getFinancial(from?: string, to?: string) {
    const filter = this.buildDateFilter(from, to);
    const titles = await this.prisma.financialTransaction.findMany({
      where: {
        dueDate: filter,
        status: { not: FinancialStatus.CANCELADO },
      },
      include: { partner: true },
      orderBy: { dueDate: 'asc' },
    });

    const sumBy = (type: string, status?: string) =>
      round4(
        titles
          .filter(
            (title) =>
              title.type === type && (!status || title.status === status),
          )
          .reduce((acc, title) => acc + Number(title.amount), 0),
      );

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        receber: sumBy('RECEBER'),
        receberPago: sumBy('RECEBER', FinancialStatus.PAGO),
        pagar: sumBy('PAGAR'),
        pagarPago: sumBy('PAGAR', FinancialStatus.PAGO),
        saldo:
          sumBy('RECEBER') - sumBy('PAGAR'),
      },
      titles: titles.map((title) => ({
        id: title.id,
        code: title.code,
        description: title.description,
        type: title.type,
        status: title.status,
        dreCategory: title.dreCategory,
        amount: Number(title.amount),
        paidAmount: Number(title.paidAmount),
        dueDate: title.dueDate,
        paymentDate: title.paymentDate,
        partner: title.partner?.name || null,
      })),
    };
  }

  async getConsolidated(from?: string, to?: string) {
    const [dre, inventory, production, sales, financial] = await Promise.all([
      this.getDre(from, to),
      this.getInventory(),
      this.getProduction(from, to),
      this.getSales(from, to),
      this.getFinancial(from, to),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      periodo: { de: from || null, ate: to || null },
      dre,
      inventory,
      production,
      sales,
      financial,
    };
  }
}
