'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  KpiCard,
  LoadingBlock,
} from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime } from '../../lib/format';
import {
  CheckCircle2,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
  UserX,
  X,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ENGENHARIA: 'Engenharia',
  PCP: 'PCP',
  OPERADOR: 'Operador',
  COMPRAS: 'Compras',
  VENDAS: 'Vendas',
  FINANCEIRO: 'Financeiro',
};

const ROLE_TONES: Record<string, string> = {
  ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ENGENHARIA: 'bg-sky-50 text-sky-700 border-sky-200',
  PCP: 'bg-amber-50 text-amber-700 border-amber-200',
  OPERADOR: 'bg-slate-100 text-slate-700 border-slate-200',
  COMPRAS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VENDAS: 'bg-blue-50 text-blue-700 border-blue-200',
  FINANCEIRO: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OPERADOR');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userData, roleData] = await Promise.all([
        api.get('/usuarios'),
        api.get('/usuarios/perfis'),
      ]);
      setUsers(userData);
      setRoles(roleData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('erp_user');
      const stored = raw ? JSON.parse(raw) : null;
      if (stored?.role !== 'ADMIN') {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      load();
    } catch {
      setAuthorized(false);
      setLoading(false);
    }
  }, [load]);

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === 'ADMIN' && user.active).length,
      profiles: new Set(users.map((user) => user.role)).size,
    }),
    [users],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      await api.post('/usuarios', { name, email, password, role });
      setFeedback(`Usuário ${name} criado com o perfil ${ROLE_LABELS[role]}.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('OPERADOR');
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const patchUser = async (user: any, body: any, message: string) => {
    setError('');
    setFeedback('');
    try {
      const updated = await api.patch(`/usuarios/${user.id}`, body);
      setFeedback(message);
      await load();

      const raw = localStorage.getItem('erp_user');
      const stored = raw ? JSON.parse(raw) : null;
      if (stored?.id === updated.id) {
        localStorage.setItem('erp_user', JSON.stringify(updated));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActive = (user: any) =>
    patchUser(
      user,
      { active: !user.active },
      `Usuário ${user.name} ${user.active ? 'desativado' : 'reativado'}.`,
    );

  const changeRole = (user: any, nextRole: string) =>
    patchUser(
      user,
      { role: nextRole },
      `Perfil de ${user.name} alterado para ${ROLE_LABELS[nextRole]}.`,
    );

  const resetPassword = (user: any) => {
    const next = window.prompt(
      `Nova senha para ${user.name} (mínimo 6 caracteres):`,
    );
    if (!next) return;
    patchUser(user, { password: next }, `Senha de ${user.name} redefinida.`);
  };

  if (!loading && !authorized) {
    return (
      <>
        <Header title="Usuários & Perfis" />
        <main className="p-8">
          <Feedback
            type="error"
            message="Acesso restrito: apenas administradores podem gerenciar usuários."
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Usuários & Perfis" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Governança de Acessos (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Perfis definem quais operações cada usuário pode executar no ERP.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowForm((value) => !value)}
              className="flex items-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Fechar' : 'Novo Usuário'}
            </button>
          </div>
        </div>

        {feedback && (
          <Feedback
            type="success"
            message={feedback}
            onClose={() => setFeedback('')}
          />
        )}
        {error && (
          <Feedback type="error" message={error} onClose={() => setError('')} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            label="Usuários"
            value={summary.total}
            icon={<Users className="w-5 h-5" />}
            tone="blue"
          />
          <KpiCard
            label="Ativos"
            value={summary.active}
            icon={<CheckCircle2 className="w-5 h-5" />}
            tone="emerald"
          />
          <KpiCard
            label="Administradores"
            value={summary.admins}
            icon={<ShieldCheck className="w-5 h-5" />}
            tone="indigo"
          />
          <KpiCard
            label="Perfis em uso"
            value={summary.profiles}
            icon={<UserCog className="w-5 h-5" />}
            tone="amber"
          />
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <h4 className="text-sm font-bold text-slate-800">Novo usuário</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  E-mail
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Senha inicial
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Perfil de acesso
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {roles.map((value) => (
                    <option key={value} value={value}>
                      {ROLE_LABELS[value] || value}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="md:col-span-3 bg-industrial-600 hover:bg-industrial-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {saving ? 'Salvando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingBlock />
        ) : users.length === 0 ? (
          <EmptyState title="Nenhum usuário cadastrado" />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-800">
                Usuários cadastrados
              </h4>
              <p className="text-xs text-slate-500">
                {users.length} registro(s)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Usuário</th>
                    <th className="text-left px-4 py-3">Perfil</th>
                    <th className="text-left px-4 py-3">Último acesso</th>
                    <th className="text-left px-4 py-3">Situação</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user, e.target.value)}
                          className={`border rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ROLE_TONES[user.role] ||
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {roles.map((value) => (
                            <option key={value} value={value}>
                              {ROLE_LABELS[value] || value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {dateTime(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => resetPassword(user)}
                            title="Redefinir senha"
                            className="p-1.5 text-slate-500 hover:text-industrial-600 hover:bg-slate-100 rounded"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            title={user.active ? 'Desativar' : 'Reativar'}
                            className={`p-1.5 rounded hover:bg-slate-100 ${
                              user.active
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {user.active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
