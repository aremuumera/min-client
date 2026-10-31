/*
 * Group 05 batches and the quantity ledger (docs/new/frontend/implementation/step-2.5-batches-ledger.md).
 * Shapes follow the backend's Swagger schemas (minmeg-backend-ts src/docs/batch.docs.ts). Quantities are
 * decimal strings with up to 6 places, and are added up exactly here, never as floats.
 */
export interface Paged<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
}

export const BATCH_STATUSES = ['ACTIVE', 'VERIFIED', 'PENDING_VERIFICATION', 'RESERVED', 'ALLOCATED', 'PARTIALLY_ALLOCATED', 'IN_TRANSIT', 'PROCESSING', 'QUARANTINED', 'SUSPENDED', 'COMPLETED', 'RETIRED', 'CLOSED', 'CANCELLED'] as const;
export const REGISTER_TYPES = ['INITIAL', 'ADDITIONAL_INVENTORY'] as const;
export const REGISTER_SOURCES = ['MINED', 'PRODUCED', 'PURCHASED', 'IMPORTED', 'OTHER'] as const;
export const PHYSICAL_FORMS = ['ORE', 'CONCENTRATE', 'INGOT', 'POWDER', 'LIQUID', 'GEMSTONE', 'CRYSTAL', 'PELLET', 'OTHER'] as const;
export const ADJUSTMENT_TYPES = ['LOSS', 'GAIN', 'ADJUSTMENT'] as const;
export const MEASUREMENT_SOURCES = ['MANUAL', 'WEIGHBRIDGE', 'LAB', 'INSPECTOR'] as const;
export const PROVENANCE_STATUSES = ['PENDING', 'RECORDED', 'VERIFIED', 'DISPUTED', 'FAILED'] as const;
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED', 'EXPIRED'] as const;
export const INSPECTION_STATUSES = ['NOT_REQUIRED', 'PENDING', 'RESULTS_RECORDED', 'VERIFIED', 'EXPIRED'] as const;
export const LISTING_ELIGIBILITY = ['NOT_ELIGIBLE', 'PENDING', 'ELIGIBLE', 'SUSPENDED'] as const;

/** Statuses a batch can be split, merged, transformed or adjusted in (backend OPERABLE_STATUSES) */
export const OPERABLE_STATUSES = ['ACTIVE', 'VERIFIED', 'PENDING_VERIFICATION'];
export const ENDED_STATUSES = ['RETIRED', 'CLOSED', 'CANCELLED'];
/** Only these entries can be reversed; the others define the batch's physical identity */
export const REVERSIBLE_ENTRIES = ['LOSS', 'GAIN', 'ADJUSTMENT', 'RECONCILIATION'];

export const BATCH_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,63}$/;
export const MAX_SPLIT_CHILDREN = 50;
export const MAX_TRANSFORM_OUTPUTS = 10;
export const MAX_MERGE_SOURCES = 20;

export interface NamedRecord {
  id: string;
  code: string;
  name: string;
}
export interface UnitChoice {
  id: string;
  code: string;
  symbol: string;
  name?: string;
}

export interface Batch {
  id: string;
  batchCode: string;
  ownerOrganizationId: string;
  materialId: string;
  batchType: string;
  batchStatus: string;
  statusReason: string | null;
  initialQuantity: string;
  currentQuantity: string;
  availableQuantity: string;
  reservedQuantity: string;
  allocatedQuantity: string | null;
  quantityUnitId: string;
  sourceType: string;
  sourceLocationId: string | null;
  currentLocationId: string | null;
  physicalForm: string | null;
  grade: string | null;
  purity: string | null;
  provenanceStatus: string;
  verificationStatus: string;
  inspectionStatus: string | null;
  listingEligibilityStatus: string;
  quarantinedAt: string | null;
  quarantinedByStaff?: boolean;
  retiredAt: string | null;
  retirementReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  material?: NamedRecord;
  unit?: UnitChoice;
  sourceLocation?: NamedRecord | null;
  currentLocation?: NamedRecord | null;
  lineage?: { parents: number; children: number };
  pendingLedgerEntries?: number;
  quantityApproval?: { policy: 'TOLERANCE' | 'NOT_REQUIRED'; tolerancePercent?: string | null; source?: string } | null;
  activeDisqualifications?: { id: string; reasonText?: string }[];
}

export interface LedgerEntry {
  id: string;
  batchId: string;
  entryType: string;
  direction: string;
  quantity: string;
  balanceBefore: string | null;
  balanceAfter: string | null;
  reason: string | null;
  occurredAt: string;
  recordedAt: string;
  status: 'PENDING' | 'POSTED' | 'REVERSED' | 'INVALIDATED';
  reversalOfEntryId: string | null;
  reviewNote: string | null;
}

