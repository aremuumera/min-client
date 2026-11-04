/*
 * Passports, compliance and certificates (step 2.9, Groups 14 to 17, decisions #73 to #76, #108).
 * Staff define the rules (standards, templates); companies issue passports on their batches;
 * MINMEG confirms compliance and issues certificates. Published records never change.
 */
export type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage?: number } };
export type Single<T> = { data: T; message?: string };

// =========================== 2.9a rules ===========================
export const SUBJECT_TYPES = ['BATCH', 'PRODUCT', 'MATERIAL', 'ORGANIZATION', 'OTHER'] as const;
export const STANDARD_TYPES = ['REGULATION', 'STANDARD', 'GUIDANCE', 'CERTIFICATION_SCHEME', 'BUYER_POLICY', 'MINMEG_POLICY'] as const;
export const FIELD_DATA_TYPES = ['STRING', 'NUMBER', 'INTEGER', 'BOOLEAN', 'DATE', 'DATETIME', 'ENUM', 'REFERENCE', 'FILE', 'OBJECT', 'ARRAY'] as const;
export const VISIBILITY_REQUIREMENTS = ['PUBLIC', 'RESTRICTED', 'ANY'] as const;
export const REQUEST_TYPES = ['NEW_TEMPLATE', 'TEMPLATE_VARIANT', 'ADD_STANDARD', 'NEW_STANDARD', 'STANDARD_MAPPING'] as const;
export const IDENTIFIER_BINDINGS = ['NONE', 'TRACEABILITY_IDENTIFIER', 'PRODUCT_MODEL_CODE', 'BATCH_CODE'] as const;
export const IDENTIFIER_TYPES = ['QR', 'BARCODE', 'NFC', 'RFID', 'SERIAL', 'SEAL'] as const;
export const REFERENCE_TYPES = ['BATCH', 'MATERIAL', 'PRODUCT_MODEL', 'PRODUCT_INSTANCE', 'ORGANIZATION', 'LOCATION', 'SHIPMENT', 'INSPECTION_RESULT', 'ASSAY_RESULT', 'CARBON_ASSESSMENT', 'ESG_ASSESSMENT'] as const;
export const COMPLIANCE_MODES = ['FULL', 'PARTIAL', 'PROFILED'] as const;
export const MAPPING_TYPES = ['DIRECT', 'DERIVED', 'EVIDENCE', 'CONDITIONAL'] as const;

