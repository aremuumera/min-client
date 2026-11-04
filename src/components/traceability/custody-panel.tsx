'use client';

import * as React from 'react';
import { Alert, Button, DropdownSelect, FormField, Input, Modal, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { CUSTODY_STATUS_LABELS } from '@/lib/traceability';
import { useGetCustodyHistoryQuery, useTransferCustodyMutation } from '@/redux/features/traceability/traceability_api';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function HandOverModal({ subjectType, subjectId, onClose }: { subjectType: string; subjectId: string; onClose: () => void }) {
  const [to, setTo] = React.useState<'ORGANIZATION' | 'EXTERNAL' | 'AUTHORITY'>('ORGANIZATION');
  const [orgId, setOrgId] = React.useState('');
  const [name, setName] = React.useState('');
  const [reference, setReference] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [transfer, { isLoading }] = useTransferCustodyMutation();
  const ready = to === 'ORGANIZATION' ? UUID.test(orgId.trim()) : !!name.trim();
  const submit = async () => {
    setError(null);
    try {
      await transfer({
        subjectType,
        subjectId,
        custodianType: to,
        ...(to === 'ORGANIZATION' ? { toOrganizationId: orgId.trim() } : { externalCustodian: { name: name.trim(), ...(reference.trim() ? { reference: reference.trim() } : {}) } }),
        ...(note.trim() ? { note: note.trim() } : {}),
        idempotencyKey: key,
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Hand over the goods</h3>
          <p className="mt-1 text-sm text-gray-500">A company on MINMEG accepts the goods before it holds them. A handover outside MINMEG, such as to a warehouse or customs, takes effect at once. MINMEG may check it.</p>
        </div>
        <FormField htmlFor="handover-to" label="To" required>
          <DropdownSelect id="handover-to" aria-label="To" value={to} onValueChange={(v) => setTo(v as typeof to)} options={[{ value: 'ORGANIZATION', label: 'A company on MINMEG' }, { value: 'EXTERNAL', label: 'A carrier or warehouse outside MINMEG' }, { value: 'AUTHORITY', label: 'Customs or a port authority' }]} />
        </FormField>
        {to === 'ORGANIZATION' ? (
          <FormField htmlFor="handover-org" label="Company ID" required info="Ask the company for its MINMEG company ID.">
            <Input id="handover-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} />
          </FormField>
        ) : (
          <>
            <FormField htmlFor="handover-name" label="Name" required>
              <Input id="handover-name" value={name} maxLength={255} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField htmlFor="handover-ref" label="Their reference" optional info="A waybill, warehouse receipt or customs number.">
              <Input id="handover-ref" value={reference} maxLength={128} onChange={(e) => setReference(e.target.value)} />
            </FormField>
          </>
        )}
        <FormField htmlFor="handover-note" label="Note" optional>
          <Textarea id="handover-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!ready || isLoading} onClick={submit}>Hand over</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Who physically holds a subject, its handovers, and (for the holder) handing it over */
export function CustodyPanel({ subjectType, subjectId, canHandOver }: { subjectType: 'BATCH' | 'HANDLING_UNIT' | 'SHIPMENT'; subjectId: string; canHandOver: boolean }) {
  const history = useGetCustodyHistoryQuery({ subjectType, subjectId }, { refetchOnMountOrArgChange: true });
  const [open, setOpen] = React.useState(false);
  const records = [...(history.data?.data.records ?? [])].reverse();
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Who holds the goods</h3>
        {canHandOver && <Button size="sm" variant="outlined" onClick={() => setOpen(true)}>Hand over</Button>}
      </div>
      {history.isError ? (
        <Alert severity="error">{toApiError(history.error).message}</Alert>
      ) : !records.length ? (
        <p className="text-sm text-steel">{history.isLoading ? 'Loading…' : 'Your company holds them. No handover yet.'}</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {records.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-ink">{r.custodianType === 'ORGANIZATION' ? 'A company on MINMEG' : r.custodianType === 'AUTHORITY' ? 'An authority' : 'Outside MINMEG'} · {r.acquisitionType.toLowerCase()} · {formatDateTime(r.startedAt ?? r.createdAt)}</span>
              <StatusBadge status={r.status}>{CUSTODY_STATUS_LABELS[r.status] ?? r.status}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
      {open && <HandOverModal subjectType={subjectType} subjectId={subjectId} onClose={() => setOpen(false)} />}
    </section>
  );
}
