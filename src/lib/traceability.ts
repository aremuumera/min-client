/*
 * Physical traceability (step 2.7c): handling units, MINMEG codes, printing and custody. Shapes follow
 * the backend's traceability module. The owner of the goods packs units; only the inspector assigned to
 * the trade (or staff with a reason) makes, prints and applies codes (decision #69).
 */
export const UNIT_TYPES = ['BAG', 'SACK', 'DRUM', 'PALLET', 'CRATE', 'CONTAINER', 'BULK', 'OTHER'] as const;
export const unitTypeLabel = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export const UNIT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ready',
  PACKED: 'Packed',
  LOADED: 'Loaded',
  IN_TRANSIT: 'On the way',
  OPENED: 'Opened',
  EMPTY: 'Empty',
  DAMAGED: 'Damaged',
  RETIRED: 'Retired',
};
export const CODE_STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Not applied yet',
  ACTIVE: 'Active',
  REVOKED: 'Revoked',
  LOST: 'Lost',
  DAMAGED: 'Damaged',
  REPLACED: 'Replaced',
  RETIRED: 'Retired',
};

export interface Code {
  id: string;
  identifierType: 'QR' | 'BARCODE' | 'NFC' | 'RFID' | 'SERIAL' | 'SEAL';
  publicReference: string | null;
  status: string;
  subjectType: string;
  subjectId: string;
  activatedAt: string | null;
  replacedById: string | null;
  /** Only for staff and the inspector on the goods */
  identifierValue?: string;
  /** In the batch list: a label has been printed (it prints once) */
  printed?: boolean;
}
export interface HandlingUnit {
  id: string;
  batchId: string;
  parentHandlingUnitId: string | null;
  unitType: string;
  serialNumber: string | null;
  quantity: string;
  status: string;
  sealed: boolean;
  sealReference: string | null;
  shipmentId: string | null;
  identifiers: Code[];
}
export interface BatchUnits {
  batch: { id: string; batchCode: string; ownerOrganizationId: string; currentQuantity: string };
  canWork: boolean;
  seesPrintable: boolean;
  identifiers: Code[];
  units: HandlingUnit[];
}
export interface CustodyRow {
  id: string;
  subjectType: string;
  subjectId: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED' | 'CANCELLED' | 'DISPUTED' | 'INVALIDATED';
  custodianType: 'ORGANIZATION' | 'EXTERNAL' | 'AUTHORITY';
  acquisitionType: string;
  startedAt: string | null;
  createdAt?: string;
  subjectLabel?: string;
  fromName?: string;
  toName?: string;
  metadata?: { note?: string } | null;
}
export const CUSTODY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Waiting for the receiver',
  ACTIVE: 'Holding',
  CLOSED: 'Handed on',
  REJECTED: 'Refused',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
  INVALIDATED: 'Set aside by MINMEG',
};

/** Units that hold goods (not emptied, opened, damaged or retired) */
export const LIVE_UNIT = ['ACTIVE', 'PACKED', 'LOADED', 'IN_TRANSIT'];

export interface FieldWindow {
  inspectorAssignmentId: string;
  scheduled: boolean;
  opensAt: string | null;
  closesAt: string | null;
  stoppedAt: string | null;
  stopReason: string | null;
  open?: boolean;
  recorded?: Record<string, { accepted: number; rejected: number }>;
  batches: { id: string; batchCode: string; material: string | null; currentQuantity: string; siteId: string | null }[];
}
export interface PrintJob {
  id: string;
  printJobCode: string;
  status: string;
  requestedQuantity: number;
  printedQuantity: number;
  items?: { id: string; traceabilityIdentifierId: string; status: string; verifiedAt: string | null }[];
}

/** The phone's position, for actions that must happen at the site */
export function currentPosition(): Promise<{ latitude: number; longitude: number; accuracyMeters: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('This device cannot share its location.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: Number(p.coords.latitude.toFixed(6)), longitude: Number(p.coords.longitude.toFixed(6)), accuracyMeters: Math.round(p.coords.accuracy) }),
      () => reject(new Error('Your location could not be read. Allow location for this site and try again.')),
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  });
}

export interface ScanResult {
  result: 'VALID' | 'NOT_ACTIVE' | 'REVOKED' | 'UNKNOWN' | 'BAD_SIGNATURE' | 'REPLAYED';
  genuine: boolean;
  identifier: Code | null;
  subject: {
    subjectType: string;
    batch?: { id: string; batchCode: string; batchStatus: string };
    handlingUnit?: { id: string; unitType: string; serialNumber: string | null; status: string; sealed: boolean; quantity: string };
    shipment?: { id: string; shipmentNumber: string; status: string };
  } | null;
}
export const SCAN_RESULT_TEXT: Record<ScanResult['result'], string> = {
  VALID: 'Genuine MINMEG code, active',
  NOT_ACTIVE: 'Genuine MINMEG code, but not active',
  REVOKED: 'This code was withdrawn by MINMEG. Do not accept the goods on it',
  UNKNOWN: 'Not a MINMEG code',
  BAD_SIGNATURE: 'This label is a copy or has been changed. Do not accept the goods on it',
  REPLAYED: 'This tag reading was copied. Do not accept the goods on it',
};

// =========================== inspection results (step 2.8a) ===========================
export interface MeasuredValue {
  parameter: string;
  value: number | string;
  unit?: string;
}
export interface InspectionFile {
  id: string;
  photoUrl: string;
  caption: string | null;
  category: string | null;
}
export interface Findings {
  id: string;
  batchId: string;
  quantityVerified: string | null;
  observations: MeasuredValue[] | null;
  summary: string | null;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'SUPERSEDED';
  verificationNote: string | null;
  createdAt: string;
  files: InspectionFile[];
}
export interface LabResult {
  id: string;
  batchId: string;
  laboratoryName: string;
  laboratoryReference: string | null;
  sampleReference: string | null;
  sampledAt: string | null;
  testedAt: string | null;
  grade: { parameter: string; value: string | number; unit: string } | null;
  gradeComparison: { agreed: number; achieved: number; difference: number; position: 'ABOVE' | 'EQUAL' | 'BELOW' } | null;
  values: MeasuredValue[] | null;
  summary: string | null;
  status: 'DRAFT' | 'FINAL' | 'VERIFIED' | 'REJECTED' | 'INVALIDATED';
  verificationNote: string | null;
  invalidationReason: string | null;
  files: InspectionFile[];
}
export interface RoundResults {
  inspectorAssignmentId: string;
  released: boolean;
  agreedGrade: string | number | null;
  inspectionResults: Findings[];
  assayResults: LabResult[];
}
export const RESULT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Waiting for MINMEG',
  FINAL: 'Waiting for MINMEG',
  DRAFT: 'Draft',
  VERIFIED: 'Checked by MINMEG',
  REJECTED: 'Sent back by MINMEG',
  SUPERSEDED: 'Replaced',
  INVALIDATED: 'Withdrawn by MINMEG',
};
export const POSITION_TEXT = { ABOVE: 'above the agreed grade', EQUAL: 'equal to the agreed grade', BELOW: 'below the agreed grade' } as const;
/** "58.2000" → "58.2": the backend keeps fixed decimals; text values stay as they are */
export const numberText = (v: string | number | null | undefined): string =>
  v == null ? '' : typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(v) ? String(Number(v)) : v;
