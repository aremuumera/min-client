'use client';

import * as React from 'react';
import { Alert, Button, FormField, Input, Modal, QrScanner, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { currentPosition, LIVE_UNIT, unitTypeLabel, type Code, type FieldWindow, type HandlingUnit } from '@/lib/traceability';
import {
  useApplyCodeMutation,
  useCreatePrintJobMutation,
  useExtendWindowMutation,
  useGetWindowQuery,
  useLazyGetLabelQuery,
  useMakeCodesMutation,
  usePrintJobActionMutation,
  useReplaceCodeMutation,
  useUnitActionMutation,
} from '@/redux/features/traceability/traceability_api';
import { BatchUnitsPanel } from './batch-units-panel';

/** An open QR or barcode (made or applied) means the subject needs no new one */
const hasOpenCode = (codes: Code[]) => codes.some((c) => (c.identifierType === 'QR' || c.identifierType === 'BARCODE') && ['GENERATED', 'ACTIVE'].includes(c.status));
const toLocal = (iso: string) => new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function WindowCard({ assignmentId, window }: { assignmentId: string; window: FieldWindow }) {
  const [extending, setExtending] = React.useState(false);
  const [closesAt, setClosesAt] = React.useState(window.closesAt ? toLocal(window.closesAt) : '');
  const [reason, setReason] = React.useState('');
  const [progress, setProgress] = React.useState('');
  const [remaining, setRemaining] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [extend, { isLoading }] = useExtendWindowMutation();
  // Read once when the card first shows; the window's times come from the server
  const [now] = React.useState(() => Date.now());
  const status = window.stoppedAt
    ? `Closed: ${window.stopReason ?? 'stopped'}`
    : !window.scheduled || !window.opensAt || !window.closesAt
      ? 'No inspection date yet. Labels can be made once MINMEG schedules the visit.'
      : now < new Date(window.opensAt).getTime()
        ? `Opens ${formatDateTime(window.opensAt)}`
        : now < new Date(window.closesAt).getTime()
          ? `Open until ${formatDateTime(window.closesAt)}`
          : `Closed at ${formatDateTime(window.closesAt)}`;
  const recorded = Object.entries(window.recorded ?? {}).filter(([, v]) => v.accepted || v.rejected);
  const submit = async () => {
    setError(null);
    try {
      await extend({ assignmentId, closesAt: new Date(closesAt).toISOString(), reason: reason.trim(), progress: progress.trim(), ...(remaining.trim() ? { remaining: remaining.trim() } : {}) }).unwrap();
      setExtending(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Time for label work</h3>
          <p className="text-sm text-gray-600">{status}</p>
        </div>
        {window.scheduled && !window.stoppedAt && <Button size="sm" variant="outlined" onClick={() => setExtending(true)}>Ask for more time</Button>}
      </div>
      {!!recorded.length && (
        <p className="text-xs text-gray-500">Recorded so far: {recorded.map(([k, v]) => `${k.toLowerCase()} ${v.accepted}${v.rejected ? ` (${v.rejected} refused)` : ''}`).join(' · ')}</p>
      )}
      {extending && (
        <Modal open onClose={() => setExtending(false)} size="sm">
          <div className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">More time for label work</h3>
              <p className="mt-1 text-sm text-gray-500">Up to 24 hours more each time, and never past the planned departure. MINMEG is told.</p>
            </div>
            <FormField htmlFor="window-until" label="Work until" required>
              <Input id="window-until" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </FormField>
            <FormField htmlFor="window-reason" label="Why" required>
              <Textarea id="window-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} placeholder="Rain stopped loading at 15:00" />
            </FormField>
            <FormField htmlFor="window-progress" label="Done so far" required>
              <Textarea id="window-progress" value={progress} onChange={(e) => setProgress(e.target.value)} rows={2} maxLength={1000} placeholder="18 of 30 bags labelled" />
            </FormField>
            <FormField htmlFor="window-remaining" label="Still to do" optional>
              <Textarea id="window-remaining" value={remaining} onChange={(e) => setRemaining(e.target.value)} rows={2} maxLength={1000} />
            </FormField>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outlined" onClick={() => setExtending(false)}>Back</Button>
              <Button disabled={isLoading || reason.trim().length < 5 || progress.trim().length < 3 || !closesAt} onClick={submit}>Ask</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MakeCodesModal({ batchId, batchCodes, units, onClose }: { batchId: string; batchCodes: Code[]; units: HandlingUnit[]; onClose: () => void }) {
  const subjects = [
    ...(!hasOpenCode(batchCodes) ? [{ subjectType: 'BATCH', subjectId: batchId, label: 'The batch itself' }] : []),
    ...units.filter((u) => LIVE_UNIT.includes(u.status) && !hasOpenCode(u.identifiers)).map((u) => ({ subjectType: 'HANDLING_UNIT', subjectId: u.id, label: `${unitTypeLabel(u.unitType)}${u.serialNumber ? ` ${u.serialNumber}` : ''}` })),
  ];
  const [picked, setPicked] = React.useState<Set<string>>(new Set(subjects.map((s) => s.subjectId)));
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [make, { isLoading }] = useMakeCodesMutation();
  const submit = async () => {
    setError(null);
    try {
      await make({ items: subjects.filter((s) => picked.has(s.subjectId)).map(({ subjectType, subjectId }) => ({ subjectType, subjectId, identifierType: 'QR' })), idempotencyKey: key }).unwrap();
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
          <h3 className="text-lg font-bold text-gray-900">Make MINMEG codes</h3>
          <p className="mt-1 text-sm text-gray-500">One QR code for each. Next, print the labels and put them on the goods.</p>
        </div>
        {!subjects.length ? (
          <p className="text-sm text-gray-600">Everything already has a code.</p>
        ) : (
          <fieldset className="space-y-1">
            <legend className="sr-only">What needs a code</legend>
            {subjects.map((s) => (
              <label key={s.subjectId} className="flex min-h-11 items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" checked={picked.has(s.subjectId)} onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(s.subjectId); else n.delete(s.subjectId); setPicked(n); }} />
                {s.label}
              </label>
            ))}
          </fieldset>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!picked.size || isLoading} onClick={submit}>Make {picked.size} code(s)</Button>
        </div>
      </div>
    </Modal>
  );
}

function PrintModal({ codes, onClose }: { codes: Code[]; onClose: () => void }) {
  const [step, setStep] = React.useState<'choose' | 'printing'>('choose');
  const [picked, setPicked] = React.useState<Set<string>>(new Set(codes.map((c) => c.id)));
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [labels, setLabels] = React.useState<{ id: string; ref: string | null; svg: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [create, { isLoading: creating }] = useCreatePrintJobMutation();
  const [jobAction, { isLoading: finishing }] = usePrintJobActionMutation();
  const [loadLabel] = useLazyGetLabelQuery();

  const start = async () => {
    setError(null);
    try {
      const chosen = codes.filter((c) => picked.has(c.id));
      const job = await create({ identifierIds: chosen.map((c) => c.id), idempotencyKey: key }).unwrap();
      done();
      await jobAction({ id: job.data.id, action: 'start' }).unwrap();
      setJobId(job.data.id);
      setLabels(await Promise.all(chosen.map(async (c) => ({ id: c.id, ref: c.publicReference, svg: await loadLabel(c.id).unwrap() }))));
      setStep('printing');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  const openSheet = () => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return setError('Allow pop-ups for this site to open the print sheet.');
    w.document.write(`<!doctype html><html><head><title>MINMEG labels</title><style>body{font-family:sans-serif;margin:12mm}.l{display:inline-block;width:60mm;margin:4mm;text-align:center;page-break-inside:avoid}.l svg{width:100%;height:auto}</style></head><body>${labels.map((l) => `<div class="l">${l.svg}</div>`).join('')}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  const finish = async (allPrinted: boolean) => {
    if (!jobId) return;
    setError(null);
    try {
      await jobAction({ id: jobId, action: 'complete', body: allPrinted ? {} : { failureReason: 'The printer did not print every label' } }).unwrap();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <h3 className="text-lg font-bold text-gray-900">Print labels</h3>
        {step === 'choose' ? (
          <>
            <p className="text-sm text-gray-500">Each label prints once. A label that fails can be printed again with a reason.</p>
            <fieldset className="max-h-64 space-y-1 overflow-y-auto">
              <legend className="sr-only">Labels to print</legend>
              {codes.map((c) => (
                <label key={c.id} className="flex min-h-11 items-center gap-2 font-mono text-sm text-gray-800">
                  <input type="checkbox" checked={picked.has(c.id)} onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(c.id); else n.delete(c.id); setPicked(n); }} />
                  {c.publicReference}
                </label>
              ))}
            </fieldset>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Labels">
              {labels.map((l) => (
                // The label is MINMEG's own SVG from the backend
                <div key={l.id} className="rounded-lg border border-gray-200 p-2" dangerouslySetInnerHTML={{ __html: l.svg }} />
              ))}
            </div>
            <p className="text-sm text-gray-600">Open the print sheet and print it. Then say whether every label came out.</p>
          </>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          {step === 'choose' ? (
            <>
              <Button variant="outlined" onClick={onClose}>Cancel</Button>
              <Button disabled={!picked.size || creating} onClick={start}>Prepare {picked.size} label(s)</Button>
            </>
          ) : (
            <>
              <Button variant="outlined" onClick={openSheet}>Open the print sheet</Button>
              <Button variant="outlined" disabled={finishing} onClick={() => finish(false)}>Some did not print</Button>
              <Button disabled={finishing} onClick={() => finish(true)}>All printed</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Scan the label on the goods: the code must be this one, and you must be at the site */
function ApplyModal({ codes, onClose }: { codes: Code[]; onClose: () => void }) {
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [round, setRound] = React.useState(0);
  const [apply] = useApplyCodeMutation();
  const onResult = React.useCallback(
    async (value: string) => {
      const ref = value.toUpperCase();
      const code = codes.find((c) => c.status === 'GENERATED' && ((c.publicReference && ref.includes(c.publicReference.toUpperCase())) || c.identifierValue === value));
      if (!code) {
        setMessage({ ok: false, text: 'This label is not one of the codes waiting to be applied here.' });
        return setRound((r) => r + 1);
      }
      try {
        const where = await currentPosition();
        await apply({ id: code.id, scannedValue: value, ...where }).unwrap();
        setMessage({ ok: true, text: `${code.publicReference} is now active.` });
      } catch (err) {
        setMessage({ ok: false, text: err instanceof Error && !('status' in (err as object)) ? err.message : toApiError(err).message });
      }
      setRound((r) => r + 1);
    },
    [codes, apply],
  );
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Apply codes</h3>
          <p className="mt-1 text-sm text-gray-500">Stick the label on, then scan it with the camera. Scanning proves the label is on the goods, so a typed reference cannot apply a QR code. You need to be at the site, with location on.</p>
        </div>
        <QrScanner key={round} onResult={onResult} />
        {message && <Alert severity={message.ok ? 'success' : 'error'}>{message.text}</Alert>}
        <div className="flex justify-end">
          <Button variant="outlined" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}

function SealModal({ unit, onClose }: { unit: HandlingUnit; onClose: () => void }) {
  const [seal, setSeal] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [act, { isLoading }] = useUnitActionMutation();
  const submit = async () => {
    setError(null);
    try {
      await act({ id: unit.id, action: 'pack', body: { sealReference: seal.trim(), ...(await currentPosition()) } }).unwrap();
      onClose();
    } catch (err) {
      setError(err instanceof Error && !('status' in (err as object)) ? err.message : toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Seal this {unitTypeLabel(unit.unitType).toLowerCase()}</h3>
          <p className="mt-1 text-sm text-gray-500">Type the number on the seal. A seal number can be used once. You need to be at the site.</p>
        </div>
        <FormField htmlFor="seal-number" label="Seal number" required>
          <Input id="seal-number" value={seal} maxLength={128} onChange={(e) => setSeal(e.target.value)} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!seal.trim() || isLoading} onClick={submit}>Seal</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReplaceModal({ code, onClose }: { code: Code; onClose: () => void }) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [replace, { isLoading }] = useReplaceCodeMutation();
  const submit = async () => {
    setError(null);
    try {
      await replace({ id: code.id, reason: reason.trim(), ...(await currentPosition()) }).unwrap();
      onClose();
    } catch (err) {
      setError(err instanceof Error && !('status' in (err as object)) ? err.message : toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Replace {code.publicReference}</h3>
          <p className="mt-1 text-sm text-gray-500">A new code is made. Print it and apply it like the first one.</p>
        </div>
        <FormField htmlFor="replace-reason" label="Reason" required>
          <Textarea id="replace-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={reason.trim().length < 3 || isLoading} onClick={submit}>Replace</Button>
        </div>
      </div>
    </Modal>
  );
}

/** Label work in the inspector's workbench: one section per batch of the trade */
export function WorkbenchLabels({ assignmentId }: { assignmentId: string }) {
  const query = useGetWindowQuery(assignmentId, { refetchOnMountOrArgChange: true });
  const [modal, setModal] = React.useState<null | { kind: 'make'; batchId: string; batchCodes: Code[]; units: HandlingUnit[] } | { kind: 'print' | 'apply'; codes: Code[] } | { kind: 'seal'; unit: HandlingUnit } | { kind: 'replace'; code: Code }>(null);
  const window = query.data?.data;
  if (query.isError) return <Alert severity="error">{toApiError(query.error).message}</Alert>;
  if (!window) return <p className="text-sm text-gray-500">Loading label work…</p>;

  const waiting = (batchCodes: Code[], units: HandlingUnit[]) => [...batchCodes, ...units.flatMap((u) => u.identifiers)].filter((c) => c.status === 'GENERATED' && c.publicReference);
  const toPrint = (batchCodes: Code[], units: HandlingUnit[]) => waiting(batchCodes, units).filter((c) => !c.printed);
  const toApply = (batchCodes: Code[], units: HandlingUnit[]) => waiting(batchCodes, units).filter((c) => c.printed);
  return (
    <section className="space-y-4" aria-labelledby="labels-heading">
      <div>
        <h2 id="labels-heading" className="text-lg font-black text-gray-900">Labels on the goods</h2>
        <p className="text-sm text-gray-500">Make a MINMEG code for the batch and each bag or drum, print the labels, then stick them on and scan them at the site. Seal containers here too. The goods can only leave once they carry active codes.</p>
      </div>
      <WindowCard assignmentId={assignmentId} window={window} />
      {!window.batches.length ? (
        <p className="text-sm text-gray-600">No stock is committed to this trade yet. Labels are made once the trade is accepted.</p>
      ) : (
        window.batches.map((b) => (
          <div key={b.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900">{b.batchCode}{b.material ? ` · ${b.material}` : ''}</h3>
            <BatchUnitsPanel
              batchId={b.id}
              canManage={false}
              codeTools={({ units, batchCodes }) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setModal({ kind: 'make', batchId: b.id, batchCodes, units })}>Make codes</Button>
                  <Button size="sm" variant="outlined" disabled={!toPrint(batchCodes, units).length} onClick={() => setModal({ kind: 'print', codes: toPrint(batchCodes, units) })}>Print labels</Button>
                  <Button size="sm" variant="outlined" disabled={!toApply(batchCodes, units).length} onClick={() => setModal({ kind: 'apply', codes: toApply(batchCodes, units) })}>Apply codes</Button>
                </div>
              )}
              unitTools={(u) => (
                <>
                  {LIVE_UNIT.includes(u.status) && !u.sealed && <Button size="sm" variant="outlined" onClick={() => setModal({ kind: 'seal', unit: u })}>Seal</Button>}
                  {u.identifiers.filter((c) => ['LOST', 'DAMAGED'].includes(c.status) && !c.replacedById).map((c) => (
                    <Button key={c.id} size="sm" variant="outlined" onClick={() => setModal({ kind: 'replace', code: c })}>Replace code</Button>
                  ))}
                </>
              )}
            />
          </div>
        ))
      )}
      {modal?.kind === 'make' && <MakeCodesModal batchId={modal.batchId} batchCodes={modal.batchCodes} units={modal.units} onClose={() => setModal(null)} />}
      {modal?.kind === 'print' && <PrintModal codes={modal.codes} onClose={() => setModal(null)} />}
      {modal?.kind === 'apply' && <ApplyModal codes={modal.codes} onClose={() => setModal(null)} />}
      {modal?.kind === 'seal' && <SealModal unit={modal.unit} onClose={() => setModal(null)} />}
      {modal?.kind === 'replace' && <ReplaceModal code={modal.code} onClose={() => setModal(null)} />}
    </section>
  );
}
