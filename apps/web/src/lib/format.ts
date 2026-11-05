export const brl = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));

export const num = (
  value: number | string | null | undefined,
  digits = 2,
) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value || 0));

export const pct = (value: number | string | null | undefined) =>
  `${num(value, 1)}%`;

export const date = (value?: string | Date | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
};

export const dateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const STATUS_LABELS: Record<string, string> = {
  PLANEJADA: 'Planejada',
  LIBERADA: 'Liberada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
  ORCAMENTO: 'Orçamento',
  APROVADO: 'Aprovado',
  EM_PRODUCAO: 'Em produção',
  FATURADO: 'Faturado',
  CANCELADO: 'Cancelado',
  COTACAO: 'Cotação',
  RECEBIDO: 'Recebido',
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  ENTRADA_COMPRA: 'Entrada compra',
  ENTRADA_PRODUCAO: 'Entrada produção',
  SAIDA_PRODUCAO: 'Saída produção',
  SAIDA_VENDA: 'Saída venda',
  AJUSTE_INVENTARIO: 'Ajuste inventário',
  PRODUCAO: 'Produção',
  PARADA: 'Parada',
  AJUSTE: 'Ajuste',
};

export const statusLabel = (status?: string | null) =>
  status ? STATUS_LABELS[status] || status : '—';

export const typeLabel = (type?: string | null) => {
  const labels: Record<string, string> = {
    MATERIA_PRIMA: 'Matéria-prima',
    SEMIACABADO: 'Semiacabado',
    PRODUTO_ACABADO: 'Produto acabado',
    EMBALAGEM: 'Embalagem',
    CONSUMO: 'Consumo',
    CLIENTE: 'Cliente',
    FORNECEDOR: 'Fornecedor',
    AMBOS: 'Ambos',
    RECEBER: 'A receber',
    PAGAR: 'A pagar',
    RECEITA_BRUTA: 'Receita bruta',
    DEDUCAO_RECEITA: 'Dedução de receita',
    CUSTO_PRODUCAO_CPV: 'CPV',
    DESPESA_OPERACIONAL: 'Despesa operacional',
    DESPESA_ADMINISTRATIVA: 'Despesa administrativa',
    OUTRAS_RECEITAS: 'Outras receitas',
    OUTRAS_DESPESAS: 'Outras despesas',
  };
  return type ? labels[type] || type : '—';
};

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: any) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.map(escape).join(';'),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(';')),
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
