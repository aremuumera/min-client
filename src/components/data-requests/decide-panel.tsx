'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, FormField, Input, Radio, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import type { DataRequestDetail, DisclosureScope } from '@/lib/data-requests';
import { useApproveDataRequestMutation, useEndDataRequestMutation } from '@/redux/features/passports/passports_api';

const dayInput = (d: Date) => d.toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);
const fields = (n: number) => `${n} field${n === 1 ? '' : 's'}`;

/**
 * Decision #137: the owner's decision on a data request. Approve: partner data, or partner and private
 * data, until a date at most 90 days away. Or decline with a reason the requester reads. Once approved,
 * the access can be ended.
 */
export function DecidePanel({ request }: { request: DataRequestDetail }) {
  const [approve, approveState] = useApproveDataRequestMutation();
  const [end, endState] = useEndDataRequestMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [scope, setScope] = React.useState<DisclosureScope>('PARTNERS');
  const [until, setUntil] = React.useState(() => dayInput(inDays(30)));
  const [note, setNote] = React.useState('');
  const [ending, setEnding] = React.useState<'decline' | 'revoke' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const can = request.nextSteps;
  const share = request.shareable;
  if (!can.length) return null;

  const give = async () => {
    setError(null);
    if (!until) return setError('Choose the last day they can open it');
    const expiresAt = new Date(`${until}T23:59:59`);
    const who = request.requester.organization;
    if (!(await confirm({ title: `Share ${scope === 'PARTNERS' ? 'partner data' : 'partner and private data'} with ${who}?`, description: `They get a copy of passport ${request.passportCode ?? ''} as it is published today, until ${formatDate(expiresAt.toISOString())}. MINMEG emails them a link. You can end it at any time.`, confirmLabel: 'Approve' }))) return;
    try {
      const res = await approve({ id: request.id, scope, expiresAt: expiresAt.toISOString(), note: note.trim() || null, idempotencyKey: key }).unwrap();
      done();
      toast.success(res.message ?? 'Approved');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 p-4" aria-label="Your decision" data-testid="data-request-decide">
      <h3 className="text-sm font-bold text-gray-900">{can.includes('APPROVE') ? 'Your decision' : 'Access in force'}</h3>
      {error && <Alert severity="error">{error}</Alert>}
      {can.includes('APPROVE') && (
        <>
          {!share.published && <Alert severity="warning">This passport has no published version, so there is nothing to share. Publish it first, or decline.</Alert>}
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-gray-900">What to share</legend>
            <Radio name="dr-scope" checked={scope === 'PARTNERS'} onChange={() => setScope('PARTNERS')} label="Partner data" description={`What you already share with your trade partners: ${fields(share.partnersFields)} beyond the ${fields(share.publicFields)} on the public page.`} />
            <Radio name="dr-scope" checked={scope === 'PARTNERS_AND_PRIVATE'} onChange={() => setScope('PARTNERS_AND_PRIVATE')} label="Partner and private data" description={`Also the ${fields(share.privateFields)} only your company sees.`} />
          </fieldset>
          {share.published && (scope === 'PARTNERS' ? share.partnersFields : share.partnersFields + share.privateFields) === 0 && <Alert severity="info">With this choice they see nothing new: those fields are empty or already on the public page.</Alert>}
          <FormField htmlFor="dr-until" label="They can open it until" required info="90 days at most. You can end it earlier.">
            <Input id="dr-until" type="date" value={until} min={dayInput(inDays(1))} max={dayInput(inDays(89))} onChange={(e) => setUntil(e.target.value)} />
          </FormField>
          <FormField htmlFor="dr-note" label="Note for them (optional)">
            <Textarea id="dr-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For the permit check only" />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button loading={approveState.isLoading} disabled={!share.published} onClick={give} data-testid="data-request-approve">Approve</Button>
            <Button variant="outlined" color="error" onClick={() => setEnding('decline')}>Decline</Button>
          </div>
        </>
      )}
      {can.includes('REVOKE') && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">They can open the data{request.expiresAt ? ` until ${formatDate(request.expiresAt)}` : ''}. They opened it {request.openCount} time{request.openCount === 1 ? '' : 's'}.</p>
          <Button variant="outlined" color="error" onClick={() => setEnding('revoke')}>End the access</Button>
        </div>
      )}
      <ConfirmDialog
        open={!!ending}
        title={ending === 'decline' ? 'Decline this request?' : 'End this access?'}
        description={ending === 'decline' ? 'They get your reason by email. They can ask again later.' : 'They can no longer open the data, and get your reason by email.'}
        confirmLabel={ending === 'decline' ? 'Decline' : 'End the access'}
        tone="error"
        reason={{ label: 'Reason (they read it)', minLength: 3 }}
        loading={endState.isLoading}
        onConfirm={async (why) => {
          if (!ending) return;
          try {
            const res = await end({ id: request.id, step: ending, reason: why ?? '' }).unwrap();
            toast.success(res.message ?? 'Done');
          } catch (err) {
            setError(toApiError(err).message);
          }
          setEnding(null);
        }}
        onClose={() => setEnding(null)}
      />
      {dialog}
    </section>
  );
}
