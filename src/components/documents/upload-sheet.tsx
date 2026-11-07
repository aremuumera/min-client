'use client';

import * as React from 'react';
import { CheckCircle2, FileUp, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button, FormField, IconButton, DropdownSelect, SideSheet, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { ACCEPTED_FILE_TYPES, FILE_CLASSES, fileClassFor, flattenFolders, formatBytes, label, MAX_FILE_BYTES, sha256Hex, type FileClass } from '@/lib/vault';
import { sendFileBytes } from '@/lib/vault-upload';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useGetFolderTreeQuery, useInitiateUploadMutation, vaultApi } from '@/redux/features/vault/vaultApi';

interface Item {
  key: string;
  file: File;
  fileClass: FileClass;
  /** Same key on a retry, so the backend never declares the file twice */
  idempotencyKey: string;
  state: 'ready' | 'uploading' | 'done' | 'failed' | 'refused';
  progress: number;
  error?: string;
}

const CLASS_OPTIONS = FILE_CLASSES.map((c) => ({ value: c, label: label(c) }));
const ACCEPT = Object.keys(ACCEPTED_FILE_TYPES).join(',');

function check(file: File): string | undefined {
  if (!ACCEPTED_FILE_TYPES[file.type]) return 'This type is not accepted: use PDF, pictures, Word, Excel, CSV or text';
  if (file.size === 0) return 'The file is empty';
  if (file.size > MAX_FILE_BYTES) return `${formatBytes(file.size)}: the most is 20 MB`;
}

/**
 * Upload into the vault: POST /storage/files/initiate-upload declares the file, then its bytes go up
 * unchanged with a SHA-256 the server checks. Each file has its own progress and can be retried.
 */
export function UploadSheet({ open, folderId, onClose }: { open: boolean; folderId: string | null; onClose: () => void }) {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const dispatch = useAppDispatch();
  const tree = useGetFolderTreeQuery(undefined, { skip: !open });
  const [initiate] = useInitiateUploadMutation();
  const { confirm, dialog } = useConfirm();
  const input = React.useRef<HTMLInputElement>(null);

  const [target, setTarget] = React.useState('');
  const [items, setItems] = React.useState<Item[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTarget(folderId ?? '');
    setItems([]);
  }, [open, folderId]);

  const folders = React.useMemo(
    () => flattenFolders(tree.data?.data.folders ?? []).filter((f) => f.status === 'ACTIVE').map((f) => ({ value: f.id, label: `${' '.repeat(f.depth)}${f.name}` })),
    [tree.data],
  );
  const patch = (key: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const add = (files: FileList | null) => {
    if (!files) return;
    const next: Item[] = Array.from(files).map((file) => {
      const problem = check(file);
      return { key: newIdempotencyKey(), file, fileClass: fileClassFor(file.type), idempotencyKey: newIdempotencyKey(), state: problem ? 'refused' : 'ready', progress: 0, error: problem };
    });
    setItems((prev) => [...prev, ...next]);
  };

  const uploadOne = async (item: Item) => {
    patch(item.key, { state: 'uploading', progress: 0, error: undefined });
    try {
      const declared = await initiate({
        folderId: target || null,
        originalFilename: item.file.name,
        mimeType: item.file.type,
        sizeBytes: item.file.size,
        fileClass: item.fileClass,
        idempotencyKey: item.idempotencyKey,
      }).unwrap();
      const checksum = await sha256Hex(item.file);
      await sendFileBytes(declared.data.file.id, item.file, { token, checksum, onProgress: (f) => patch(item.key, { progress: f }) });
      patch(item.key, { state: 'done', progress: 1 });
      return true;
    } catch (err) {
      patch(item.key, { state: 'failed', error: toApiError(err).message });
      return false;
    }
  };

  const waiting = items.filter((i) => i.state === 'ready' || i.state === 'failed');
  const start = async () => {
    if (!waiting.length) return;
    const where = folders.find((f) => f.value === target)?.label.trim() ?? 'the top of your documents';
    const ok = await confirm({
      title: `Upload ${waiting.length} ${waiting.length === 1 ? 'file' : 'files'}?`,
      description: `Into ${where}. Only your company can see them until you share them.`,
      confirmLabel: 'Upload',
    });
    if (!ok) return;
    setBusy(true);
    let okCount = 0;
    for (const item of waiting) if (await uploadOne(item)) okCount += 1;
    setBusy(false);
    dispatch(vaultApi.util.invalidateTags(['Files', 'Folders']));
    if (okCount) toast.success(`${okCount} ${okCount === 1 ? 'file' : 'files'} uploaded`);
  };

  const allDone = items.length > 0 && items.every((i) => i.state === 'done' || i.state === 'refused');

  return (
    <SideSheet
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="lg"
      title="Upload documents"
      subtitle="PDF, pictures, Word, Excel, CSV or text, up to 20 MB each. Files are stored exactly as they are."
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={busy}>
            {allDone ? 'Close' : 'Cancel'}
          </Button>
          <Button type="button" onClick={start} loading={busy} disabled={busy || !waiting.length}>
            Upload {waiting.length || ''} {waiting.length === 1 ? 'file' : 'files'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Folder" htmlFor="upload-folder">
          <DropdownSelect id="upload-folder" value={target} onValueChange={setTarget} options={folders} placeholder="Top level (no folder)" disabled={busy} />
        </FormField>

        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            add(e.dataTransfer.files);
          }}
          disabled={busy}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-hairline-strong bg-surface px-4 py-8 text-center hover:bg-surface-soft"
        >
          <FileUp className="h-6 w-6 text-primary-pressed" aria-hidden />
          <span className="font-medium text-ink">Choose files, or drop them here</span>
          <span className="text-xs text-steel">You can pick several at once</span>
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" aria-label="Files to upload" onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />

        {items.length > 0 && (
          <ul aria-label="Files to upload" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
            {items.map((i) => (
              <li key={i.key} className="flex flex-col gap-2 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{i.file.name}</p>
                    <p className="text-xs text-steel">
                      {formatBytes(i.file.size)}
                      {i.state === 'done' && ' · uploaded'}
                    </p>
                  </div>
                  {i.state === 'done' && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-pressed" aria-label="Uploaded" />}
                  {(i.state === 'failed' || i.state === 'refused') && <XCircle className="h-5 w-5 shrink-0 text-semantic-error-text" aria-hidden />}
                  {i.state === 'failed' && !busy && (
                    <IconButton aria-label={`Retry ${i.file.name}`} onClick={() => void uploadOne(i).then((ok) => ok && dispatch(vaultApi.util.invalidateTags(['Files', 'Folders'])))}>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                  {(i.state === 'ready' || i.state === 'refused' || i.state === 'failed') && !busy && (
                    <IconButton aria-label={`Remove ${i.file.name}`} onClick={() => setItems((prev) => prev.filter((x) => x.key !== i.key))}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                </div>
                {i.state === 'ready' && (
                  <DropdownSelect aria-label={`Kind of document: ${i.file.name}`} value={i.fileClass} onValueChange={(v) => patch(i.key, { fileClass: v as FileClass })} options={CLASS_OPTIONS} />
                )}
                {i.state === 'uploading' && (
                  <div role="progressbar" aria-label={`Uploading ${i.file.name}`} aria-valuenow={Math.round(i.progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className="h-full bg-primary-500 transition-[width]" style={{ width: `${Math.round(i.progress * 100)}%` }} />
                  </div>
                )}
                {i.error && (
                  <p className="text-xs text-semantic-error-text" role="alert">
                    {i.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {dialog}
    </SideSheet>
  );
}
