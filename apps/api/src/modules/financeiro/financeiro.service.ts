import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinancialType, FinancialStatus, DRECategory } from '../../common/enums';

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

  async createTransaction(data: any) {
    return this.prisma.financialTransaction.create({ data });
  }

  async payTransaction(id: string, paidAmount?: number, paymentDate?: Date) {
    const transaction = await this.prisma.financialTransaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Lançamento financeiro não encontrado.');

    return this.prisma.financialTransaction.update({
      where: { id },
      data: {
        status: FinancialStatus.PAGO,
        paidAmount: paidAmount || transaction.amount,
        paymentDate: paymentDate || new Date(),
      },
    });
  }

  // ================= DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO (DRE) =================
  async getDRE() {
    const transactions = await this.prisma.financialTransaction.findMany({
      where: { status: { not: FinancialStatus.CANCELADO } },
    });

    let receitaBruta = 0;
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

    const lucroBruto = receitaBruta - custosProducaoCPV;
    const resultadoOperacional = lucroBruto - despesasOperacionais;
    const resultadoLiquido = resultadoOperacional + outrasReceitas - outrasDespesas;

    return {
      receitaBruta,
      custosProducaoCPV,
      lucroBruto,
      margemBrutaPercent: receitaBruta > 0 ? ((lucroBruto / receitaBruta) * 100).toFixed(2) : 0,
      despesasOperacionais,
      resultadoOperacional,
      outrasReceitas,
      outrasDespesas,
      resultadoLiquido,
      margemLiquidaPercent: receitaBruta > 0 ? ((resultadoLiquido / receitaBruta) * 100).toFixed(2) : 0,
    };
  }
}
