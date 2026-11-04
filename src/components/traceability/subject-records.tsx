'use client';

import * as React from 'react';
import { Alert, Button, ConfirmDialog, DropdownSelect, FileDropZone, FormField, Input, Modal, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { newIdempotencyKey, useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { eventIsOpen, eventStatusLabel, readingTrust, recorderKind, sourceLabel, type DataField, type EventType, type Reading, type RecorderRole, type RecordSubject, type TraceEvent } from '@/lib/records';
import { numberText } from '@/lib/traceability';
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES, sha256Hex } from '@/lib/vault';
import { sendFileBytes } from '@/lib/vault-upload';
import { useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';
import { useGetMeasurementChoicesQuery } from '@/redux/features/locations/locations_api';
import {
  useCheckEventMutation,
  useCheckReadingMutation,
  useCorrectReadingMutation,
  useGetEventsQuery,
  useGetReadingsQuery,
  useGetRecordableEventTypesQuery,
  useGetWindowQuery,
  useRecordEventMutation,
  useRecordReadingMutation,
  useWithdrawEventMutation,
} from '@/redux/features/traceability/traceability_api';
import { useInitiateUploadMutation } from '@/redux/features/vault/vaultApi';
import { useAppSelector } from '@/redux/hooks';

/*
 * Readings and events on a batch, unit or shipment (step 2.8b, decisions #70, #106).
 *  - owner (the company): declares readings and records the events its role allows; they show as
 *    declared until the inspector or MINMEG checks them
 *  - inspector (assigned to the trade): records and checks, never their own records
 *  - reader: sees them
 * Nothing is edited: a correction is a new reading, a wrong event is withdrawn.
 */

const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const ACCEPT = Object.keys(ACCEPTED_FILE_TYPES).join(',');
const valueOf = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'number' || typeof v === 'string' ? numberText(v) : JSON.stringify(v));

/** Puts the file in the company's (or the inspector's) vault and returns its id for the evidence link */
function useEvidenceUpload() {
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const [initiate] = useInitiateUploadMutation();
  return async (file: File): Promise<string> => {
    const declared = await initiate({ folderId: null, originalFilename: file.name, mimeType: file.type, sizeBytes: file.size, fileClass: 'EVIDENCE', idempotencyKey: newIdempotencyKey() }).unwrap();
    await sendFileBytes(declared.data.file.id, file, { token, checksum: await sha256Hex(file), onProgress: () => undefined });
    return declared.data.file.id;
  };
}

function EvidencePicker({ id, file, onChange, required }: { id: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) {
  const [problem, setProblem] = React.useState<string | null>(null);
  return (
    <FormField htmlFor={id} label="Evidence" required={required} optional={!required} info="A photo, ticket or report. It is kept in your documents and linked to this record.">
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <Button size="sm" variant="text" onClick={() => onChange(null)}>Remove</Button>
        </div>
      ) : (
        <FileDropZone
          label={`${id} file`}
          hint="PDF, pictures, Word, Excel, CSV or text, up to 20 MB"
          accept={ACCEPT}
          onFiles={(list) => {
            const f = list[0];
            setProblem(null);
            if (!f) return;
            if (!ACCEPTED_FILE_TYPES[f.type]) return setProblem('This type is not accepted');
            if (f.size > MAX_FILE_BYTES) return setProblem('The most is 20 MB');
            onChange(f);
          }}
        />
      )}
      {problem && <p className="mt-1 text-sm text-semantic-error-text">{problem}</p>}
    </FormField>
  );
}

/** The inspector's position when the phone gives it quickly: an on-site reading in the window counts as checked */
const currentPosition = () =>
  new Promise<GeolocationCoordinates | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), () => resolve(null), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
  });

