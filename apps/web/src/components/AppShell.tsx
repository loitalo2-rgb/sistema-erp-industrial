'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { api, storeSessionUser } from '../lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }

    // Valida a sessão no servidor: o token está em cookie HttpOnly.
    let active = true;
    api
      .get('/auth/me')
      .then((user) => {
        if (!active) return;
        storeSessionUser(user);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [isLogin, pathname, router]);

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-600 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Validando acesso...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
