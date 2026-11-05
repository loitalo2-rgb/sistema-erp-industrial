'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import {
  EmptyState,
  Feedback,
  KpiCard,
  LoadingBlock,
} from '../../components/ui';
import { api } from '../../lib/api';
import { dateTime, todayISO } from '../../lib/format';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileClock,
  Filter,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  CRIAR: 'Criar',
  ATUALIZAR: 'Atualizar',
  DESATIVAR: 'Desativar',
  EXCLUIR: 'Excluir',
  FATURAR: 'Faturar',
  RECEBER: 'Receber',
  PAGAR: 'Pagar',
  CANCELAR: 'Cancelar',
  ALTERAR_STATUS: 'Alterar status',
  ALTERAR_SENHA: 'Alterar senha',
  LOGIN: 'Login',
};

const ACTION_TONES: Record<string, string> = {
  CRIAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ATUALIZAR: 'bg-blue-50 text-blue-700 border-blue-200',
  DESATIVAR: 'bg-amber-50 text-amber-700 border-amber-200',
  EXCLUIR: 'bg-rose-50 text-rose-700 border-rose-200',
  FATURAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RECEBER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAGAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELAR: 'bg-rose-50 text-rose-700 border-rose-200',
  ALTERAR_STATUS: 'bg-amber-50 text-amber-700 border-amber-200',
  ALTERAR_SENHA: 'bg-slate-100 text-slate-700 border-slate-200',
  LOGIN: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function AuditoriaPage() {
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<{ entities: string[]; actions: string[] }>({
    entities: [],
    actions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayISO());
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (entity) params.set('entity', entity);
        if (action) params.set('action', action);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('page', String(targetPage));
        params.set('limit', '30');

        const result = await api.get(`/auditoria?${params.toString()}`);
        setData(result);
        setPage(targetPage);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [search, entity, action, from, to, page],
  );

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
      api
        .get('/auditoria/filtros')
        .then(setOptions)
        .catch(() => undefined);
      load(1);
    } catch {
      setAuthorized(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && !authorized) {
    return (
      <>
        <Header title="Auditoria" />
        <main className="p-8">
          <Feedback
            type="error"
            message="Acesso restrito: apenas administradores podem consultar a auditoria."
          />
        </main>
      </>
    );
  }

  const items = data?.items || [];
  const stats = data?.stats || { byAction: [], byEntity: [] };
  const pages = data?.pages || 0;

  return (
    <>
      <Header title="Auditoria & Governança" />
      <main className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Trilha de Auditoria
            </h3>
            <p className="text-xs text-slate-500">
              Registro automático de todas as operações de escrita realizadas no
              sistema.
            </p>
          </div>
          <button
            onClick={() => load(page)}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {error && (
          <Feedback type="error" message={error} onClose={() => setError('')} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            label="Eventos no filtro"
            value={data?.total ?? 0}
            icon={<FileClock className="w-5 h-5" />}
            tone="blue"
          />
          <KpiCard
            label="Ações distintas"
            value={stats.byAction?.length ?? 0}
            icon={<Activity className="w-5 h-5" />}
            tone="indigo"
          />
          <KpiCard
            label="Módulos afetados"
            value={stats.byEntity?.length ?? 0}
            icon={<ShieldCheck className="w-5 h-5" />}
            tone="emerald"
          />
          <KpiCard
            label="Página"
            value={`${data?.page ?? 1} / ${pages || 1}`}
            icon={<Users className="w-5 h-5" />}
            tone="slate"
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1);
          }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Buscar
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="usuário, ação, módulo ou rota"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Módulo
            </label>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {options.entities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ação
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {options.actions.map((value) => (
                <option key={value} value={value}>
                  {ACTION_LABELS[value] || value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              De
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Até
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="md:col-span-6 flex items-center justify-center gap-2 bg-industrial-600 hover:bg-industrial-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Filter className="w-4 h-4" /> Aplicar filtros
          </button>
        </form>

        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum evento encontrado"
            description="As operações de escrita aparecem aqui automaticamente."
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Data/Hora</th>
                    <th className="text-left px-4 py-3">Usuário</th>
                    <th className="text-left px-4 py-3">Ação</th>
                    <th className="text-left px-4 py-3">Módulo</th>
                    <th className="text-left px-4 py-3">Rota</th>
                    <th className="text-left px-4 py-3">HTTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((log: any) => (
                    <Fragment key={log.id}>
                      <tr
                        onClick={() =>
                          setExpanded(expanded === log.id ? null : log.id)
                        }
                        className="hover:bg-slate-50/60 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {dateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {log.user?.name || log.userEmail || 'Sistema'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.user?.role || log.userEmail || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                              ACTION_TONES[log.action] ||
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">
                          {log.entity}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                          {log.method} {log.path}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {log.statusCode || '—'}
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">
                              Payload registrado
                            </p>
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-all">
                              {log.payload || 'Sem payload.'}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                {data?.total ?? 0} evento(s) • página {data?.page ?? 1} de{' '}
                {pages || 1}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => load(page + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
                >
                  Próxima <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
