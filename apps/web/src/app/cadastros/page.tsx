'use client';

import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { Users, Package, Plus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState<'itens' | 'parceiros'>('itens');
  const [items, setItems] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Formulário Item
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('MATERIA_PRIMA');
  const [itemUnit, setItemUnit] = useState('KG');
  const [itemCost, setItemCost] = useState('10.00');
  const [itemMinStock, setItemMinStock] = useState('100');

  // Formulário Parceiro
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerDoc, setPartnerDoc] = useState('');
  const [partnerType, setPartnerType] = useState('CLIENTE');

  const fetchData = async () => {
    setLoading(true);
    try {
      const resItems = await fetch('http://localhost:3001/api/cadastros/itens', {
        headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
      });
      if (resItems.ok) {
        setItems(await resItems.json());
      }

      const resPartners = await fetch('http://localhost:3001/api/cadastros/parceiros', {
        headers: { Authorization: `Bearer ${localStorage.getItem('erp_token')}` },
      });
      if (resPartners.ok) {
        setPartners(await resPartners.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/cadastros/itens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
        body: JSON.stringify({
          code: itemCode,
          name: itemName,
          type: itemType,
          unit: itemUnit,
          costPrice: parseFloat(itemCost),
          minStock: parseFloat(itemMinStock),
        }),
      });

      if (res.ok) {
        setFeedback('Item cadastrado com sucesso no banco de dados!');
        setItemCode('');
        setItemName('');
        fetchData();
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/cadastros/parceiros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
        },
        body: JSON.stringify({
          code: partnerCode,
          name: partnerName,
          docNumber: partnerDoc,
          type: partnerType,
        }),
      });

      if (res.ok) {
        setFeedback('Parceiro comercial cadastrado com sucesso!');
        setPartnerCode('');
        setPartnerName('');
        setPartnerDoc('');
        fetchData();
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header title="Cadastros Base — Itens & Parceiros Comerciais" />
      <main className="p-8 space-y-6">

        {feedback && (
          <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-sm">{feedback}</span>
          </div>
        )}

        {/* ABAS */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('itens')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'itens'
                ? 'border-industrial-600 text-industrial-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> Itens (Matéria-Prima / Produtos)
          </button>

          <button
            onClick={() => setActiveTab('parceiros')}
            className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'parceiros'
                ? 'border-industrial-600 text-industrial-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Parceiros (Clientes & Fornecedores)
          </button>
        </div>

        {activeTab === 'itens' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FORMULÁRIO DE CADASTRO */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-industrial-600" /> Novo Item / Insumo
              </h4>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código do Item</label>
                  <input
                    type="text"
                    placeholder="Ex: MP-ACO-02"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Barra de Ferro 1/2"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="MATERIA_PRIMA">Matéria-Prima</option>
                      <option value="PRODUTO_ACABADO">Produto Acabado</option>
                      <option value="SEMIACABADO">Semiacabado</option>
                      <option value="EMBALAGEM">Embalagem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade</label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                    >
                      <option value="KG">KG</option>
                      <option value="UN">UN</option>
                      <option value="M">Metros</option>
                      <option value="L">Litros</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Estoque Mín.</label>
                    <input
                      type="number"
                      value={itemMinStock}
                      onChange={(e) => setItemMinStock(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-industrial-600 hover:bg-industrial-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors mt-2"
                >
                  Salvar Item no Banco
                </button>
              </form>
            </div>

            {/* LISTAGEM DE ITENS */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Itens Cadastrados no PostgreSQL / SQLite</h4>
                <button onClick={fetchData} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Código</th>
                      <th className="px-4 py-2.5">Nome</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Un.</th>
                      <th className="px-4 py-2.5">Custo</th>
                      <th className="px-4 py-2.5">Est. Mín.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{it.code}</td>
                        <td className="px-4 py-2.5">{it.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {it.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{it.unit}</td>
                        <td className="px-4 py-2.5 font-medium">R$ {it.costPrice?.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-slate-500">{it.minStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FORMULÁRIO DE PARCEIROS */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-industrial-600" /> Novo Parceiro Comercial
              </h4>
              <form onSubmit={handleCreatePartner} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Código</label>
                  <input
                    type="text"
                    placeholder="Ex: CLI-002"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Razão Social / Nome</label>
                  <input
                    type="text"
                    placeholder="Ex: ABC Indústria de Motores"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={partnerDoc}
                    onChange={(e) => setPartnerDoc(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Parceiro</label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="AMBOS">Ambos (Cliente e Fornecedor)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-industrial-600 hover:bg-industrial-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors mt-2"
                >
                  Salvar Parceiro no Banco
                </button>
              </form>
            </div>

            {/* LISTAGEM DE PARCEIROS */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Clientes & Fornecedores Cadastrados</h4>
                <button onClick={fetchData} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Código</th>
                      <th className="px-4 py-2.5">Razão Social</th>
                      <th className="px-4 py-2.5">CNPJ / CPF</th>
                      <th className="px-4 py-2.5">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{p.code}</td>
                        <td className="px-4 py-2.5">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.docNumber}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            p.type === 'CLIENTE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
