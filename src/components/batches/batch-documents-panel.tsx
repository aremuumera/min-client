'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, FormField, NativeSelect, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { batchLabel, type BatchAttachment } from '@/lib/batches';
import { formatDate } from '@/lib/format';
import { ATTACHMENT_TYPES, label } from '@/lib/vault';
import { useAttachToBatchMutation, useGetBatchAttachmentsQuery, useUnlinkFromBatchMutation } from '@/redux/features/batches/batches_api';
import { useGetFilesQuery } from '@/redux/features/vault/vaultApi';

/** Vault files attached to a batch as evidence. Staff verify them, never the owner. */
export function BatchDocumentsPanel({ batchId, batchCode }: { batchId: string; batchCode: string }) {
  const attachments = useGetBatchAttachmentsQuery(batchId);
  const [adding, setAdding] = React.useState(false);
  const files = useGetFilesQuery({ status: 'ACTIVE', limit: 100 }, { skip: !adding });
  const [attach, attachState] = useAttachToBatchMutation();
  const [unlink, unlinkState] = useUnlinkFromBatchMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [fileId, setFileId] = React.useState('');
  const [type, setType] = React.useState('ORIGIN_EVIDENCE');
  const [error, setError] = React.useState<string>();
  const [removing, setRemoving] = React.useState<BatchAttachment | null>(null);
  const rows = attachments.data?.data ?? [];

  const submit = async () => {
    if (!fileId) return setError('Choose a file from your documents');
    setError(undefined);
    const name = files.data?.data.find((f) => f.id === fileId)?.displayName ?? 'this file';
    if (!(await confirm({ title: `Attach ${name}?`, description: `As ${label(type).toLowerCase()} on ${batchCode}. MINMEG staff can open it to verify it.`, confirmLabel: 'Attach' }))) return;
    try {
      await attach({ resourceId: batchId, fileAssetId: fileId, attachmentType: type, idempotencyKey: key }).unwrap();
      done();
      toast.success('Attached');
      setAdding(false);
      setFileId('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const remove = async (reason?: string) => {
    if (!removing) return;
    try {
      await unlink({ id: removing.id, reason: reason ?? '' }).unwrap();
      toast.success('Removed: the file stays in your documents');
      setRemoving(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {attachments.isError ? (
        <Alert severity="error">{toApiError(attachments.error).message}</Alert>
      ) : rows.length === 0 ? (
        <p className="text-sm text-steel">{attachments.isLoading ? 'Loading…' : 'No documents yet. Attach assay results, weighbridge tickets or origin papers from your documents.'}</p>
      ) : (
        <ul aria-label="Batch documents" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-ink">{a.title ?? a.file?.displayName ?? '—'}</p>
                <p className="text-xs text-steel">
                  {label(a.attachmentType)} · attached {formatDate(a.linkedAt)}
                </p>
              </div>
              <StatusBadge status={a.verificationStatus}>{batchLabel(a.verificationStatus)}</StatusBadge>
              <Button size="sm" variant="text" color="secondary" onClick={() => setRemoving(a)} aria-label={`Remove ${a.title ?? a.file?.displayName ?? 'document'}`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
          {error && <Alert severity="error">{error}</Alert>}
          <FormField label="File" htmlFor="batch-doc-file" required help={files.isSuccess && !files.data.data.length ? 'No files yet: upload one in My documents first.' : undefined}>
            <NativeSelect id="batch-doc-file" value={fileId} onValueChange={setFileId} options={(files.data?.data ?? []).map((f) => ({ value: f.id, label: f.displayName }))} placeholder={files.isLoading ? 'Loading…' : 'Choose a file'} />
          </FormField>
          <FormField label="What it proves" htmlFor="batch-doc-type">
            <NativeSelect id="batch-doc-type" value={type} onValueChange={setType} options={ATTACHMENT_TYPES.map((t) => ({ value: t, label: label(t) }))} />
          </FormField>
          <div className="flex gap-2">
            <Button variant="outlined" color="secondary" onClick={() => setAdding(false)} disabled={attachState.isLoading}>
              Cancel
            </Button>
            <Button onClick={submit} loading={attachState.isLoading}>
              Attach
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outlined" className="self-start" onClick={() => setAdding(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
          Attach a document
        </Button>
      )}

      <ConfirmDialog
        open={!!removing}
        tone="error"
        title={`Remove ${removing?.title ?? removing?.file?.displayName ?? 'this document'}?`}
        description="It stops counting as evidence for this batch. The file stays in your documents."
        reason={{ label: 'Reason', minLength: 3 }}
        confirmLabel="Remove"
        loading={unlinkState.isLoading}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
      {dialog}
    </div>
  );
}
