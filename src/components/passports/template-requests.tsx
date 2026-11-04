'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, DropdownSelect, FormField, Input, KeyValueList, SideSheet, StatusBadge, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { REQUEST_TYPES, words, type TemplateRequest } from '@/lib/passports';
import { useAnswerTemplateRequestMutation, useCancelTemplateRequestMutation, useCreateTemplateRequestMutation, useGetPassportTypesQuery, useGetTemplateRequestQuery, useGetTemplatesQuery } from '@/redux/features/passports/passports_api';

/* Template requests (step 2.9a D11, decision #73): a company asks MINMEG for a passport template */
const KIND_LABELS: Record<(typeof REQUEST_TYPES)[number], string> = {
  NEW_TEMPLATE: 'A new template',
  TEMPLATE_VARIANT: 'A variant of an existing template',
  ADD_STANDARD: 'A standard added to a template',
  NEW_STANDARD: 'A new standard',
  STANDARD_MAPPING: 'A field linked to a standard',
};
const OPEN = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION'];
export const requestTone = (s: TemplateRequest['status']) => (s === 'APPROVED' || s === 'IMPLEMENTED' ? 'ACTIVE' : s === 'REJECTED' || s === 'CANCELLED' ? 'CANCELLED' : s === 'NEEDS_INFORMATION' ? 'ON_HOLD' : 'PENDING');
export const requestLabel = (s: TemplateRequest['status']) => (s === 'NEEDS_INFORMATION' ? 'MINMEG asked a question' : s === 'IMPLEMENTED' ? 'Done: template published' : words(s));

