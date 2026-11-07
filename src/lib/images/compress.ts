/*
 * Shrinks a picture in the browser before it is uploaded, so a 6 MB phone photo goes up as a few
 * hundred KB. The backend still checks and re-processes every image; this only saves time and data.
 */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** The backend refuses larger files (master-data image upload) */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface CompressOptions {
  /** Longest side in pixels */
  maxSize?: number;
  /** 0–1 */
  quality?: number;
}

/** Resized to fit maxSize×maxSize and re-encoded as WebP; the original is kept when that is not smaller */
export async function compressImage(file: File, { maxSize = 1600, quality = 0.85 }: CompressOptions = {}): Promise<File> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return file; // PDFs, videos and so on go up unchanged
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // not decodable here; the backend decides
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp', lastModified: Date.now() });
}

/** Pictures among the files are compressed; everything else stays as it is. Not for evidence, which must stay byte-for-byte. */
export const compressImages = (files: Iterable<File>) => Promise.all(Array.from(files).map((f) => compressImage(f)));

/** "1.4 MB", "320 KB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