function ReadingForm({ subjectType, subjectId, role, onClose }: { subjectType: RecordSubject; subjectId: string; role: RecorderRole; onClose: () => void }) {
  const types = useGetMeasurementChoicesQuery();
  const units = useGetUnitChoicesQuery();
  const [typeId, setTypeId] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [value, setValue] = React.useState('');
  const [measuredAt, setMeasuredAt] = React.useState(() => toLocal(new Date()));
  const [source, setSource] = React.useState(role === 'inspector' ? 'INSPECTOR' : 'MANUAL');
  const [file, setFile] = React.useState<File | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const upload = useEvidenceUpload();
  const [record] = useRecordReadingMutation();
  const unitOptions = (units.data?.data ?? []).filter((u) => (u.measurementTypeId ?? u.measurementType?.id) === typeId).map((u) => ({ value: u.id, label: `${u.name ?? u.code} (${u.symbol})` }));
  const problem = !typeId ? 'Choose what was measured.' : !unitId ? 'Choose the unit.' : !/^-?\d+(\.\d+)?$/.test(value.trim()) ? 'Enter the value as a number.' : !measuredAt ? 'Enter when it was measured.' : null;

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const fileAssetId = file ? await upload(file) : null;
      const at = role === 'inspector' ? await currentPosition() : null;
      await record({
        idempotencyKey: key,
        subjectType,
        subjectId,
        measurementTypeId: typeId,
        unitId,
        value: value.trim(),
        measuredAt: new Date(measuredAt).toISOString(),
        ...(role === 'inspector' ? { sourceType: source } : {}),
        ...(at ? { latitude: at.latitude, longitude: at.longitude, accuracyMeters: Math.round(at.accuracy) } : {}),
        ...(fileAssetId ? { evidence: [{ fileAssetId, attachmentType: 'OTHER', title: file!.name }] } : {}),
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Record a reading</h3>
          <p className="mt-1 text-sm text-gray-500">
            {role === 'inspector'
              ? 'Taken on site during the inspection, with your phone’s location, it counts as checked at once. Otherwise MINMEG checks it.'
              : 'Shown as declared by your company until the inspector or MINMEG checks it. A reading is never edited: a correction replaces it.'}
          </p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="reading-type" label="What was measured" required>
          <DropdownSelect id="reading-type" aria-label="What was measured" value={typeId} placeholder="Choose" options={(types.data?.data ?? []).map((t) => ({ value: t.id, label: t.name }))} onValueChange={(v) => { setTypeId(v); setUnitId(''); }} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="reading-value" label="Value" required>
            <Input id="reading-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="4.1" />
          </FormField>
          <FormField htmlFor="reading-unit" label="Unit" required>
            <DropdownSelect id="reading-unit" aria-label="Unit" value={unitId} placeholder={typeId ? 'Choose' : 'Choose what was measured first'} disabled={!typeId} options={unitOptions} onValueChange={setUnitId} />
          </FormField>
        </div>
        <FormField htmlFor="reading-at" label="Measured" required info="Up to 30 days back.">
          <Input id="reading-at" type="datetime-local" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} />
        </FormField>
        {role === 'inspector' && (
          <FormField htmlFor="reading-source" label="Taken with" required>
            <DropdownSelect id="reading-source" aria-label="Taken with" value={source} onValueChange={setSource} options={[{ value: 'INSPECTOR', label: 'My own instrument' }, { value: 'WEIGHBRIDGE', label: 'Weighbridge' }, { value: 'LAB', label: 'Lab' }]} />
          </FormField>
        )}
        <EvidencePicker id="reading-evidence" file={file} onChange={setFile} />
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save reading</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Save this reading?" description="It can't be edited afterwards, only corrected by a new reading." confirmLabel="Save" loading={busy} onConfirm={save} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

function FieldInput({ field, value, onChange }: { field: DataField; value: string; onChange: (v: string) => void }) {
  const id = `event-data-${field.key}`;
  const label = field.label ?? field.key;
  const control =
    field.type === 'enum' ? (
      <DropdownSelect id={id} aria-label={label} value={value} placeholder="Choose" options={(field.values ?? []).map((v) => ({ value: v, label: v }))} onValueChange={onChange} />
    ) : field.type === 'boolean' ? (
      <DropdownSelect id={id} aria-label={label} value={value} placeholder="Choose" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} onValueChange={onChange} />
    ) : (
      <Input id={id} type={field.type === 'date' ? 'datetime-local' : 'text'} inputMode={field.type === 'number' || field.type === 'integer' ? 'decimal' : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  const range = field.min !== undefined || field.max !== undefined ? `Between ${field.min ?? '…'} and ${field.max ?? '…'}.` : undefined;
  return (
    <FormField htmlFor={id} label={label} required={field.required} optional={!field.required} info={range}>
      {control}
    </FormField>
  );
}

const toData = (fields: DataField[], values: Record<string, string>): Record<string, unknown> =>
  Object.fromEntries(
    fields
      .filter((f) => (values[f.key] ?? '').trim() !== '')
      .map((f) => {
        const v = values[f.key].trim();
        return [f.key, f.type === 'number' || f.type === 'integer' ? Number(v) : f.type === 'boolean' ? v === 'true' : f.type === 'date' ? new Date(v).toISOString() : v];
      }),
  );

function EventForm({ subjectId, role, types, onClose }: { subjectId: string; role: RecorderRole; types: EventType[]; onClose: () => void }) {
  const [typeId, setTypeId] = React.useState(types.length === 1 ? types[0].id : '');
  const [occurredAt, setOccurredAt] = React.useState(() => toLocal(new Date()));
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [file, setFile] = React.useState<File | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const upload = useEvidenceUpload();
  const [record] = useRecordEventMutation();
  const type = types.find((t) => t.id === typeId);
  const fields = type?.metadataSchema?.fields ?? [];
  const missing = fields.find((f) => f.required && !(values[f.key] ?? '').trim());
  const problem = !type
    ? 'Choose what happened.'
    : type.requiresLocation
      ? 'This kind of event needs a place: MINMEG staff record it.'
      : missing
        ? `Fill in ${missing.label ?? missing.key}.`
        : type.requiresEvidence && !file
          ? 'Attach the evidence.'
          : null;

  const save = async () => {
    if (!type) return;
    setError(null);
    setBusy(true);
    try {
      const fileAssetId = file ? await upload(file) : null;
      await record({
        idempotencyKey: key,
        eventTypeId: type.id,
        subjectId,
        occurredAt: new Date(occurredAt).toISOString(),
        ...(fields.length ? { data: toData(fields, values) } : {}),
        ...(fileAssetId ? { evidence: [{ fileAssetId, attachmentType: 'OTHER', title: file!.name }] } : {}),
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Record an event</h3>
          <p className="mt-1 text-sm text-gray-500">Something that happened to the goods, such as a site visit or sampling. It can&apos;t be edited afterwards; a wrong one is withdrawn with a reason.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="event-type" label="What happened" required>
          <DropdownSelect id="event-type" aria-label="What happened" value={typeId} placeholder="Choose" options={types.map((t) => ({ value: t.id, label: t.name }))} onValueChange={(v) => { setTypeId(v); setValues({}); }} />
        </FormField>
        {type?.description && <p className="text-sm text-gray-600">{type.description}</p>}
        {type?.requiresVerification && role !== 'staff' && <p className="text-sm text-gray-600">MINMEG or the inspector checks this kind of event.</p>}
        <FormField htmlFor="event-at" label="When" required info="Up to 30 days back.">
          <Input id="event-at" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </FormField>
        {fields.map((f) => <FieldInput key={f.key} field={f} value={values[f.key] ?? ''} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />)}
        {type && <EvidencePicker id="event-evidence" file={file} onChange={setFile} required={type.requiresEvidence} />}
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save event</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Record ${type?.name ?? 'this event'}?`} description="It can't be edited afterwards, only withdrawn with a reason." confirmLabel="Save" loading={busy} onConfirm={save} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

type Pending =
  | { kind: 'check-reading' | 'reject-reading'; reading: Reading }
  | { kind: 'correct-reading'; reading: Reading }
  | { kind: 'check-event' | 'withdraw-event'; event: TraceEvent };

function CorrectReading({ reading, onClose }: { reading: Reading; onClose: () => void }) {
  const [value, setValue] = React.useState(numberText(reading.value));
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [correct, { isLoading }] = useCorrectReadingMutation();
  const ok = /^-?\d+(\.\d+)?$/.test(value.trim()) && reason.trim().length >= 3;
  const save = async () => {
    setError(null);
    try {
      await correct({ id: reading.id, idempotencyKey: key, value: value.trim(), reason: reason.trim() }).unwrap();
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
          <h3 className="text-lg font-bold text-gray-900">Correct {reading.measurementType?.name ?? 'the reading'}</h3>
          <p className="mt-1 text-sm text-gray-500">A new reading replaces this one. The old one stays in the history.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="correct-value" label={`Value (${reading.unit?.symbol ?? ''})`} required>
          <Input id="correct-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </FormField>
        <FormField htmlFor="correct-reason" label="Why" required>
          <Textarea id="correct-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok} loading={isLoading} onClick={save}>Save correction</Button>
        </div>
      </div>
    </Modal>
  );
}

/** "Readings and events" for one batch, unit or shipment */
export function SubjectRecords({ subjectType, subjectId, role, title = 'Readings and events' }: { subjectType: RecordSubject; subjectId: string; role: RecorderRole; title?: string }) {
  const me = useAppSelector((s) => (s.auth as { user?: { id?: string } | null }).user?.id ?? null);
  const [showHistory, setShowHistory] = React.useState(false);
  const readings = useGetReadingsQuery({ subjectType, subjectId, includeHistory: showHistory });
  const events = useGetEventsQuery({ subjectType, subjectId, includeHistory: showHistory });
  const kind = recorderKind(role);
  const types = useGetRecordableEventTypesQuery(subjectType, { skip: !kind });
  const myTypes = (types.data?.data ?? []).filter((t) => !t.systemDefined && kind && (t.recordableBy ?? []).includes(kind));
  const [form, setForm] = React.useState<'reading' | 'event' | null>(null);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [checkReading, checkReadingState] = useCheckReadingMutation();
  const [checkEvent, checkEventState] = useCheckEventMutation();
  const [withdrawEvent, withdrawState] = useWithdrawEventMutation();
  const canCheck = role === 'inspector' || role === 'staff';
  const canRecord = role !== 'reader';

  const run = async (text?: string) => {
    if (!pending) return;
    setActionError(null);
    try {
      if (pending.kind === 'check-reading') await checkReading({ id: pending.reading.id, outcome: 'VERIFIED' }).unwrap();
      if (pending.kind === 'reject-reading') await checkReading({ id: pending.reading.id, outcome: 'REJECTED', note: text }).unwrap();
      if (pending.kind === 'check-event') await checkEvent({ id: pending.event.id, ...(text ? { note: text } : {}) }).unwrap();
      if (pending.kind === 'withdraw-event') await withdrawEvent({ id: pending.event.id, reason: text ?? '' }).unwrap();
      setPending(null);
    } catch (err) {
      setPending(null);
      setActionError(toApiError(err).message);
    }
  };

  const error = readings.error ?? events.error;
  const readingRows = readings.data?.data ?? [];
  const eventRows = (events.data?.data ?? []).filter((e) => !e.eventType?.systemDefined || showHistory);
  return (
    <section className="space-y-3" aria-labelledby={`records-${subjectId}`} data-testid={`records-${subjectId}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={`records-${subjectId}`} className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">Never edited: corrections and withdrawals stay in the history.</p>
        </div>
        {canRecord && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outlined" onClick={() => setForm('reading')}>Record a reading</Button>
            {!!myTypes.length && <Button size="sm" variant="outlined" onClick={() => setForm('event')}>Record an event</Button>}
          </div>
        )}
      </div>
      {error && <Alert severity="error">{toApiError(error).message}</Alert>}
      {actionError && <Alert severity="error">{actionError}</Alert>}

      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Readings</h4>
        {readings.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {!readings.isLoading && !readingRows.length && <p className="text-sm text-gray-500">No readings yet.</p>}
        {readingRows.map((r) => {
          const trust = readingTrust(r);
          const open = r.status === 'ACTIVE';
          return (
            <div key={r.id} className="space-y-1 rounded-lg bg-gray-50 p-3" data-testid={`reading-${r.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-900">{r.measurementType?.name ?? 'Reading'}: {numberText(r.value)} {r.unit?.symbol}</span>
                <StatusBadge status={trust.status}>{trust.label}</StatusBadge>
              </div>
              <p className="text-xs text-gray-500">{sourceLabel(r.sourceType)} · measured {formatDateTime(r.measuredAt)}</p>
              {r.verificationNote && <p className="text-sm text-gray-600">Note: {r.verificationNote}</p>}
              {r.statusReason && <p className="text-sm text-gray-600">Why: {r.statusReason}</p>}
              {open && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {canCheck && r.verificationStatus === 'UNVERIFIED' && r.recordedBy !== me && (
                    <>
                      <Button size="sm" onClick={() => setPending({ kind: 'check-reading', reading: r })}>Checked</Button>
                      <Button size="sm" variant="outlined" onClick={() => setPending({ kind: 'reject-reading', reading: r })}>Reject</Button>
                    </>
                  )}
                  {((r.recordedBy === me && r.verificationStatus === 'UNVERIFIED') || role === 'staff') && (
                    <Button size="sm" variant="outlined" onClick={() => setPending({ kind: 'correct-reading', reading: r })}>Correct</Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Events</h4>
        {events.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {!events.isLoading && !eventRows.length && <p className="text-sm text-gray-500">No events recorded by hand yet.</p>}
        {eventRows.map((e) => (
          <div key={e.id} className="space-y-1 rounded-lg bg-gray-50 p-3" data-testid={`event-${e.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900">{e.eventType?.name ?? 'Event'}</span>
              <StatusBadge status={e.status === 'RECORDED' ? 'ACTIVE' : e.status === 'PENDING' ? 'PENDING' : e.status}>{eventStatusLabel(e.status)}</StatusBadge>
            </div>
            <p className="text-xs text-gray-500">{formatDateTime(e.occurredAt)}</p>
            {!!e.data && !!Object.keys(e.data).length && <p className="text-sm text-gray-700">{Object.entries(e.data).map(([k, v]) => `${k}: ${valueOf(v)}`).join(' · ')}</p>}
            {e.verificationNote && <p className="text-sm text-gray-600">Note: {e.verificationNote}</p>}
            {e.statusReason && <p className="text-sm text-gray-600">Why: {e.statusReason}</p>}
            {eventIsOpen(e) && !e.eventType?.systemDefined && (
              <div className="flex flex-wrap gap-2 pt-1">
                {canCheck && ['PENDING', 'RECORDED'].includes(e.status) && e.actorId !== me && <Button size="sm" onClick={() => setPending({ kind: 'check-event', event: e })}>Checked</Button>}
                {((e.actorId === me && ['PENDING', 'RECORDED'].includes(e.status)) || role === 'staff') && (
                  <Button size="sm" variant="outlined" onClick={() => setPending({ kind: 'withdraw-event', event: e })}>Withdraw</Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={showHistory} onChange={(e) => setShowHistory(e.target.checked)} />
        Show replaced and withdrawn records, and events MINMEG records itself
      </label>

      {form === 'reading' && <ReadingForm subjectType={subjectType} subjectId={subjectId} role={role} onClose={() => setForm(null)} />}
      {form === 'event' && <EventForm subjectId={subjectId} role={role} types={myTypes} onClose={() => setForm(null)} />}
      {pending?.kind === 'correct-reading' && <CorrectReading reading={pending.reading} onClose={() => setPending(null)} />}
      {pending && pending.kind !== 'correct-reading' && (
        <ConfirmDialog
          open
          title={{ 'check-reading': 'Mark this reading as checked?', 'reject-reading': 'Reject this reading?', 'check-event': 'Mark this event as checked?', 'withdraw-event': 'Withdraw this event?' }[pending.kind]}
          confirmLabel={{ 'check-reading': 'Checked', 'reject-reading': 'Reject', 'check-event': 'Checked', 'withdraw-event': 'Withdraw' }[pending.kind]}
          tone={pending.kind === 'reject-reading' || pending.kind === 'withdraw-event' ? 'error' : 'primary'}
          reason={pending.kind === 'reject-reading' ? { label: 'Why (the company sees this)', minLength: 3 } : pending.kind === 'withdraw-event' ? { label: 'Reason', minLength: 3 } : undefined}
          loading={checkReadingState.isLoading || checkEventState.isLoading || withdrawState.isLoading}
          onConfirm={run}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  );
}

/** The inspector's readings and events for each batch on the trade (workbench) */
export function WorkbenchRecords({ assignmentId }: { assignmentId: string }) {
  const { data } = useGetWindowQuery(assignmentId);
  const batches = data?.data?.batches ?? [];
  if (!batches.length) return null;
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 p-4 sm:p-5" aria-labelledby="workbench-records">
      <div>
        <h3 id="workbench-records" className="text-base font-black text-gray-900">Readings and events</h3>
        <p className="mt-0.5 text-xs text-gray-500">Weights, moisture and other readings, and what happened on site. Readings you take on site during the inspection count as checked. You can also check what the company declared.</p>
      </div>
      {batches.map((b) => (
        <div key={b.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <SubjectRecords subjectType="BATCH" subjectId={b.id} role="inspector" title={`${b.batchCode}${b.material ? ` · ${b.material}` : ''}`} />
        </div>
      ))}
    </section>
  );
}
