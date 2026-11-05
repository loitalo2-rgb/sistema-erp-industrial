'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '../components/Header';
import {
  EmptyState,
  Feedback,
  KpiCard,
  LoadingBlock,
  StatusBadge,
} from '../components/ui';
import { api } from '../lib/api';
import {
  brl,
  date,
  dateTime,
  pct,
  statusLabel,
} from '../lib/format';
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Factory,
  Gauge,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.get('/dashboard/resumo'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header title="Painel Geral de Operações Industriais" />
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Visão executiva em tempo real
            </h3>
            <p className="text-xs text-slate-500">
              Indicadores integrados de produção, estoque, vendas, compras e DRE.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {error && <Feedback type="error" message={error} onClose={() => setError('')} />}
        {loading && !data ? (
          <LoadingBlock />
        ) : !data ? null : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <KpiCard
                label="OPs Ativas"
                value={data.cards.activeProductionOrders}
                hint={`${data.cards.ordersInProgress} em andamento`}
                icon={<Factory className="w-6 h-6" />}
                tone="blue"
              />
              <KpiCard
                label="Estoque Crítico"
                value={data.cards.lowStockItems}
                hint={`Valor em estoque: ${brl(data.cards.stockValue)}`}
                icon={<AlertTriangle className="w-6 h-6" />}
                tone={data.cards.lowStockItems > 0 ? 'rose' : 'emerald'}
              />
              <KpiCard
                label="Contas a Receber"
                value={brl(data.cards.totalReceber)}
                hint={`${data.cards.overdueTitles} título(s) vencido(s)`}
                icon={<DollarSign className="w-6 h-6" />}
                tone="emerald"
              />
              <KpiCard
                label="Resultado Líquido (DRE)"
                value={brl(data.cards.resultadoLiquido)}
                hint={`Margem líquida: ${pct(data.cards.margemLiquidaPercent)}`}
                icon={<TrendingUp className="w-6 h-6" />}
                tone={data.cards.resultadoLiquido >= 0 ? 'emerald' : 'rose'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <KpiCard
                label="Qualidade da Produção"
                value={pct(data.cards.qualityRate)}
                hint="Peças boas / total apontado"
                icon={<PackageCheck className="w-6 h-6" />}
                tone="indigo"
              />
              <KpiCard
                label="Aderência ao Plano"
                value={pct(data.cards.adherenceRate)}
                hint={`${data.production.produced} de ${data.production.planned} un.`}
                icon={<Gauge className="w-6 h-6" />}
                tone="amber"
              />
              <KpiCard
                label="Vendas (30 dias)"
                value={brl(data.cards.salesRevenue30d)}
                hint={`${data.cards.partnersCount} parceiros cadastrados`}
                icon={<ShoppingCart className="w-6 h-6" />}
                tone="blue"
              />
              <KpiCard
                label="Itens Ativos"
                value={data.cards.itemsCount}
                hint={`Total a pagar: ${brl(data.cards.totalPagar)}`}
                icon={<Boxes className="w-6 h-6" />}
                tone="slate"
              />
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4">
                Fluxo Operacional Integrado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  ['1', 'Comercial', 'Pedido aprovado e faturamento com baixa de estoque.', 'text-blue-600 bg-blue-100'],
                  ['2', 'MRP I', 'Explosão de BOM, saldo real e necessidade líquida.', 'text-indigo-600 bg-indigo-100'],
                  ['3', 'Compras', 'Recebimento gera lote, custo médio e contas a pagar.', 'text-amber-600 bg-amber-100'],
                  ['4', 'Produção', 'OP consome insumos FIFO e dá entrada no produto acabado.', 'text-rose-600 bg-rose-100'],
                  ['5', 'DRE', 'Receita, deduções, CPV e despesas atualizados.', 'text-emerald-600 bg-emerald-100'],
                ].map(([step, title, description, tone]) => (
                  <div
                    key={step}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${tone.split(' ')[0]}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${tone.split(' ')[1]}`}>
                        {step}
                      </span>
                      {title}
                    </div>
                    <p className="text-xs text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">
                    Ordens de Produção Ativas
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {data.activeOrders.length} exibida(s)
                  </span>
                </div>
                {data.activeOrders.length === 0 ? (
                  <EmptyState
                    title="Nenhuma OP ativa"
                    description="Crie uma ordem de produção no módulo PCP & MRP I."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">OP</th>
                          <th className="px-5 py-3">Produto</th>
                          <th className="px-5 py-3">Progresso</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.activeOrders.map((op: any) => (
                          <tr key={op.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-bold text-slate-900">
                              {op.code}
                            </td>
                            <td className="px-5 py-3">{op.product}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-industrial-600"
                                    style={{
                                      width: `${Math.min(100, op.progress)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">
                                  {pct(op.progress)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {op.quantityProduced} / {op.quantityPlanned} un.
                                {op.quantityScrapped > 0
                                  ? ` • ${op.quantityScrapped} refugo(s)`
                                  : ''}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <StatusBadge status={op.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Estoque abaixo do mínimo
                  </h3>
                  {data.lowStock.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Nenhum item abaixo do ponto de reposição.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {data.lowStock.map((item: any) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-slate-700">
                              {item.name}
                            </p>
                            <p className="text-slate-500">{item.code}</p>
                          </div>
                          <span className="font-bold text-rose-600">
                            {item.currentStock} / {item.minStock} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Próximos vencimentos
                  </h3>
                  {data.upcomingTitles.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Nenhum título pendente.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {data.upcomingTitles.map((title: any) => (
                        <li
                          key={title.id}
                          className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700 truncate">
                              {title.description}
                            </span>
                            <span
                              className={`font-bold whitespace-nowrap ${
                                title.overdue ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              {brl(title.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500 mt-0.5">
                            <span>
                              {statusLabel(title.type)} • {date(title.dueDate)}
                            </span>
                            {title.overdue && (
                              <span className="text-rose-600 font-semibold">
                                vencido
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800">
                  Últimos Apontamentos de Chão de Fábrica
                </h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Atualizado em {dateTime(data.generatedAt)}
                </span>
              </div>
              {data.recentLogs.length === 0 ? (
                <EmptyState
                  title="Nenhum apontamento registrado"
                  description="Os apontamentos aparecem aqui após a conclusão de um ciclo no terminal de chão de fábrica."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">OP / Produto</th>
                        <th className="px-5 py-3">Operador</th>
                        <th className="px-5 py-3">Centro de Trabalho</th>
                        <th className="px-5 py-3">Boas / Refugo</th>
                        <th className="px-5 py-3">Início</th>
                        <th className="px-5 py-3">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">
                              {log.opCode}
                            </p>
                            <p className="text-xs text-slate-500">{log.product}</p>
                          </td>
                          <td className="px-5 py-3">{log.operator}</td>
                          <td className="px-5 py-3">{log.workCenter}</td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-emerald-600">
                              {log.quantityGood}
                            </span>
                            {' / '}
                            <span className="text-rose-600">
                              {log.quantityScrapped}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {dateTime(log.startTime)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={log.type} />
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
