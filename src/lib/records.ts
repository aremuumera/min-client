/*
 * Readings (dynamic measurements) and events on a batch, unit or shipment (step 2.8b, decision #70).
 * Nothing is ever edited: a correction is a new record and the old one is replaced. A merchant's own
 * reading is a declaration until the assigned inspector or MINMEG staff check it (decision #106).
 */
export type RecordSubject = 'BATCH' | 'SHIPMENT' | 'HANDLING_UNIT';
export type RecorderRole = 'owner' | 'inspector' | 'staff' | 'reader';

export interface Evidence {
  id: string;
  fileAssetId: string;
  attachmentType: string;
  title: string | null;
}
/** Decision #107: MINMEG released a record, for one trade, to its buyer, supplier and / or assigned inspector */
export interface RecordRelease {
  id: string;
  resourceType: 'TRACEABILITY_EVENT' | 'DYNAMIC_MEASUREMENT';
  resourceId: string;
  tradeId: string;
  tradeCode: string | null;
  toBuyer: boolean;
  toSupplier: boolean;
  toInspector: boolean;
  status: 'ACTIVE' | 'REVERTED';
  releasedAt: string;
  revertedAt: string | null;
  revertReason: string | null;
}
/** Staff only: the releases of a record and the trades it can be released for */
export interface ReleaseInfo {
  releases?: RecordRelease[];
  releasableTrades?: { id: string; tradeCode: string }[];
}
export function releaseAudience(r: Pick<RecordRelease, 'toBuyer' | 'toSupplier' | 'toInspector'>): string {
  const who = [r.toBuyer && 'buyer', r.toSupplier && 'supplier', r.toInspector && 'inspector'].filter(Boolean) as string[];
  return who.length > 1 ? `${who.slice(0, -1).join(', ')} and ${who[who.length - 1]}` : (who[0] ?? 'nobody');
}
export interface Reading extends ReleaseInfo {
  evidence?: Evidence[];
  id: string;
  subjectType: RecordSubject;
  subjectId: string;
  value: string;
  measuredAt: string;
  recordedAt: string;
  sourceType: 'MANUAL' | 'INSPECTOR' | 'IOT_DEVICE' | 'API' | 'CHECKPOINT' | 'LAB' | 'WEIGHBRIDGE';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verificationNote: string | null;
  status: 'ACTIVE' | 'SUPERSEDED';
  statusReason: string | null;
  recordedBy: string;
  correctionOfMeasurementId: string | null;
  measurementType: { id: string; code: string; name: string } | null;
  unit: { id: string; code: string; symbol: string } | null;
}
export interface DataField {
  key: string;
  label?: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'enum' | 'uuid';
  required?: boolean;
  values?: string[];
  min?: number;
  max?: number;
}
export interface EventType {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  subjectType: string;
  requiresLocation: boolean;
  requiresEvidence: boolean;
  requiresVerification: boolean;
  anchorPolicy: 'NEVER' | 'OPTIONAL' | 'REQUIRED';
  active: boolean;
  systemDefined: boolean;
  metadataSchema: { fields: DataField[]; allowOtherFields?: boolean } | null;
  recordableBy: ('OWNER' | 'INSPECTOR' | 'STAFF' | 'DEVICE')[] | null;
  category?: { id: string; code: string; name: string } | null;
}
export interface TraceEvent extends ReleaseInfo {
  evidence?: Evidence[];
  id: string;
  subjectType: string;
  subjectId: string;
  actorType: string;
  actorId: string | null;
  occurredAt: string;
  recordedAt: string;
  status: 'PENDING' | 'RECORDED' | 'VERIFIED' | 'ANCHORED' | 'INVALIDATED' | 'SUPERSEDED';
  data: Record<string, unknown> | null;
  verificationNote: string | null;
  statusReason: string | null;
  correctionOfEventId: string | null;
  eventType: { id: string; code: string; name: string; subjectType: string; systemDefined: boolean } | null;
  eventCategory: { id: string; code: string; name: string } | null;
}

const SOURCE_LABELS: Record<Reading['sourceType'], string> = {
  MANUAL: 'Declared',
  INSPECTOR: 'Inspector',
  LAB: 'Lab',
  WEIGHBRIDGE: 'Weighbridge',
  IOT_DEVICE: 'Device',
  API: 'System',
  CHECKPOINT: 'Checkpoint',
};
export const sourceLabel = (s: Reading['sourceType']) => SOURCE_LABELS[s] ?? s;

/** How far a reading can be trusted, in words (no pass or fail) */
export function readingTrust(r: Reading): { label: string; status: string } {
  if (r.status === 'SUPERSEDED') return { label: 'Replaced by a correction', status: 'SUPERSEDED' };
  if (r.verificationStatus === 'VERIFIED') return { label: 'Checked', status: 'VERIFIED' };
  if (r.verificationStatus === 'REJECTED') return { label: 'Rejected', status: 'REJECTED' };
  return r.sourceType === 'MANUAL' ? { label: 'Declared by the company, not checked', status: 'PENDING' } : { label: 'Waiting for a check', status: 'PENDING' };
}

const EVENT_STATUS_LABELS: Record<TraceEvent['status'], string> = {
  PENDING: 'Waiting for a check',
  RECORDED: 'Recorded',
  VERIFIED: 'Checked',
  ANCHORED: 'Checked and sealed',
  INVALIDATED: 'Withdrawn',
  SUPERSEDED: 'Replaced',
};
export const eventStatusLabel = (s: TraceEvent['status']) => EVENT_STATUS_LABELS[s] ?? s;
export const eventIsOpen = (e: TraceEvent) => !['INVALIDATED', 'SUPERSEDED'].includes(e.status);

/** Which event types this role may record by hand */
export const recorderKind = (role: RecorderRole) => (role === 'owner' ? 'OWNER' : role === 'inspector' ? 'INSPECTOR' : role === 'staff' ? 'STAFF' : null);

/** GET /trades/{id}/released-records: what MINMEG released on the trade to the caller's side */
export interface ReleasedRecords {
  tradeId: string;
  tradeCode: string;
  party: 'buyer' | 'supplier' | 'inspector' | 'staff';
  records: ({ kind: 'READING'; at: string; release: RecordRelease; record: Reading; evidence: Evidence[] } | { kind: 'EVENT'; at: string; release: RecordRelease; record: TraceEvent; evidence: Evidence[] })[];
}
