'use client';

import * as React from 'react';
import { Alert, Button, ConfirmDialog, FileDropZone, FormField, Input, Modal, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import {
  numberText,
  POSITION_TEXT,
  RESULT_STATUS_LABELS,
  type Findings,
  type InspectionFile,
  type LabResult,
  type MeasuredValue,
  type RoundResults,
} from '@/lib/traceability';
import {
  useGetRoundResultsQuery,
  useGetWindowQuery,
  useSubmitFindingsMutation,
  useSubmitLabResultMutation,
  useUploadInspectionFilesMutation,
} from '@/redux/features/traceability/traceability_api';

/*
 * Findings and lab results per batch (step 2.8a, decisions #71 and #72).
 * The inspector records them in the workbench; MINMEG checks them; the buyer and the supplier
 * see them only after MINMEG releases the round. No pass or fail: a lab grade is shown against
 * the agreed grade.
 */

type Batch = { id: string; batchCode: string | null; material: string | null };
type Row = { parameter: string; value: string; unit: string };
const EMPTY_ROW: Row = { parameter: '', value: '', unit: '' };

/** The batch's live findings: the newest one that was not replaced */
const currentFindings = (results: Findings[], batchId: string) =>
  [...results].reverse().find((r) => r.batchId === batchId && r.status !== 'SUPERSEDED') ?? null;
const labResultsFor = (results: LabResult[], batchId: string) => results.filter((r) => r.batchId === batchId);

/** Batches still without findings MINMEG can accept (none yet, or sent back) */
export function batchesMissingFindings(batches: Batch[], results: RoundResults | undefined): Batch[] {
  return batches.filter((b) => {
    const f = currentFindings(results?.inspectionResults ?? [], b.id);
    return !f || f.status === 'REJECTED';
  });
}

const toValues = (rows: Row[]): MeasuredValue[] =>
  rows
    .filter((r) => r.parameter.trim() && r.value.trim())
    .map((r) => {
      const v = r.value.trim();
      return { parameter: r.parameter.trim(), value: /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v, ...(r.unit.trim() ? { unit: r.unit.trim() } : {}) };
    });
const valueText = (v: MeasuredValue) => `${v.parameter}: ${numberText(v.value)}${v.unit ? ` ${v.unit}` : ''}`;
const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined);

