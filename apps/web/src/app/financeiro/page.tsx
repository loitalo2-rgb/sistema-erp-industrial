import { Header } from '../../components/Header';
import { DollarSign, ArrowUpRight, ArrowDownRight, FileText, CheckCircle2 } from 'lucide-react';

export default function FinanceiroPage() {
  return (
    <>
      <Header title="Financeiro & Demonstrativo de Resultado (DRE)" />
      <main className="p-8 space-y-6">
        
        {/* CARDS RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total a Receber (Vendas)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">R$ 185.000,00</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Próximos 30 dias
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total a Pagar (Compras/Insumos)</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">R$ 42.500,00</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Fornecedores & Insumos
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Resultado Líquido Projetado</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ 142.500,00</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Margem Líquida: 77.0%
            </p>
          </div>
        </div>

        {/* DEMONSTRATIVO DRE SIMPLIFICADO */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-industrial-600" />
            <h3 className="text-base font-bold text-slate-800">DRE Gerencial — Visão Contábil & Operacional</h3>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
            <div className="flex justify-between p-3.5 bg-slate-50 font-bold text-slate-900 border-b border-slate-200">
              <span>(=) RECEITA BRUTA DE VENDAS</span>
              <span>R$ 185.000,00</span>
            </div>
            <div className="flex justify-between p-3 text-slate-600 border-b border-slate-100 pl-8">
              <span>(-) Deduções e Impostos sobre Vendas</span>
              <span className="text-rose-600">(R$ 18.500,00)</span>
            </div>
            <div className="flex justify-between p-3.5 bg-slate-50/70 font-semibold text-slate-800 border-b border-slate-200">
              <span>(=) RECEITA LÍQUIDA</span>
              <span>R$ 166.500,00</span>
            </div>
            <div className="flex justify-between p-3 text-slate-600 border-b border-slate-100 pl-8">
              <span>(-) Custo dos Produtos Vendidos (CPV - Insumos + Chão de Fábrica)</span>
              <span className="text-rose-600">(R$ 24.000,00)</span>
            </div>
            <div className="flex justify-between p-3.5 bg-slate-50/70 font-bold text-slate-900 border-b border-slate-200">
              <span>(=) LUCRO BRUTO INDUSTRIAL</span>
              <span>R$ 142.500,00</span>
            </div>
            <div className="flex justify-between p-3 text-slate-600 border-b border-slate-100 pl-8">
              <span>(-) Despesas Operacionais e Administrativas</span>
              <span className="text-rose-600">(R$ 12.000,00)</span>
            </div>
            <div className="flex justify-between p-4 bg-emerald-50 text-emerald-900 font-extrabold text-base border-t border-emerald-200">
              <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span>R$ 130.500,00</span>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
