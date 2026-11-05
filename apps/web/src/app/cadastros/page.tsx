'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import { EmptyState, Feedback, LoadingBlock } from '../../components/ui';
import { api } from '../../lib/api';
import { brl, typeLabel } from '../../lib/format';
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Package,
  X,
} from 'lucide-react';

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState<'itens' | 'parceiros'>('itens');
  const [items, setItems] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(true);

  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('MATERIA_PRIMA');
  const [itemUnit, setItemUnit] = useState('UN');
  const [itemCost, setItemCost] = useState('10.00');
  const [itemSalePrice, setItemSalePrice] = useState('0');
  const [itemMinStock, setItemMinStock] = useState('0');
  const [itemLeadTime, setItemLeadTime] = useState('1');

  const [partnerCode, setPartnerCode] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerDoc, setPartnerDoc] = useState('');
  const [partnerType, setPartnerType] = useState('CLIENTE');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCity, setPartnerCity] = useState('');
  const [partnerState, setPartnerState] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemData, partnerData] = await Promise.all([
        api.get('/cadastros/itens'),
        api.get('/cadastros/parceiros'),
      ]);
      setItems(itemData);
      setPartners(partnerData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        !term ||
        item.code?.toLowerCase().includes(term) ||
        item.name?.toLowerCase().includes(term),
    );
  }, [items, search]);

  const filteredPartners = useMemo(() => {
    const term = search.toLowerCase();
    return partners.filter(
      (partner) =>
        !term ||
        partner.code?.toLowerCase().includes(term) ||
        partner.name?.toLowerCase().includes(term) ||
        partner.docNumber?.toLowerCase().includes(term),
    );
  }, [partners, search]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/cadastros/itens', {
        code: itemCode,
        name: itemName,
        type: itemType,
        unit: itemUnit,
        costPrice: Number(itemCost),
        salePrice: Number(itemSalePrice),
        minStock: Number(itemMinStock),
        leadTimeDays: Number(itemLeadTime),
      });
      setFeedback('Item cadastrado com sucesso no banco de dados.');
      setItemCode('');
      setItemName('');
      setItemSalePrice('0');
      setItemMinStock('0');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/cadastros/parceiros', {
        code: partnerCode,
        name: partnerName,
        docNumber: partnerDoc,
        type: partnerType,
        email: partnerEmail || undefined,
        phone: partnerPhone || undefined,
        city: partnerCity || undefined,
        state: partnerState || undefined,
      });
      setFeedback('Parceiro comercial cadastrado com sucesso.');
      setPartnerCode('');
      setPartnerName('');
      setPartnerDoc('');
      setPartnerEmail('');
      setPartnerPhone('');
      setPartnerCity('');
      setPartnerState('');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (kind: 'item' | 'partner', row: any) => {
    const confirmed = window.confirm(
      `Desativar ${kind === 'item' ? 'o item' : 'o parceiro'} ${row.code} — ${row.name}?`,
    );
    if (!confirmed) return;
    setError('');
    try {
      await api.patch(
        `/cadastros/${kind === 'item' ? 'itens' : 'parceiros'}/${row.id}/desativar`,
      );
      setFeedback('Registro desativado. O histórico permanece preservado.');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <Header title="Cadastros Base — Itens & Parceiros Comerciais" />
      <main className="p-8 space-y-6">
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => {
                setActiveTab('itens');
                setSearch('');
              }}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'itens'
                  ? 'border-industrial-600 text-industrial-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" /> Itens ({items.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('parceiros');
                setSearch('');
              }}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'parceiros'
                  ? 'border-industrial-600 text-industrial-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> Parceiros ({partners.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar código ou nome..."
                className="bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm w-64"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Ocultar formulário' : 'Novo cadastro'}
            </button>
          </div>
        </div>

        {loading && items.length === 0 && partners.length === 0 ? (
          <LoadingBlock />
        ) : activeTab === 'itens' ? (
          <div className={`grid grid-cols-1 gap-6 ${showForm ? 'lg:grid-cols-3' : ''}`}>
            {showForm && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-industrial-600" /> Novo Item /
                  Insumo
                </h4>
                <form onSubmit={handleCreateItem} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        placeholder="MP-ACO-02"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Unidade
                      </label>
                      <select
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <option value="UN">UN</option>
                        <option value="KG">KG</option>
                        <option value="M">Metros</option>
                        <option value="L">Litros</option>
                        <option value="PC">Peça</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Barra de Ferro 1/2"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tipo
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="MATERIA_PRIMA">Matéria-prima</option>
                      <option value="PRODUTO_ACABADO">Produto acabado</option>
                      <option value="SEMIACABADO">Semiacabado</option>
                      <option value="EMBALAGEM">Embalagem</option>
                      <option value="CONSUMO">Consumo</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Custo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Venda (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemSalePrice}
                        onChange={(e) => setItemSalePrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Estoque mín.
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={itemMinStock}
                        onChange={(e) => setItemMinStock(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Lead time (dias)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={itemLeadTime}
                        onChange={(e) => setItemLeadTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm mt-2"
                  >
                    {saving ? 'Salvando...' : 'Salvar Item no Banco'}
                  </button>
                </form>
              </div>
            )}

            <div
              className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${
                showForm ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Itens Cadastrados
                </h4>
                <span className="text-xs text-slate-500">
                  {filteredItems.length} registro(s)
                </span>
              </div>
              {filteredItems.length === 0 ? (
                <EmptyState
                  title="Nenhum item encontrado"
                  description="Cadastre insumos e produtos para começar."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Código</th>
                        <th className="px-4 py-2.5">Nome</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Un.</th>
                        <th className="px-4 py-2.5">Custo</th>
                        <th className="px-4 py-2.5">Venda</th>
                        <th className="px-4 py-2.5">Est. mín.</th>
                        <th className="px-4 py-2.5">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            {it.code}
                          </td>
                          <td className="px-4 py-2.5">{it.name}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                              {typeLabel(it.type)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">{it.unit}</td>
                          <td className="px-4 py-2.5 font-medium">
                            {brl(it.costPrice)}
                          </td>
                          <td className="px-4 py-2.5">{brl(it.salePrice)}</td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {it.minStock}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => deactivate('item', it)}
                              className="text-rose-500 hover:text-rose-700"
                              title="Desativar item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 ${showForm ? 'lg:grid-cols-3' : ''}`}>
            {showForm && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-industrial-600" /> Novo Parceiro
                  Comercial
                </h4>
                <form onSubmit={handleCreatePartner} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Código
                      </label>
                      <input
                        type="text"
                        placeholder="CLI-002"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tipo
                      </label>
                      <select
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <option value="CLIENTE">Cliente</option>
                        <option value="FORNECEDOR">Fornecedor</option>
                        <option value="AMBOS">Ambos</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Razão Social / Nome
                    </label>
                    <input
                      type="text"
                      placeholder="ABC Indústria de Motores"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      CNPJ / CPF
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={partnerDoc}
                      onChange={(e) => setPartnerDoc(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Telefone
                      </label>
                      <input
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Cidade
                      </label>
                      <input
                        value={partnerCity}
                        onChange={(e) => setPartnerCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        UF
                      </label>
                      <input
                        maxLength={2}
                        value={partnerState}
                        onChange={(e) => setPartnerState(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-industrial-600 hover:bg-industrial-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm mt-2"
                  >
                    {saving ? 'Salvando...' : 'Salvar Parceiro no Banco'}
                  </button>
                </form>
              </div>
            )}

            <div
              className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${
                showForm ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Clientes & Fornecedores
                </h4>
                <span className="text-xs text-slate-500">
                  {filteredPartners.length} registro(s)
                </span>
              </div>
              {filteredPartners.length === 0 ? (
                <EmptyState
                  title="Nenhum parceiro encontrado"
                  description="Cadastre clientes e fornecedores para vendas e compras."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Código</th>
                        <th className="px-4 py-2.5">Razão Social</th>
                        <th className="px-4 py-2.5">CNPJ / CPF</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Cidade</th>
                        <th className="px-4 py-2.5">Contato</th>
                        <th className="px-4 py-2.5">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPartners.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            {p.code}
                          </td>
                          <td className="px-4 py-2.5">{p.name}</td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {p.docNumber}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-medium ${
                                p.type === 'CLIENTE'
                                  ? 'bg-blue-50 text-blue-700'
                                  : p.type === 'FORNECEDOR'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {typeLabel(p.type)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {p.city || '—'}
                            {p.state ? `/${p.state}` : ''}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            <p>{p.email || '—'}</p>
                            <p>{p.phone || ''}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => deactivate('partner', p)}
                              className="text-rose-500 hover:text-rose-700"
                              title="Desativar parceiro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