function ValuesEditor({ idPrefix, rows, onChange }: { idPrefix: string; rows: Row[]; onChange: (rows: Row[]) => void }) {
  const set = (i: number, patch: Partial<Row>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_5rem_auto] items-center gap-2">
          <Input aria-label={`Parameter ${i + 1}`} id={`${idPrefix}-p-${i}`} value={r.parameter} onChange={(e) => set(i, { parameter: e.target.value })} placeholder="Moisture" maxLength={64} />
          <Input aria-label={`Value ${i + 1}`} id={`${idPrefix}-v-${i}`} value={r.value} onChange={(e) => set(i, { value: e.target.value })} placeholder="4.1" maxLength={64} />
          <Input aria-label={`Unit ${i + 1}`} id={`${idPrefix}-u-${i}`} value={r.unit} onChange={(e) => set(i, { unit: e.target.value })} placeholder="%" maxLength={16} />
          <Button size="sm" variant="text" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Remove value ${i + 1}`}>Remove</Button>
        </div>
      ))}
      <Button size="sm" variant="outlined" onClick={() => onChange([...rows, { ...EMPTY_ROW }])}>Add a value</Button>
    </div>
  );
}

function FilePicker({ id, label, hint, accept, files, onChange }: { id: string; label: string; hint: string; accept: string; files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="space-y-2" id={id}>
      <FileDropZone label={label} hint={hint} accept={accept} multiple onFiles={(list) => onChange([...files, ...Array.from(list)].slice(0, 10))} />
      {!!files.length && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-sm text-gray-700">
              <span className="truncate">{f.name}</span>
              <Button size="sm" variant="text" onClick={() => onChange(files.filter((_, j) => j !== i))}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Uploads the picked files to the inspection (stored privately) and returns their ids */
function useUploadFiles(assignmentId: string) {
  const [upload, { isLoading }] = useUploadInspectionFilesMutation();
  const run = async (files: File[], category: string): Promise<string[]> => {
    if (!files.length) return [];
    const form = new FormData();
    form.append('category', category);
    files.forEach((f) => form.append('images', f));
    const res = await upload({ assignmentId, form }).unwrap();
    return (res.data ?? []).map((f) => f.id);
  };
  return { run, isLoading };
}

function FindingsForm({ assignmentId, batch, onClose }: { assignmentId: string; batch: Batch; onClose: () => void }) {
  const [quantity, setQuantity] = React.useState('');
  const [rows, setRows] = React.useState<Row[]>([{ ...EMPTY_ROW }]);
  const [summary, setSummary] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const uploader = useUploadFiles(assignmentId);
  const [submit, { isLoading }] = useSubmitFindingsMutation();
  const observations = toValues(rows);
  const empty = !quantity.trim() && !observations.length && !summary.trim() && !files.length;

  const save = async () => {
    setError(null);
    try {
      const fileIds = await uploader.run(files, 'SITE_EVIDENCE');
      await submit({
        assignmentId,
        idempotencyKey: key,
        batchId: batch.id,
        ...(quantity.trim() ? { quantityVerified: quantity.trim() } : {}),
        ...(observations.length ? { observations } : {}),
        ...(summary.trim() ? { summary: summary.trim() } : {}),
        ...(fileIds.length ? { fileIds } : {}),
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Findings for {batch.batchCode ?? batch.id}</h3>
          <p className="mt-1 text-sm text-gray-500">What you checked on site for this batch. MINMEG checks it before the buyer or the supplier sees it. Saving again replaces your earlier findings.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="findings-quantity" label="Quantity verified" optional info="The quantity you confirmed on site, in the batch's unit.">
          <Input id="findings-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="20" />
        </FormField>
        <FormField htmlFor="findings-values" label="Observations" optional info="Spot checks and readings, for example moisture 4.1 %. Leave a row empty to skip it.">
          <ValuesEditor idPrefix="findings" rows={rows} onChange={setRows} />
        </FormField>
        <FormField htmlFor="findings-summary" label="Summary" optional info="Packaging, condition, how samples were taken.">
          <Textarea id="findings-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={5000} />
        </FormField>
        <FormField htmlFor="findings-files" label="Photos and videos" optional info="Stored privately. Opened only through a link that expires.">
          <FilePicker id="findings-files" label="Findings photos" hint="Photos or videos, up to 10" accept="image/*,video/*" files={files} onChange={setFiles} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={empty} onClick={() => setConfirming(true)}>Save findings</Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Save these findings?"
        description={`They are sent to MINMEG for ${batch.batchCode ?? batch.id}.`}
        confirmLabel="Save"
        loading={isLoading || uploader.isLoading}
        onConfirm={save}
        onClose={() => setConfirming(false)}
      />
    </Modal>
  );
}

function LabResultForm({ assignmentId, batch, findingsId, onClose }: { assignmentId: string; batch: Batch; findingsId: string | null; onClose: () => void }) {
  const [lab, setLab] = React.useState('');
  const [labRef, setLabRef] = React.useState('');
  const [sampleRef, setSampleRef] = React.useState('');
  const [sampledAt, setSampledAt] = React.useState('');
  const [testedAt, setTestedAt] = React.useState('');
  const [gradeParam, setGradeParam] = React.useState('');
  const [gradeValue, setGradeValue] = React.useState('');
  const [gradeUnit, setGradeUnit] = React.useState('%');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [summary, setSummary] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const uploader = useUploadFiles(assignmentId);
  const [submit, { isLoading }] = useSubmitLabResultMutation();
  const values = toValues(rows);
  const grade = gradeParam.trim() && gradeValue.trim() && !Number.isNaN(Number(gradeValue)) ? { parameter: gradeParam.trim(), value: Number(gradeValue), unit: gradeUnit.trim() || '%' } : null;
  const problem = !lab.trim()
    ? 'Enter the laboratory.'
    : !grade && !values.length
      ? 'Enter the grade or at least one other value.'
      : !files.length
        ? 'Attach the lab certificate or report.'
        : sampledAt && testedAt && testedAt < sampledAt
          ? 'The analysis cannot be before the sampling.'
          : null;

  const save = async () => {
    setError(null);
    try {
      const fileIds = await uploader.run(files, 'LAB_CERTIFICATE');
      await submit({
        idempotencyKey: key,
        inspectorAssignmentId: assignmentId,
        batchId: batch.id,
        ...(findingsId ? { inspectionResultId: findingsId } : {}),
        laboratoryName: lab.trim(),
        ...(labRef.trim() ? { laboratoryReference: labRef.trim() } : {}),
        ...(sampleRef.trim() ? { sampleReference: sampleRef.trim() } : {}),
        ...(sampledAt ? { sampledAt: toIso(sampledAt) } : {}),
        ...(testedAt ? { testedAt: toIso(testedAt) } : {}),
        ...(grade ? { grade } : {}),
        ...(values.length ? { values } : {}),
        ...(summary.trim() ? { summary: summary.trim() } : {}),
        fileIds,
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Lab result for {batch.batchCode ?? batch.id}</h3>
          <p className="mt-1 text-sm text-gray-500">One sample&apos;s analysis, with the lab&apos;s certificate. The grade is shown against the agreed grade once MINMEG releases it.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="lab-name" label="Laboratory" required>
          <Input id="lab-name" value={lab} onChange={(e) => setLab(e.target.value)} maxLength={255} placeholder="Kigali Minerals Lab" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="lab-ref" label="Lab accreditation number" optional info="The lab's accreditation or certificate number.">
            <Input id="lab-ref" value={labRef} onChange={(e) => setLabRef(e.target.value)} maxLength={255} />
          </FormField>
          <FormField htmlFor="lab-sample" label="Sample reference" optional info="The number on the sample bag.">
            <Input id="lab-sample" value={sampleRef} onChange={(e) => setSampleRef(e.target.value)} maxLength={128} />
          </FormField>
          <FormField htmlFor="lab-sampled" label="Sampled" optional>
            <Input id="lab-sampled" type="datetime-local" value={sampledAt} onChange={(e) => setSampledAt(e.target.value)} />
          </FormField>
          <FormField htmlFor="lab-tested" label="Analysed" optional>
            <Input id="lab-tested" type="datetime-local" value={testedAt} onChange={(e) => setTestedAt(e.target.value)} />
          </FormField>
        </div>
        <FormField htmlFor="lab-grade-param" label="Headline grade" info="The main value, for example Sn 58.2 %. In % it is compared with the agreed grade. Give this or at least one other value.">
          <div className="grid grid-cols-[1fr_1fr_5rem] gap-2">
            <Input id="lab-grade-param" aria-label="Grade parameter" value={gradeParam} onChange={(e) => setGradeParam(e.target.value)} placeholder="Sn" maxLength={64} />
            <Input aria-label="Grade value" inputMode="decimal" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} placeholder="58.2" />
            <Input aria-label="Grade unit" value={gradeUnit} onChange={(e) => setGradeUnit(e.target.value)} maxLength={16} />
          </div>
        </FormField>
        <FormField htmlFor="lab-values" label="Other values" optional>
          <ValuesEditor idPrefix="lab" rows={rows} onChange={setRows} />
        </FormField>
        <FormField htmlFor="lab-summary" label="Notes" optional>
          <Textarea id="lab-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} maxLength={5000} />
        </FormField>
        <FormField htmlFor="lab-files" label="Lab certificate or report" required info="At least one file. Stored privately.">
          <FilePicker id="lab-files" label="Lab certificate" hint="PDF or photos, up to 10" accept="application/pdf,image/*" files={files} onChange={setFiles} />
        </FormField>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save lab result</Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Save this lab result?"
        description={`It is sent to MINMEG for ${batch.batchCode ?? batch.id}.`}
        confirmLabel="Save"
        loading={isLoading || uploader.isLoading}
        onConfirm={save}
        onClose={() => setConfirming(false)}
      />
    </Modal>
  );
}

function FileLinks({ files }: { files: InspectionFile[] }) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((f) => (
        <li key={f.id}>
          <a href={f.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            {f.caption ?? 'File'}
          </a>
        </li>
      ))}
    </ul>
  );
}

function FindingsView({ f }: { f: Findings }) {
  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">Findings</span>
        <StatusBadge status={f.status}>{RESULT_STATUS_LABELS[f.status] ?? f.status}</StatusBadge>
      </div>
      {f.quantityVerified && <p className="text-sm text-gray-700">Quantity verified: {numberText(f.quantityVerified)}</p>}
      {!!f.observations?.length && <p className="text-sm text-gray-700">{f.observations.map(valueText).join(' · ')}</p>}
      {f.summary && <p className="whitespace-pre-wrap text-sm text-gray-700">{f.summary}</p>}
      {f.status === 'REJECTED' && f.verificationNote && <p className="text-sm text-semantic-error-text">MINMEG: {f.verificationNote}</p>}
      <FileLinks files={f.files} />
    </div>
  );
}

function LabResultView({ r }: { r: LabResult }) {
  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">Lab result: {r.laboratoryName}</span>
        <StatusBadge status={r.status}>{RESULT_STATUS_LABELS[r.status] ?? r.status}</StatusBadge>
      </div>
      {r.grade && (
        <p className="text-sm text-gray-900">
          <span className="font-bold">{r.grade.parameter} {numberText(r.grade.value)} {r.grade.unit}</span>
          {r.gradeComparison && (
            <span className="text-gray-600">
              {' '}({POSITION_TEXT[r.gradeComparison.position]} of {numberText(r.gradeComparison.agreed)}%{r.gradeComparison.difference ? `, ${r.gradeComparison.difference > 0 ? '+' : ''}${numberText(r.gradeComparison.difference)}` : ''})
            </span>
          )}
        </p>
      )}
      {!!r.values?.length && <p className="text-sm text-gray-700">{r.values.map(valueText).join(' · ')}</p>}
      <p className="text-xs text-gray-500">
        {[r.sampleReference && `Sample ${r.sampleReference}`, r.sampledAt && `sampled ${formatDateTime(r.sampledAt)}`, r.testedAt && `analysed ${formatDateTime(r.testedAt)}`, r.laboratoryReference && `lab no. ${r.laboratoryReference}`].filter(Boolean).join(' · ')}
      </p>
      {r.summary && <p className="whitespace-pre-wrap text-sm text-gray-700">{r.summary}</p>}
      {r.status === 'REJECTED' && r.verificationNote && <p className="text-sm text-semantic-error-text">MINMEG: {r.verificationNote}</p>}
      {r.status === 'INVALIDATED' && <p className="text-sm text-semantic-error-text">Withdrawn by MINMEG{r.invalidationReason ? `: ${r.invalidationReason}` : ''}</p>}
      <FileLinks files={r.files} />
    </div>
  );
}

function BatchResults({ batch, results, editable, assignmentId }: { batch: Batch; results: RoundResults; editable: boolean; assignmentId: string }) {
  const [form, setForm] = React.useState<'findings' | 'lab' | null>(null);
  const findings = currentFindings(results.inspectionResults, batch.id);
  const labs = labResultsFor(results.assayResults, batch.id);
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4" data-testid={`results-batch-${batch.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="break-all text-sm font-bold text-gray-900">{batch.batchCode ?? batch.id}</h4>
          {batch.material && <p className="text-xs text-gray-500">{batch.material}</p>}
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            {findings?.status !== 'VERIFIED' && (
              <Button size="sm" variant="outlined" onClick={() => setForm('findings')}>{findings ? 'Replace findings' : 'Record findings'}</Button>
            )}
            <Button size="sm" variant="outlined" onClick={() => setForm('lab')}>Add lab result</Button>
          </div>
        )}
      </div>
      {findings ? <FindingsView f={findings} /> : <p className="text-sm text-gray-500">{editable ? 'No findings yet.' : 'No findings for this batch.'}</p>}
      {labs.map((r) => <LabResultView key={r.id} r={r} />)}
      {form === 'findings' && <FindingsForm assignmentId={assignmentId} batch={batch} onClose={() => setForm(null)} />}
      {form === 'lab' && <LabResultForm assignmentId={assignmentId} batch={batch} findingsId={findings?.id ?? null} onClose={() => setForm(null)} />}
    </div>
  );
}

