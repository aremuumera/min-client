'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, Checkbox, ConfirmDialog, CopyableId, FormField, Input, DropdownSelect, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { GRANT_PERMISSIONS, GRANTEE_TYPES, label, OWNER_ACCESS_MODES, type Grant, type GrantPermission, type VaultFile } from '@/lib/vault';
import {
  useCreateGrantMutation,
  useCreateShareLinkMutation,
  useGetGrantsQuery,
  useGetVisibilityPoliciesQuery,
  useGetVisibilityQuery,
  useRevokeGrantMutation,
  useSetVisibilityMutation,
  useUpdateFileMutation,
} from '@/redux/features/vault/vaultApi';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_HELP: Record<string, string> = {
  ORGANIZATION: "The company's MINMEG ID: ask them for it, or use their email instead",
  USER: "The person's MINMEG ID: ask them for it, or use their email instead",
};
const DAY = 24 * 3600_000;
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
/** A company or person by ID, or anyone by email (an emailed link with a code; no MINMEG account needed) */
type GranteeChoice = (typeof GRANTEE_TYPES)[number] | 'EMAIL';
const CHOICES: GranteeChoice[] = ['EMAIL', ...GRANTEE_TYPES];

/**
 * Who can see one vault file (Group 02 on FILE_ASSET): the file's access mode, the visibility rule
 * when it follows one, access given to specific companies or people by ID, and access by email,
 * which is an emailed share link (it shows under Share links).
 */
