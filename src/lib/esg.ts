import type { BadgeTone } from '@/components/ui';

/*
 * Step 2.10: ESG and carbon (Group 18, decision #77). MINMEG never rates and supplies no factor:
 * carbon figures are the owner's own, added up by the server; ESG results are recorded as the
 * scheme issued them. Trust is always shown in words.
 */
export type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage?: number } };
export type Single<T> = { data: T };

export type TrustLevel = 'DECLARED' | 'EVIDENCED' | 'INDEPENDENTLY_VERIFIED' | 'CONFIRMED_BY_MINMEG';
export type AssessmentStatus = 'DRAFT' | 'CALCULATED' | 'ASSESSED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUPERSEDED' | 'INVALIDATED';
export type CarbonSubject = 'BATCH' | 'SHIPMENT' | 'ORGANIZATION';

export interface Verification {
  verifierName: string | null;
  verificationStandard: string | null;
  verificationStatementFileId: string | null;
  verifierVerifiedOn: string | null;
  confirmedAt: string | null;
  notes: string | null;
}

export interface CarbonInput {
  id: string;
  inputType: string;
  activityCode: string | null;
  activityName: string;
  activityValue: string;
  activityUnitId: string;
  calculationMethod: 'FACTOR' | 'DIRECT';
  emissionFactorValue: string | null;
  emissionFactorUnitId: string | null;
  emissionFactorSource: string | null;
  emissionFactorVersion: string | null;
  calculatedEmissionsValue: string;
  emissionsUnitId: string;
  scope: string | null;
  sourceType: string;
  sourceId: string | null;
  dataType: string;
  periodStart: string | null;
  periodEnd: string | null;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  evidenceFileId: string | null;
}

export interface CarbonAssessment {
  id: string;
  assessmentCode: string;
  kind: 'CARBON';
  subjectType: CarbonSubject;
  subjectId: string;
  ownerOrganizationId: string;
  version: number;
  previousAssessmentId: string | null;
  methodologyCode: string;
  methodologyVersion: string;
  systemBoundary: string;
  functionalUnit: string | null;
  functionalUnitQuantity: string | null;
  functionalUnitUnit: string | null;
  totalEmissions: { value: string; unitId: string; unit: string | null };
  intensity: { value: string; unitId: string; unit: string | null } | null;
  primaryDataPercentage: string | null;
  secondaryDataPercentage: string | null;
  calculationPeriodStart: string | null;
  calculationPeriodEnd: string | null;
  calculatedAt: string | null;
  status: AssessmentStatus;
  trust: { level: TrustLevel; label: string };
  declaredBy: string;
  verification: Verification;
  submittedAt: string | null;
  returnNotes?: string | null;
  invalidatedAt: string | null;
  invalidationReason: string | null;
  inputs: CarbonInput[];
  createdAt: string;
}

export interface UnitOption {
  id: string;
  code: string;
  symbol: string;
  name?: string;
  measurementType?: { id: string; code: string; name?: string } | null;
}

export const ASSESSMENT_STATUS_TEXT: Record<AssessmentStatus, string> = {
  DRAFT: 'Draft',
  CALCULATED: 'Calculated, not sent',
  ASSESSED: 'Recorded, not sent',
  PENDING_VERIFICATION: 'Waiting for MINMEG',
  VERIFIED: 'Confirmed by MINMEG',
  SUPERSEDED: 'Replaced by a newer version',
  INVALIDATED: 'Withdrawn',
};

export function statusTone(status: AssessmentStatus): string {
  if (status === 'VERIFIED') return 'VERIFIED';
  if (status === 'PENDING_VERIFICATION') return 'PENDING';
  if (status === 'INVALIDATED') return 'FAILED';
  if (status === 'SUPERSEDED') return 'NEUTRAL';
  return 'ON_HOLD';
}

export const TRUST_TEXT: Record<TrustLevel, string> = {
  DECLARED: 'Declared',
  EVIDENCED: 'Declared with evidence',
  INDEPENDENTLY_VERIFIED: 'Independently verified',
  CONFIRMED_BY_MINMEG: 'Confirmed by MINMEG',
};
export function trustTone(level: TrustLevel): BadgeTone {
  if (level === 'CONFIRMED_BY_MINMEG') return 'success';
  if (level === 'INDEPENDENTLY_VERIFIED') return 'dark';
  return 'warning';
}

export const SUBJECT_TEXT: Record<string, string> = { BATCH: 'Batch', SHIPMENT: 'Shipment', ORGANIZATION: 'The company', LOCATION: 'Mine site' };
export const BOUNDARIES = ['CRADLE_TO_GATE', 'GATE_TO_GATE', 'CRADLE_TO_GRAVE', 'WELL_TO_WHEEL', 'CUSTOM'] as const;
export const BOUNDARY_TEXT: Record<string, string> = {
  CRADLE_TO_GATE: 'Cradle to gate (until it leaves the site)',
  GATE_TO_GATE: 'Gate to gate (one site’s own process only)',
  CRADLE_TO_GRAVE: 'Cradle to grave (whole life)',
  WELL_TO_WHEEL: 'Well to wheel (fuel and transport)',
  CUSTOM: 'Custom (described in the method)',
};
export const INPUT_TYPES = ['FUEL', 'ELECTRICITY', 'ENERGY', 'TRANSPORT', 'PROCESS', 'MATERIAL', 'WASTE', 'REFRIGERANT', 'LAND_USE', 'OTHER'] as const;
export const SCOPE_TEXT: Record<string, string> = { SCOPE_1: 'Scope 1 (own fuel and processes)', SCOPE_2: 'Scope 2 (bought electricity and heat)', SCOPE_3: 'Scope 3 (others in the chain, e.g. transport)', OTHER: 'Other' };
export const DATA_QUALITY_TEXT: Record<string, string> = { PRIMARY: 'Primary (measured by the company)', SECONDARY: 'Secondary (from a database or estimate source)', ESTIMATED: 'Estimated', DERIVED: 'Derived' };
export const INPUT_STATUS_TEXT: Record<CarbonInput['verificationStatus'], string> = { UNVERIFIED: 'Not checked', VERIFIED: 'Checked', REJECTED: 'Rejected by MINMEG' };

export const words = (v: string | null | undefined) => (v ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') : '');

/** A decimal string without trailing zeros, with thousands separators */
export function amount(v: string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const [int, frac] = String(v).split('.');
  const trimmed = (frac ?? '').replace(/0+$/, '');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return trimmed ? `${grouped}.${trimmed.slice(0, 4)}` : grouped;
}

/** Open = the owner can still change it */
export const isOpen = (a: { status: AssessmentStatus }) => ['DRAFT', 'CALCULATED', 'ASSESSED', 'PENDING_VERIFICATION'].includes(a.status);
