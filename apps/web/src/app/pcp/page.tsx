'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { Cpu, Calculator, CheckCircle2, ShoppingCart, Play, AlertCircle } from 'lucide-react';

export default function PCPPage() {
  const [quantity, setQuantity] = useState(10);
  const [calculated, setCalculated] = useState(false);

  return (
    <>
      <Header title="PCP — Planejamento MRP I & Ordens de Produção" />
      <main className="p-8 space-y-6">
        
        {/* MOTOR DE CÁLCULO MRP I */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Cálculo de Necessidades Líquidas (MRP I)</h3>
              <p className="text-xs text-slate-500">Explosão de demanda contra estoque atual e geração de ordens</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Produto Acabado</label>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>PA-ARMARIO-01 — Armário Industrial Reforçado 2 Portas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantidade a Produzir</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => setCalculated(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm h-10"
            >
              <Calculator className="w-4 h-4" /> Executar Explosão MRP
            </button>
          </div>

          {calculated && (
            <div className="mt-6 border-t border-slate-200 pt-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Resultado do MRP: Insumos Necessários</h4>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Componente</th>
                    <th className="px-4 py-2.5">Necessidade Bruta</th>
                    <th className="px-4 py-2.5">Saldo em Estoque</th>
                    <th className="px-4 py-2.5">Necessidade Líquida</th>
                    <th className="px-4 py-2.5">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Chapa de Aço 2mm</td>
                    <td className="px-4 py-3">{(quantity * 18.5 * 1.03).toFixed(2)} KG</td>
                    <td className="px-4 py-3 text-slate-500">120.00 KG</td>
                    <td className="px-4 py-3 text-rose-600 font-bold">
                      {Math.max(0, quantity * 18.5 * 1.03 - 120).toFixed(2)} KG
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 w-max">
                        <ShoppingCart className="w-3 h-3" /> Gerar Ordem de Compra
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Parafuso M8 x 25</td>
                    <td className="px-4 py-3">{(quantity * 24 * 1.01).toFixed(0)} UN</td>
                    <td className="px-4 py-3 text-slate-500">1.500 UN</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">0 UN</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> Estoque Disponível
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  <Play className="w-4 h-4" /> Emitir Ordem de Produção (OP)
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </>
  );
}