export interface PassportType {
  id: string;
  code: string;
  name: string;
  subjectType: (typeof SUBJECT_TYPES)[number];
  subjectUniquenessGroup: string | null;
  description: string | null;
  active: boolean;
  systemDefined: boolean;
}
export interface StandardProperty {
  id: string;
  standardId: string;
  code: string;
  key: string;
  title: string;
  description?: string | null;
  dataType: string;
  required: boolean;
  group?: string | null;
  visibilityRequirement: (typeof VISIBILITY_REQUIREMENTS)[number];
  evidenceRequired: boolean;
  verificationRequired: boolean;
  order: number;
  active: boolean;
}
export interface Standard {
  id: string;
  code: string;
  version: string;
  name: string;
  standardType: (typeof STANDARD_TYPES)[number];
  issuer: string;
  jurisdiction: string[] | null;
  description?: string | null;
  sourceReference?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'DEPRECATED';
  active: boolean;
  supersededById: string | null;
  activatedAt: string | null;
  properties?: StandardProperty[];
}
export interface TemplateRequest {
  id: string;
  requestCode: string;
  requestType: (typeof REQUEST_TYPES)[number];
  requestedByOrganizationId: string;
  passportTypeId: string | null;
  existingTemplateId: string | null;
  name: string;
  description: string;
  targetMarket: string[] | null;
  buyerOrganizationId: string | null;
  requestedStandards: string[] | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_INFORMATION' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'CANCELLED';
  messages: { at: string; by: string; side: 'MINMEG' | 'REQUESTER'; message: string }[];
  reviewNotes: string | null;
  reviewedAt: string | null;
  resultTemplateId: string | null;
  createdAt?: string;
}
export interface FieldMapping {
  id: string;
  templateFieldId: string;
  standardPropertyId: string;
  mappingType: (typeof MAPPING_TYPES)[number];
  required: boolean;
  status?: string;
  property: StandardProperty | null;
}
export interface TemplateField {
  id: string;
  templateId: string;
  key: string;
  label: string;
  description?: string | null;
  dataType: (typeof FIELD_DATA_TYPES)[number];
  required: boolean;
  dynamic: boolean;
  enumValues: string[] | null;
  validationRules: Record<string, unknown>;
  identifierBinding: (typeof IDENTIFIER_BINDINGS)[number];
  identifierType: string | null;
  referenceType: string | null;
  measurementTypeId: string | null;
  unitId: string | null;
  group: string | null;
  order: number;
  visibilityPolicyId: string;
  visibilityPolicy?: { code: string; name: string; accessScope: string } | null;
  hashIncluded: boolean;
  active: boolean;
  standardProperties?: FieldMapping[];
}
export interface TemplateStandardLink {
  id: string;
  templateId: string;
  standardId: string;
  complianceMode: (typeof COMPLIANCE_MODES)[number];
  standard: Standard | null;
}
export interface ValidationIssue {
  level: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  fieldKey?: string;
  standardCode?: string;
}
export interface Template {
  id: string;
  passportTypeId: string;
  code: string;
  version: number;
  name: string;
  description?: string | null;
  status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'DEPRECATED';
  active: boolean;
  isDefault: boolean;
  previousTemplateId: string | null;
  requestId?: string | null;
  schema: Record<string, unknown>;
  validationReport: { valid: boolean; issues: ValidationIssue[]; checkedAt: string } | null;
  publishedAt: string | null;
  deprecatedAt: string | null;
  deprecationReason: string | null;
  fields?: TemplateField[];
  standards?: TemplateStandardLink[];
}
export interface VisibilityPolicy {
  id: string;
  code: string;
  name: string;
  accessScope: string;
  active: boolean;
}

/** "NEEDS_INFORMATION" → "Needs information" */
export const words = (v: string | null | undefined) => {
  const s = String(v ?? '').replace(/_/g, ' ').trim().toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
};
export const options = (values: readonly string[]) => values.map((v) => ({ value: v, label: words(v) }));
export const openRevision = (t: Pick<Template, 'status'>) => t.status === 'DRAFT' || t.status === 'VALIDATED';

// =========================== 2.9b passports ===========================
export type VersionStatus = 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'SUPERSEDED' | 'INVALIDATED';
export interface VersionSummary {
  id: string;
  versionNumber: number;
  status: VersionStatus;
  templateId: string;
  changeReason: string | null;
  createdAt: string;
  validatedAt: string | null;
  publishedAt: string | null;
  supersededAt: string | null;
  invalidatedAt: string | null;
  invalidationReason: string | null;
}
export interface Passport {
  id: string;
  certificateKind: 'PASSPORT';
  passportCode: string;
  certificateType: { id: string; code: string; name: string } | null;
  subjectType: string;
  subjectId: string;
  ownerOrganizationId: string;
  status: 'DRAFT' | 'ACTIVE' | 'PUBLISHED' | 'SUSPENDED' | 'REVOKED' | 'ARCHIVED';
  correctionPending: boolean;
  publishedVersion: VersionSummary | null;
  /** Owner and staff only */
  openVersion?: VersionSummary | null;
  versionCount?: number;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  archivedAt?: string | null;
  archiveReason?: string | null;
  createdAt: string;
}
export type ValueSource = 'USER' | 'DOCUMENT' | 'MEASUREMENT' | 'INSPECTION' | 'ASSESSMENT' | 'SYSTEM';
export interface PassportValue {
  id: string;
  templateFieldId: string;
  key: string;
  value: unknown;
  valueType: string;
  unitId: string | null;
  visibilityPolicyId: string;
  sourceType: ValueSource | null;
  sourceId: string | null;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  hashIncluded: boolean;
}
export interface VersionField {
  fieldId: string;
  key: string;
  label: string;
  dataType: string;
  required: boolean;
  dynamic: boolean;
  group: string | null;
  order: number;
  unitId: string | null;
  identifierBinding: string;
  visibility: string | null;
  value: PassportValue | null;
  latestReading?: Record<string, unknown> | null;
}
export interface PassportMaterial {
  id: string;
  materialId: string;
  material: { id: string; code: string; name: string } | null;
  quantity: string | null;
  unitId: string | null;
  percentage: number | null;
  role: string | null;
}
export interface PassportVersion extends VersionSummary {
  passportId: string;
  previousVersionId: string | null;
  template: { id: string; code: string; version: number; name: string; status: string };
  fields: VersionField[];
  hiddenFieldCount?: number;
  metadata: { id: string; key: string; value: unknown; description: string | null }[];
  materials: PassportMaterial[];
  validationReport?: { valid: boolean; issues: ValidationIssue[]; checkedAt: string } | null;
}
export interface PassportVerification {
  valid?: boolean;
  status?: string;
  [key: string]: unknown;
}

