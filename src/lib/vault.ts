/*
 * Group 03 document vault + the Group 02 access pieces merchants use on their files
 * (docs/new/frontend/implementation/step-2.3-shared-resources-vault.md B1–B3).
 * Shapes follow the backend's Swagger schemas (minmeg-backend-ts src/docs/vault.docs.ts,
 * shared-resources.docs.ts).
 */

export interface Paged<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
}

export const FILE_CLASSES = ['DOCUMENT', 'IMAGE', 'VIDEO', 'REPORT', 'CERTIFICATE', 'LICENSE', 'EVIDENCE', 'CONTRACT', 'OTHER'] as const;
export type FileClass = (typeof FILE_CLASSES)[number];
/** PUBLIC is set by MINMEG staff only */
export const OWNER_ACCESS_MODES = ['PRIVATE', 'AUTHENTICATED', 'POLICY_CONTROLLED'] as const;
export type AccessMode = (typeof OWNER_ACCESS_MODES)[number] | 'PUBLIC';
export type FileStatus = 'UPLOADING' | 'PROCESSING' | 'ACTIVE' | 'QUARANTINED' | 'ARCHIVED' | 'DELETED';
export type RetentionStatus = 'ACTIVE' | 'LEGAL_HOLD' | 'RETENTION_LOCKED' | 'EXPIRABLE';

export interface VaultFile {
  id: string;
  fileCode: string;
  ownerOrganizationId: string;
  folderId: string | null;
  displayName: string;
  originalFilename: string;
  fileClass: FileClass;
  mimeType: string;
  extension: string | null;
  sizeBytes: number;
  checksum: string | null;
  checksumAlgorithm: string;
  accessMode: AccessMode;
  visibilityPolicyId: string | null;
  malwareScanStatus: string;
  retentionStatus: RetentionStatus;
  status: FileStatus;
  uploadedBy: string;
  uploadedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** GET /storage/files/:id only */
  folder?: { id: string; name: string; status: string } | null;
  activeShareLinks?: number;
}

export interface FolderNode {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  parentFolderId: string | null;
  fileCount: number;
  children: FolderNode[];
}

export interface FolderTree {
  ownerOrganizationId: string;
  rootFileCount: number;
  folders: FolderNode[];
}

export interface ContentLink {
  url: string;
  expiresAt: string;
  disposition: 'inline' | 'attachment';
}

export const SHARE_SCOPES = ['SPECIFIC_EMAIL', 'SPECIFIC_ORGANIZATION', 'AUTHENTICATED_LINK', 'PUBLIC_LINK'] as const;
export type ShareScope = (typeof SHARE_SCOPES)[number] | 'SPECIFIC_USER';
export type SharePermission = 'VIEW' | 'DOWNLOAD';

export interface ShareLink {
  id: string;
  fileAssetId: string;
  accessScope: ShareScope;
  targetOrganizationId: string | null;
  targetEmail: string | null;
  permission: SharePermission;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  remainingUses: number | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
}

/** POST …/share-links only: the token is shown this once */
export interface ShareLinkCreated extends ShareLink {
  token: string;
  shareUrl: string;
  emailSent?: boolean;
}

export interface AccessLogEntry {
  id: string;
  actorUserId: string | null;
  actorOrganizationId: string | null;
  shareLinkId: string | null;
  accessType: 'PREVIEW' | 'DOWNLOAD' | 'STREAM' | 'SHARE_LINK' | 'METADATA';
  decision: 'ALLOWED' | 'DENIED';
  denialReason: string | null;
  occurredAt: string;
}

export interface VisibilityPolicy {
  id: string;
  code: string;
  name: string;
  description: string | null;
  accessScope: string;
  active: boolean;
  requiresExplicitGrant: boolean;
}

export interface ResourceVisibility {
  effectivePolicy: (Pick<VisibilityPolicy, 'id' | 'code' | 'name' | 'accessScope' | 'active'> & { source: 'ASSIGNMENT' | 'RESOURCE_DEFAULT' | 'FALLBACK' }) | null;
  assignments?: { id: string; visibilityPolicyId: string; contextType: string; active: boolean; policy: Pick<VisibilityPolicy, 'id' | 'name' | 'code'> }[];
}

/** What merchants can choose. TRADE_PARTICIPANT stays readable on older grants, but isn't offered (owner, 2026-10-31). */
export const GRANTEE_TYPES = ['ORGANIZATION', 'USER'] as const;
export type GranteeType = (typeof GRANTEE_TYPES)[number] | 'TRADE_PARTICIPANT';
export const GRANT_PERMISSIONS = ['READ', 'VIEW_EVIDENCE', 'DOWNLOAD'] as const;
export type GrantPermission = (typeof GRANT_PERMISSIONS)[number] | 'VIEW_PRIVATE_DATA' | 'SHARE' | 'MANAGE_ACCESS';

