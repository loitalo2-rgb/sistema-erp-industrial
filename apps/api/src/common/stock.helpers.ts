import { StockMovementType } from './enums';
import { round4 } from './inventory';

type Tx = any;

/**
 * Consome estoque pelo critério FIFO/PEPS.
 * Se os lotes não cobrirem toda a quantidade, o restante é lançado sem lote
 * para manter o Kardex completo e permitir saldo negativo controlado.
 */
export async function consumeFifo(
  tx: Tx,
  params: {
    itemId: string;
    quantity: number;
    type?: StockMovementType;
    documentRef?: string;
    productionOrderId?: string;
  },
) {
  const quantity = round4(Math.abs(params.quantity));
  const type = params.type || StockMovementType.SAIDA_PRODUCAO;
  const lots = await tx.stockLot.findMany({
    where: { itemId: params.itemId, quantity: { gt: 0 } },
    orderBy: [{ expirationAt: 'asc' }, { createdAt: 'asc' }],
  });

  let remaining = quantity;
  const consumedLots: Array<{ lotId: string; lotNumber: string; quantity: number }> = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = round4(Math.min(remaining, Number(lot.quantity)));
    if (take <= 0) continue;

    await tx.stockLot.update({
      where: { id: lot.id },
      data: { quantity: { decrement: take } },
    });

    await tx.stockMovement.create({
      data: {
        itemId: params.itemId,
        stockLotId: lot.id,
        productionOrderId: params.productionOrderId,
        type,
        quantity: take,
        unitCost: 0,
        documentRef: params.documentRef,
      },
    });

    consumedLots.push({ lotId: lot.id, lotNumber: lot.lotNumber, quantity: take });
    remaining = round4(remaining - take);
  }

  if (remaining > 0) {
    await tx.stockMovement.create({
      data: {
        itemId: params.itemId,
        productionOrderId: params.productionOrderId,
        type,
        quantity: remaining,
        unitCost: 0,
        documentRef: params.documentRef,
      },
    });
  }

  return { quantity, consumedLots, withoutLot: remaining };
}

/**
 * Dá entrada de estoque em um lote (criando o lote quando necessário) e
 * registra a movimentação de entrada correspondente.
 */
export async function receiveStock(
  tx: Tx,
  params: {
    itemId: string;
    quantity: number;
    type?: StockMovementType;
    unitCost?: number;
    lotNumber?: string;
    expirationAt?: Date | string | null;
    documentRef?: string;
    productionOrderId?: string;
  },
) {
  const quantity = round4(Math.abs(params.quantity));
  const type = params.type || StockMovementType.ENTRADA_COMPRA;
  let stockLotId: string | undefined;

  if (params.lotNumber) {
    const lot = await tx.stockLot.upsert({
      where: {
        lotNumber_itemId: {
          lotNumber: params.lotNumber,
          itemId: params.itemId,
        },
      },
      update: {
        quantity: { increment: quantity },
        expirationAt: params.expirationAt ? new Date(params.expirationAt) : undefined,
      },
      create: {
        lotNumber: params.lotNumber,
        itemId: params.itemId,
        quantity,
        expirationAt: params.expirationAt ? new Date(params.expirationAt) : undefined,
      },
    });
    stockLotId = lot.id;
  }

  const movement = await tx.stockMovement.create({
    data: {
      itemId: params.itemId,
      stockLotId,
      productionOrderId: params.productionOrderId,
      type,
      quantity,
      unitCost: params.unitCost || 0,
      documentRef: params.documentRef,
    },
  });

  return { movement, stockLotId, quantity };
}

export async function getItemBalance(tx: Tx, itemId: string): Promise<number> {
  const [inbound, outbound] = await Promise.all([
    tx.stockMovement.aggregate({
      where: {
        itemId,
        type: {
          in: [
            StockMovementType.ENTRADA_COMPRA,
            StockMovementType.ENTRADA_PRODUCAO,
            StockMovementType.AJUSTE_INVENTARIO,
          ],
        },
      },
      _sum: { quantity: true },
    }),
    tx.stockMovement.aggregate({
      where: {
        itemId,
        type: {
          in: [StockMovementType.SAIDA_PRODUCAO, StockMovementType.SAIDA_VENDA],
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  return round4(
    Number(inbound._sum.quantity || 0) - Number(outbound._sum.quantity || 0),
  );
}