/** How far a value can be trusted, in words (decision #74: typed values are declared) */
export function valueTrust(v: PassportValue | null): { label: string; status: string } {
  if (!v) return { label: 'Not filled', status: 'NEUTRAL' };
  if (v.verificationStatus === 'VERIFIED') return { label: v.sourceType === 'SYSTEM' ? 'Filled by MINMEG' : 'Verified', status: 'VERIFIED' };
  if (v.verificationStatus === 'FAILED') return { label: 'Check failed', status: 'FAILED' };
  if (v.verificationStatus === 'PENDING') return { label: 'Waiting for a check', status: 'PENDING' };
  return { label: v.sourceType === 'DOCUMENT' ? 'Declared, with a document' : 'Declared by the company', status: 'ON_HOLD' };
}
export const SOURCE_TEXT: Record<string, string> = {
  USER: 'typed by the company',
  DOCUMENT: 'a document',
  MEASUREMENT: 'a reading',
  INSPECTION: 'an inspection or lab result',
  ASSESSMENT: 'an assessment',
  SYSTEM: 'MINMEG',
};
export const PASSPORT_STATUS_TEXT: Record<Passport['status'], string> = {
  DRAFT: 'Not published yet',
  ACTIVE: 'Active',
  PUBLISHED: 'Published',
  SUSPENDED: 'Suspended by MINMEG',
  REVOKED: 'Revoked by MINMEG',
  ARCHIVED: 'Archived',
};
export const passportTone = (s: Passport['status']) => (s === 'PUBLISHED' ? 'ACTIVE' : s === 'DRAFT' ? 'PENDING' : s === 'SUSPENDED' ? 'ON_HOLD' : 'CANCELLED');
export const valueText = (v: unknown): string => (v == null ? '' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'object' ? JSON.stringify(v) : String(v));

