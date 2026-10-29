import { Header } from '../../components/Header';
import { ShoppingCart, Plus, CheckCircle2, Clock, Calculator } from 'lucide-react';

export default function ComercialPage() {
  return (
    <>
      <Header title="Comercial & Engenharia de Vendas" />
      <main className="p-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Pedidos de Venda & Orçamentos</h3>
            <p className="text-xs text-slate-500">Formação de preço industrial e envio para PCP</p>
          </div>
          <button className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Novo Pedido de Venda
          </button>
        </div>

        {/* TABELA DE PEDIDOS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Número Pedido</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Valor Total</th>
                <th className="px-6 py-3">Prazo de Entrega</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ação PCP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900">PED-2026-104</td>
                <td className="px-6 py-4">Indústria Metalúrgica Progresso Ltda</td>
                <td className="px-6 py-4 font-semibold text-slate-800">R$ 34.000,00</td>
                <td className="px-6 py-4 text-xs text-slate-500">10/11/2026</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                    Aprovado
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                    Explodir no MRP &rarr;
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
