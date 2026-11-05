'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  KpiCard,
  LoadingBlock,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import {
  brl,
  date,
  downloadCsv,
  num,
  pct,
  typeLabel,
} from '../../lib/format';
import {
  BarChart3,
  Boxes,
  Download,
  Factory,
  FileText,
  Printer,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

const firstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};

const today = () => new Date().toISOString().slice(0, 10);

export default function RelatoriosPage() {
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(
        await api.get(
          `/relatorios/consolidado?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const exportInventory = () => {
    if (!data?.inventory?.items) return;
    downloadCsv(
      `estoque-${from}-a-${to}.csv`,
      data.inventory.items.map((item: any) => ({
        codigo: item.code,
        item: item.name,
        tipo: typeLabel(item.type),
        saldo: item.currentStock,
        unidade: item.unit,
        minimo: item.minStock,
        custo_unitario: item.costPrice,
        valor_total: item.stockValue,
        situacao: item.isUnderMinimum ? 'REPOR' : 'NORMAL',
      })),
    );
  };

  const exportProduction = () => {
    if (!data?.production?.orders) return;
    downloadCsv(
      `producao-${from}-a-${to}.csv`,
      data.production.orders.map((order: any) => ({
        op: order.code,
        produto: order.product,
        status: order.status,
        planejado: order.planned,
        produzido: order.produced,
        refugo: order.scrapped,
        criado_em: date(order.createdAt),
      })),
    );
  };

  return (
    <>
      <Header title="Relatórios Gerenciais & Consolidado" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Relatórios consolidados
            </h3>
            <p className="text-xs text-slate-500">
              DRE, produção, estoque, vendas e financeiro no mesmo período.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 print:hidden">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                De
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Até
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Gerar
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        {error && (
          <Feedback type="error" message={error} onClose={() => setError('')} />
        )}

        {loading && !data ? (
          <LoadingBlock />
        ) : !data ? null : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <KpiCard
                label="Receita Líquida"
                value={brl(data.dre.receitaLiquida)}
                hint={`${data.dre.lancamentosConsiderados} lançamento(s)`}
                icon={<TrendingUp className="w-5 h-5" />}
                tone="emerald"
              />
              <KpiCard
                label="Resultado Líquido"
                value={brl(data.dre.resultadoLiquido)}
                hint={`Margem: ${pct(data.dre.margemLiquidaPercent)}`}
                icon={<BarChart3 className="w-5 h-5" />}
                tone={data.dre.resultadoLiquido >= 0 ? 'emerald' : 'rose'}
              />
              <KpiCard
                label="Produção Boa"
                value={`${num(data.production.totals.produced, 2)} un.`}
                hint={`Qualidade: ${pct(data.production.totals.qualityRate)}`}
                icon={<Factory className="w-5 h-5" />}
                tone="indigo"
              />
              <KpiCard
                label="Valor em Estoque"
                value={brl(data.inventory.totals.stockValue)}
                hint={`${data.inventory.totals.lowStockItems} item(ns) crítico(s)`}
                icon={<Boxes className="w-5 h-5" />}
                tone="blue"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-industrial-600" />
                  <h3 className="text-base font-bold text-slate-800">
                    DRE Gerencial
                  </h3>
                </div>
                <div className="p-5 space-y-1 text-sm">
                  <ReportLine label="Receita bruta" value={data.dre.receitaBruta} />
                  <ReportLine label="Deduções" value={-data.dre.deducoesReceita} negative />
                  <ReportLine label="Receita líquida" value={data.dre.receitaLiquida} strong />
                  <ReportLine label="CPV" value={-data.dre.custosProducaoCPV} negative />
                  <ReportLine label="Lucro bruto" value={data.dre.lucroBruto} strong />
                  <ReportLine
                    label="Despesas operacionais"
                    value={-data.dre.despesasOperacionais}
                    negative
                  />
                  <ReportLine
                    label="Resultado operacional"
                    value={data.dre.resultadoOperacional}
                    strong
                  />
                  <ReportLine label="Outras receitas" value={data.dre.outrasReceitas} />
                  <ReportLine
                    label="Outras despesas"
                    value={-data.dre.outrasDespesas}
                    negative
                  />
                  <ReportLine
                    label="Resultado líquido"
                    value={data.dre.resultadoLiquido}
                    strong
                    highlight
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-800">
                      Produção por Centro de Trabalho
                    </h3>
                  </div>
                  <button
                    onClick={exportProduction}
                    className="text-xs font-semibold text-industrial-600 hover:underline flex items-center gap-1 print:hidden"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
                {data.production.byWorkCenter.length === 0 ? (
                  <EmptyState title="Sem apontamentos no período" />
                ) : (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-2.5">Centro</th>
                        <th className="px-5 py-2.5">Boas</th>
                        <th className="px-5 py-2.5">Refugo</th>
                        <th className="px-5 py-2.5">Apontamentos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.production.byWorkCenter.map((wc: any) => (
                        <tr key={wc.name}>
                          <td className="px-5 py-3 font-medium">{wc.name}</td>
                          <td className="px-5 py-3 text-emerald-600 font-semibold">
                            {num(wc.good, 2)}
                          </td>
                          <td className="px-5 py-3 text-rose-600">
                            {num(wc.scrapped, 2)}
                          </td>
                          <td className="px-5 py-3">{wc.logs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-800">
                    Posição de Estoque por Tipo
                  </h3>
                </div>
                <button
                  onClick={exportInventory}
                  className="text-xs font-semibold text-industrial-600 hover:underline flex items-center gap-1 print:hidden"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-5">
                {Object.entries(data.inventory.byType).map(([type, values]: any) => (
                  <div
                    key={type}
                    className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {typeLabel(type)}
                    </p>
                    <p className="text-lg font-bold text-slate-800 mt-1">
                      {brl(values.stockValue)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {values.items} item(ns)
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-800">
                    Vendas & Produtos
                  </h3>
                  <p className="text-xs text-slate-500">
                    {data.sales.totals.orders} pedido(s) •{' '}
                    {brl(data.sales.totals.revenue)} • Ticket médio{' '}
                    {brl(data.sales.totals.ticketMedio)}
                  </p>
                </div>
                {data.sales.topProducts.length === 0 ? (
                  <EmptyState title="Nenhuma venda no período" />
                ) : (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-2.5">Produto</th>
                        <th className="px-5 py-2.5">Quantidade</th>
                        <th className="px-5 py-2.5">Receita</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.sales.topProducts.map((product: any) => (
                        <tr key={product.code}>
                          <td className="px-5 py-3">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.code}</p>
                          </td>
                          <td className="px-5 py-3">{num(product.quantity, 2)}</td>
                          <td className="px-5 py-3 font-semibold">
                            {brl(product.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-800">
                    Resumo Financeiro
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contas a receber, a pagar e saldo projetado do período.
                  </p>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                  <SummaryBox label="A receber" value={brl(data.financial.totals.receber)} />
                  <SummaryBox label="Recebido" value={brl(data.financial.totals.receberPago)} />
                  <SummaryBox label="A pagar" value={brl(data.financial.totals.pagar)} />
                  <SummaryBox label="Pago" value={brl(data.financial.totals.pagarPago)} />
                  <div className="col-span-2 border-t border-slate-200 pt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      Saldo projetado
                    </span>
                    <span
                      className={`text-lg font-extrabold ${
                        data.financial.totals.saldo >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {brl(data.financial.totals.saldo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">
                  Produção por Ordem
                </h3>
                <span className="text-xs text-slate-500">
                  {data.production.totals.orders} ordem(ns)
                </span>
              </div>
              {data.production.orders.length === 0 ? (
                <EmptyState title="Nenhuma ordem no período" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-2.5">OP</th>
                        <th className="px-5 py-2.5">Produto</th>
                        <th className="px-5 py-2.5">Planejado</th>
                        <th className="px-5 py-2.5">Produzido</th>
                        <th className="px-5 py-2.5">Refugo</th>
                        <th className="px-5 py-2.5">Status</th>
                        <th className="px-5 py-2.5">Criação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.production.orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-bold text-slate-900">
                            {order.code}
                          </td>
                          <td className="px-5 py-3">{order.product}</td>
                          <td className="px-5 py-3">{num(order.planned, 2)}</td>
                          <td className="px-5 py-3 text-emerald-600 font-semibold">
                            {num(order.produced, 2)}
                          </td>
                          <td className="px-5 py-3 text-rose-600">
                            {num(order.scrapped, 2)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {date(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function ReportLine({
  label,
  value,
  strong,
  negative,
  highlight,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded ${
        highlight
          ? 'bg-emerald-50 text-emerald-900 font-extrabold'
          : strong
            ? 'bg-slate-50 font-bold text-slate-900'
            : 'text-slate-600'
      }`}
    >
      <span>{label}</span>
      <span className={negative ? 'text-rose-600' : ''}>{brl(value)}</span>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}