export function FileAccessPanel({ file }: { file: VaultFile }) {
  const [updateFile, updateState] = useUpdateFileMutation();
  const policies = useGetVisibilityPoliciesQuery();
  const visibility = useGetVisibilityQuery(file.id);
  const [setVisibility, visibilityState] = useSetVisibilityMutation();
  const grants = useGetGrantsQuery({ resourceType: 'FILE_ASSET', resourceId: file.id, limit: 100 });
  const [createGrant, grantState] = useCreateGrantMutation();
  const [createShareLink, shareState] = useCreateShareLinkMutation();
  const [revokeGrant, revokeState] = useRevokeGrantMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();

  const [mode, setMode] = React.useState<string>(file.accessMode);
  const [policyId, setPolicyId] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [granteeType, setGranteeType] = React.useState<GranteeChoice>('EMAIL');
  const [email, setEmail] = React.useState('');
  const [canDownload, setCanDownload] = React.useState(false);
  const [emailUntil, setEmailUntil] = React.useState(() => toDateInput(new Date(Date.now() + 7 * DAY)));
  // an emailed link lasts at most 30 days; fixed when the panel opens
  const [range] = React.useState(() => ({ min: toDateInput(new Date(Date.now() + DAY)), max: toDateInput(new Date(Date.now() + 30 * DAY)) }));
  const [granteeId, setGranteeId] = React.useState('');
  const [perms, setPerms] = React.useState<GrantPermission[]>(['READ']);
  const [expiresAt, setExpiresAt] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [revoking, setRevoking] = React.useState<Grant | null>(null);

  React.useEffect(() => setMode(file.accessMode), [file.accessMode]);
  const effective = visibility.data?.data.effectivePolicy;
  React.useEffect(() => setPolicyId(effective?.source === 'ASSIGNMENT' ? effective.id : ''), [effective]);

  const saveMode = async () => {
    const ok = await confirm({
      title: 'Change who can open this file?',
      description: `${label(mode)}. Access you gave to specific companies below stays as it is.`,
      confirmLabel: 'Save',
    });
    if (!ok) return;
    try {
      await updateFile({ id: file.id, accessMode: mode }).unwrap();
      toast.success('Saved');
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const savePolicy = async () => {
    const policy = policies.data?.data.find((p) => p.id === policyId);
    if (!policy) return;
    const ok = await confirm({ title: `Apply "${policy.name}"?`, description: policy.description ?? undefined, confirmLabel: 'Apply rule' });
    if (!ok) return;
    try {
      await setVisibility({ fileId: file.id, visibilityPolicyId: policy.id }).unwrap();
      toast.success(`${policy.name} applied`);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const addByEmail = async () => {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter the email address';
    const until = new Date(`${emailUntil}T23:59:00`);
    if (!(until.getTime() > Date.now() + 60_000 && until.getTime() <= Date.now() + 30 * DAY)) next.emailUntil = 'Choose a date within the next 30 days';
    setErrors(next);
    if (Object.keys(next).length) return;
    const ok = await confirm({
      title: `Share with ${email.trim()}?`,
      description: `We email them a link. They enter a 6-digit code each time they open it, and don't need a MINMEG account. ${canDownload ? 'They can view and download' : 'They can only view'} until ${until.toLocaleDateString()}.`,
      confirmLabel: 'Send link',
    });
    if (!ok) return;
    try {
      const res = await createShareLink({ fileId: file.id, accessScope: 'SPECIFIC_EMAIL', targetEmail: email.trim(), permission: canDownload ? 'DOWNLOAD' : 'VIEW', expiresAt: until.toISOString(), idempotencyKey: key }).unwrap();
      done();
      if (res.data.emailSent === false) toast.error(`The link was created, but the email to ${email.trim()} could not be sent. Revoke it under Share links and try again.`);
      else toast.success(`Sent to ${email.trim()}. It's listed under Share links.`);
      setAdding(false);
      setEmail('');
      setCanDownload(false);
    } catch (err) {
      const apiError = toApiError(err);
      setErrors(apiError.fields.targetEmail ? { email: apiError.fields.targetEmail } : apiError.fields.expiresAt ? { emailUntil: apiError.fields.expiresAt } : { form: apiError.message });
    }
  };

  const addGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (granteeType === 'EMAIL') return addByEmail();
    const next: Record<string, string> = {};
    if (!UUID.test(granteeId.trim())) next.granteeId = 'Paste the full ID';
    if (!perms.length) next.permissions = 'Tick at least one';
    if (expiresAt && new Date(`${expiresAt}T23:59:00`).getTime() <= Date.now()) next.expiresAt = 'Choose a date in the future';
    setErrors(next);
    if (Object.keys(next).length) return;
    const ok = await confirm({
      title: `Give ${label(granteeType).toLowerCase()} access?`,
      description: `They can ${perms.map((p) => label(p).toLowerCase()).join(', ')}${expiresAt ? ` until ${new Date(expiresAt).toLocaleDateString()}` : ' until you revoke it'}.`,
      confirmLabel: 'Give access',
    });
    if (!ok) return;
    try {
      await createGrant({
        resourceType: 'FILE_ASSET',
        resourceId: file.id,
        granteeType,
        granteeId: granteeId.trim(),
        permissions: perms,
        ...(expiresAt ? { expiresAt: new Date(`${expiresAt}T23:59:00`).toISOString() } : {}),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        idempotencyKey: key,
      }).unwrap();
      done();
      toast.success('Access given');
      setAdding(false);
      setGranteeId('');
      setPerms(['READ']);
      setExpiresAt('');
      setReason('');
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      else setErrors({ form: apiError.message });
    }
  };

  const doRevoke = async (why?: string) => {
    if (!revoking) return;
    try {
      await revokeGrant({ id: revoking.id, reason: why ?? '' }).unwrap();
      toast.success('Access removed');
      setRevoking(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const activeGrants = (grants.data?.data ?? []).filter((g) => g.status === 'ACTIVE');
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Who can open it</h3>
        {file.accessMode === 'PUBLIC' ? (
          <Alert severity="info">MINMEG has made this file public. Contact support to change it.</Alert>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField label="Access" htmlFor="file-access-mode" className="flex-1">
              <DropdownSelect id="file-access-mode" value={mode} onValueChange={setMode} options={OWNER_ACCESS_MODES.map((m) => ({ value: m, label: label(m) }))} />
            </FormField>
            <Button variant="outlined" onClick={saveMode} disabled={mode === file.accessMode} loading={updateState.isLoading} className="h-11">
              Save
            </Button>
          </div>
        )}
        {mode === 'POLICY_CONTROLLED' && file.accessMode === 'POLICY_CONTROLLED' && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField label="Visibility rule" htmlFor="file-policy" className="flex-1" help={effective ? `In force now: ${effective.name}` : 'None yet: only your company can open it'}>
              <DropdownSelect
                id="file-policy"
                value={policyId}
                onValueChange={setPolicyId}
                options={(policies.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
                placeholder={policies.isLoading ? 'Loading…' : 'Choose a rule'}
              />
            </FormField>
            <Button variant="outlined" onClick={savePolicy} disabled={!policyId || policyId === effective?.id} loading={visibilityState.isLoading} className="h-11">
              Apply
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-ink">Access given to others</h3>
        {grants.isError ? (
          <Alert severity="error">{toApiError(grants.error).message}</Alert>
        ) : activeGrants.length === 0 ? (
          <p className="text-sm text-steel">Nobody else has been given access.</p>
        ) : (
          <ul aria-label="Access given" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
            {activeGrants.map((g) => (
              <li key={g.id} className="flex flex-col gap-1.5 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-ink">{label(g.granteeType)}</p>
                  <CopyableId value={g.granteeId} />
                  <p className="text-xs text-steel">
                    {g.permissions.map((p) => label(p)).join(', ')} · {g.expiresAt ? `until ${formatDate(g.expiresAt)}` : 'no end date'}
                  </p>
                </div>
                <StatusBadge status={g.status} />
                <Button size="sm" variant="text" color="secondary" onClick={() => setRevoking(g)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!adding ? (
          <Button variant="outlined" className="self-start" onClick={() => setAdding(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Give access
          </Button>
        ) : (
          <form onSubmit={addGrant} noValidate aria-label="Give access" className="flex flex-col gap-3 rounded-xl border border-hairline p-4">
            {errors.form && <Alert severity="error">{errors.form}</Alert>}
            <FormField label="To" htmlFor="grant-type">
              <DropdownSelect
                id="grant-type"
                value={granteeType}
                onValueChange={(v) => {
                  setGranteeType(v as GranteeChoice);
                  setErrors({});
                }}
                options={CHOICES.map((t) => ({ value: t, label: label(t) }))}
              />
            </FormField>
            {granteeType === 'EMAIL' ? (
              <>
                <FormField label="Email address" htmlFor="grant-email" required help="On MINMEG or not: they get a link and enter a 6-digit code to open it" error={errors.email}>
                  <Input id="grant-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} autoComplete="off" />
                </FormField>
                <Checkbox label="They can also download it" checked={canDownload} onChange={(e) => setCanDownload(e.target.checked)} />
                <FormField label="Until" htmlFor="grant-email-until" required help="At most 30 days ahead" error={errors.emailUntil}>
                  <Input id="grant-email-until" type="date" value={emailUntil} min={range.min} max={range.max} onChange={(e) => setEmailUntil(e.target.value)} error={!!errors.emailUntil} />
                </FormField>
              </>
            ) : (
              <>
                <FormField label="ID" htmlFor="grant-id" required help={ID_HELP[granteeType]} error={errors.granteeId}>
                  <Input id="grant-id" value={granteeId} onChange={(e) => setGranteeId(e.target.value)} error={!!errors.granteeId} className="font-mono" autoComplete="off" />
                </FormField>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium text-ink">They can</legend>
                  {GRANT_PERMISSIONS.map((p) => (
                    <Checkbox key={p} label={label(p)} checked={perms.includes(p)} onChange={(e) => setPerms((prev) => (e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)))} />
                  ))}
                  {errors.permissions && <p className="text-xs text-semantic-error-text">{errors.permissions}</p>}
                </fieldset>
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField label="Until" htmlFor="grant-expiry" help="Empty: until you remove it" error={errors.expiresAt}>
                    <Input id="grant-expiry" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} error={!!errors.expiresAt} />
                  </FormField>
                  <FormField label="Reason" htmlFor="grant-reason">
                    <Input id="grant-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="e.g. due diligence for Lot 12" />
                  </FormField>
                </div>
              </>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outlined" color="secondary" onClick={() => setAdding(false)} disabled={grantState.isLoading || shareState.isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={grantState.isLoading || shareState.isLoading}>
                {granteeType === 'EMAIL' ? 'Send link' : 'Give access'}
              </Button>
            </div>
          </form>
        )}
      </section>

      <ConfirmDialog
        open={!!revoking}
        tone="error"
        title="Remove this access?"
        description="They can no longer open the file."
        reason={{ label: 'Reason', minLength: 3 }}
        confirmLabel="Remove access"
        loading={revokeState.isLoading}
        onConfirm={doRevoke}
        onClose={() => setRevoking(null)}
      />
      {dialog}
    </div>
  );
}
