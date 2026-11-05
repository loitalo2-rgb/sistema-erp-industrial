import { StockMovementType } from './enums';

/**
 * Movimentos de saída reduzem o saldo; movimentos de entrada aumentam.
 * A quantidade é sempre persistida em valor absoluto e o efeito é calculado
 * pelo tipo do movimento (padrão de Kardex adotado pelo ERP).
 */
export const OUTBOUND_MOVEMENT_TYPES: StockMovementType[] = [
  StockMovementType.SAIDA_PRODUCAO,
  StockMovementType.SAIDA_VENDA,
];

export function isOutboundMovement(type: string): boolean {
  return OUTBOUND_MOVEMENT_TYPES.includes(type as StockMovementType);
}

export function stockEffect(type: string, quantity: number | string): number {
  const abs = Math.abs(Number(quantity) || 0);
  return isOutboundMovement(type) ? -abs : abs;
}

export function round4(value: number): number {
  return Number(Number(value || 0).toFixed(4));
}
