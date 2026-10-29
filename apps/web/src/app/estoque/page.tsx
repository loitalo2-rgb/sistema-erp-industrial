import { Header } from '../../components/Header';
import { Boxes, Upload, AlertTriangle, ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function EstoquePage() {
  return (
    <>
      <Header title="Suprimentos, Estoque & Rastreabilidade (FIFO)" />
      <main className="p-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Saldos por Lote & Localização</h3>
            <p className="text-xs text-slate-500">Controle rigoroso por Lote, Data de Validade e Método FIFO/PEPS</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-slate-300">
              <Upload className="w-4 h-4 text-slate-600" /> Importar XML de NF-e
            </button>
            <button className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              <Boxes className="w-4 h-4" /> Nova Movimentação Manual
            </button>
          </div>
        </div>

        {/* ALERTA DE REPOSIÇÃO */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-900">Alerta de Ponto de Reposição Automático</p>
              <p className="text-xs text-amber-700">1 item atingiu o limite crítico de segurança.</p>
            </div>
          </div>
          <button className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
            Emitir Cotação de Compra
          </button>
        </div>

        {/* TABELA DE LOTES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Lote</th>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Quantidade</th>
                <th className="px-6 py-3">Validade / Entrada</th>
                <th className="px-6 py-3">Status FIFO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">LT-2026-0881</td>
                <td className="px-6 py-4">Chapa de Aço Carbono 2mm</td>
                <td className="px-6 py-4 font-semibold">120.00 KG</td>
                <td className="px-6 py-4 text-xs text-slate-500">Entrada: 15/10/2026</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    Primeiro a Sair (FIFO Ativo)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">LT-2026-0912</td>
                <td className="px-6 py-4">Parafuso Sextavado M8 x 25</td>
                <td className="px-6 py-4 font-semibold">1.500 UN</td>
                <td className="px-6 py-4 text-xs text-slate-500">Entrada: 18/10/2026</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                    Em Estoque
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </>
  );
}
