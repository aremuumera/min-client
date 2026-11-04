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
