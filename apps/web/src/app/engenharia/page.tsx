import { Header } from '../../components/Header';
import { Layers, Plus, FileSpreadsheet, Settings } from 'lucide-react';

export default function EngenhariaPage() {
  return (
    <>
      <Header title="Engenharia de Produto & BOM (Bill of Materials)" />
      <main className="p-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Estruturas de Produtos Ativas</h3>
            <p className="text-xs text-slate-500">Árvore de insumos, coeficientes técnicos e tempos de roteiro</p>
          </div>
          <button className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Estrutura (BOM)
          </button>
        </div>

        {/* ESTRUTURA EXPANSÍVEL (BOM) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-industrial-600 uppercase tracking-wide">Produto Acabado</span>
              <h4 className="text-base font-bold text-slate-900">PA-ARMARIO-01 — Armário Industrial Reforçado 2 Portas</h4>
              <p className="text-xs text-slate-500">Versão 1.0 • Código BOM: BOM-ARMARIO-01</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Tempo Padrão de Fabricação</span>
              <p className="text-sm font-bold text-slate-700">45 minutos / unidade</p>
            </div>
          </div>

          <h5 className="text-xs font-bold uppercase text-slate-500 mb-3">Componentes e Matérias-Primas Requeridas</h5>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">Código Item</th>
                <th className="px-4 py-2.5">Descrição</th>
                <th className="px-4 py-2.5">Tipo</th>
                <th className="px-4 py-2.5">Consumo Unitário</th>
                <th className="px-4 py-2.5">Perda Técnica (%)</th>
                <th className="px-4 py-2.5">Custo Unitário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800">MP-CHAPA-01</td>
                <td className="px-4 py-3">Chapa de Aço Carbono 2mm</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">Matéria-Prima</span></td>
                <td className="px-4 py-3 font-medium">18.50 KG</td>
                <td className="px-4 py-3 text-rose-600">3.00%</td>
                <td className="px-4 py-3">R$ 15,50 / KG</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800">MP-PARAFUSO-M8</td>
                <td className="px-4 py-3">Parafuso Sextavado M8 x 25</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">Matéria-Prima</span></td>
                <td className="px-4 py-3 font-medium">24.00 UN</td>
                <td className="px-4 py-3 text-rose-600">1.00%</td>
                <td className="px-4 py-3">R$ 0,85 / UN</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </>
  );
}
