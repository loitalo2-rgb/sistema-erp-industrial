'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  LoadingBlock,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import {
  addDaysISO,
  brl,
  date,
  num,
  pct,
  typeLabel,
} from '../../lib/format';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Cpu,
  Factory,
  Play,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';

export default function PCPPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemData, orderData] = await Promise.all([
        api.get('/cadastros/itens?type=PRODUTO_ACABADO'),
        api.get('/producao/ordens'),
      ]);
      setProducts(itemData);
      setOrders(orderData);
      setProductId((current) => current || itemData[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const calculate = async () => {
    if (!productId) {
      setError('Selecione um produto acabado.');
      return;
    }
    setCalculating(true);
    setError('');
    try {
      const data = await api.get(
        `/mrp/calcular?productId=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(quantity)}`,
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const createOrder = async () => {
    if (!result) return;
    setCreating(true);
    setError('');
    try {
      const op = await api.post('/producao/ordens', {
        productId: result.productId,
        quantityPlanned: Number(quantity),
        startDate: new Date().toISOString(),
        endDate: addDaysISO(5),
        status: 'LIBERADA',
      });
      setFeedback(`Ordem de produção ${op.code} emitida e liberada.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setError('');
    try {
      await api.patch(`/producao/ordens/${id}/status`, { status });
      setFeedback(`Status da OP atualizado para ${status}.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalNetCost = result?.components?.reduce(
    (acc: number, item: any) => acc + Number(item.estimatedCost),
    0,
  );

  return (
    <>
      <Header title="PCP — Planejamento MRP I & Ordens de Produção" />
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Planejamento e Controle da Produção
            </h3>
            <p className="text-xs text-slate-500">
              Explosão de BOM contra o saldo real e emissão de ordens.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {feedback && (
          <Feedback
            type="success"
            message={feedback}
            onClose={() => setFeedback('')}
          />
        )}
        {error && (
          <Feedback type="error" message={error} onClose={() => setError('')} />
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Cálculo de Necessidades Líquidas (MRP I)
              </h3>
              <p className="text-xs text-slate-500">
                Necessidade bruta = quantidade × BOM × (1 + perda técnica).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Produto Acabado
              </label>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} — {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Quantidade a Produzir
              </label>
              <input
                type="number"
                min="0.0001"
                step="0.01"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setResult(null);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <button
              onClick={calculate}
              disabled={calculating || !productId}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold h-10"
            >
              <Calculator className="w-4 h-4" />
              {calculating ? 'Calculando...' : 'Executar Explosão MRP'}
            </button>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : result ? (
            <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Resultado do MRP: {result.productCode} — {result.productName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    BOM {result.bomCode} • Quantidade solicitada:{' '}
                    {num(result.quantityRequested, 2)} un.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">
                    Necessidade de compra estimada
                  </span>
                  <p className="text-base font-bold text-slate-800">
                    {brl(totalNetCost)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Componente</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Nec. bruta</th>
                      <th className="px-4 py-2.5">Saldo atual</th>
                      <th className="px-4 py-2.5">Nec. líquida</th>
                      <th className="px-4 py-2.5">Lead time</th>
                      <th className="px-4 py-2.5">Ação sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.components.map((component: any) => (
                      <tr key={component.componentId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {component.componentCode}
                          </p>
                          <p className="text-xs text-slate-500">
                            {component.componentName}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {typeLabel(component.type)}
                        </td>
                        <td className="px-4 py-3">
                          {num(component.grossRequirement, 2)} {component.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {num(component.currentStock, 2)} {component.unit}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${
                            component.netRequirement > 0
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {num(component.netRequirement, 2)} {component.unit}
                        </td>
                        <td className="px-4 py-3">
                          {component.leadTimeDays} dia(s)
                        </td>
                        <td className="px-4 py-3">
                          {component.suggestedAction ===
                          'ESTOQUE_SUFICIENTE' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Estoque
                              disponível
                            </span>
                          ) : component.suggestedAction ===
                            'EMITIR_ORDEM_COMPRA' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                              <ShoppingCart className="w-3 h-3" /> Emitir compra
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                              <Factory className="w-3 h-3" /> Emitir produção
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Custo estimado considera apenas a necessidade líquida.
                </p>
                <button
                  onClick={createOrder}
                  disabled={creating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Play className="w-4 h-4" />
                  {creating ? 'Emitindo...' : 'Emitir Ordem de Produção (OP)'}
                </button>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="mt-6">
                <EmptyState
                  title="Execute o cálculo para ver as necessidades"
                  description="Selecione um produto com BOM ativa e informe a quantidade."
                />
              </div>
            )
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Ordens de Produção
            </h3>
            <span className="text-xs text-slate-500">
              {orders.length} ordem(ns) cadastrada(s)
            </span>
          </div>

          {orders.length === 0 ? (
            <EmptyState title="Nenhuma ordem de produção cadastrada" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">OP</th>
                    <th className="px-5 py-3">Produto</th>
                    <th className="px-5 py-3">Planejado</th>
                    <th className="px-5 py-3">Produzido</th>
                    <th className="px-5 py-3">Refugo</th>
                    <th className="px-5 py-3">Progresso</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const progress =
                      Number(order.quantityPlanned) > 0
                        ? (Number(order.quantityProduced) /
                            Number(order.quantityPlanned)) *
                          100
                        : 0;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {order.code}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-700">
                            {order.product?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.saleOrder
                              ? `Pedido ${order.saleOrder.orderNumber}`
                              : 'Sem pedido vinculado'}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          {num(order.quantityPlanned, 2)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-emerald-600">
                          {num(order.quantityProduced, 2)}
                        </td>
                        <td className="px-5 py-3 text-rose-600">
                          {num(order.quantityScrapped, 2)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-industrial-600"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {pct(progress)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            {order.status === 'PLANEJADA' && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, 'LIBERADA')
                                }
                                className="font-semibold text-blue-600 hover:underline"
                              >
                                Liberar
                              </button>
                            )}
                            {['LIBERADA', 'EM_ANDAMENTO', 'PLANEJADA'].includes(
                              order.status,
                            ) && (
                              <Link
                                href="/chao-de-fabrica"
                                className="font-semibold text-industrial-600 hover:underline"
                              >
                                Apontar
                              </Link>
                            )}
                            {!['CONCLUIDA', 'CANCELADA'].includes(
                              order.status,
                            ) && (
                              <button
                                onClick={() =>
                                  updateStatus(order.id, 'CANCELADA')
                                }
                                className="font-semibold text-rose-600 hover:underline"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
