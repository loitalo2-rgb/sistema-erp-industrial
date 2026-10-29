import { Header } from '../components/Header';
import { 
  Activity, 
  AlertTriangle, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Factory, 
  TrendingUp 
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <Header title="Painel Geral de Operações Industriais" />
      <main className="p-8 space-y-6">
        
        {/* CARDS DE INDICADORES (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">OEE da Planta</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">84.2%</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +2.4% vs meta (80%)
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Ordens de Produção (OP)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">12 Ativas</h3>
              <p className="text-xs text-slate-500 mt-1">3 Liberadas / 9 Em Produção</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Factory className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Gatilho Estoque Mínimo</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">2 Itens</h3>
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Necessitam de Compra MRP
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Resultado Operacional (DRE)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">R$ 142.500</h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                Margem Líquida: 24.8%
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* FLUXO INDUSTRIAL DE DADOS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Fluxo Operacional Integrado (Gatilhos Ativos)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">1</span>
                Comercial
              </div>
              <p className="text-xs text-slate-600">Pedidos de Venda aprovados disparam explosão no MRP.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
                <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">2</span>
                Cálculo MRP I
              </div>
              <p className="text-xs text-slate-600">Leitura de BOM, análise de saldo e geração de requisição de compra.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-1">
                <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">3</span>
                Ordem de Produção
              </div>
              <p className="text-xs text-slate-600">Reserva de matéria-prima e liberação de roteiro de usinagem/corte.</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">4</span>
                Chão de Fábrica
              </div>
              <p className="text-xs text-slate-600">Apontamento de operador, baixa automática e DRE atualizado.</p>
            </div>
          </div>
        </div>

        {/* TABELA DE ORDENS NO CHÃO DE FÁBRICA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Ordens de Produção em Andamento (Chão de Fábrica)</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">Tempo Real</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Código OP</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Qtd. Planejada</th>
                  <th className="px-6 py-3">Produzido / Refugo</th>
                  <th className="px-6 py-3">Centro de Trabalho</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">OP-2026-001</td>
                  <td className="px-6 py-4">Armário Industrial Reforçado 2 Portas</td>
                  <td className="px-6 py-4">50 UN</td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 font-medium">32 boas</span> / <span className="text-rose-500 font-medium">1 refugo</span>
                  </td>
                  <td className="px-6 py-4">Corte a Laser CNC</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                      Em Execução
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">OP-2026-002</td>
                  <td className="px-6 py-4">Base Soldada para Prensa Hidráulica</td>
                  <td className="px-6 py-4">20 UN</td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 font-medium">20 boas</span> / <span className="text-slate-400">0 refugo</span>
                  </td>
                  <td className="px-6 py-4">Linha de Solda MIG</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                      Concluída
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  );
}
