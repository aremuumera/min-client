'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, FormField, Input, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { useGetGrantsQuery, useGetPassedOnQuery, usePassOnByEmailMutation, useRevokeEmailShareMutation } from '@/redux/features/vault/vaultApi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Decision #134: a passport another company shared with yours, with permission to pass it on. Your
 * company can pass it on to one more person or company, by email, exactly like sharing by email
 * (decision #119): the same answer whether or not the address has a MINMEG account. A company on
 * MINMEG reads it in its app; anyone else gets an emailed link that opens with a code. Never for
 * longer than your own access; what you pass on can't be passed on again. You can remove it, and so
 * can the owner.
 */
export function PassOnPanel({ passportId }: { passportId: string }) {
  const received = useGetGrantsQuery({ received: true, resourceType: 'PASSPORT', resourceId: passportId, status: 'ACTIVE', limit: 20 });
  const mine = (received.data?.data ?? []).find((g) => g.canTransfer && g.status === 'ACTIVE');
  const passed = useGetPassedOnQuery(mine?.id ?? '', { skip: !mine });
  const [passOn, passOnState] = usePassOnByEmailMutation();
  const [remove, removeState] = useRevokeEmailShareMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  if (!mine) return null;
  const live = (passed.data?.data.shares ?? []).filter((x) => x.status === 'ACTIVE');
  const until = mine.expiresAt ? formatDate(mine.expiresAt) : null;

  const give = async () => {
    setError(null);
    const address = email.trim();
    if (!EMAIL.test(address)) return setError('Enter a valid email address');
    if (reason.trim().length < 3) return setError('Say why they need it');
    if (!(await confirm({ title: `Pass this passport on to ${address}?`, description: `They can read it${until ? ` until ${until} at the latest` : ''}. They can't change it or pass it on. You can remove it at any time, and so can the owner.`, confirmLabel: 'Pass it on' }))) return;
    try {
      const res = await passOn({ grantId: mine.id, email: address, reason: reason.trim(), idempotencyKey: key }).unwrap();
      done();
      toast.success(res.message ?? "Shared. We've emailed them.");
      setEmail('');
      setReason('');
      setOpen(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-2 border-t border-gray-200 pt-4" aria-label="Pass it on" data-testid="pass-on">
      <h4 className="text-sm font-bold text-gray-900">Pass it on</h4>
      <p className="text-sm text-gray-500">The owner lets your company show this passport to one more person or company, for example your customer{until ? `, until ${until}` : ''}.</p>
      {error && <Alert severity="error">{error}</Alert>}
      {!!live.length && (
        <ul className="space-y-1 text-sm">
          {live.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="break-all"><span className="font-medium text-gray-900">{x.email}</span> · until {formatDate(x.expiresAt)}</span>
              <Button size="sm" variant="text" onClick={() => setRemoving(x.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <FormField htmlFor={`pass-email-${passportId}`} label="Email address" required info="If they have a MINMEG account, their company can read it in MINMEG. If not, MINMEG emails them a link that opens with a code sent to that address.">
            <Input id={`pass-email-${passportId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="off" />
          </FormField>
          <FormField htmlFor={`pass-reason-${passportId}`} label="Why they need it" required>
            <Textarea id={`pass-reason-${passportId}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={passOnState.isLoading} onClick={give} data-testid="pass-on-give">Pass it on</Button>
            <Button size="sm" variant="text" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        passed.data?.data.canPassOn !== false && <Button size="sm" variant="outlined" onClick={() => setOpen(true)}>Pass it on by email</Button>
      )}
      <ConfirmDialog
        open={!!removing}
        title="Stop sharing?"
        description="They can no longer open it."
        confirmLabel="Stop sharing"
        tone="error"
        reason={{ label: 'Reason', minLength: 3 }}
        loading={removeState.isLoading}
        onConfirm={async (why) => {
          if (removing) await remove({ id: removing, reason: why ?? '' }).unwrap().catch((err) => setError(toApiError(err).message));
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
      {dialog}
    </section>
  );
}
