'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  LoadingBlock,
  KpiCard,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import {
  brl,
  date,
  dateTime,
  num,
  statusLabel,
  typeLabel,
} from '../../lib/format';
import {
  AlertTriangle,
  Boxes,
  Factory,
  Layers,
  PackagePlus,
  Plus,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';

export default function EstoquePage() {
  const [tab, setTab] = useState<'saldos' | 'lotes' | 'movimentos'>('saldos');
  const [items, setItems] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showMovement, setShowMovement] = useState(false);
  const [showLot, setShowLot] = useState(false);
  const [saving, setSaving] = useState(false);

  const [movItemId, setMovItemId] = useState('');
  const [movType, setMovType] = useState('ENTRADA_COMPRA');
  const [movQuantity, setMovQuantity] = useState('1');
  const [movUnitCost, setMovUnitCost] = useState('0');
  const [movLotId, setMovLotId] = useState('');
  const [movDoc, setMovDoc] = useState('');

  const [lotNumber, setLotNumber] = useState('');
  const [lotItemId, setLotItemId] = useState('');
  const [lotQuantity, setLotQuantity] = useState('0');
  const [lotExpiration, setLotExpiration] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemData, balanceData, lotData, movementData] = await Promise.all([
        api.get('/cadastros/itens'),
        api.get('/estoque/saldos'),
        api.get('/estoque/lotes'),
        api.get('/estoque/movimentacoes'),
      ]);
      setItems(itemData);
      setBalances(balanceData);
      setLots(lotData);
      setMovements(movementData);
      setMovItemId((current) => current || itemData[0]?.id || '');
      setLotItemId((current) => current || itemData[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    return {
      items: balances.length,
      stockValue: balances.reduce(
        (acc: number, item: any) => acc + Number(item.stockValue),
        0,
      ),
      lowStock: balances.filter((item: any) => item.isUnderMinimum).length,
      lots: lots.filter((lot: any) => Number(lot.quantity) > 0).length,
    };
  }, [balances, lots]);

  const lotsForSelectedItem = useMemo(
    () => lots.filter((lot) => lot.itemId === movItemId),
    [lots, movItemId],
  );

  const resetMovement = () => {
    setMovType('ENTRADA_COMPRA');
    setMovQuantity('1');
    setMovUnitCost('0');
    setMovLotId('');
    setMovDoc('');
  };

  const submitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/estoque/movimentacoes', {
        itemId: movItemId,
        type: movType,
        quantity: Number(movQuantity),
        unitCost: Number(movUnitCost) || 0,
        stockLotId: movLotId || undefined,
        documentRef: movDoc || undefined,
      });
      setFeedback('Movimentação de estoque registrada no Kardex.');
      setShowMovement(false);
      resetMovement();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/estoque/lotes', {
        lotNumber,
        itemId: lotItemId,
        quantity: Number(lotQuantity) || 0,
        expirationAt: lotExpiration || undefined,
      });
      setFeedback('Lote criado e saldo inicial lançado.');
      setShowLot(false);
      setLotNumber('');
      setLotQuantity('0');
      setLotExpiration('');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Suprimentos, Estoque & Rastreabilidade (FIFO)" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Saldos por Lote & Kardex
            </h3>
            <p className="text-xs text-slate-500">
              Controle por lote, validade, método FIFO/PEPS e custo médio.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowLot((v) => !v);
                setShowMovement(false);
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300"
            >
              <Layers className="w-4 h-4" /> Novo Lote
            </button>
            <button
              onClick={() => {
                setShowMovement((v) => !v);
                setShowLot(false);
              }}
              className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              <PackagePlus className="w-4 h-4" /> Nova Movimentação
            </button>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            label="Itens Ativos"
            value={summary.items}
            icon={<Boxes className="w-5 h-5" />}
            tone="blue"
          />
          <KpiCard
            label="Valor em Estoque"
            value={brl(summary.stockValue)}
            icon={<Factory className="w-5 h-5" />}
            tone="emerald"
          />
          <KpiCard
            label="Abaixo do Mínimo"
            value={summary.lowStock}
            icon={<AlertTriangle className="w-5 h-5" />}
            tone={summary.lowStock > 0 ? 'rose' : 'emerald'}
          />
          <KpiCard
            label="Lotes com Saldo"
            value={summary.lots}
            icon={<Layers className="w-5 h-5" />}
            tone="indigo"
          />
        </div>

        {summary.lowStock > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Alerta de ponto de reposição
                </p>
                <p className="text-xs text-amber-700">
                  {summary.lowStock} item(ns) atingiu(ram) o limite crítico.
                  Gere uma cotação no módulo Compras.
                </p>
              </div>
            </div>
            <a
              href="/compras"
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold"
            >
              Ir para Compras
            </a>
          </div>
        )}

        {showMovement && (
          <form
            onSubmit={submitMovement}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                Nova movimentação manual
              </h4>
              <button
                type="button"
                onClick={() => setShowMovement(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Item
                </label>
                <select
                  value={movItemId}
                  onChange={(e) => {
                    setMovItemId(e.target.value);
                    setMovLotId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tipo
                </label>
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="ENTRADA_COMPRA">Entrada por compra</option>
                  <option value="ENTRADA_PRODUCAO">Entrada por produção</option>
                  <option value="SAIDA_PRODUCAO">Saída para produção</option>
                  <option value="SAIDA_VENDA">Saída por venda</option>
                  <option value="AJUSTE_INVENTARIO">Ajuste de inventário</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={movQuantity}
                  onChange={(e) => setMovQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lote (opcional)
                </label>
                <select
                  value={movLotId}
                  onChange={(e) => setMovLotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sem lote</option>
                  {lotsForSelectedItem.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotNumber} (saldo {num(lot.quantity, 2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custo unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={movUnitCost}
                  onChange={(e) => setMovUnitCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Documento / NF
                </label>
                <input
                  value={movDoc}
                  onChange={(e) => setMovDoc(e.target.value)}
                  placeholder="NF-e, OP, ajuste..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {saving ? 'Lançando...' : 'Lançar Movimentação'}
              </button>
            </div>
          </form>
        )}

        {showLot && (
          <form
            onSubmit={submitLot}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                Cadastrar novo lote
              </h4>
              <button
                type="button"
                onClick={() => setShowLot(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Número do lote
                </label>
                <input
                  required
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="LT-2026-0001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Item
                </label>
                <select
                  value={lotItemId}
                  onChange={(e) => setLotItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Quantidade inicial
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={lotQuantity}
                  onChange={(e) => setLotQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Validade
                </label>
                <input
                  type="date"
                  value={lotExpiration}
                  onChange={(e) => setLotExpiration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar Lote'}
              </button>
            </div>
          </form>
        )}

        <div className="flex border-b border-slate-200 gap-4">
          {[
            ['saldos', 'Saldos por Item'],
            ['lotes', 'Lotes FIFO'],
            ['movimentos', 'Kardex / Movimentações'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as any)}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
                tab === value
                  ? 'border-industrial-600 text-industrial-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {tab === 'saldos' && (
              <>
                {balances.length === 0 ? (
                  <EmptyState title="Nenhum item cadastrado" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Código</th>
                          <th className="px-5 py-3">Item</th>
                          <th className="px-5 py-3">Tipo</th>
                          <th className="px-5 py-3">Saldo</th>
                          <th className="px-5 py-3">Mínimo</th>
                          <th className="px-5 py-3">Custo unit.</th>
                          <th className="px-5 py-3">Valor total</th>
                          <th className="px-5 py-3">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {balances.map((item: any) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 ${
                              item.isUnderMinimum ? 'bg-rose-50/40' : ''
                            }`}
                          >
                            <td className="px-5 py-3 font-bold text-slate-900">
                              {item.code}
                            </td>
                            <td className="px-5 py-3">{item.name}</td>
                            <td className="px-5 py-3 text-xs">
                              {typeLabel(item.type)}
                            </td>
                            <td
                              className={`px-5 py-3 font-bold ${
                                item.currentStock < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              {num(item.currentStock, 2)} {item.unit}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {num(item.minStock, 2)} {item.unit}
                            </td>
                            <td className="px-5 py-3">{brl(item.costPrice)}</td>
                            <td className="px-5 py-3 font-semibold">
                              {brl(item.stockValue)}
                            </td>
                            <td className="px-5 py-3">
                              {item.isUnderMinimum ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                                  <AlertTriangle className="w-3 h-3" /> Repor
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                                  Normal
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'lotes' && (
              <>
                {lots.length === 0 ? (
                  <EmptyState title="Nenhum lote cadastrado" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Lote</th>
                          <th className="px-5 py-3">Item</th>
                          <th className="px-5 py-3">Saldo do lote</th>
                          <th className="px-5 py-3">Validade</th>
                          <th className="px-5 py-3">Entrada</th>
                          <th className="px-5 py-3">Prioridade FIFO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lots.map((lot: any, index) => (
                          <tr key={lot.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-bold text-slate-900">
                              {lot.lotNumber}
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-medium">{lot.item?.name}</p>
                              <p className="text-xs text-slate-500">
                                {lot.item?.code}
                              </p>
                            </td>
                            <td className="px-5 py-3 font-semibold">
                              {num(lot.quantity, 2)} {lot.item?.unit}
                            </td>
                            <td className="px-5 py-3 text-xs">
                              {date(lot.expirationAt)}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-500">
                              {date(lot.createdAt)}
                            </td>
                            <td className="px-5 py-3">
                              {Number(lot.quantity) > 0 ? (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                                  {index === 0 ? 'Próximo a sair' : 'Em estoque'}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                  Esgotado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'movimentos' && (
              <>
                {movements.length === 0 ? (
                  <EmptyState title="Nenhuma movimentação registrada" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Data</th>
                          <th className="px-5 py-3">Item</th>
                          <th className="px-5 py-3">Tipo</th>
                          <th className="px-5 py-3">Quantidade</th>
                          <th className="px-5 py-3">Lote</th>
                          <th className="px-5 py-3">Documento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {movements.map((movement: any) => {
                          const outbound = [
                            'SAIDA_PRODUCAO',
                            'SAIDA_VENDA',
                          ].includes(movement.type);
                          return (
                            <tr key={movement.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 text-xs text-slate-500">
                                {dateTime(movement.createdAt)}
                              </td>
                              <td className="px-5 py-3">
                                <p className="font-medium">
                                  {movement.item?.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {movement.item?.code}
                                </p>
                              </td>
                              <td className="px-5 py-3">
                                <StatusBadge status={movement.type} />
                              </td>
                              <td
                                className={`px-5 py-3 font-bold ${
                                  outbound ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {outbound ? '-' : '+'}
                                {num(movement.quantity, 2)}{' '}
                                {movement.item?.unit}
                              </td>
                              <td className="px-5 py-3 text-xs">
                                {movement.stockLot?.lotNumber || '—'}
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-500">
                                {movement.documentRef || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
