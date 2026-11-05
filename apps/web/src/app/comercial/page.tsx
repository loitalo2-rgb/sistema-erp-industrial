'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  KpiCard,
  LoadingBlock,
  StatusBadge,
} from '../../components/ui';
import { api } from '../../lib/api';
import { addDaysISO, brl, date, num } from '../../lib/format';
import {
  CheckCircle2,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';

type OrderItemRow = {
  itemId: string;
  quantity: string;
  unitPrice: string;
};

export default function ComercialPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [partnerId, setPartnerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(addDaysISO(7));
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<OrderItemRow[]>([
    { itemId: '', quantity: '1', unitPrice: '0' },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderData, partnerData, itemData] = await Promise.all([
        api.get('/vendas/pedidos'),
        api.get('/cadastros/parceiros'),
        api.get('/cadastros/itens?type=PRODUTO_ACABADO'),
      ]);
      setOrders(orderData);
      setPartners(
        partnerData.filter((partner: any) =>
          ['CLIENTE', 'AMBOS'].includes(partner.type),
        ),
      );
      setItems(itemData);
      setPartnerId((current) => current || partnerData[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      revenue: orders
        .filter((order) => order.status !== 'CANCELADO')
        .reduce((acc, order) => acc + Number(order.totalAmount), 0),
      approved: orders.filter((order) => order.status === 'APROVADO').length,
      invoiced: orders.filter((order) => order.status === 'FATURADO').length,
    }),
    [orders],
  );

  const formTotal = rows.reduce(
    (acc, row) => acc + Number(row.quantity || 0) * Number(row.unitPrice || 0),
    0,
  );

  const selectItem = (index: number, itemId: string) => {
    const item = items.find((current) => current.id === itemId);
    setRows((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              itemId,
              unitPrice: String(item?.salePrice || item?.costPrice || 0),
            }
          : row,
      ),
    );
  };

  const resetForm = () => {
    setOrderNumber('');
    setDeliveryDate(addDaysISO(7));
    setNotes('');
    setRows([{ itemId: '', quantity: '1', unitPrice: '0' }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const validRows = rows.filter(
        (row) => row.itemId && Number(row.quantity) > 0,
      );
      if (!partnerId) throw new Error('Selecione o cliente.');
      if (!validRows.length) throw new Error('Adicione ao menos um item.');

      const order = await api.post('/vendas/pedidos', {
        orderNumber: orderNumber || undefined,
        partnerId,
        deliveryDate,
        notes,
        status: 'APROVADO',
        items: validRows.map((row) => ({
          itemId: row.itemId,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
        })),
      });

      setFeedback(
        `Pedido ${order.orderNumber} aprovado. O faturamento gera baixa de estoque e título a receber.`,
      );
      setShowForm(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (order: any, status: string) => {
    if (status === 'FATURADO') {
      const confirmed = window.confirm(
        `Faturar o pedido ${order.orderNumber}? Isso dará baixa no estoque e criará o título a receber.`,
      );
      if (!confirmed) return;
    }
    if (status === 'CANCELADO') {
      const confirmed = window.confirm(
        `Cancelar o pedido ${order.orderNumber}?`,
      );
      if (!confirmed) return;
    }

    setError('');
    try {
      await api.patch(`/vendas/pedidos/${order.id}/status`, { status });
      setFeedback(`Pedido ${order.orderNumber}: status atualizado para ${status}.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Header title="Comercial & Engenharia de Vendas" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Pedidos de Venda & Orçamentos
            </h3>
            <p className="text-xs text-slate-500">
              Formação de preço, aprovação, faturamento e integração com estoque
              e financeiro.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Fechar' : 'Novo Pedido de Venda'}
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
            label="Pedidos"
            value={summary.total}
            icon={<ShoppingCart className="w-5 h-5" />}
            tone="blue"
          />
          <KpiCard
            label="Valor em Carteira"
            value={brl(summary.revenue)}
            icon={<DollarSign className="w-5 h-5" />}
            tone="emerald"
          />
          <KpiCard
            label="Aprovados"
            value={summary.approved}
            icon={<CheckCircle2 className="w-5 h-5" />}
            tone="amber"
          />
          <KpiCard
            label="Faturados"
            value={summary.invoiced}
            icon={<FileText className="w-5 h-5" />}
            tone="indigo"
          />
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-800">
              Novo pedido de venda
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Número do pedido
                </label>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Automático se vazio"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Cliente
                </label>
                <select
                  required
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione o cliente...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.code} — {partner.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Entrega prevista
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Itens do pedido
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => [
                      ...current,
                      { itemId: '', quantity: '1', unitPrice: '0' },
                    ])
                  }
                  className="text-xs font-semibold text-industrial-600 hover:text-industrial-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar item
                </button>
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-200 rounded-lg p-3"
                >
                  <div className="md:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Produto
                    </label>
                    <select
                      value={row.itemId}
                      onChange={(e) => selectItem(index, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} — {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={row.quantity}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, quantity: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Preço unit.
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.unitPrice}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, unitPrice: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {brl(
                        Number(row.quantity || 0) * Number(row.unitPrice || 0),
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRows((current) =>
                          current.length === 1
                            ? current
                            : current.filter((_, i) => i !== index),
                        )
                      }
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Observações
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              <p className="text-sm font-bold text-slate-800">
                Total do pedido: {brl(formTotal)}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
                >
                  {saving ? 'Salvando...' : 'Aprovar Pedido'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Carteira de Pedidos
            </h3>
            <span className="text-xs text-slate-500">
              {orders.length} pedido(s)
            </span>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : orders.length === 0 ? (
            <EmptyState
              title="Nenhum pedido de venda"
              description="Cadastre clientes e produtos para criar o primeiro pedido."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Pedido</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Itens</th>
                    <th className="px-5 py-3">Valor total</th>
                    <th className="px-5 py-3">Entrega</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3">{order.partner?.name}</td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-slate-600">
                          {order.items
                            ?.map(
                              (item: any) =>
                                `${num(item.quantity, 2)}x ${item.item?.code}`,
                            )
                            .join(', ')}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {brl(order.totalAmount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {date(order.deliveryDate)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          {['ORCAMENTO', 'APROVADO'].includes(order.status) && (
                            <button
                              onClick={() => updateStatus(order, 'FATURADO')}
                              className="font-semibold text-emerald-600 hover:underline"
                            >
                              Faturar
                            </button>
                          )}
                          {!['FATURADO', 'CANCELADO'].includes(order.status) && (
                            <button
                              onClick={() => updateStatus(order, 'CANCELADO')}
                              className="font-semibold text-rose-600 hover:underline"
                            >
                              Cancelar
                            </button>
                          )}
                          {order.status === 'FATURADO' && (
                            <span className="text-slate-400">Concluído</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