// =========================== 2.9c compliance ===========================
export const REQUIREMENT_RESULTS = ['SATISFIED', 'MISSING', 'NOT_APPLICABLE', 'PENDING_VERIFICATION', 'NO_EVIDENCE', 'NOT_SATISFIED'] as const;
export const ACTOR_TYPES = ['SUPPLIER', 'BUYER', 'IMPORTER', 'EXPORTER', 'PRODUCER', 'PROCESSOR', 'CARRIER', 'OTHER'] as const;
export type AssessmentStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL' | 'EXPIRED' | 'INVALIDATED';
export type TrustLabel = 'SELF_ASSESSED' | 'VERIFIED_BY_MINMEG' | 'REJECTED_BY_MINMEG';
export interface StandardRef {
  id: string;
  code: string;
  version: string;
  name: string;
  status?: string;
}
export interface ComplianceProfile {
  id: string;
  code: string;
  name: string;
  description: string | null;
  jurisdiction: string | null;
  buyerOrganizationId: string | null;
  useCase: string | null;
  active: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  standards?: { id: string; passportStandardId: string; standard: (Omit<StandardRef, 'id'> & { status: string }) | null; required: boolean; effectiveTo: string | null }[];
}
export interface ApplicabilityRule {
  id: string;
  passportStandardId: string;
  effect: 'APPLIES' | 'EXCLUDES';
  subjectType: string | null;
  categoryId: string | null;
  materialId: string | null;
  productModelId: string | null;
  jurisdiction: string | null;
  actorType: string | null;
  organizationId: string | null;
  conditionJson: Record<string, unknown>[];
  priority: number;
  active: boolean;
}
export interface Finding {
  propertyId: string;
  code: string;
  key: string;
  title: string;
  required: boolean;
  result: (typeof REQUIREMENT_RESULTS)[number];
  reason: string;
  fieldKeys: string[];
  verificationStatus: string | null;
}
export interface Assessment {
  id: string;
  assessmentCode: string;
  runCode: string | null;
  complianceProfileId: string | null;
  standard: StandardRef | null;
  subjectId: string;
  passportVersion: { id: string; versionNumber: number; status: string } | null;
  status: AssessmentStatus;
  verificationStatus: 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'REJECTED';
  trustLabel: TrustLabel;
  assessmentMethod: string;
  conditions: string | null;
  findings: Finding[];
  overrides: { propertyId: string; result: string; reason: string }[] | null;
  assessedAt: string | null;
  expiresAt: string | null;
  supersededById: string | null;
  verificationNote?: string | null;
  invalidationReason?: string | null;
}
export interface ComplianceSummary {
  certificateId: string;
  passportCode: string;
  currentVersionId: string | null;
  activeDisqualifications: number;
  note: string;
  standards: {
    standard: StandardRef | null;
    complianceProfileId: string | null;
    assessmentId: string;
    assessmentCode: string;
    status: AssessmentStatus;
    trustLabel: TrustLabel;
    conditions: string | null;
    assessedAt: string | null;
    expiresAt: string | null;
    reassessmentNeeded: boolean;
  }[];
}
export const TRUST_TEXT: Record<TrustLabel, string> = { SELF_ASSESSED: 'Self-checked by the company', VERIFIED_BY_MINMEG: 'Confirmed by MINMEG', REJECTED_BY_MINMEG: 'Rejected by MINMEG' };
export const ASSESSMENT_TEXT: Record<AssessmentStatus, string> = {
  PENDING: 'Waiting for checks',
  IN_REVIEW: 'In review',
  COMPLIANT: 'Meets the standard',
  NON_COMPLIANT: 'Does not meet the standard',
  CONDITIONAL: 'Meets it, with conditions',
  EXPIRED: 'Expired',
  INVALIDATED: 'Withdrawn',
};
export const assessmentTone = (s: AssessmentStatus) => (s === 'COMPLIANT' ? 'ACTIVE' : s === 'CONDITIONAL' || s === 'PENDING' || s === 'IN_REVIEW' ? 'PENDING' : 'CANCELLED');
export const RESULT_TEXT: Record<(typeof REQUIREMENT_RESULTS)[number], string> = {
  SATISFIED: 'Met',
  MISSING: 'Missing',
  NOT_APPLICABLE: 'Does not apply',
  PENDING_VERIFICATION: 'Waiting for a check',
  NO_EVIDENCE: 'No evidence',
  NOT_SATISFIED: 'Not met',
};
export const resultTone = (r: (typeof REQUIREMENT_RESULTS)[number]) => (r === 'SATISFIED' || r === 'NOT_APPLICABLE' ? 'ACTIVE' : r === 'PENDING_VERIFICATION' ? 'PENDING' : 'CANCELLED');
