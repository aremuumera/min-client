'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, Checkbox, ConfirmDialog, CopyableId, FormField, Input, NativeSelect, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { GRANT_PERMISSIONS, GRANTEE_TYPES, label, OWNER_ACCESS_MODES, type Grant, type GranteeType, type GrantPermission, type VaultFile } from '@/lib/vault';
import {
  useCreateGrantMutation,
  useGetGrantsQuery,
  useGetVisibilityPoliciesQuery,
  useGetVisibilityQuery,
  useRevokeGrantMutation,
  useSetVisibilityMutation,
  useUpdateFileMutation,
} from '@/redux/features/vault/vaultApi';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_HELP: Record<GranteeType, string> = {
  ORGANIZATION: "The company's MINMEG ID, shown on its profile",
  USER: "The person's MINMEG ID",
  TRADE_PARTICIPANT: 'The trade ID: its buyer, supplier and inspectors get access',
};

/**
 * Who can see one vault file (Group 02 on FILE_ASSET): the file's access mode, the visibility rule
 * when it follows one, and access given to specific companies, people or trades.
 */
export function FileAccessPanel({ file }: { file: VaultFile }) {
  const [updateFile, updateState] = useUpdateFileMutation();
  const policies = useGetVisibilityPoliciesQuery();
  const visibility = useGetVisibilityQuery(file.id);
  const [setVisibility, visibilityState] = useSetVisibilityMutation();
  const grants = useGetGrantsQuery({ resourceType: 'FILE_ASSET', resourceId: file.id, limit: 100 });
  const [createGrant, grantState] = useCreateGrantMutation();
  const [revokeGrant, revokeState] = useRevokeGrantMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();

  const [mode, setMode] = React.useState<string>(file.accessMode);
  const [policyId, setPolicyId] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [granteeType, setGranteeType] = React.useState<GranteeType>('ORGANIZATION');
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

  const addGrant = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <NativeSelect id="file-access-mode" value={mode} onValueChange={setMode} options={OWNER_ACCESS_MODES.map((m) => ({ value: m, label: label(m) }))} />
            </FormField>
            <Button variant="outlined" onClick={saveMode} disabled={mode === file.accessMode} loading={updateState.isLoading} className="h-11">
              Save
            </Button>
          </div>
        )}
        {mode === 'POLICY_CONTROLLED' && file.accessMode === 'POLICY_CONTROLLED' && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField label="Visibility rule" htmlFor="file-policy" className="flex-1" help={effective ? `In force now: ${effective.name}` : 'None yet: only your company can open it'}>
              <NativeSelect
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
              <NativeSelect id="grant-type" value={granteeType} onValueChange={(v) => setGranteeType(v as GranteeType)} options={GRANTEE_TYPES.map((t) => ({ value: t, label: label(t) }))} />
            </FormField>
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
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outlined" color="secondary" onClick={() => setAdding(false)} disabled={grantState.isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={grantState.isLoading}>
                Give access
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
