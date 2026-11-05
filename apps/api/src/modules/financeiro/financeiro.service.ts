import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FinancialType,
  FinancialStatus,
  DRECategory,
} from '../../common/enums';
import { round4 } from '../../common/inventory';
import { buildDateFilter } from '../../common/dates';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(type?: FinancialType, status?: FinancialStatus) {
    return this.prisma.financialTransaction.findMany({
      where: {
        type: type || undefined,
        status: status || undefined,
      },
      include: {
        partner: true,
        saleOrder: true,
        purchaseOrder: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTransactionById(id: string) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
      include: { partner: true, saleOrder: true, purchaseOrder: true },
    });
    if (!transaction) {
      throw new NotFoundException('Lançamento financeiro não encontrado.');
    }
    return transaction;
  }

  async createTransaction(data: any) {
    if (!data.description?.trim()) {
      throw new BadRequestException('Informe a descrição do lançamento.');
    }
    if (!data.type || !Object.values(FinancialType).includes(data.type)) {
      throw new BadRequestException('Informe um tipo válido (PAGAR ou RECEBER).');
    }
    if (!data.amount || Number(data.amount) <= 0) {
      throw new BadRequestException('O valor deve ser maior que zero.');
    }

    const code = data.code?.trim() || `LAN-${Date.now()}`;

    return this.prisma.financialTransaction.create({
      data: {
        code,
        description: data.description,
        type: data.type,
        status: data.status || FinancialStatus.PENDENTE,
        dreCategory: data.dreCategory || DRECategory.DESPESA_OPERACIONAL,
        amount: Number(data.amount),
        paidAmount: Number(data.paidAmount) || 0,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        partnerId: data.partnerId || undefined,
        saleOrderId: data.saleOrderId || undefined,
        purchaseOrderId: data.purchaseOrderId || undefined,
        documentRef: data.documentRef,
      },
      include: { partner: true },
    });
  }

  async payTransaction(
    id: string,
    paidAmount?: number,
    paymentDate?: Date | string,
  ) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Lançamento financeiro não encontrado.');
    }

    const amountToPay = round4(
      paidAmount === undefined || paidAmount === null
        ? Number(transaction.amount)
        : Number(paidAmount),
    );
    if (amountToPay <= 0) {
      throw new BadRequestException('O valor pago deve ser maior que zero.');
    }

    const newPaid = round4(Number(transaction.paidAmount) + amountToPay);
    const isSettled = newPaid >= Number(transaction.amount) - 0.001;

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        status: isSettled ? FinancialStatus.PAGO : FinancialStatus.PENDENTE,
        paidAmount: Math.min(newPaid, Number(transaction.amount)),
        paymentDate: isSettled
          ? paymentDate
            ? new Date(paymentDate)
            : new Date()
          : transaction.paymentDate,
      },
      include: { partner: true },
    });
  }

  async cancelTransaction(id: string) {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Lançamento financeiro não encontrado.');
    }
    return this.prisma.financialTransaction.update({
      where: { id },
      data: { status: FinancialStatus.CANCELADO },
    });
  }

  async getSummary() {
    const now = new Date();
    const transactions = await this.prisma.financialTransaction.findMany({
      where: { status: { not: FinancialStatus.CANCELADO } },
    });

    const pending = transactions.filter(
      (t) => t.status === FinancialStatus.PENDENTE,
    );
    const overdue = transactions.filter(
      (t) =>
        t.status === FinancialStatus.PENDENTE &&
        new Date(t.dueDate).getTime() < now.getTime(),
    );

    const sum = (list: typeof transactions, type: FinancialType) =>
      round4(
        list
          .filter((t) => t.type === type)
          .reduce((acc, t) => acc + Number(t.amount) - Number(t.paidAmount), 0),
      );

    return {
      totalReceber: sum(pending, FinancialType.RECEBER),
      totalPagar: sum(pending, FinancialType.PAGAR),
      vencidosReceber: sum(overdue, FinancialType.RECEBER),
      vencidosPagar: sum(overdue, FinancialType.PAGAR),
      titulosPendentes: pending.length,
      titulosVencidos: overdue.length,
    };
  }

  // ================= DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE) =================
  async getDRE(from?: string | Date, to?: string | Date) {
    const where: any = { status: { not: FinancialStatus.CANCELADO } };

    // DRE por competência: usa a data de lançamento do título (createdAt),
    // enquanto o vencimento (dueDate) fica para o fluxo de caixa.
    const dateFilter = buildDateFilter(from, to);
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where,
    });

    let receitaBruta = 0;
    let deducoesReceita = 0;
    let custosProducaoCPV = 0;
    let despesasOperacionais = 0;
    let outrasReceitas = 0;
    let outrasDespesas = 0;

    for (const t of transactions) {
      const val = Number(t.amount);
      switch (t.dreCategory) {
        case DRECategory.RECEITA_BRUTA:
          receitaBruta += val;
          break;
        case DRECategory.DEDUCAO_RECEITA:
          deducoesReceita += val;
          break;
        case DRECategory.CUSTO_PRODUCAO_CPV:
          custosProducaoCPV += val;
          break;
        case DRECategory.DESPESA_OPERACIONAL:
        case DRECategory.DESPESA_ADMINISTRATIVA:
          despesasOperacionais += val;
          break;
        case DRECategory.OUTRAS_RECEITAS:
          outrasReceitas += val;
          break;
        case DRECategory.OUTRAS_DESPESAS:
          outrasDespesas += val;
          break;
      }
    }

    receitaBruta = round4(receitaBruta);
    deducoesReceita = round4(deducoesReceita);
    const receitaLiquida = round4(receitaBruta - deducoesReceita);
    custosProducaoCPV = round4(custosProducaoCPV);
    const lucroBruto = round4(receitaLiquida - custosProducaoCPV);
    despesasOperacionais = round4(despesasOperacionais);
    const resultadoOperacional = round4(lucroBruto - despesasOperacionais);
    outrasReceitas = round4(outrasReceitas);
    outrasDespesas = round4(outrasDespesas);
    const resultadoLiquido = round4(
      resultadoOperacional + outrasReceitas - outrasDespesas,
    );

    const percent = (base: number, value: number) =>
      base > 0 ? Number(((value / base) * 100).toFixed(2)) : 0;

    return {
      periodo: {
        de: from || null,
        ate: to || null,
      },
      receitaBruta,
      deducoesReceita,
      receitaLiquida,
      custosProducaoCPV,
      lucroBruto,
      margemBrutaPercent: percent(receitaLiquida, lucroBruto),
      despesasOperacionais,
      resultadoOperacional,
      margemOperacionalPercent: percent(receitaLiquida, resultadoOperacional),
      outrasReceitas,
      outrasDespesas,
      resultadoLiquido,
      margemLiquidaPercent: percent(receitaLiquida, resultadoLiquido),
      lancamentosConsiderados: transactions.length,
    };
  }
}
