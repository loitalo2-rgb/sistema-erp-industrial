import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { statusLabel } from '../lib/format';

const STATUS_TONES: Record<string, string> = {
  PLANEJADA: 'bg-slate-100 text-slate-700 border-slate-200',
  LIBERADA: 'bg-blue-50 text-blue-700 border-blue-200',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-700 border-amber-200',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADA: 'bg-rose-50 text-rose-700 border-rose-200',
  ORCAMENTO: 'bg-slate-100 text-slate-700 border-slate-200',
  APROVADO: 'bg-blue-50 text-blue-700 border-blue-200',
  EM_PRODUCAO: 'bg-amber-50 text-amber-700 border-amber-200',
  FATURADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-rose-50 text-rose-700 border-rose-200',
  COTACAO: 'bg-slate-100 text-slate-700 border-slate-200',
  RECEBIDO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  PAGO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ATRASADO: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function StatusBadge({ status }: { status?: string | null }) {
  const tone =
    STATUS_TONES[status || ''] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
        <div className="text-2xl font-bold text-slate-800 mt-1 truncate">
          {value}
        </div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
      <div className={`p-3 rounded-lg shrink-0 ${tones[tone]}`}>{icon}</div>
    </div>
  );
}

export function Feedback({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
}) {
  const success = type === 'success';
  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
        success
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {success ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          data-testid="btn-fechar-feedback"
          className="text-xs font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current rounded"
        >
          fechar
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = 'Carregando dados...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-slate-600 text-sm">
      <Loader2 className="w-5 h-5 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
    </div>
  );
}
