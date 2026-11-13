import { config } from '@/lib/config';
import { toApiError } from '@/lib/api/errors';

/*
 * Bulk jobs (decision #128): imports of batches and passports from a spreadsheet, and one action on
 * many passports. A job is checked first (nothing is saved), then run. These calls carry files, so
 * they are plain requests with the session token, like the downloads.
 */
export type BulkJobStatus = 'CHECK_QUEUED' | 'CHECKING' | 'CHECKED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export interface BulkJob {
  id: string;
  kind: string;
  status: BulkJobStatus;
  fileName: string | null;
  total: number;
  checkValid: number;
  checkInvalid: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  error: string | null;
  createdAt: string;
}
export interface BulkItem {
  id: string;
  position: number;
  checkStatus: 'PENDING' | 'VALID' | 'INVALID';
  checkMessage: string | null;
  status: 'PENDING' | 'OK' | 'FAILED' | 'SKIPPED';
  message: string | null;
  recordCode: string | null;
}
export interface ImportField {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  example: string;
}
export interface ImportPreview {
  headers: string[];
  totalRows: number;
  sampleRows: string[][];
  fields: ImportField[];
  suggestedMapping: Record<string, string>;
  unmappedRequired: string[];
}
export type ImportKind = 'batches' | 'passports';

export const JOB_STATUS_TEXT: Record<BulkJobStatus, string> = { CHECK_QUEUED: 'Waiting to be checked', CHECKING: 'Being checked', CHECKED: 'Checked, not imported yet', QUEUED: 'Waiting to start', RUNNING: 'Running', COMPLETED: 'Finished', FAILED: 'Stopped by an error', CANCELLED: 'Cancelled' };
/** The job is still moving on its own: keep asking for its state */
export const jobIsMoving = (j: BulkJob) => ['CHECK_QUEUED', 'CHECKING', 'QUEUED', 'RUNNING'].includes(j.status);

async function call<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${config.api.baseUrl}${path}`, { ...init, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) }, credentials: 'include' });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  if (!res.ok) throw toApiError({ status: res.status, data: body });
  return (body as { data: T }).data;
}
const form = (file: File, fields: Record<string, string | undefined>) => {
  const f = new FormData();
  f.append('file', file);
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== '') f.append(k, v);
  return f;
};
const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

export const bulk = {
  preview: (kind: ImportKind, file: File, fields: Record<string, string | undefined>, token: string | null) => call<ImportPreview>(`/imports/${kind}/preview`, token, { method: 'POST', body: form(file, fields) }),
  start: (kind: ImportKind, file: File, fields: Record<string, string | undefined>, token: string | null) => call<BulkJob>(`/imports/${kind}`, token, { method: 'POST', body: form(file, fields) }),
  startAction: (body: Record<string, unknown>, token: string | null) => call<BulkJob>('/bulk-jobs', token, json(body)),
  job: (id: string, token: string | null) => call<BulkJob>(`/bulk-jobs/${id}`, token),
  items: (id: string, result: string, token: string | null) => call<BulkItem[]>(`/bulk-jobs/${id}/items?result=${result}&limit=50`, token),
  run: (id: string, skipInvalid: boolean, token: string | null) => call<BulkJob>(`/bulk-jobs/${id}/run`, token, json(skipInvalid ? { skipInvalid: true } : {})),
  cancel: (id: string, token: string | null) => call<BulkJob>(`/bulk-jobs/${id}/cancel`, token, json({})),
};
