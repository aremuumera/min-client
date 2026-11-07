/*
 * The stock behind a trade (docs/new/frontend/implementation/step-2.6c-trades.md). Shapes follow the
 * backend's trade-allocation module. Quantities are decimal strings.
 */
export interface TradeStockSummary {
  reserved: string;
  committed: string;
  fulfilled: string;
  fullyAllocated: boolean | null;
  openAllocations: number;
}

export interface TradeStockRecord {
  id: string;
  tradeCode: string;
  status: string;
  quantity: string | null;
  unit?: { id: string; symbol: string } | null;
  stockMode?: 'BATCHES' | 'TYPED';
  metadata?: { allocationNote?: string; typedQuantityTaken?: string } | null;
  allocationSummary: TradeStockSummary;
  viewerRole?: 'staff' | 'seller' | 'buyer';
  sellerOrganizationId?: string;
  buyerOrganizationId?: string;
}

export interface TradeAllocation {
  id: string;
  status: string;
  quantityAllocated: string;
  expiresAt: string | null;
  releaseReason?: string | null;
  cancellationReason?: string | null;
  unit?: { id: string; symbol: string } | null;
  batch: { id: string; batchCode: string; materialId?: string; material?: { id: string; name: string } | null } | null;
}

/** Before Trade Accepted: stock can still be held or released */
export const HOLDS_CAN_CHANGE = ['DRAFT', 'NEGOTIATING', 'PENDING_ACCEPTANCE'];

export const ALLOCATION_LABELS: Record<string, string> = {
  RESERVED: 'Held',
  ACTIVE: 'Committed',
  PARTIALLY_FULFILLED: 'Partly shipped',
  FULFILLED: 'Shipped',
  RELEASED: 'Released',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Ended',
};

/** 3.000000 t reads as 3 t */
export function showQuantity(value: string | number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 6 })}${unit ? ` ${unit}` : ''}`;
}

/** How much of the trade still has no stock behind it */
export function stillToAllocate(trade: TradeStockRecord): number {
  if (!trade.quantity) return 0;
  const left = Number(trade.quantity) - Number(trade.allocationSummary.reserved) - Number(trade.allocationSummary.committed);
  return left > 0 ? Number(left.toFixed(6)) : 0;
}
