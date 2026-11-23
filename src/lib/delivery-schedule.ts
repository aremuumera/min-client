/*
 * Recurring trades (decision #120, #145), slice 1 — ⚠️ NOT RELEASED: the backend answers 404 while
 * FEATURE_RECURRING_TRADES is off, and the screens then hide themselves.
 * Shapes follow minmeg-backend-ts delivery-schedule.service.ts (scheduleView). The parties read; MINMEG staff run it.
 */
export type ScheduleStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED_EARLY' | 'COMPLETED';
export type DeliveryStatus = 'PLANNED' | 'OPEN' | 'DISPATCHED' | 'DELIVERED' | 'CLOSED' | 'PAUSED' | 'CANCELLED';
export type DeliveryPaymentStatus = 'NOT_REQUIRED' | 'NOT_PAID' | 'PART_PAID' | 'PAID';
export type InspectionMode = 'ONE_FOR_ALL' | 'PER_DELIVERY';
export type PaymentMode = 'FULL' | 'PER_DELIVERY' | 'PART_PER_DELIVERY' | 'INSTALMENTS';
export type ShortDefault = 'CARRY_OVER' | 'DROP';

export interface TradeDelivery {
  id: string;
  scheduleId: string;
  tradeId: string;
  deliveryNumber: number;
  dueDate: string;
  agreedDueDate: string | null;
  plannedQuantity: string;
  deliveredQuantity: string;
  carriedOverQuantity: string;
  status: DeliveryStatus;
  needsInspection: boolean;
  paymentStatus: DeliveryPaymentStatus;
  paymentNote: string | null;
  paymentConfirmedBy: string | null;
  paymentConfirmedAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
  /** slice 2: date moves (up to 14 days) and how a shortfall was settled */
  metadata?: {
    dateMoves?: Array<{ from: string; to: string; reason: string; at: string }>;
    shortfall?: { quantity: string; settled: 'CARRIED_OVER' | 'DROPPED'; toDeliveryNumber?: number; note?: string | null };
  } | null;
}

export type ChangeLineType = 'MOVE' | 'QUANTITY' | 'CANCEL' | 'PAUSE' | 'RESUME' | 'ADD' | 'DROP_SHORTFALL' | 'END_EARLY';
export type ChangeStatus = 'DRAFT' | 'AWAITING_SIGNATURES' | 'APPLIED' | 'REJECTED' | 'WITHDRAWN';
/** What staff send (one per line) */
export type ChangeLineInput =
  | { type: 'MOVE'; deliveryId: string; dueDate: string }
  | { type: 'QUANTITY'; deliveryId: string; quantity: string }
  | { type: 'CANCEL' | 'PAUSE' | 'RESUME' | 'DROP_SHORTFALL'; deliveryId: string }
  | { type: 'ADD'; dueDate: string; quantity: string }
  | { type: 'END_EARLY' };
export interface ScheduleChange {
  id: string;
  scheduleId: string;
  requestedBy: 'BUYER' | 'SUPPLIER' | 'STAFF';
  reason: string;
  lines: Array<{
    type: ChangeLineType;
    deliveryId: string | null;
    deliveryNumber: number | null;
    before: { dueDate?: string; quantity?: string; status?: string; short?: string } | null;
    after: { dueDate?: string; quantity?: string; status?: string } | null;
    input: ChangeLineInput;
  }>;
  status: ChangeStatus;
  documentIds: string[];
  appliedAt: string | null;
  createdAt: string;
}


export interface DeliverySchedule {
  id: string;
  tradeId: string;
  status: ScheduleStatus;
  inspectionMode: InspectionMode;
  paymentMode: PaymentMode;
  paymentTerms: string | null;
  shortDeliveryDefault: ShortDefault;
  totalQuantity: string;
  unit: string | null;
  activatedAt: string | null;
  activationNote: string | null;
  deliveries: TradeDelivery[];
  changes: ScheduleChange[];
  summary: {
    deliveries: number;
    delivered: number;
    plannedTotal: string;
    deliveredTotal: string;
    difference: string;
    nextDue: { deliveryNumber: number; dueDate: string; status: DeliveryStatus } | null;
    line: string;
  };
}

export interface TradeScheduleView {
  tradeId: string;
  tradeCode: string;
  totalQuantity: string | null;
  quantityPerDelivery: string | null;
  schedule: DeliverySchedule | null;
}