export function NewRequestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const types = useGetPassportTypesQuery(undefined, { skip: !open });
  const templates = useGetTemplatesQuery({ status: 'PUBLISHED', limit: 100 }, { skip: !open });
  const [create, { isLoading }] = useCreateTemplateRequestMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [kind, setKind] = React.useState<string>('NEW_TEMPLATE');
  const [typeId, setTypeId] = React.useState('');
  const [templateId, setTemplateId] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [markets, setMarkets] = React.useState('');
  const [standards, setStandards] = React.useState('');
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    if (!open) return;
    setKind('NEW_TEMPLATE');
    setTypeId('');
    setTemplateId('');
    setName('');
    setDescription('');
    setMarkets('');
    setStandards('');
    setError(undefined);
  }, [open]);
  const needsTemplate = kind === 'TEMPLATE_VARIANT' || kind === 'ADD_STANDARD' || kind === 'STANDARD_MAPPING';
  const submit = async () => {
    const problem = !name.trim() ? 'Give the request a short name' : description.trim().length < 1 ? 'Say what you need' : needsTemplate && !templateId ? 'Choose the template it is about' : null;
    if (problem) return setError(problem);
    if (!(await confirm({ title: 'Send this request to MINMEG?', description: 'MINMEG reviews it and may ask questions here.', confirmLabel: 'Send' }))) return;
    try {
      await create({
        requestType: kind,
        name: name.trim(),
        description: description.trim(),
        ...(typeId ? { passportTypeId: typeId } : {}),
        ...(templateId ? { existingTemplateId: templateId } : {}),
        ...(markets.trim() ? { targetMarket: markets.split(',').map((m) => m.trim().toUpperCase()).filter(Boolean) } : {}),
        ...(standards.trim() ? { requestedStandards: standards.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
        idempotencyKey: key,
      }).unwrap();
      done();
      toast.success('Request sent');
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Ask MINMEG for a template"
      subtitle="For a passport your buyers or markets need"
      footer={
        <>
          <Button variant="outlined" color="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button loading={isLoading} onClick={submit}>Send request</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="req-kind" label="What you need" required>
          <DropdownSelect id="req-kind" aria-label="What you need" value={kind} onValueChange={setKind} options={REQUEST_TYPES.map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
        </FormField>
        <FormField htmlFor="req-name" label="Short name" required>
          <Input id="req-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} placeholder="Tin concentrate for EU buyers" />
        </FormField>
        <FormField htmlFor="req-type" label="Kind of passport" optional>
          <DropdownSelect id="req-type" aria-label="Kind of passport" value={typeId} placeholder="Not sure" onValueChange={setTypeId} options={(types.data?.data ?? []).map((t) => ({ value: t.id, label: t.name }))} />
        </FormField>
        {needsTemplate && (
          <FormField htmlFor="req-template" label="The template it is about" required>
            <DropdownSelect id="req-template" aria-label="The template it is about" value={templateId} placeholder="Choose" onValueChange={setTemplateId} options={(templates.data?.data ?? []).map((t) => ({ value: t.id, label: `${t.name} (${t.code} ${t.version})` }))} />
          </FormField>
        )}
        <FormField htmlFor="req-description" label="Details" required info="Which minerals, which buyers, what they ask you to prove">
          <Textarea id="req-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={10000} />
        </FormField>
        <FormField htmlFor="req-markets" label="Markets" optional info="Country or region codes, separated by commas, for example EU, US">
          <Input id="req-markets" value={markets} onChange={(e) => setMarkets(e.target.value)} />
        </FormField>
        <FormField htmlFor="req-standards" label="Standards your buyers name" optional info="Separated by commas, for example OECD due diligence, CRMA">
          <Input id="req-standards" value={standards} onChange={(e) => setStandards(e.target.value)} />
        </FormField>
      </div>
      {dialog}
    </SideSheet>
  );
}

export function RequestDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const query = useGetTemplateRequestQuery(id ?? '', { skip: !id });
  const [answer, answerState] = useAnswerTemplateRequestMutation();
  const [cancel, cancelState] = useCancelTemplateRequestMutation();
  const [dialog, setDialog] = React.useState<'answer' | 'cancel' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  if (!id) return null;
  const r = query.data?.data;
  return (
    <SideSheet
      open
      onClose={onClose}
      title={r?.name ?? 'Template request'}
      subtitle={r ? `${r.requestCode} · ${KIND_LABELS[r.requestType]}` : undefined}
      footer={
        r ? (
          <>
            {(OPEN.includes(r.status) || r.status === 'APPROVED') && <Button variant="outlined" color="secondary" onClick={() => setDialog('cancel')}>Cancel request</Button>}
            {r.status === 'NEEDS_INFORMATION' && <Button onClick={() => setDialog('answer')}>Answer MINMEG</Button>}
          </>
        ) : undefined
      }
    >
      {query.isLoading && <p className="text-sm text-steel">Loading…</p>}
      {query.error && <Alert severity="error">{toApiError(query.error).message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {r && (
        <div className="space-y-6">
          <KeyValueList
            items={[
              { label: 'Status', value: <StatusBadge status={requestTone(r.status)}>{requestLabel(r.status)}</StatusBadge> },
              { label: 'Details', value: <span className="whitespace-pre-wrap">{r.description}</span> },
              { label: 'Markets', value: r.targetMarket?.join(', ') || '—' },
              { label: 'Standards', value: r.requestedStandards?.join(', ') || '—' },
              ...(r.reviewNotes ? [{ label: 'MINMEG’s answer', value: r.reviewNotes }] : []),
            ]}
          />
          <section className="space-y-2" aria-labelledby="req-thread">
            <h3 id="req-thread" className="text-sm font-bold text-ink">Questions and answers</h3>
            {!r.messages.length && <p className="text-sm text-steel">None yet.</p>}
            <ul className="space-y-2">
              {r.messages.map((m, i) => (
                <li key={i} className={`rounded-lg p-3 text-sm ${m.side === 'MINMEG' ? 'bg-surface-soft' : 'border border-hairline'}`}>
                  <p className="text-xs text-steel">{m.side === 'MINMEG' ? 'MINMEG' : 'You'} · {formatDateTime(m.at)}</p>
                  <p className="whitespace-pre-wrap text-ink">{m.message}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      <ConfirmDialog
        open={!!dialog}
        title={dialog === 'answer' ? 'Answer MINMEG?' : 'Cancel this request?'}
        description={dialog === 'cancel' ? 'It closes without a template.' : undefined}
        confirmLabel={dialog === 'answer' ? 'Send' : 'Cancel request'}
        tone={dialog === 'cancel' ? 'error' : 'primary'}
        reason={dialog === 'answer' ? { label: 'Your answer', minLength: 3 } : { label: 'Reason (optional)', minLength: 0 }}
        loading={answerState.isLoading || cancelState.isLoading}
        onConfirm={async (text) => {
          if (!r) return;
          setError(null);
          try {
            if (dialog === 'answer') await answer({ id: r.id, message: text ?? '' }).unwrap();
            else await cancel({ id: r.id, reason: text || undefined }).unwrap();
            toast.success(dialog === 'answer' ? 'Answer sent' : 'Request cancelled');
          } catch (err) {
            setError(toApiError(err).message);
          }
          setDialog(null);
        }}
        onClose={() => setDialog(null)}
      />
    </SideSheet>
  );
}
