'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { useGetGrantsQuery, useReshareGrantMutation, useRevokeGrantMutation } from '@/redux/features/vault/vaultApi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Decision #134: a passport another company shared with yours, with permission to pass it on.
 * You can pass read access on to one more company (named by the email of someone there), never for
 * longer than your own access; it cannot be passed on again. You can end it at any time, and so can
 * the owner.
 */
export function PassOnPanel({ passportId }: { passportId: string }) {
  const received = useGetGrantsQuery({ received: true, resourceType: 'PASSPORT', resourceId: passportId, status: 'ACTIVE', limit: 20 });
  const mine = (received.data?.data ?? []).find((g) => g.canTransfer && g.status === 'ACTIVE');
  const [reshare, reshareState] = useReshareGrantMutation();
  const [revoke] = useRevokeGrantMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [given, setGiven] = React.useState<{ id: string; email: string; until: string | null }[]>([]);
  if (!mine) return null;

  const give = async () => {
    setError(null);
    if (!EMAIL.test(email.trim())) return setError('Enter the email address of someone at that company');
    if (reason.trim().length < 3) return setError('Say why they need it');
    if (!(await confirm({ title: 'Pass this passport on?', description: `Their company can read it${mine.expiresAt ? ` until ${formatDate(mine.expiresAt)}` : ' as long as you can'}. They cannot pass it on again. You can end it at any time, and so can the owner.`, confirmLabel: 'Pass it on' }))) return;
    try {
      const res = await reshare({ id: mine.id, granteeEmail: email.trim(), reason: reason.trim(), idempotencyKey: key }).unwrap();
      done();
      setGiven((list) => [...list, { id: res.data.id, email: email.trim(), until: res.data.expiresAt }]);
      toast.success('Passed on. Their company can read it now.');
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
      <p className="text-sm text-gray-500">The owner lets your company show this passport to one more company, for example your customer{mine.expiresAt ? `, until ${formatDate(mine.expiresAt)}` : ''}.</p>
      {error && <Alert severity="error">{error}</Alert>}
      {!!given.length && (
        <ul className="space-y-1 text-sm">
          {given.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2">
              <span><span className="font-medium text-gray-900">{g.email}</span>{g.until ? ` · until ${formatDate(g.until)}` : ''}</span>
              <Button size="sm" variant="text" onClick={async () => { try { await revoke({ id: g.id, reason: 'Ended by the company that passed it on' }).unwrap(); setGiven((l) => l.filter((x) => x.id !== g.id)); toast.success('Ended'); } catch (err) { setError(toApiError(err).message); } }}>End</Button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <FormField htmlFor={`pass-email-${passportId}`} label="Email of someone at that company" required info="Their company must already use MINMEG.">
            <Input id={`pass-email-${passportId}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="off" />
          </FormField>
          <FormField htmlFor={`pass-reason-${passportId}`} label="Why they need it" required>
            <Textarea id={`pass-reason-${passportId}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={reshareState.isLoading} onClick={give} data-testid="pass-on-give">Pass it on</Button>
            <Button size="sm" variant="text" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outlined" onClick={() => setOpen(true)}>Pass it on to a company</Button>
      )}
      {dialog}
    </section>
  );
}
