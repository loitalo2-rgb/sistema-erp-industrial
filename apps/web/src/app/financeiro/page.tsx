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
import { brl, date, pct, todayISO, typeLabel } from '../../lib/format';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Wallet,
  X,
} from 'lucide-react';

const DRE_CATEGORIES = [
  'RECEITA_BRUTA',
  'DEDUCAO_RECEITA',
  'CUSTO_PRODUCAO_CPV',
  'DESPESA_OPERACIONAL',
  'DESPESA_ADMINISTRATIVA',
  'OUTRAS_RECEITAS',
  'OUTRAS_DESPESAS',
];

export default function FinanceiroPage() {
  const [titles, setTitles] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dre, setDre] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'TODOS' | 'RECEBER' | 'PAGAR' | 'PENDENTE' | 'PAGO'>(
    'TODOS',
  );

  const [description, setDescription] = useState('');
  const [type, setType] = useState('PAGAR');
  const [dreCategory, setDreCategory] = useState('DESPESA_OPERACIONAL');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());
  const [partnerId, setPartnerId] = useState('');
  const [documentRef, setDocumentRef] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [titleData, summaryData, dreData, partnerData] = await Promise.all([
        api.get('/financeiro/titulos'),
        api.get('/financeiro/resumo'),
        api.get('/financeiro/dre'),
        api.get('/cadastros/parceiros'),
      ]);
      setTitles(titleData);
      setSummary(summaryData);
      setDre(dreData);
      setPartners(partnerData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTitles = useMemo(() => {
    if (filter === 'TODOS') return titles;
    if (filter === 'RECEBER') return titles.filter((title) => title.type === 'RECEBER');
    if (filter === 'PAGAR') return titles.filter((title) => title.type === 'PAGAR');
    return titles.filter((title) => title.status === filter);
  }, [titles, filter]);

  const resetForm = () => {
    setDescription('');
    setType('PAGAR');
    setDreCategory('DESPESA_OPERACIONAL');
    setAmount('');
    setDueDate(todayISO());
    setPartnerId('');
    setDocumentRef('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/financeiro/titulos', {
        description,
        type,
        dreCategory,
        amount: Number(amount),
        dueDate,
        partnerId: partnerId || undefined,
        documentRef: documentRef || undefined,
      });
      setFeedback('Lançamento financeiro criado com sucesso.');
      setShowForm(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pay = async (title: any) => {
    const confirmed = window.confirm(
      `Confirmar baixa de ${brl(title.amount)} do título ${title.code}?`,
    );
    if (!confirmed) return;
    setError('');
    try {
      await api.patch(`/financeiro/titulos/${title.id}/pagar`, {
        paidAmount: Number(title.amount) - Number(title.paidAmount),
      });
      setFeedback(`Título ${title.code} baixado com sucesso.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cancel = async (title: any) => {
    const confirmed = window.confirm(`Cancelar o título ${title.code}?`);
    if (!confirmed) return;
    setError('');
    try {
      await api.patch(`/financeiro/titulos/${title.id}/cancelar`);
      setFeedback(`Título ${title.code} cancelado.`);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Header title="Financeiro & Demonstrativo de Resultado (DRE)" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Contas a Pagar, Receber e DRE Gerencial
            </h3>
            <p className="text-xs text-slate-500">
              Títulos gerados por vendas e compras, baixa manual e apuração
              contábil.
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
              {showForm ? 'Fechar' : 'Novo Lançamento'}
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
            label="Total a Receber"
            value={brl(summary?.totalReceber)}
            hint={`Vencidos: ${brl(summary?.vencidosReceber)}`}
            icon={<ArrowUpRight className="w-5 h-5" />}
            tone="emerald"
          />
          <KpiCard
            label="Total a Pagar"
            value={brl(summary?.totalPagar)}
            hint={`Vencidos: ${brl(summary?.vencidosPagar)}`}
            icon={<ArrowDownRight className="w-5 h-5" />}
            tone="rose"
          />
          <KpiCard
            label="Resultado Líquido"
            value={brl(dre?.resultadoLiquido)}
            hint={`Margem líquida: ${pct(dre?.margemLiquidaPercent)}`}
            icon={<TrendingIcon />}
            tone={Number(dre?.resultadoLiquido) >= 0 ? 'emerald' : 'rose'}
          />
          <KpiCard
            label="Títulos Pendentes"
            value={summary?.titulosPendentes || 0}
            hint={`${summary?.titulosVencidos || 0} vencido(s)`}
            icon={<AlertTriangle className="w-5 h-5" />}
            tone={summary?.titulosVencidos > 0 ? 'amber' : 'slate'}
          />
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            data-testid="form-financeiro"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <h4 className="text-sm font-bold text-slate-800">
              Novo lançamento financeiro
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descrição
                </label>
                <input
                  id="financeiro-descricao"
                  data-testid="input-financeiro-descricao"
                  name="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-400 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setDreCategory(
                      e.target.value === 'RECEBER'
                        ? 'RECEITA_BRUTA'
                        : 'DESPESA_OPERACIONAL',
                    );
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="PAGAR">A pagar</option>
                  <option value="RECEBER">A receber</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Categoria DRE
                </label>
                <select
                  value={dreCategory}
                  onChange={(e) => setDreCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DRE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {typeLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Valor (R$)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Vencimento
                </label>
                <input
                  required
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Parceiro (opcional)
                </label>
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sem parceiro</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Documento / NF
                </label>
                <input
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                data-testid="btn-salvar-lancamento"
                disabled={saving}
                className="bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
              >
                {saving ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        )}

        <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
          {[
            ['TODOS', 'Todos'],
            ['RECEBER', 'A receber'],
            ['PAGAR', 'A pagar'],
            ['PENDENTE', 'Pendentes'],
            ['PAGO', 'Pagos'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                filter === value
                  ? 'border-industrial-600 text-industrial-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              Títulos Financeiros
            </h3>
            <span className="text-xs text-slate-500">
              {filteredTitles.length} título(s)
            </span>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : filteredTitles.length === 0 ? (
            <EmptyState title="Nenhum título encontrado para o filtro" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Código</th>
                    <th className="px-5 py-3">Descrição</th>
                    <th className="px-5 py-3">Parceiro</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Categoria DRE</th>
                    <th className="px-5 py-3">Valor</th>
                    <th className="px-5 py-3">Vencimento</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTitles.map((title) => {
                    const overdue =
                      title.status === 'PENDENTE' &&
                      new Date(title.dueDate).getTime() < Date.now();
                    return (
                      <tr
                        key={title.id}
                        className={`hover:bg-slate-50 ${
                          overdue ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {title.code}
                        </td>
                        <td className="px-5 py-3">{title.description}</td>
                        <td className="px-5 py-3 text-xs">
                          {title.partner?.name || '—'}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold">
                          {typeLabel(title.type)}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {typeLabel(title.dreCategory)}
                        </td>
                        <td
                          className={`px-5 py-3 font-bold ${
                            title.type === 'RECEBER'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {brl(title.amount)}
                        </td>
                        <td
                          className={`px-5 py-3 text-xs ${
                            overdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {date(title.dueDate)}
                          {overdue ? ' (vencido)' : ''}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={title.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 text-xs">
                            {title.status === 'PENDENTE' && (
                              <button
                                onClick={() => pay(title)}
                                className="font-semibold text-emerald-600 hover:underline"
                              >
                                Baixar
                              </button>
                            )}
                            {title.status !== 'CANCELADO' &&
                              title.status !== 'PAGO' && (
                                <button
                                  onClick={() => cancel(title)}
                                  className="font-semibold text-rose-600 hover:underline"
                                >
                                  Cancelar
                                </button>
                              )}
                            {title.status === 'PAGO' && (
                              <span className="text-slate-600 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {date(title.paymentDate)}
                              </span>
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

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-industrial-600" />
            <h3 className="text-base font-bold text-slate-800">
              DRE Gerencial — Apuração Contábil
            </h3>
          </div>

          {!dre ? (
            <LoadingBlock />
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
              <DreLine label="(=) RECEITA BRUTA DE VENDAS" value={dre.receitaBruta} strong />
              <DreLine
                label="(-) Deduções e Impostos sobre Vendas"
                value={-dre.deducoesReceita}
                negative
                indent
              />
              <DreLine label="(=) RECEITA LÍQUIDA" value={dre.receitaLiquida} strong />
              <DreLine
                label="(-) Custo dos Produtos Vendidos (CPV)"
                value={-dre.custosProducaoCPV}
                negative
                indent
              />
              <DreLine
                label="(=) LUCRO BRUTO INDUSTRIAL"
                value={dre.lucroBruto}
                strong
                hint={`Margem bruta: ${pct(dre.margemBrutaPercent)}`}
              />
              <DreLine
                label="(-) Despesas Operacionais e Administrativas"
                value={-dre.despesasOperacionais}
                negative
                indent
              />
              <DreLine
                label="(=) RESULTADO OPERACIONAL"
                value={dre.resultadoOperacional}
                strong
                hint={`Margem operacional: ${pct(dre.margemOperacionalPercent)}`}
              />
              <DreLine label="(+) Outras Receitas" value={dre.outrasReceitas} indent />
              <DreLine label="(-) Outras Despesas" value={-dre.outrasDespesas} negative indent />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 bg-emerald-50 text-emerald-900 font-extrabold text-base border-t border-emerald-200">
                <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
                <div className="text-right">
                  <span>{brl(dre.resultadoLiquido)}</span>
                  <p className="text-xs font-semibold text-emerald-700">
                    Margem líquida: {pct(dre.margemLiquidaPercent)} •{' '}
                    {dre.lancamentosConsiderados} lançamento(s)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function DreLine({
  label,
  value,
  strong,
  negative,
  indent,
  hint,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
  indent?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-1 p-3.5 border-b border-slate-100 ${
        strong ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-600'
      } ${indent ? 'pl-8' : ''}`}
    >
      <span>{label}</span>
      <div className="md:text-right">
        <span className={negative ? 'text-rose-600' : ''}>{brl(value)}</span>
        {hint && <p className="text-[11px] text-slate-500 font-normal">{hint}</p>}
      </div>
    </div>
  );
}

function TrendingIcon() {
  return <DollarSign className="w-5 h-5" />;
}
