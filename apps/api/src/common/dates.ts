/**
 * Helpers de data usados nos filtros de relatórios e do DRE.
 *
 * Datas no formato `YYYY-MM-DD` (input de formulário HTML) são interpretadas
 * como dia local. Usar `new Date('2026-11-05')` cria meia-noite UTC, que em
 * fusos negativos (Brasil, UTC-3) cai no dia anterior e fazia o filtro
 * "até 05/11" excluir todo o dia 05. Esta função evita esse deslocamento.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(
  value: string | Date,
  endOfDay = false,
): Date {
  if (value instanceof Date) return new Date(value.getTime());

  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return endOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(value);
}

export function buildDateFilter(
  from?: string | Date,
  to?: string | Date,
): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;

  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = parseDateOnly(from, false);
  if (to) filter.lte = parseDateOnly(to, true);

  return filter;
}