export const SCHEDULE_LABELS: Record<ScheduleStatus, string> = { DRAFT: 'Draft', ACTIVE: 'Active', PAUSED: 'Paused', ENDED_EARLY: 'Ended early', COMPLETED: 'Completed' };
export const DELIVERY_LABELS: Record<DeliveryStatus, string> = { PLANNED: 'Planned', OPEN: 'Open', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', CLOSED: 'Closed', PAUSED: 'Paused', CANCELLED: 'Cancelled' };
export const PAYMENT_STATUS_LABELS: Record<DeliveryPaymentStatus, string> = { NOT_REQUIRED: 'Paid with the trade', NOT_PAID: 'Not paid', PART_PAID: 'Part paid', PAID: 'Paid' };

export const INSPECTION_OPTIONS: Array<{ value: InspectionMode; label: string; description: string }> = [
  { value: 'ONE_FOR_ALL', label: 'One inspection for all deliveries', description: 'The inspection before the agreement covers every delivery' },
  { value: 'PER_DELIVERY', label: 'An inspection per delivery', description: 'Each delivery after the first needs its own inspection' },
];
export const PAYMENT_OPTIONS: Array<{ value: PaymentMode; label: string; description: string }> = [
  { value: 'FULL', label: 'Full payment for all deliveries', description: 'Paid once, on the trade’s own payment step' },
  { value: 'PER_DELIVERY', label: 'Payment per delivery', description: 'Each delivery is paid on its own' },
  { value: 'PART_PER_DELIVERY', label: 'Part payment per delivery', description: 'For example a share before dispatch, the rest after delivery' },
  { value: 'INSTALMENTS', label: 'Instalments', description: 'Not tied to deliveries; describe them in the payment terms' },
];
export const SHORT_OPTIONS: Array<{ value: ShortDefault; label: string }> = [
  { value: 'CARRY_OVER', label: 'Carry the shortfall over to the next delivery' },
  { value: 'DROP', label: 'Drop the shortfall' },
];

/** "15 Jan 2027" from "2027-01-15" (a date, no time zone shift) */
export function showDay(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** The stepper line with readable dates: "Recurring: 1 of 3 delivered · next due 15 Feb 2027" */
export function scheduleLine(schedule: DeliverySchedule): string {
  const { delivered, deliveries, nextDue } = schedule.summary;
  if (schedule.status === 'DRAFT') return `Recurring (draft): ${deliveries} deliveries`;
  return `Recurring: ${delivered} of ${deliveries} delivered${nextDue ? ` · next due ${showDay(nextDue.dueDate)}` : ''}`;
}

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = { DRAFT: 'Draft', AWAITING_SIGNATURES: 'Waiting for signatures', APPLIED: 'Applied', REJECTED: 'Not signed', WITHDRAWN: 'Withdrawn' };
export const REQUESTED_BY_LABELS = { BUYER: 'The buyer', SUPPLIER: 'The supplier', STAFF: 'MINMEG' } as const;

/** Plain words for one line of a recorded change, as on the signed document */
export function changeLineText(l: ScheduleChange['lines'][number], unit: string | null): string {
  const q = (v?: string) => (v ? `${Number(v)}${unit ? ` ${unit}` : ''}` : '');
  switch (l.type) {
    case 'MOVE': return `Delivery ${l.deliveryNumber}: due ${showDay(l.before?.dueDate)} → ${showDay(l.after?.dueDate)}`;
    case 'QUANTITY': return `Delivery ${l.deliveryNumber}: ${q(l.before?.quantity)} → ${q(l.after?.quantity)}`;
    case 'CANCEL': return `Delivery ${l.deliveryNumber} cancelled (${q(l.before?.quantity)})`;
    case 'PAUSE': return `Delivery ${l.deliveryNumber} paused`;
    case 'RESUME': return `Delivery ${l.deliveryNumber} resumed`;
    case 'ADD': return `New delivery ${l.deliveryNumber}: ${q(l.after?.quantity)}, due ${showDay(l.after?.dueDate)}`;
    case 'DROP_SHORTFALL': return `Delivery ${l.deliveryNumber}: the ${q(l.before?.short)} shortfall is dropped`;
    case 'END_EARLY': return `The agreement ends early (${q(l.after?.quantity)} not opened is cancelled)`;
  }
}

/** What a delivered delivery is still short of (0 when not short) */
export const shortOf = (d: TradeDelivery) => Math.max(0, Math.round((Number(d.plannedQuantity) + Number(d.carriedOverQuantity) - Number(d.deliveredQuantity)) * 1e6) / 1e6);
