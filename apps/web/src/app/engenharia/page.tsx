'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  LoadingBlock,
} from '../../components/ui';
import { api } from '../../lib/api';
import { brl, num, typeLabel } from '../../lib/format';
import {
  FileSpreadsheet,
  Layers,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';

type ComponentRow = {
  componentId: string;
  quantity: string;
  scrapRate: string;
};

export default function EngenhariaPage() {
  const [boms, setBoms] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'bom' | 'roteiros'>('bom');

  const [code, setCode] = useState('');
  const [productId, setProductId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<ComponentRow[]>([
    { componentId: '', quantity: '1', scrapRate: '0' },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bomData, itemData, wcData, routingData] = await Promise.all([
        api.get('/engenharia/bom'),
        api.get('/cadastros/itens'),
        api.get('/engenharia/centros-trabalho'),
        api.get('/engenharia/roteiros'),
      ]);
      setBoms(bomData);
      setItems(itemData);
      setWorkCenters(wcData);
      setRoutings(routingData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(
    () =>
      items.filter((item) =>
        ['PRODUTO_ACABADO', 'SEMIACABADO'].includes(item.type),
      ),
    [items],
  );

  const components = useMemo(
    () =>
      items.filter((item) =>
        ['MATERIA_PRIMA', 'EMBALAGEM', 'CONSUMO', 'SEMIACABADO'].includes(
          item.type,
        ),
      ),
    [items],
  );

  const resetForm = () => {
    setCode('');
    setProductId('');
    setVersion('1.0');
    setDescription('');
    setRows([{ componentId: '', quantity: '1', scrapRate: '0' }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const validRows = rows.filter(
        (row) => row.componentId && Number(row.quantity) > 0,
      );
      if (!productId || !validRows.length) {
        throw new Error('Selecione o produto e ao menos um componente.');
      }

      await api.post('/engenharia/bom', {
        code,
        productId,
        version,
        description,
        items: validRows.map((row, index) => ({
          componentId: row.componentId,
          quantity: Number(row.quantity),
          scrapRate: Number(row.scrapRate) || 0,
          order: index + 1,
        })),
      });

      setFeedback('Estrutura (BOM) cadastrada com sucesso.');
      setShowForm(false);
      resetForm();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const bomCost = (bom: any) =>
    bom.items.reduce(
      (acc: number, item: any) =>
        acc +
        Number(item.quantity) *
          (1 + Number(item.scrapRate) / 100) *
          Number(item.component?.costPrice || 0),
      0,
    );

  return (
    <>
      <Header title="Engenharia de Produto & BOM (Bill of Materials)" />
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Estruturas de Produtos Ativas
            </h3>
            <p className="text-xs text-slate-500">
              Árvore de insumos, coeficientes técnicos e roteiros de fabricação.
            </p>
          </div>
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Fechar formulário' : 'Nova Estrutura (BOM)'}
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

        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setTab('bom')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === 'bom'
                ? 'border-industrial-600 text-industrial-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Estruturas (BOM)
          </button>
          <button
            onClick={() => setTab('roteiros')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              tab === 'roteiros'
                ? 'border-industrial-600 text-industrial-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" /> Roteiros & Centros de Trabalho
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <h4 className="text-sm font-bold text-slate-800">
              Cadastrar nova estrutura de produto
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Código BOM
                </label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="BOM-ARMARIO-02"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Produto
                </label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Selecione o produto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.code} — {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Versão
                </label>
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Descrição
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Estrutura padrão de fabricação"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Componentes
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => [
                      ...current,
                      { componentId: '', quantity: '1', scrapRate: '0' },
                    ])
                  }
                  className="text-xs font-semibold text-industrial-600 hover:text-industrial-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar componente
                </button>
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-200 rounded-lg p-3"
                >
                  <div className="md:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Componente
                    </label>
                    <select
                      value={row.componentId}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, componentId: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {components.map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.code} — {component.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Qtd. por un.
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
                      Perda (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.scrapRate}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, scrapRate: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
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
                      title="Remover componente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
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
                {saving ? 'Salvando...' : 'Salvar Estrutura'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingBlock />
        ) : tab === 'bom' ? (
          boms.length === 0 ? (
            <EmptyState
              title="Nenhuma estrutura cadastrada"
              description="Cadastre a primeira BOM para habilitar o cálculo MRP."
            />
          ) : (
            <div className="space-y-5">
              {boms.map((bom) => (
                <div
                  key={bom.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-industrial-600 uppercase tracking-wide">
                        {typeLabel(bom.product?.type)}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        {bom.product?.code} — {bom.product?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Versão {bom.version} • BOM {bom.code}
                        {bom.description ? ` • ${bom.description}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">
                        Custo estimado por unidade
                      </span>
                      <p className="text-sm font-bold text-slate-800">
                        {brl(bomCost(bom))}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-5 py-2.5">Código</th>
                          <th className="px-5 py-2.5">Componente</th>
                          <th className="px-5 py-2.5">Tipo</th>
                          <th className="px-5 py-2.5">Consumo unit.</th>
                          <th className="px-5 py-2.5">Perda</th>
                          <th className="px-5 py-2.5">Custo unit.</th>
                          <th className="px-5 py-2.5">Custo c/ perda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bom.items.map((item: any) => {
                          const factor = 1 + Number(item.scrapRate) / 100;
                          const total =
                            Number(item.quantity) *
                            factor *
                            Number(item.component?.costPrice || 0);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3 font-semibold text-slate-800">
                                {item.component?.code}
                              </td>
                              <td className="px-5 py-3">
                                {item.component?.name}
                              </td>
                              <td className="px-5 py-3 text-xs">
                                {typeLabel(item.component?.type)}
                              </td>
                              <td className="px-5 py-3 font-medium">
                                {num(item.quantity, 4)} {item.component?.unit}
                              </td>
                              <td className="px-5 py-3 text-rose-600">
                                {num(item.scrapRate, 2)}%
                              </td>
                              <td className="px-5 py-3">
                                {brl(item.component?.costPrice)}
                              </td>
                              <td className="px-5 py-3 font-semibold text-slate-800">
                                {brl(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-industrial-600" />
                <h4 className="text-base font-bold text-slate-800">
                  Roteiros de Fabricação
                </h4>
              </div>
              {routings.length === 0 ? (
                <EmptyState title="Nenhum roteiro cadastrado" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-2.5">Sequência</th>
                        <th className="px-5 py-2.5">Roteiro</th>
                        <th className="px-5 py-2.5">Produto</th>
                        <th className="px-5 py-2.5">Centro de Trabalho</th>
                        <th className="px-5 py-2.5">Setup</th>
                        <th className="px-5 py-2.5">Execução</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {routings.map((routing) => (
                        <tr key={routing.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono text-xs">
                            {String(routing.sequence).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {routing.code}
                            <span className="block text-xs font-normal text-slate-500">
                              {routing.name}
                            </span>
                          </td>
                          <td className="px-5 py-3">{routing.item?.name}</td>
                          <td className="px-5 py-3">
                            {routing.workCenter?.name}
                          </td>
                          <td className="px-5 py-3">
                            {routing.setupMinutes} min
                          </td>
                          <td className="px-5 py-3">
                            {num(routing.runTimeMinutes, 1)} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-base font-bold text-slate-800 mb-3">
                Centros de Trabalho
              </h4>
              <ul className="space-y-3">
                {workCenters.map((wc) => (
                  <li
                    key={wc.id}
                    className="border border-slate-200 rounded-lg p-3"
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {wc.code} — {wc.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Capacidade: {num(wc.capacityPerHour, 2)} un./h • Custo:{' '}
                      {brl(wc.costPerHour)}/h
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
