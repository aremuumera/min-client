import { config } from '@/lib/config';
import { toApiError } from '@/lib/api/errors';

/*
 * Step 2.9d: the server-made PDF of a certificate or passport (GET /certificates/{id}/pdf), saved
 * with its code as the file name. Fetched with the session token, never through a public link.
 */
export async function downloadCertificatePdf(id: string, code: string, token: string | null): Promise<void> {
  const res = await fetch(`${config.api.baseUrl}/certificates/${id}/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw toApiError({ status: res.status, data: body });
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${code}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
