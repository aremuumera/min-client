'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, FormField, Input, NativeSelect, PageHeader, SideSheet, StatusBadge, useConfirm } from '@/components/ui';
import { DocumentsTabs } from '@/components/documents/documents-tabs';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { companyEvidenceHelp } from '@/lib/help/documents';
import { RequireAccess } from '@/lib/permissions';
import { ATTACHMENT_TYPES, label, type Attachment } from '@/lib/vault';
import { useAppSelector } from '@/redux/hooks';
import { useAttachEvidenceMutation, useGetCompanyEvidenceQuery, useGetCompanyLabelsQuery, useGetCompanyTagsQuery, useGetFilesQuery, useUnlinkEvidenceMutation } from '@/redux/features/vault/vaultApi';

/* Company evidence (step 2.3 B4): vault files attached to the company for MINMEG to verify */
const TONE: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = { UNVERIFIED: 'neutral', PENDING: 'warning', VERIFIED: 'success', FAILED: 'error' };

function AttachSheet({ open, orgId, onClose }: { open: boolean; orgId: string; onClose: () => void }) {
  const files = useGetFilesQuery({ status: 'ACTIVE', limit: 100 }, { skip: !open });
  const [attach, state] = useAttachEvidenceMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [fileId, setFileId] = React.useState('');
  const [type, setType] = React.useState('LICENSE');
  const [title, setTitle] = React.useState('');
  const [validUntil, setValidUntil] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setFileId('');
    setType('LICENSE');
    setTitle('');
    setValidUntil('');
    setErrors({});
    setFormError(undefined);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next: Record<string, string> = {};
    if (!fileId) next.fileAssetId = 'Choose a file from your documents';
    if (validUntil && new Date(`${validUntil}T23:59:00`).getTime() <= Date.now()) next.validUntil = 'Choose a date in the future';
    setErrors(next);
    if (Object.keys(next).length) return;
    const name = files.data?.data.find((f) => f.id === fileId)?.displayName ?? 'this file';
    if (!(await confirm({ title: `Attach ${name}?`, description: `As ${label(type).toLowerCase()} on your company. MINMEG staff can open it to verify it.`, confirmLabel: 'Attach' }))) return;
    try {
      await attach({ resourceId: orgId, fileAssetId: fileId, attachmentType: type, ...(title.trim() ? { title: title.trim() } : {}), ...(validUntil ? { validUntil: new Date(`${validUntil}T23:59:00`).toISOString() } : {}), idempotencyKey: key }).unwrap();
      done();
      toast.success('Attached: MINMEG will check it');
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      else setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Attach evidence"
      subtitle="Choose a file you have already uploaded to Documents"
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={state.isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="evidence-form" loading={state.isLoading} disabled={state.isLoading}>
            Attach
          </Button>
        </>
      }
    >
      <form id="evidence-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <FormField label="File" htmlFor="evidence-file" required error={errors.fileAssetId} help={files.isSuccess && !files.data.data.length ? 'No files yet: upload one in My documents first' : undefined}>
          <NativeSelect id="evidence-file" value={fileId} onValueChange={setFileId} options={(files.data?.data ?? []).map((f) => ({ value: f.id, label: f.displayName }))} placeholder={files.isLoading ? 'Loading…' : 'Choose…'} error={!!errors.fileAssetId} />
        </FormField>
        <FormField label="What it proves" htmlFor="evidence-type">
          <NativeSelect id="evidence-type" value={type} onValueChange={setType} options={ATTACHMENT_TYPES.map((t) => ({ value: t, label: label(t) }))} />
        </FormField>
        <FormField label="Title" htmlFor="evidence-title" help="Empty: the file's name" error={errors.title}>
          <Input id="evidence-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} autoComplete="off" />
        </FormField>
        <FormField label="Valid until" htmlFor="evidence-valid" help="The date on the document; you are warned 30 and 7 days before" error={errors.validUntil}>
          <Input id="evidence-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} error={!!errors.validUntil} />
        </FormField>
      </form>
      {dialog}
    </SideSheet>
  );
}

function EvidencePage() {
  const { isTeamMember, ownerUserId, user } = useAppSelector((s) => s.auth);
  const orgId = ((isTeamMember ? ownerUserId : user?.id) as string | undefined) ?? '';
  const evidence = useGetCompanyEvidenceQuery(orgId, { skip: !orgId });
  const labels = useGetCompanyLabelsQuery(orgId, { skip: !orgId });
  const tags = useGetCompanyTagsQuery(orgId, { skip: !orgId });
  const [unlink, unlinkState] = useUnlinkEvidenceMutation();
  const [attaching, setAttaching] = React.useState(false);
  const [removing, setRemoving] = React.useState<Attachment | null>(null);
  const rows = evidence.data?.data ?? [];
  const marks = [...(labels.data?.data ?? []).map((a) => a.label?.name), ...(tags.data?.data ?? []).map((a) => a.tag?.name)].filter(Boolean) as string[];

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
    <div>
      <PageHeader
        title="Company evidence"
        help={companyEvidenceHelp}
        description="Documents that prove something about your company, checked by MINMEG."
        actions={
          <Button onClick={() => setAttaching(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Attach evidence
          </Button>
        }
      />
      <DocumentsTabs current={paths.dashboard.documents.evidence} />

      {evidence.isError ? (
        <Alert severity="error">{toApiError(evidence.error).message}</Alert>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-steel">{evidence.isLoading ? 'Loading…' : 'No evidence yet. Attach your licences and certificates so MINMEG can verify them.'}</p>
      ) : (
        <ul aria-label="Company evidence" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline bg-canvas">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-ink">{a.title ?? a.file?.displayName ?? '—'}</p>
                <p className="text-xs text-steel">
                  {label(a.attachmentType)} · attached {formatDate(a.linkedAt)}
                  {a.validUntil ? ` · valid until ${formatDate(a.validUntil)}` : ''}
                  {a.expired ? ' (expired)' : ''}
                </p>
                {a.verificationNote && <p className="mt-1 text-xs text-steel">MINMEG: {a.verificationNote}</p>}
              </div>
              <StatusBadge tone={TONE[a.verificationStatus]}>{label(a.verificationStatus)}</StatusBadge>
              <Button size="sm" variant="text" color="secondary" onClick={() => setRemoving(a)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Labels and tags on your company</h2>
        {marks.length ? (
          <ul className="flex flex-wrap gap-2">
            {marks.map((m) => (
              <li key={m} className="rounded-full border border-hairline px-3 py-1 text-sm text-ink">
                {m}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">None yet.</p>
        )}
      </section>

      <AttachSheet open={attaching} orgId={orgId} onClose={() => setAttaching(false)} />
      <ConfirmDialog
        open={!!removing}
        tone="error"
        title="Remove this evidence?"
        description="The file stays in your documents. Evidence cited by a disqualification can't be removed."
        reason={{ label: 'Reason', minLength: 3 }}
        confirmLabel="Remove"
        loading={unlinkState.isLoading}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess teamKey="documents">
      <EvidencePage />
    </RequireAccess>
  );
}
