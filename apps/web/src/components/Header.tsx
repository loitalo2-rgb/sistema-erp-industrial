'use client';

import { Bell, Activity } from 'lucide-react';

export function Header({ title }: { title: string }) {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-[11px] text-slate-600 capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Sistema operando</span>
        </div>

        <button
          aria-label="Notificações"
          data-testid="btn-notificacoes"
          className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5" />
        </button>
      </div>
    </header>
  );
}
