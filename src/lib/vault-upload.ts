import { config } from '@/lib/config';
import { toApiError, type ApiError } from '@/lib/api/errors';
import type { VaultFile } from '@/lib/vault';

/*
 * The second step of a vault upload: the file's bytes, sent unchanged (no compression: the server
 * checks size, real type and SHA-256). XMLHttpRequest instead of fetch so the progress bar moves.
 */
export function sendFileBytes(
  fileId: string,
  file: File,
  opts: { token: string | null; checksum?: string; onProgress: (fraction: number) => void },
): Promise<VaultFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    if (opts.checksum) form.append('checksum', opts.checksum);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${config.api.baseUrl}/storage/files/${fileId}/complete-upload`);
    xhr.withCredentials = true;
    if (opts.token) xhr.setRequestHeader('Authorization', `Bearer ${opts.token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve((body as { data: VaultFile }).data);
      reject(toApiError({ status: xhr.status, data: body }) satisfies ApiError);
    };
    xhr.onerror = () => reject(toApiError({ status: 'FETCH_ERROR' }));
    xhr.send(form);
  });
}
