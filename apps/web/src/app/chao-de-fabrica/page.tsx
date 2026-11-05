'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  LoadingBlock,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime, num, pct } from '../../lib/format';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  HardHat,
  PackageCheck,
  Play,
  RefreshCw,
  Square,
  Timer,
  X,
} from 'lucide-react';

export default function ChaoDeFabricaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [opId, setOpId] = useState('');
  const [workCenterId, setWorkCenterId] = useState('');
  const [operator, setOperator] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [goodPieces, setGoodPieces] = useState(0);
  const [scrappedPieces, setScrappedPieces] = useState(0);
  const [showStop, setShowStop] = useState(false);
  const [stopReason, setStopReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderData, wcData] = await Promise.all([
        api.get('/producao/ordens'),
        api.get('/engenharia/centros-trabalho'),
      ]);
      setOrders(orderData);
      setWorkCenters(wcData);
      setOpId(
        (current) =>
          current ||
          orderData.find(
            (order: any) =>
              !['CONCLUIDA', 'CANCELADA'].includes(order.status),
          )?.id ||
          '',
      );
      setWorkCenterId((current) => current || wcData[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    try {
      const raw = localStorage.getItem('erp_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.id) setOperator({ id: user.id, name: user.name || user.email });
      }
    } catch {
      setOperator(null);
    }
  }, [load]);

  useEffect(() => {
    if (!isRunning || !startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => !['CONCLUIDA', 'CANCELADA'].includes(order.status),
      ),
    [orders],
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === opId) || null,
    [orders, opId],
  );

  const selectedWorkCenter = useMemo(
    () => workCenters.find((wc) => wc.id === workCenterId) || null,
    [workCenters, workCenterId],
  );

  const progress =
    selectedOrder && Number(selectedOrder.quantityPlanned) > 0
      ? (Number(selectedOrder.quantityProduced) /
          Number(selectedOrder.quantityPlanned)) *
        100
      : 0;

  const formatElapsed = (total: number) => {
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  };

  const start = () => {
    if (!selectedOrder) {
      setError('Selecione uma OP para iniciar o apontamento.');
      return;
    }
    if (!operator) {
      setError('Operador não identificado. Faça login novamente.');
      return;
    }
    setError('');
    setStartedAt(new Date());
    setElapsed(0);
    setIsRunning(true);
  };

  const finishCycle = async () => {
    if (!selectedOrder || !selectedWorkCenter || !operator || !startedAt) return;
    if (goodPieces + scrappedPieces <= 0) {
      setError('Informe ao menos uma peça boa ou refugada.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.post('/producao/apontamentos', {
        productionOrderId: selectedOrder.id,
        workCenterId: selectedWorkCenter.id,
        operatorId: operator.id,
        type: 'PRODUCAO',
        startTime: startedAt.toISOString(),
        endTime: new Date().toISOString(),
        quantityGood: goodPieces,
        quantityScrapped: scrappedPieces,
        scrapReason: scrappedPieces > 0 ? 'Refugo apontado no terminal' : undefined,
      });
      setFeedback(
        `Apontamento gravado: ${goodPieces} peça(s) boa(s), ${scrappedPieces} refugo(s). Estoque e OP atualizados.`,
      );
      setIsRunning(false);
      setStartedAt(null);
      setElapsed(0);
      setGoodPieces(0);
      setScrappedPieces(0);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const registerStop = async () => {
    if (!selectedOrder || !selectedWorkCenter || !operator) return;
    if (!stopReason.trim()) {
      setError('Informe o motivo da parada.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/producao/apontamentos', {
        productionOrderId: selectedOrder.id,
        workCenterId: selectedWorkCenter.id,
        operatorId: operator.id,
        type: 'PARADA',
        startTime: (startedAt || new Date()).toISOString(),
        endTime: new Date().toISOString(),
        quantityGood: 0,
        quantityScrapped: 0,
        stopReason,
      });
      setFeedback('Parada registrada no histórico da OP.');
      setShowStop(false);
      setStopReason('');
      setIsRunning(false);
      setStartedAt(null);
      setElapsed(0);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Terminal Touch de Chão de Fábrica (Operador)" />
      <main className="p-8 space-y-6 max-w-6xl">
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

        {loading ? (
          <LoadingBlock />
        ) : activeOrders.length === 0 ? (
          <EmptyState
            title="Nenhuma OP liberada para apontamento"
            description="Libere uma ordem no módulo PCP & MRP I para iniciar a produção."
          />
        ) : (
          <>
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-industrial-600 rounded-xl">
                  <HardHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Posto de Trabalho
                  </p>
                  <h3 className="text-xl font-bold">
                    {selectedWorkCenter
                      ? `${selectedWorkCenter.code} — ${selectedWorkCenter.name}`
                      : 'Selecione um centro de trabalho'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Operador: {operator?.name || 'não identificado'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                    isRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  {isRunning ? 'Em operação' : 'Posto parado'}
                </span>
                <span className="text-2xl font-mono font-bold text-slate-200">
                  {formatElapsed(elapsed)}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ordem de Produção
                  </label>
                  <select
                    value={opId}
                    onChange={(e) => {
                      setOpId(e.target.value);
                      setIsRunning(false);
                      setStartedAt(null);
                      setElapsed(0);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {activeOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.code} — {order.product?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Centro de Trabalho
                  </label>
                  <select
                    value={workCenterId}
                    onChange={(e) => setWorkCenterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {workCenters.map((wc) => (
                      <option key={wc.id} value={wc.id}>
                        {wc.code} — {wc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={load}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300"
                  >
                    <RefreshCw className="w-4 h-4" /> Atualizar OPs
                  </button>
                </div>
              </div>

              {selectedOrder && (
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-industrial-600 uppercase">
                        Ordem selecionada
                      </span>
                      <h4 className="text-lg font-bold text-slate-900">
                        {selectedOrder.code} — {selectedOrder.product?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Meta do lote: {num(selectedOrder.quantityPlanned, 2)} un.
                        • Produzido: {num(selectedOrder.quantityProduced, 2)} un.
                        • Refugo: {num(selectedOrder.quantityScrapped, 2)} un.
                      </p>
                    </div>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {pct(progress)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isRunning ? (
                  <button
                    onClick={start}
                    className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-md"
                  >
                    <Play className="w-7 h-7" /> Iniciar / Retomar Operação
                  </button>
                ) : (
                  <button
                    onClick={finishCycle}
                    disabled={saving}
                    className="h-20 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-md"
                  >
                    <Square className="w-7 h-7" />
                    {saving ? 'Gravando...' : 'Concluir Ciclo'}
                  </button>
                )}

                <button
                  onClick={() => setShowStop((value) => !value)}
                  className="h-20 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all border border-slate-300"
                >
                  <AlertOctagon className="w-7 h-7 text-amber-500" /> Registrar
                  Motivo de Parada
                </button>
              </div>

              {showStop && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-amber-900">
                      Registrar parada de máquina
                    </p>
                    <button
                      onClick={() => setShowStop(false)}
                      className="text-amber-700 hover:text-amber-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={stopReason}
                    onChange={(e) => setStopReason(e.target.value)}
                    placeholder="Ex.: falta de matéria-prima, manutenção, setup..."
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={registerStop}
                    disabled={saving}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    {saving ? 'Registrando...' : 'Confirmar Parada'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
                  <p className="text-sm font-bold text-emerald-800 uppercase mb-2 flex items-center justify-center gap-2">
                    <PackageCheck className="w-4 h-4" /> Peças Boas Aprovadas
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setGoodPieces(Math.max(0, goodPieces - 1))}
                      className="w-14 h-14 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-2xl font-bold hover:bg-emerald-100 shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-5xl font-extrabold text-emerald-900 w-24">
                      {goodPieces}
                    </span>
                    <button
                      onClick={() => setGoodPieces(goodPieces + 1)}
                      className="w-14 h-14 bg-emerald-600 text-white rounded-xl text-2xl font-bold hover:bg-emerald-700 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center">
                  <p className="text-sm font-bold text-rose-800 uppercase mb-2 flex items-center justify-center gap-2">
                    <AlertOctagon className="w-4 h-4" /> Peças com Refugo
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() =>
                        setScrappedPieces(Math.max(0, scrappedPieces - 1))
                      }
                      className="w-14 h-14 bg-white border border-rose-300 text-rose-800 rounded-xl text-2xl font-bold hover:bg-rose-100 shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-5xl font-extrabold text-rose-900 w-24">
                      {scrappedPieces}
                    </span>
                    <button
                      onClick={() => setScrappedPieces(scrappedPieces + 1)}
                      className="w-14 h-14 bg-rose-600 text-white rounded-xl text-2xl font-bold hover:bg-rose-700 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder?.logs?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-base font-bold text-slate-800">
                    Histórico de apontamentos da OP
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-2.5">Início</th>
                        <th className="px-5 py-2.5">Fim</th>
                        <th className="px-5 py-2.5">Centro de trabalho</th>
                        <th className="px-5 py-2.5">Operador</th>
                        <th className="px-5 py-2.5">Boas / Refugo</th>
                        <th className="px-5 py-2.5">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {dateTime(log.startTime)}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">
                            {dateTime(log.endTime)}
                          </td>
                          <td className="px-5 py-3">{log.workCenter?.name}</td>
                          <td className="px-5 py-3">{log.operator?.name}</td>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-emerald-600">
                              {num(log.quantityGood, 0)}
                            </span>{' '}
                            /{' '}
                            <span className="text-rose-600">
                              {num(log.quantityScrapped, 0)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={log.type} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
