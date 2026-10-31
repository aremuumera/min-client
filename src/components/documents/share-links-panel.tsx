'use client';

import * as React from 'react';
import { Copy, Link2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, FormField, Input, Modal, ModalBody, ModalFooter, ModalHeader, NativeSelect, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { label, SHARE_SCOPES, type ShareLink, type ShareLinkCreated, type SharePermission, type ShareScope } from '@/lib/vault';
import { useCreateShareLinkMutation, useGetShareLinksQuery, useRevokeShareLinkMutation } from '@/redux/features/vault/vaultApi';

const DAY = 24 * 3600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Share links on one file: GET / POST /storage/files/:id/share-links, DELETE /storage/share-links/:id.
 * Links expire within 30 days (a public link may work until revoked); the link is shown once.
 */
export function ShareLinksPanel({ fileId, fileName }: { fileId: string; fileName: string }) {
  const links = useGetShareLinksQuery(fileId);
  const [create, createState] = useCreateShareLinkMutation();
  const [revoke, revokeState] = useRevokeShareLinkMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();

  const [formOpen, setFormOpen] = React.useState(false);
  const [scope, setScope] = React.useState<ShareScope>('SPECIFIC_EMAIL');
  const [email, setEmail] = React.useState('');
  const [orgId, setOrgId] = React.useState('');
  const [permission, setPermission] = React.useState<SharePermission>('VIEW');
  const [expires, setExpires] = React.useState(() => toDateInput(new Date(Date.now() + 7 * DAY)));
  // the date picker's range, fixed when the panel opens
  const [range] = React.useState(() => ({ min: toDateInput(new Date(Date.now() + DAY)), max: toDateInput(new Date(Date.now() + 30 * DAY)) }));
  const [noExpiry, setNoExpiry] = React.useState(false);
  const [maxUses, setMaxUses] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();
  const [created, setCreated] = React.useState<ShareLinkCreated | null>(null);
  const [revoking, setRevoking] = React.useState<ShareLink | null>(null);

  const isPublic = scope === 'PUBLIC_LINK';
  const reset = () => {
    setScope('SPECIFIC_EMAIL');
    setEmail('');
    setOrgId('');
    setPermission('VIEW');
    setExpires(toDateInput(new Date(Date.now() + 7 * DAY)));
    setNoExpiry(false);
    setMaxUses('');
    setErrors({});
    setFormError(undefined);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next: Record<string, string> = {};
    if (scope === 'SPECIFIC_EMAIL' && !/^\S+@\S+\.\S+$/.test(email.trim())) next.targetEmail = 'Enter the email address';
    if (scope === 'SPECIFIC_ORGANIZATION' && !UUID.test(orgId.trim())) next.targetOrganizationId = "Paste the company's full MINMEG ID";
    const expiry = noExpiry && isPublic ? null : new Date(`${expires}T23:59:00`);
    if (expiry && (expiry.getTime() <= Date.now() + 60_000 || expiry.getTime() > Date.now() + 30 * DAY)) next.expiresAt = 'Choose a date within the next 30 days';
    if (maxUses && !(Number(maxUses) >= 1 && Number(maxUses) <= 1000)) next.maxUses = 'From 1 to 1000';
    setErrors(next);
    if (Object.keys(next).length) return;

    const ok = await confirm({
      title: `Share ${fileName}?`,
      description: `${label(scope)}, ${label(permission).toLowerCase()}, ${expiry ? `until ${expiry.toLocaleDateString()}` : 'until you revoke it'}. Every open is logged.`,
      confirmLabel: 'Create link',
    });
    if (!ok) return;
    try {
      const res = await create({
        fileId,
        accessScope: scope,
        permission,
        expiresAt: expiry ? expiry.toISOString() : null,
        ...(scope === 'SPECIFIC_EMAIL' ? { targetEmail: email.trim() } : {}),
        ...(scope === 'SPECIFIC_ORGANIZATION' ? { targetOrganizationId: orgId.trim() } : {}),
        ...(maxUses ? { maxUses: Number(maxUses) } : {}),
        idempotencyKey: key,
      }).unwrap();
      done();
      setFormOpen(false);
      reset();
      setCreated(res.data);
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      else setFormError(apiError.message);
    }
  };

  const doRevoke = async (reason?: string) => {
    if (!revoking) return;
    try {
      await revoke({ id: revoking.id, reason: reason ?? '' }).unwrap();
      toast.success('Link revoked: it stops working now');
      setRevoking(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed: select the link and copy it by hand');
    }
  };

  const rows = links.data?.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-steel">Let someone outside your company open this file with a link. Links expire, can be limited to a number of opens, and can be revoked at any time.</p>

      {!formOpen ? (
        <Button variant="outlined" className="self-start" onClick={() => setFormOpen(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
          New share link
        </Button>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-xl border border-hairline p-4" aria-label="New share link">
          {formError && <Alert severity="error">{formError}</Alert>}
          <FormField label="Who can open it" htmlFor="share-scope">
            <NativeSelect id="share-scope" value={scope} onValueChange={(v) => setScope(v as ShareScope)} options={SHARE_SCOPES.map((s) => ({ value: s, label: label(s) }))} />
          </FormField>
          {scope === 'SPECIFIC_EMAIL' && (
            <FormField label="Email address" htmlFor="share-email" required help="They get a 6-digit code by email each time they open it" error={errors.targetEmail}>
              <Input id="share-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.targetEmail} autoComplete="off" />
            </FormField>
          )}
          {scope === 'SPECIFIC_ORGANIZATION' && (
            <FormField label="Company's MINMEG ID" htmlFor="share-org" required help="Shown on their company profile" error={errors.targetOrganizationId}>
              <Input id="share-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} error={!!errors.targetOrganizationId} className="font-mono" autoComplete="off" />
            </FormField>
          )}
          {isPublic && <Alert severity="warning">Anyone who gets this link can open the file, without signing in. Prefer a link for one email address when you can.</Alert>}
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="They can" htmlFor="share-permission">
              <NativeSelect id="share-permission" value={permission} onValueChange={(v) => setPermission(v as SharePermission)} options={[{ value: 'VIEW', label: label('VIEW') }, { value: 'DOWNLOAD', label: label('DOWNLOAD') }]} />
            </FormField>
            <FormField label="Most opens" htmlFor="share-uses" help="Empty: no limit" error={errors.maxUses}>
              <Input id="share-uses" type="number" inputMode="numeric" min={1} max={1000} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} error={!!errors.maxUses} />
            </FormField>
          </div>
          <FormField label="Works until" htmlFor="share-expiry" error={errors.expiresAt} help="At most 30 days ahead">
            <Input
              id="share-expiry"
              type="date"
              value={expires}
              min={range.min}
              max={range.max}
              onChange={(e) => setExpires(e.target.value)}
              disabled={noExpiry && isPublic}
              error={!!errors.expiresAt}
            />
          </FormField>
          {isPublic && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)} className="h-4 w-4" />
              No end date (works until I revoke it)
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outlined" color="secondary" onClick={() => {
                setFormOpen(false);
                reset();
              }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={createState.isLoading}>
              Create link
            </Button>
          </div>
        </form>
      )}

      {links.isError ? (
        <Alert severity="error">{toApiError(links.error).message}</Alert>
      ) : rows.length === 0 && !links.isLoading ? (
        <p className="text-sm text-steel">No share links yet.</p>
      ) : (
        <ul aria-label="Share links" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
          {rows.map((l) => (
            <li key={l.id} className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3">
              <Link2 className="hidden h-4 w-4 shrink-0 text-steel sm:block" aria-hidden />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-ink">{l.targetEmail ?? (l.targetOrganizationId ? `Company ${l.targetOrganizationId}` : label(l.accessScope))}</p>
                <p className="text-xs text-steel">
                  {label(l.permission)} · {l.expiresAt ? `until ${formatDateTime(l.expiresAt)}` : 'no end date'} · opened {l.useCount}
                  {l.maxUses ? ` of ${l.maxUses}` : ''} {l.useCount === 1 ? 'time' : 'times'}
                </p>
              </div>
              <StatusBadge status={l.status} />
              {l.status === 'ACTIVE' && (
                <Button size="sm" variant="text" color="secondary" onClick={() => setRevoking(l)}>
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!created} onClose={() => setCreated(null)} size="sm" mobileFullScreen={false}>
        <ModalHeader>Copy the link now</ModalHeader>
        <ModalBody>
          <p className="mb-3 text-sm text-steel">For your security it is shown only this once. {created?.emailSent ? 'It has also been emailed.' : ''}</p>
          <div className="break-all rounded-lg border border-hairline bg-surface p-3 font-mono text-xs text-ink" data-testid="share-url">
            {created?.shareUrl}
          </div>
        </ModalBody>
        <ModalFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outlined" color="secondary" onClick={() => setCreated(null)}>
            Done
          </Button>
          <Button onClick={() => created && copy(created.shareUrl)} startIcon={<Copy className="h-4 w-4" aria-hidden />}>
            Copy link
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={!!revoking}
        tone="error"
        title="Revoke this link?"
        description="It stops working at once for everyone who has it."
        reason={{ label: 'Reason', placeholder: 'e.g. deal cancelled', minLength: 3 }}
        confirmLabel="Revoke link"
        loading={revokeState.isLoading}
        onConfirm={doRevoke}
        onClose={() => setRevoking(null)}
      />
      {dialog}
    </div>
  );
}
