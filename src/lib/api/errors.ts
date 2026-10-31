/*
 * One error shape for every API call (docs/new/frontend/architecture/frontend-architecture.md §3).
 * The backend answers { success: false, error: { message, code, statusCode, requestId?, errors? } };
 * validation failures read "Validation failed: body.note: note is required, body.x: …" and are split
 * into per-field messages so forms can show each one under its field.
 */
export interface ApiError {
  /** HTTP status, or 0 when the request never reached the server */
  status: number;
  code: string;
  message: string;
  /** Field name (without body. / query. / params.) → message */
  fields: Record<string, string>;
  requestId?: string;
}

interface BackendErrorBody {
  message?: string;
  error?: { message?: string; code?: string; statusCode?: number; requestId?: string; errors?: string[] } | string;
}

const FIELD = /(?:^|,\s*)(?:body|query|params)\.([\w.[\]]+):\s*(.*?)(?=,\s*(?:body|query|params)\.|$)/g;

export function fieldErrors(message: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const rest = message.replace(/^Validation failed:\s*/, '');
  if (rest === message) return fields;
  for (const m of rest.matchAll(FIELD)) if (!fields[m[1]]) fields[m[1]] = m[2].trim();
  return fields;
}

/** Turns an RTK Query / fetch / thrown error into ApiError */
export function toApiError(error: unknown): ApiError {
  const e = error as { status?: number | string; data?: BackendErrorBody; error?: string; message?: string } | undefined;
  if (!e) return { status: 0, code: 'UNKNOWN', message: 'Something went wrong', fields: {} };
  // already converted (e.g. rejected by an upload helper)
  if (typeof (error as ApiError).code === 'string' && typeof (error as ApiError).fields === 'object') return error as ApiError;

  if (e.status === 'FETCH_ERROR') return { status: 0, code: 'NETWORK', message: 'No connection to the server. Check your network and try again.', fields: {} };
  if (e.status === 'TIMEOUT_ERROR') return { status: 0, code: 'TIMEOUT', message: 'The server took too long to answer. Try again.', fields: {} };
  if (e.status === 'PARSING_ERROR') return { status: 0, code: 'BAD_RESPONSE', message: 'The server sent an unexpected answer.', fields: {} };

  if (typeof e.status === 'number') {
    const body = e.data ?? {};
    const err = typeof body.error === 'object' ? body.error : undefined;
    const message = err?.message ?? (typeof body.error === 'string' ? body.error : undefined) ?? body.message ?? `Request failed (${e.status})`;
    return { status: e.status, code: err?.code ?? String(e.status), message, fields: fieldErrors(message), requestId: err?.requestId };
  }
  return { status: 0, code: 'UNKNOWN', message: e.message ?? 'Something went wrong', fields: {} };
}
