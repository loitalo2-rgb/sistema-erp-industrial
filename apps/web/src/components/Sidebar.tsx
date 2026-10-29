'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Factory, 
  Layers, 
  Cpu, 
  Boxes, 
  ShoppingCart, 
  DollarSign, 
  Gauge, 
  HardHat 
} from 'lucide-react';

const menuItems = [
  { name: 'Painel Geral', href: '/', icon: Gauge },
  { name: 'Cadastros Base', href: '/cadastros', icon: Boxes },
  { name: 'Engenharia (BOM)', href: '/engenharia', icon: Layers },
  { name: 'PCP & MRP I', href: '/pcp', icon: Cpu },
  { name: 'Chão de Fábrica', href: '/chao-de-fabrica', icon: HardHat },
  { name: 'Estoque & Lotes', href: '/estoque', icon: Boxes },
  { name: 'Vendas & Compras', href: '/comercial', icon: ShoppingCart },
  { name: 'Financeiro & DRE', href: '/financeiro', icon: DollarSign },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-industrial-600 p-2 rounded-lg text-white">
          <Factory className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">ERP Industrial</h1>
          <p className="text-xs text-slate-400">MRP I & Chão de Fábrica</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-industrial-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
            ADM
          </div>
          <div className="text-xs">
            <p className="font-medium text-slate-200">Administrador</p>
            <p className="text-slate-500">admin@erp.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
