'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';

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

    const token = localStorage.getItem('erp_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500 text-sm gap-2">
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