/** The inspector's section in the workbench */
export function WorkbenchResults({ assignmentId }: { assignmentId: string }) {
  const { data: windowData, isLoading: loadingBatches } = useGetWindowQuery(assignmentId);
  const { data, isLoading, error } = useGetRoundResultsQuery(assignmentId);
  const results = data?.data;
  const batches: Batch[] = (windowData?.data?.batches ?? []).map((b) => ({ id: b.id, batchCode: b.batchCode, material: b.material }));
  const missing = batchesMissingFindings(batches, results);
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 p-4 sm:p-5" aria-labelledby="workbench-results">
      <div>
        <h3 id="workbench-results" className="text-base font-black text-gray-900">Findings and lab results</h3>
        <p className="mt-0.5 text-xs text-gray-500">Per batch. MINMEG checks each one, then releases them to the buyer and the supplier. Every batch needs findings before you submit the report.</p>
      </div>
      {(isLoading || loadingBatches) && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <Alert severity="error">{toApiError(error).message}</Alert>}
      {results?.released && <Alert severity="info">MINMEG has released these results. They can no longer change.</Alert>}
      {results && !batches.length && !loadingBatches && <p className="text-sm text-gray-500">No batches are allocated to this trade yet.</p>}
      {results && !results.released && !!batches.length && !!missing.length && (
        <p className="text-sm text-semantic-warning-text">Waiting for findings: {missing.map((b) => b.batchCode ?? b.id).join(', ')}</p>
      )}
      {results && batches.map((b) => <BatchResults key={b.id} batch={b} results={results} editable={!results.released} assignmentId={assignmentId} />)}
    </section>
  );
}

/** What the buyer or the supplier sees once MINMEG releases the round */
export function ReleasedResults({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading } = useGetRoundResultsQuery(assignmentId);
  const results = data?.data;
  if (isLoading || !results?.released) return null;
  const batchIds = [...new Set([...results.inspectionResults.map((r) => r.batchId), ...results.assayResults.map((r) => r.batchId)])];
  if (!batchIds.length) return null;
  return (
    <section className="space-y-3" aria-labelledby={`released-results-${assignmentId}`}>
      <div>
        <h4 id={`released-results-${assignmentId}`} className="text-sm font-bold text-gray-900">Results per batch</h4>
        <p className="text-xs text-gray-500">
          {results.agreedGrade != null ? `Agreed grade: ${numberText(results.agreedGrade)}%. ` : ''}Files open through a link that expires after 10 minutes; reopen this tab for a new one.
        </p>
      </div>
      {batchIds.map((id) => <BatchResults key={id} batch={{ id, batchCode: null, material: null }} results={results} editable={false} assignmentId={assignmentId} />)}
    </section>
  );
}
