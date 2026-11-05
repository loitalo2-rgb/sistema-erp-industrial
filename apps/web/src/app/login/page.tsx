'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, storeSessionUser } from '../../lib/api';
import { Factory, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@erp.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se já existe sessão válida (cookie), não faz sentido mostrar o login.
    api
      .get('/auth/me')
      .then(() => router.replace('/'))
      .catch(() => undefined);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/auth/login', { email, password });
      // O JWT fica em cookie HttpOnly; guardamos apenas os dados de exibição.
      storeSessionUser(data.user);
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
            <p className="text-xs text-slate-300">
              MRP I, Produção & Contabilidade
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-200 text-center mb-6">
          Acesso ao Sistema
        </h2>

        {error && (
          <div
            role="alert"
            data-testid="login-error"
            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="form-login"
        >
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-slate-200 mb-1"
            >
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-email"
                data-testid="input-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-industrial-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-slate-200 mb-1"
            >
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="login-password"
                data-testid="input-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-industrial-400"
              />
            </div>
          </div>

          <button
            id="btn-login"
            data-testid="btn-login"
            type="submit"
            disabled={loading}
            className="w-full bg-industrial-600 hover:bg-industrial-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-xs text-slate-300">
          <p className="font-semibold text-slate-200 mb-1">
            Credenciais de Acesso Inicial:
          </p>
          <p>
            E-mail: <code className="text-industrial-300">admin@erp.local</code>
          </p>
          <p>
            Senha: <code className="text-industrial-300">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
