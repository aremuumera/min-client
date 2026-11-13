import { config } from '@/lib/config';
import { toApiError } from '@/lib/api/errors';

/*
 * Decision #127: a file made by the server (a CSV export, a passport package), fetched with the
 * session token and saved under the name the server gives it. For a CSV list the answer also says
 * how many records match and how many are in the file.
 */
export async function downloadFile(path: string, params: Record<string, string | number | boolean | undefined | null>, fallbackName: string, token: string | null): Promise<{ total: number | null; rows: number | null }> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  const qs = query.toString();
  const res = await fetch(`${config.api.baseUrl}${path}${qs ? `?${qs}` : ''}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw toApiError({ status: res.status, data: body });
  }
  const named = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1];
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = named ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  const n = (h: string) => (res.headers.get(h) === null ? null : Number(res.headers.get(h)));
  return { total: n('X-Export-Total'), rows: n('X-Export-Rows') };
}
