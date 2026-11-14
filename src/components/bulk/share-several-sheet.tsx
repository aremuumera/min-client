'use client';

import * as React from 'react';
import { Alert, Button, Checkbox, FormField, Input, SideSheet, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { bulk, type BulkJob } from '@/lib/bulk';
import { useAppSelector } from '@/redux/hooks';
import { useGetPassportsQuery } from '@/redux/features/passports/passports_api';
import { BulkJobPanel } from './bulk-job-panel';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dayInput = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Decision #134: give a company read access to many of your published passports at once, or take
 * it away, named by the email of someone at that company. Checked first, as every bulk job.
 */
export function ShareSeveralSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const list = useGetPassportsQuery({ page: 1, limit: 100, status: 'PUBLISHED' }, { skip: !open });
  const [chosen, setChosen] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState<'give' | 'take'>('give');
  const [email, setEmail] = React.useState('');
  const [until, setUntil] = React.useState(() => dayInput(new Date(Date.now() + 90 * 86_400_000)));
  const [reason, setReason] = React.useState('');
  const [job, setJob] = React.useState<BulkJob | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const passports = list.data?.data ?? [];
  const close = () => {
    setJob(null);
    setChosen([]);
    setError(null);
    onClose();
  };
  const start = async () => {
    setError(null);
    if (!chosen.length) return setError('Choose at least one passport');
    if (!EMAIL.test(email.trim())) return setError('Enter the email address of someone at that company');
    setBusy(true);
    try {
      const grant = mode === 'give'
        ? { granteeType: 'ORGANIZATION', granteeEmail: email.trim(), permissions: ['READ'], ...(until ? { expiresAt: new Date(`${until}T23:59:59`).toISOString() } : {}), ...(reason.trim() ? { reason: reason.trim() } : {}) }
        : { granteeType: 'ORGANIZATION', granteeEmail: email.trim(), ...(reason.trim() ? { reason: reason.trim() } : {}) };
      setJob(await bulk.startAction({ kind: mode === 'give' ? 'GRANT_PASSPORT_ACCESS' : 'REVOKE_PASSPORT_ACCESS', passportIds: chosen, grant }, token));
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SideSheet open={open} onClose={close} title="Share several passports" subtitle={job ? 'Check, then confirm' : 'Give a company access to many passports, or take it away'} size="lg">
      <div className="space-y-4" data-testid="share-several">
        {error && <Alert severity="error">{error}</Alert>}
        {job ? (
          <BulkJobPanel job={job} token={token} noun="passport" verb={mode === 'give' ? 'share' : 'stop sharing'} />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={mode === 'give' ? 'contained' : 'outlined'} color={mode === 'give' ? 'primary' : 'secondary'} onClick={() => setMode('give')}>Give access</Button>
              <Button size="sm" variant={mode === 'take' ? 'contained' : 'outlined'} color={mode === 'take' ? 'primary' : 'secondary'} onClick={() => setMode('take')}>Take access away</Button>
            </div>
            <FormField htmlFor="share-several-email" label="Email of someone at that company" required info="Their company must already use MINMEG. The whole company gets access.">
              <Input id="share-several-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="off" />
            </FormField>
            {mode === 'give' && (
              <FormField htmlFor="share-several-until" label="Until" optional info="Read only. Empty: until you take it away.">
                <Input id="share-several-until" type="date" value={until} min={dayInput(new Date(Date.now() + 86_400_000))} onChange={(e) => setUntil(e.target.value)} />
              </FormField>
            )}
            <FormField htmlFor="share-several-reason" label="Why" optional>
              <Textarea id="share-several-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">Published passports ({chosen.length} chosen)</p>
                {!!passports.length && <Button size="sm" variant="text" onClick={() => setChosen(chosen.length === passports.length ? [] : passports.map((p) => p.id))}>{chosen.length === passports.length ? 'Choose none' : 'Choose all'}</Button>}
              </div>
              {list.isError && <Alert severity="error">{toApiError(list.error).message}</Alert>}
              {list.data && !passports.length && <p className="text-sm text-steel">You have no published passport.</p>}
              <ul className="max-h-80 divide-y divide-hairline overflow-y-auto rounded-xl border border-hairline">
                {passports.map((p) => (
                  <li key={p.id} className="px-3 py-2">
                    <Checkbox label={p.passportCode} description={p.certificateType?.name ?? undefined} checked={chosen.includes(p.id)} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, p.id] : c.filter((x) => x !== p.id)))} />
                  </li>
                ))}
              </ul>
            </div>
            <Button loading={busy} onClick={start} data-testid="share-several-check">Check</Button>
          </>
        )}
      </div>
    </SideSheet>
  );
}
