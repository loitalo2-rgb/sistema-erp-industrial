'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { HardHat, CheckCircle2, AlertOctagon, Play, Square, ThumbsUp } from 'lucide-react';

export default function ChaoDeFabricaPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [goodPieces, setGoodPieces] = useState(0);
  const [scrappedPieces, setScrappedPieces] = useState(0);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleFinish = () => {
    setIsRunning(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 4000);
  };

  return (
    <>
      <Header title="Terminal Touch de Chão de Fábrica (Operador)" />
      <main className="p-8 space-y-6 max-w-5xl">
        
        {/* CARD DO POSTO DE TRABALHO */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-industrial-600 rounded-xl">
              <HardHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Posto de Trabalho</p>
              <h3 className="text-xl font-bold">CT-CORTE — Máquina de Corte a Laser CNC</h3>
              <p className="text-xs text-slate-300">Operador: João Silva (Matrícula: 1042)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              isRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isRunning ? 'Em Operação' : 'Posto Parado'}
            </span>
          </div>
        </div>

        {/* CONTROLES DE APONTAMENTO TOUCH */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-industrial-600 uppercase">Ordem Selecionada</span>
            <h4 className="text-lg font-bold text-slate-900">OP-2026-001 — Armário Industrial 2 Portas</h4>
            <p className="text-xs text-slate-500">Meta do Lote: 50 Unidades</p>
          </div>

          {/* BOTÕES TOUCH DE CONTROLE DE TEMPO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isRunning ? (
              <button
                onClick={() => setIsRunning(true)}
                className="h-20 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-md"
              >
                <Play className="w-7 h-7" /> Iniciar / Retomar Operação
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="h-20 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all shadow-md"
              >
                <Square className="w-7 h-7" /> Pausar / Concluir Ciclo
              </button>
            )}

            <button
              className="h-20 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all border border-slate-300"
            >
              <AlertOctagon className="w-7 h-7 text-amber-500" /> Registrar Motivo de Parada
            </button>
          </div>

          {/* CONTADORES DE PEÇAS TOUCH (+ / -) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* PEÇAS BOAS */}
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
              <p className="text-sm font-bold text-emerald-800 uppercase mb-2">Peças Boas Aprovadas</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setGoodPieces(Math.max(0, goodPieces - 1))}
                  className="w-14 h-14 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-2xl font-bold hover:bg-emerald-100 shadow-sm"
                >
                  -
                </button>
                <span className="text-5xl font-extrabold text-emerald-900 w-24">{goodPieces}</span>
                <button
                  onClick={() => setGoodPieces(goodPieces + 1)}
                  className="w-14 h-14 bg-emerald-600 text-white rounded-xl text-2xl font-bold hover:bg-emerald-700 shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* PEÇAS REFUGADAS */}
            <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center">
              <p className="text-sm font-bold text-rose-800 uppercase mb-2">Peças com Refugo / Perda</p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setScrappedPieces(Math.max(0, scrappedPieces - 1))}
                  className="w-14 h-14 bg-white border border-rose-300 text-rose-800 rounded-xl text-2xl font-bold hover:bg-rose-100 shadow-sm"
                >
                  -
                </button>
                <span className="text-5xl font-extrabold text-rose-900 w-24">{scrappedPieces}</span>
                <button
                  onClick={() => setScrappedPieces(scrappedPieces + 1)}
                  className="w-14 h-14 bg-rose-600 text-white rounded-xl text-2xl font-bold hover:bg-rose-700 shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {savedMessage && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold text-sm">Apontamento gravado com sucesso! Baixa de insumos e entrada no estoque efetuadas.</span>
            </div>
          )}

        </div>

      </main>
    </>
  );
}
