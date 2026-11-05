import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstoqueService } from '../estoque/estoque.service';
import { FinanceiroService } from '../financeiro/financeiro.service';
import {
  FinancialStatus,
  ProductionOrderStatus,
  SaleOrderStatus,
} from '../../common/enums';
import { round4 } from '../../common/inventory';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly estoqueService: EstoqueService,
    private readonly financeiroService: FinanceiroService,
  ) {}

  async getSummary() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [
      orders,
      recentLogs,
      balances,
      financialSummary,
      dre,
      pendingTitles,
      sales,
      itemsCount,
      partnersCount,
    ] = await Promise.all([
      this.prisma.productionOrder.findMany({
        include: { product: true, logs: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.productionLog.findMany({
        take: 8,
        orderBy: { startTime: 'desc' },
        include: {
          workCenter: true,
          operator: { select: { id: true, name: true } },
          productionOrder: { include: { product: true } },
        },
      }),
      this.estoqueService.getBalances(),
      this.financeiroService.getSummary(),
      this.financeiroService.getDRE(),
      this.prisma.financialTransaction.findMany({
        where: { status: FinancialStatus.PENDENTE },
        orderBy: { dueDate: 'asc' },
        take: 6,
        include: { partner: true },
      }),
      this.prisma.saleOrder.findMany({
        where: {
          createdAt: { gte: since },
          status: { not: SaleOrderStatus.CANCELADO },
        },
        include: { partner: true },
      }),
      this.prisma.item.count({ where: { active: true } }),
      this.prisma.partner.count({ where: { active: true } }),
    ]);

    const activeStatuses = [
      ProductionOrderStatus.PLANEJADA,
      ProductionOrderStatus.LIBERADA,
      ProductionOrderStatus.EM_ANDAMENTO,
    ];
    const activeOrders = orders.filter((op) =>
      activeStatuses.includes(op.status as ProductionOrderStatus),
    );

    const consideredOrders = orders.filter(
      (op) => op.status !== ProductionOrderStatus.CANCELADA,
    );
    const planned = consideredOrders.reduce(
      (acc, op) => acc + Number(op.quantityPlanned),
      0,
    );
    const produced = consideredOrders.reduce(
      (acc, op) => acc + Number(op.quantityProduced),
      0,
    );
    const scrapped = consideredOrders.reduce(
      (acc, op) => acc + Number(op.quantityScrapped),
      0,
    );

    const lowStock = balances.filter((item) => item.isUnderMinimum);
    const stockValue = round4(
      balances.reduce((acc, item) => acc + item.stockValue, 0),
    );
    const salesRevenue = round4(
      sales.reduce((acc, order) => acc + Number(order.totalAmount), 0),
    );

    const qualityRate =
      produced + scrapped > 0
        ? round4((produced / (produced + scrapped)) * 100)
        : 0;
    const adherenceRate =
      planned > 0 ? round4((produced / planned) * 100) : 0;

    return {
      generatedAt: new Date().toISOString(),
      cards: {
        activeProductionOrders: activeOrders.length,
        ordersInProgress: orders.filter(
          (op) => op.status === ProductionOrderStatus.EM_ANDAMENTO,
        ).length,
        lowStockItems: lowStock.length,
        stockValue,
        totalReceber: financialSummary.totalReceber,
        totalPagar: financialSummary.totalPagar,
        overdueTitles: financialSummary.titulosVencidos,
        resultadoLiquido: dre.resultadoLiquido,
        margemLiquidaPercent: dre.margemLiquidaPercent,
        salesRevenue30d: salesRevenue,
        itemsCount,
        partnersCount,
        qualityRate,
        adherenceRate,
      },
      production: {
        planned: round4(planned),
        produced: round4(produced),
        scrapped: round4(scrapped),
        qualityRate,
        adherenceRate,
        byStatus: {
          planejada: orders.filter(
            (op) => op.status === ProductionOrderStatus.PLANEJADA,
          ).length,
          liberada: orders.filter(
            (op) => op.status === ProductionOrderStatus.LIBERADA,
          ).length,
          emAndamento: orders.filter(
            (op) => op.status === ProductionOrderStatus.EM_ANDAMENTO,
          ).length,
          concluida: orders.filter(
            (op) => op.status === ProductionOrderStatus.CONCLUIDA,
          ).length,
          cancelada: orders.filter(
            (op) => op.status === ProductionOrderStatus.CANCELADA,
          ).length,
        },
      },
      dre,
      financial: financialSummary,
      activeOrders: activeOrders.slice(0, 6).map((op) => ({
        id: op.id,
        code: op.code,
        product: op.product.name,
        status: op.status,
        quantityPlanned: Number(op.quantityPlanned),
        quantityProduced: Number(op.quantityProduced),
        quantityScrapped: Number(op.quantityScrapped),
        progress:
          Number(op.quantityPlanned) > 0
            ? round4(
                (Number(op.quantityProduced) / Number(op.quantityPlanned)) * 100,
              )
            : 0,
      })),
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        opCode: log.productionOrder.code,
        product: log.productionOrder.product.name,
        workCenter: log.workCenter.name,
        operator: log.operator.name,
        type: log.type,
        startTime: log.startTime,
        endTime: log.endTime,
        quantityGood: Number(log.quantityGood),
        quantityScrapped: Number(log.quantityScrapped),
        stopReason: log.stopReason,
      })),
      lowStock: lowStock.slice(0, 8),
      upcomingTitles: pendingTitles.map((title) => ({
        id: title.id,
        code: title.code,
        description: title.description,
        type: title.type,
        amount: Number(title.amount),
        dueDate: title.dueDate,
        partner: title.partner?.name || null,
        overdue: new Date(title.dueDate).getTime() < Date.now(),
      })),
    };
  }
}