export interface Grant {
  id: string;
  resourceType: string;
  resourceId: string;
  granterOrganizationId: string;
  granteeType: GranteeType;
  granteeId: string;
  permissions: GrantPermission[];
  effectiveFrom: string | null;
  expiresAt: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  reason: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export const ATTACHMENT_TYPES = ['LICENSE', 'CERTIFICATE', 'COMPLIANCE_EVIDENCE', 'ORIGIN_EVIDENCE', 'ASSAY', 'INSPECTION_REPORT', 'CONTRACT', 'SHIPPING_DOCUMENT', 'PHOTO', 'OTHER'] as const;

/** A vault file attached to a record as evidence; MINMEG staff verify it, never the owner */
export interface Attachment {
  id: string;
  fileAssetId: string;
  attachmentType: string;
  title: string | null;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  verificationNote: string | null;
  validUntil: string | null;
  expired: boolean;
  linkedAt: string;
  file: { id: string; displayName: string; status: string } | null;
}

export interface Assignment {
  id: string;
  label?: { name: string };
  tag?: { name: string };
}

/** GET /storage/share/:token */
export type ShareOpened =
  | { verificationRequired: true; emailHint: string; permission: SharePermission }
  | { verificationRequired?: undefined; file: { displayName: string; fileClass: string; sizeBytes: number }; permission: SharePermission; url: string; expiresAt: string };

/** The types and size the backend accepts (src/modules/vault/services/file-types.ts) */
export const ACCEPTED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG picture',
  'image/png': 'PNG picture',
  'image/webp': 'WebP picture',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'text/csv': 'CSV',
  'text/plain': 'Text',
};
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const LABELS: Record<string, string> = {
  DOCUMENT: 'Document',
  IMAGE: 'Picture',
  VIDEO: 'Video',
  REPORT: 'Report',
  CERTIFICATE: 'Certificate',
  LICENSE: 'Licence',
  EVIDENCE: 'Evidence',
  CONTRACT: 'Contract',
  OTHER: 'Other',
  PRIVATE: 'Only my company',
  AUTHENTICATED: 'Anyone signed in to MINMEG',
  POLICY_CONTROLLED: 'Follow a visibility rule',
  PUBLIC: 'Public (set by MINMEG)',
  SPECIFIC_EMAIL: 'One email address (with a code)',
  SPECIFIC_ORGANIZATION: 'One company on MINMEG',
  SPECIFIC_USER: 'One person on MINMEG',
  AUTHENTICATED_LINK: 'Anyone signed in, with the link',
  PUBLIC_LINK: 'Anyone with the link',
  VIEW: 'View only',
  DOWNLOAD: 'View and download',
  ORGANIZATION: 'A company',
  USER: 'A person',
  EMAIL: 'An email address',
  TRADE_PARTICIPANT: "A trade's buyer, supplier and inspectors",
  COMPLIANCE_EVIDENCE: 'Compliance evidence',
  ORIGIN_EVIDENCE: 'Origin evidence',
  INSPECTION_REPORT: 'Inspection report',
  SHIPPING_DOCUMENT: 'Shipping document',
  ASSAY: 'Assay',
  PHOTO: 'Photo',
  UNVERIFIED: 'Waiting for MINMEG',
  PENDING: 'Being checked',
  VERIFIED: 'Verified',
  FAILED: 'Not accepted',
  READ: 'See it',
  VIEW_EVIDENCE: 'See its evidence',
  LEGAL_HOLD: 'Legal hold',
  RETENTION_LOCKED: 'Retention lock',
};
export const label = (v: string | null | undefined) => (v ? LABELS[v] ?? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') : '—');

export const fileClassFor = (mimeType: string): FileClass => (mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT');

/** "1.4 MB", "320 KB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** SHA-256 of the file, sent with the upload so the server can prove it stored exactly these bytes */
export async function sha256Hex(file: Blob): Promise<string | undefined> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return undefined;
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Folder tree → flat list in tree order with depth, for pickers */
export function flattenFolders(nodes: readonly FolderNode[], depth = 0, out: (FolderNode & { depth: number })[] = []) {
  for (const n of nodes) {
    out.push({ ...n, depth });
    flattenFolders(n.children ?? [], depth + 1, out);
  }
  return out;
}

export function listParams(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}
