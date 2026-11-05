'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Factory,
  Layers,
  Cpu,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Gauge,
  HardHat,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { api, clearSession, getSessionUser } from '../lib/api';

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  testId: string;
};

const operationsItems: MenuItem[] = [
  { name: 'Painel Geral', href: '/', icon: Gauge, testId: 'nav-painel' },
  { name: 'Cadastros Base', href: '/cadastros', icon: Boxes, testId: 'nav-cadastros' },
  { name: 'Engenharia (BOM)', href: '/engenharia', icon: Layers, testId: 'nav-engenharia' },
  { name: 'PCP & MRP I', href: '/pcp', icon: Cpu, testId: 'nav-pcp' },
  { name: 'Chão de Fábrica', href: '/chao-de-fabrica', icon: HardHat, testId: 'nav-chao-de-fabrica' },
  { name: 'Estoque & Lotes', href: '/estoque', icon: Boxes, testId: 'nav-estoque' },
  { name: 'Vendas', href: '/comercial', icon: ShoppingCart, testId: 'nav-vendas' },
  { name: 'Compras', href: '/compras', icon: ShoppingBag, testId: 'nav-compras' },
  { name: 'Financeiro & DRE', href: '/financeiro', icon: DollarSign, testId: 'nav-financeiro' },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, testId: 'nav-relatorios' },
];

const adminItems: MenuItem[] = [
  { name: 'Usuários & Perfis', href: '/usuarios', icon: Users, adminOnly: true, testId: 'nav-usuarios' },
  { name: 'Auditoria', href: '/auditoria', icon: ShieldCheck, adminOnly: true, testId: 'nav-auditoria' },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ENGENHARIA: 'Engenharia',
  PCP: 'PCP',
  OPERADOR: 'Operador',
  COMPRAS: 'Compras',
  VENDAS: 'Vendas',
  FINANCEIRO: 'Financeiro',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    role?: string;
  }>({});

  useEffect(() => {
    setUser(getSessionUser() || {});
  }, [pathname]);

  const logout = async () => {
    try {
      // Encerra a sessão no servidor, apagando o cookie HttpOnly.
      await api.post('/auth/logout');
    } catch {
      // Mesmo se a API falhar, o usuário sai da interface.
    } finally {
      clearSession();
      router.push('/login');
    }
  };

  const initials = (user.name || 'ADM')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const isAdmin = user.role === 'ADMIN';

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        id={item.testId}
        data-testid={item.testId}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-industrial-600 text-white'
            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside
      id="app-sidebar"
      data-testid="app-sidebar"
      className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-20"
    >
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-industrial-600 p-2 rounded-lg text-white">
          <Factory className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">ERP Industrial</h1>
          <p className="text-xs text-slate-300">MRP I & Contabilidade</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menu principal">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Operação
        </p>
        {operationsItems.map(renderItem)}

        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Administração
            </p>
            {adminItems.map(renderItem)}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
            {initials || 'AD'}
          </div>
          <div className="text-xs min-w-0 flex-1">
            <p className="font-medium text-slate-100 truncate">
              {user.name || 'Administrador'}
            </p>
            <p className="text-slate-300 truncate">
              {ROLE_LABELS[user.role || ''] || user.role || 'Administrador'}
            </p>
          </div>
          <button
            id="btn-logout"
            data-testid="btn-logout"
            onClick={logout}
            title="Sair"
            aria-label="Sair do sistema"
            className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