/** GET /quantity-ledger: an entry with its batch, for staff review */
export interface ReviewEntry extends LedgerEntry {
  batch: { id: string; batchCode: string; ownerOrganizationId: string; ownerOrganizationName: string; currentQuantity: string; availableQuantity: string; batchStatus: string; material: NamedRecord; unit: UnitChoice };
}

export interface TreeNode {
  id: string;
  restricted?: boolean;
  batchCode?: string;
  batchStatus?: string;
  initialQuantity?: string;
  quantityUnitId?: string;
  relationshipType?: string;
  quantityContributed?: string | null;
  retirementReason?: string | null;
  parents?: TreeNode[];
  children?: TreeNode[];
}
export interface BatchTree {
  batch: TreeNode;
  upstream: TreeNode[];
  downstream: TreeNode[];
}

export interface HistoryItem {
  kind: 'EVENT' | 'LEDGER' | 'LINEAGE';
  at: string;
  record: Record<string, unknown>;
}

export interface BatchAttachment {
  id: string;
  fileAssetId: string;
  attachmentType: string;
  title: string | null;
  verificationStatus: string;
  linkedAt: string;
  file: { id: string; displayName: string } | null;
}

const LABELS: Record<string, string> = {
  INITIAL: 'First registration',
  ADDITIONAL_INVENTORY: 'Additional stock',
  SPLIT: 'From a split',
  MERGED: 'From a merge',
  TRANSFORMED: 'From processing',
  MINED: 'Mined',
  PENDING_VERIFICATION: 'Waiting for verification',
  NOT_ELIGIBLE: 'Not eligible',
  LOSS: 'Loss',
  GAIN: 'Gain',
  ADJUSTMENT: 'Correction',
  RECONCILIATION: 'Measured difference',
  POSTED: 'Applied',
  INVALIDATED: 'Rejected',
  REVERSED: 'Reversed',
  SPLIT_FROM: 'Split',
  MERGED_FROM: 'Merged',
  TRANSFORMED_FROM: 'Processed',
  MANUAL: 'Counted or estimated by hand',
  LAB: 'Laboratory',
};

/** "PENDING_VERIFICATION" → "Waiting for verification" (with our own wording for a few) */
export function batchLabel(value: string | null | undefined): string {
  if (!value) return '—';
  if (LABELS[value]) return LABELS[value];
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const batchOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: batchLabel(v) }));

export function listParams(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

const MILLION = BigInt(1_000_000);

/** A quantity in millionths, so sums are exact. Empty or invalid counts as 0. */
export function toMicro(value: string | null | undefined): bigint {
  const v = String(value ?? '').trim();
  if (!/^\d*(\.\d{0,6})?$/.test(v)) return BigInt(0);
  const [whole, part = ''] = v.split('.');
  return BigInt(whole || '0') * MILLION + BigInt((part + '000000').slice(0, 6));
}

export function fromMicro(micro: bigint): string {
  const negative = micro < BigInt(0);
  const abs = negative ? -micro : micro;
  const part = String(abs % MILLION).padStart(6, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${abs / MILLION}${part ? `.${part}` : ''}`;
}

/** What is left to assign in a split: 0 means the children add up exactly */
export function leftToAssign(total: string, parts: readonly string[]): bigint {
  return parts.reduce((left, p) => left - toMicro(p), toMicro(total));
}

export const isPositive = (value: string) => toMicro(value) > BigInt(0);

/** "1250.500000" + "t" → "1,250.5 t" */
export function formatQuantity(value: string | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const [whole, part = ''] = String(value).split('.');
  const trimmed = part.replace(/0+$/, '');
  const text = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${trimmed ? `.${trimmed}` : ''}`;
  return unit ? `${text} ${unit}` : text;
}

/** "+ 3 t", "− 20 t" */
export function signedQuantity(entry: Pick<LedgerEntry, 'direction' | 'quantity'>, unit?: string | null): string {
  const sign = entry.direction === 'IN' ? '+ ' : entry.direction === 'OUT' ? '− ' : '';
  return `${sign}${formatQuantity(entry.quantity, unit)}`;
}

/** A ledger entry's status, in words */
export const entryStatusLabel = (status: string) => (status === 'PENDING' ? 'Waiting for MINMEG' : batchLabel(status));

/** The tolerance in force, in words */
export function approvalRule(rule: Batch['quantityApproval']): string {
  if (!rule || rule.policy === 'NOT_REQUIRED') return 'Changes apply at once';
  const n = Number(rule.tolerancePercent ?? 0);
  return n === 0 ? 'Every change waits for MINMEG' : `Changes over ${n}% wait for MINMEG`;
}
