'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Factory, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@erp.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao autenticar.');
      }

      const data = await res.json();
      localStorage.setItem('erp_token', data.accessToken);
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-industrial-600 p-3 rounded-xl text-white">
            <Factory className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ERP Industrial</h1>
            <p className="text-xs text-slate-400">MRP I & Gestão de Manufatura</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-200 text-center mb-6">Acesso ao Sistema</h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-industrial-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-industrial-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-industrial-600 hover:bg-industrial-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Credenciais de Acesso Inicial:</p>
          <p>E-mail: <code className="text-industrial-400">admin@erp.local</code></p>
          <p>Senha: <code className="text-industrial-400">admin123</code></p>
        </div>
      </div>
    </div>
  );
}
