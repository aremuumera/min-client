'use client';

import * as React from 'react';
import { Alert, Button, Checkbox, ConfirmDialog, CopyableId, DropdownSelect, FormField, Input, Modal, StatusBadge, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import {
  amount,
  ASSESSMENT_STATUS_TEXT,
  DATA_QUALITY_TEXT,
  indicatorValue,
  INPUT_STATUS_TEXT,
  isOpen,
  PILLAR_TEXT,
  PILLARS,
  statusTone,
  SUBJECT_TEXT,
  TRUST_TEXT,
  trustTone,
  VALUE_TYPE_TEXT,
  type EsgAssessment,
  type EsgInput,
  type EsgSubject,
  type Pillar,
} from '@/lib/esg';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  useAddEsgInputFromReadingMutation,
  useAddEsgInputMutation,
  useCreateEsgAssessmentMutation,
  useEsgActionMutation,
  useGetEsgAssessmentQuery,
  useGetEsgAssessmentsQuery,
  useRemoveEsgInputMutation,
  useReviseEsgMutation,
} from '@/redux/features/esg/esg_api';
import { useGetReadingsQuery } from '@/redux/features/traceability/traceability_api';
import { CODE, SendForm, useFileOptions, useUnits, VerificationBox } from './shared';
import { ProofSection } from '@/components/proof/proof-section';

/*
 * ESG assessments (step 2.10b, decisions #77 and #110). The result is recorded as the scheme issued it
 * (IRMA, EcoVadis, RMI RMAP, GRI…), with its indicators by pillar. MINMEG computes only data facts
 * (evidence completeness, primary-data share), never a score, and confirms against an independent
 * verifier's report.
 *  - owner: start, indicators, record the result, send to MINMEG, withdraw, start a new version
 *  - reader (buyers trading with the owner; the trade's parties for a batch): recorded and later, never drafts
 */
type Mode = 'owner' | 'reader';
const NOT_A_RATING = 'MINMEG records the result as the scheme issued it. It does not score or rate the company.';
const NUMBER = /^-?\d{1,16}(\.\d{1,8})?$/;

// =========================== start ===========================
export function StartEsg({ subjectType, subjectId, onClose, onCreated }: { subjectType: EsgSubject; subjectId: string; onClose: () => void; onCreated?: (id: string) => void }) {
  const [create, { isLoading }] = useCreateEsgAssessmentMutation();
  const { key, done } = useIdempotencyKey();
  const [framework, setFramework] = React.useState('');
  const [version, setVersion] = React.useState('');
  const [pillars, setPillars] = React.useState<Pillar[]>([...PILLARS]);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const problem = !CODE.test(framework.trim())
    ? 'Scheme: capital letters, digits and _ (for example IRMA_MINES).'
    : !version.trim()
      ? 'Enter the scheme version.'
      : !pillars.length
        ? 'Choose at least one area it covers.'
        : from && to && to < from
          ? 'The period ends before it starts.'
          : null;
  const submit = async () => {
    setError(null);
    try {
      const made = await create({
        idempotencyKey: key,
        subjectType,
        subjectId,
        frameworkCode: framework.trim(),
        frameworkVersion: version.trim(),
        assessmentScope: { pillars },
        ...(from ? { assessmentPeriodStart: from } : {}),
        ...(to ? { assessmentPeriodEnd: to } : {}),
      }).unwrap();
      done();
      onCreated?.(made.data.id);
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
          <h3 className="text-lg font-bold text-gray-900">Record an ESG result</h3>
          <p className="mt-1 text-sm text-gray-500">For {SUBJECT_TEXT[subjectType].toLowerCase()}. {NOT_A_RATING}</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="esg-framework" label="Scheme" required info="The scheme that assessed you, for example IRMA_MINES, ECOVADIS, RMI_RMAP or GRI">
            <Input id="esg-framework" value={framework} onChange={(e) => setFramework(e.target.value.toUpperCase())} maxLength={64} />
          </FormField>
          <FormField htmlFor="esg-version" label="Scheme version" required info="For example 1.0 or 2024">
            <Input id="esg-version" value={version} onChange={(e) => setVersion(e.target.value)} maxLength={32} />
          </FormField>
        </div>
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-gray-900">What it covers</legend>
          {PILLARS.map((p) => (
            <Checkbox key={p} label={PILLAR_TEXT[p]} checked={pillars.includes(p)} onChange={(e) => setPillars((list) => (e.target.checked ? [...list, p] : list.filter((x) => x !== p)))} />
          ))}
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="esg-from" label="Period from" optional>
            <Input id="esg-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
          <FormField htmlFor="esg-to" label="Period to" optional>
            <Input id="esg-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Start</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Start this ESG record?" description="It starts as a draft only your company and MINMEG see." confirmLabel="Start" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== indicators ===========================
function IndicatorForm({ assessment, onClose }: { assessment: EsgAssessment; onClose: () => void }) {
  const units = useUnits();
  const files = useFileOptions();
  const [add, { isLoading }] = useAddEsgInputMutation();
  const { key, done } = useIdempotencyKey();
  const [f, setF] = React.useState({ pillar: (assessment.assessmentScope.pillars?.[0] ?? 'ENVIRONMENTAL') as string, code: '', name: '', type: 'NUMBER', value: '', unitId: '', evidence: '', needsEvidence: false, quality: 'SECONDARY' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const problem = !CODE.test(f.code.trim())
    ? 'Code: capital letters, digits and _ (for example WATER_RECYCLED_PCT).'
    : !f.name.trim()
      ? 'Name the indicator.'
      : !f.value.trim()
        ? 'Enter the value.'
        : f.type === 'NUMBER' && !NUMBER.test(f.value.trim())
          ? 'The value is a number, with at most 8 decimals.'
          : f.needsEvidence && !f.evidence
            ? 'This indicator needs its document.'
            : null;
  const value = () => (f.type === 'NUMBER' ? { numericValue: f.value.trim() } : f.type === 'BOOLEAN' ? { booleanValue: f.value === 'true' } : { textValue: f.value.trim() });
  const submit = async () => {
    setError(null);
    try {
      await add({
        id: assessment.id,
        idempotencyKey: key,
        category: f.pillar,
        indicatorCode: f.code.trim(),
        indicatorName: f.name.trim(),
        valueType: f.type,
        ...value(),
        ...(f.type === 'NUMBER' && f.unitId ? { unitId: f.unitId } : {}),
        ...(f.evidence ? { sourceType: 'DOCUMENT', sourceId: f.evidence, evidenceFileId: f.evidence } : {}),
        evidenceRequired: f.needsEvidence,
        dataQuality: f.quality,
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="lg">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Add an indicator</h3>
          <p className="mt-1 text-sm text-gray-500">One figure or fact behind the result, as the scheme asked for it.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField htmlFor="ei-pillar" label="Area" required>
            <DropdownSelect id="ei-pillar" aria-label="Area" value={f.pillar} options={PILLARS.map((p) => ({ value: p, label: PILLAR_TEXT[p] }))} onValueChange={(v) => set({ pillar: v })} />
          </FormField>
          <FormField htmlFor="ei-code" label="Code" required info="As the scheme names it, for example WATER_RECYCLED_PCT">
            <Input id="ei-code" value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} maxLength={64} />
          </FormField>
          <FormField htmlFor="ei-name" label="Indicator" required>
            <Input id="ei-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField htmlFor="ei-type" label="Kind of value" required>
            <DropdownSelect id="ei-type" aria-label="Kind of value" value={f.type} options={Object.entries(VALUE_TYPE_TEXT).map(([value, label]) => ({ value, label }))} onValueChange={(v) => set({ type: v, value: '' })} />
          </FormField>
          <FormField htmlFor="ei-value" label="Value" required>
            {f.type === 'BOOLEAN' ? (
              <DropdownSelect id="ei-value" aria-label="Value" value={f.value} placeholder="Choose" options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} onValueChange={(v) => set({ value: v })} />
            ) : (
              <Input id="ei-value" type={f.type === 'DATE' ? 'date' : 'text'} inputMode={f.type === 'NUMBER' ? 'decimal' : undefined} value={f.value} onChange={(e) => set({ value: e.target.value })} />
            )}
          </FormField>
          {f.type === 'NUMBER' && (
            <FormField htmlFor="ei-unit" label="Unit" optional>
              <DropdownSelect id="ei-unit" aria-label="Unit" value={f.unitId} placeholder="None" options={units.all.map((u) => ({ value: u.id, label: units.label(u) }))} onValueChange={(v) => set({ unitId: v })} searchable />
            </FormField>
          )}
        </div>
        <FormField htmlFor="ei-evidence" label="Document" optional={!f.needsEvidence} required={f.needsEvidence} info="From your documents, for example the audit report page. When every indicator that needs a document has one, the result shows as declared with evidence.">
          <DropdownSelect id="ei-evidence" aria-label="Document" value={f.evidence} placeholder={files.length ? 'Choose' : 'No files in your documents'} options={files} onValueChange={(v) => set({ evidence: v })} searchable={files.length > 8} />
        </FormField>
        <Checkbox label="This indicator needs a document" checked={f.needsEvidence} onChange={(e) => set({ needsEvidence: e.target.checked })} />
        <FormField htmlFor="ei-quality" label="Kind of data" required>
          <DropdownSelect id="ei-quality" aria-label="Kind of data" value={f.quality} options={Object.entries(DATA_QUALITY_TEXT).map(([value, label]) => ({ value, label }))} onValueChange={(v) => set({ quality: v })} />
        </FormField>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Add indicator</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Add ${f.name.trim() || 'this indicator'}?`} confirmLabel="Add" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

/** A checked reading on the batch, copied by the server (primary data, checked) */
function ReadingIndicatorForm({ assessment, onClose }: { assessment: EsgAssessment; onClose: () => void }) {
  const readings = useGetReadingsQuery({ subjectType: 'BATCH', subjectId: assessment.subjectId });
  const [add, { isLoading }] = useAddEsgInputFromReadingMutation();
  const { key, done } = useIdempotencyKey();
  const [f, setF] = React.useState({ reading: '', pillar: 'ENVIRONMENTAL', code: '', name: '' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = (readings.data?.data ?? [])
    .filter((r) => r.status === 'ACTIVE' && r.verificationStatus === 'VERIFIED')
    .map((r) => ({ value: r.id, label: `${r.measurementType?.name ?? 'Reading'}: ${amount(r.value)} ${r.unit?.symbol ?? ''} · ${formatDateTime(r.measuredAt)}` }));
  const problem = !f.reading ? 'Choose the reading.' : !CODE.test(f.code.trim()) ? 'Code: capital letters, digits and _.' : !f.name.trim() ? 'Name the indicator.' : null;
  const submit = async () => {
    setError(null);
    try {
      await add({ idempotencyKey: key, esgAssessmentId: assessment.id, measurementId: f.reading, category: f.pillar, indicatorCode: f.code.trim(), indicatorName: f.name.trim() }).unwrap();
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
          <h3 className="text-lg font-bold text-gray-900">Add an indicator from a reading</h3>
          <p className="mt-1 text-sm text-gray-500">Only readings MINMEG has checked are listed. The value is copied and counts as primary, checked data.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="er-reading" label="Reading" required>
          <DropdownSelect id="er-reading" aria-label="Reading" value={f.reading} placeholder={options.length ? 'Choose' : 'No checked readings yet'} options={options} onValueChange={(v) => set({ reading: v })} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField htmlFor="er-pillar" label="Area" required>
            <DropdownSelect id="er-pillar" aria-label="Area" value={f.pillar} options={PILLARS.map((p) => ({ value: p, label: PILLAR_TEXT[p] }))} onValueChange={(v) => set({ pillar: v })} />
          </FormField>
          <FormField htmlFor="er-code" label="Code" required>
            <Input id="er-code" value={f.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} maxLength={64} />
          </FormField>
          <FormField htmlFor="er-name" label="Indicator" required>
            <Input id="er-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Add indicator</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Add ${f.name.trim() || 'this indicator'}?`} confirmLabel="Add" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== the result as issued ===========================
function ResultForm({ assessment, onClose }: { assessment: EsgAssessment; onClose: () => void }) {
  const [act, { isLoading }] = useEsgActionMutation();
  const [f, setF] = React.useState({ issuedBy: '', rating: '', environmental: '', social: '', governance: '', overall: '', full: '' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scores = { environmentalScore: f.environmental, socialScore: f.social, governanceScore: f.governance, overallScore: f.overall };
  let full: Record<string, unknown> | null = {};
  try {
    full = f.full.trim() ? (JSON.parse(f.full) as Record<string, unknown>) : {};
    if (!full || typeof full !== 'object' || Array.isArray(full)) full = null;
  } catch {
    full = null;
  }
  const problem = !f.issuedBy.trim()
    ? 'Say who issued the result.'
    : !f.rating.trim() && Object.values(scores).every((v) => !v.trim())
      ? 'Give the rating or at least one score, as the scheme issued it.'
      : Object.values(scores).some((v) => v.trim() && !Number.isFinite(Number(v)))
        ? 'Scores are numbers.'
        : full === null
          ? 'The full result must be a JSON object, for example {"chapters": {"2.1": "met"}}.'
          : null;
  const submit = async () => {
    setError(null);
    try {
      await act({
        id: assessment.id,
        action: 'assess',
        issuedByName: f.issuedBy.trim(),
        resultData: full ?? {},
        ...(f.rating.trim() ? { rating: f.rating.trim() } : {}),
        ...Object.fromEntries(Object.entries(scores).filter(([, v]) => v.trim()).map(([k, v]) => [k, Number(v)])),
      }).unwrap();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  return (
    <Modal open onClose={onClose} size="lg">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Record the result</h3>
          <p className="mt-1 text-sm text-gray-500">Exactly as {assessment.frameworkCode} issued it. {NOT_A_RATING} The indicators freeze once it is recorded.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="er-issued" label="Issued by" required info="The scheme or the audit firm that issued it">
            <Input id="er-issued" value={f.issuedBy} onChange={(e) => set({ issuedBy: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="er-rating" label="Rating or level" optional info="For example IRMA 50, Gold, Conformant">
            <Input id="er-rating" value={f.rating} onChange={(e) => set({ rating: e.target.value })} maxLength={64} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['environmental', 'social', 'governance', 'overall'] as const).map((k) => (
            <FormField key={k} htmlFor={`er-${k}`} label={`${k.charAt(0).toUpperCase()}${k.slice(1)} score`} optional>
              <Input id={`er-${k}`} inputMode="decimal" value={f[k]} onChange={(e) => set({ [k]: e.target.value })} />
            </FormField>
          ))}
        </div>
        <FormField htmlFor="er-full" label="Full result" optional info="The scheme's own breakdown, as a JSON object">
          <Textarea id="er-full" value={f.full} onChange={(e) => set({ full: e.target.value })} rows={4} placeholder='{"chapters": {"2.1": "met"}}' />
        </FormField>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Record result</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Record this result?" description="The indicators freeze. To change them afterwards, withdraw it and start a new version." confirmLabel="Record" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== the assessment ===========================
function ResultBox({ a }: { a: EsgAssessment }) {
  const r = a.result;
  const scores: [string, string | null][] = [
    ['Environmental', r.environmentalScore],
    ['Social', r.socialScore],
    ['Governance', r.governanceScore],
    ['Overall', r.overallScore],
  ];
  const period = a.assessmentPeriodStart || a.assessmentPeriodEnd ? `${a.assessmentPeriodStart ? formatDate(a.assessmentPeriodStart) : '…'} to ${a.assessmentPeriodEnd ? formatDate(a.assessmentPeriodEnd) : '…'}` : null;
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3" aria-label="Result" data-testid="esg-result">
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-gray-900">{a.frameworkCode} {a.frameworkVersion}</span>
        {period ? ` · ${period}` : ''}
        {a.assessmentScope.pillars?.length ? ` · covers ${a.assessmentScope.pillars.map((p) => PILLAR_TEXT[p as Pillar] ?? p).join(', ').toLowerCase()}` : ''}
      </p>
      {a.assessedAt ? (
        <>
          <p className="text-sm text-gray-700">
            {r.rating && <span className="mr-2 text-base font-bold text-gray-900">{r.rating}</span>}
            Issued by {r.issuedByName}
          </p>
          {scores.some(([, v]) => v !== null) && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {scores.filter(([, v]) => v !== null).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-gray-500">{k} score</dt>
                  <dd className="font-medium text-gray-900">{amount(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">The result is not recorded yet.</p>
      )}
      <p className="text-xs text-gray-500">
        Data facts, not a rating: {amount(a.evidenceCompleteness)} % of the indicators that need a document have one · {amount(a.dataQualityScore)} % primary data
      </p>
    </div>
  );
}

function IndicatorsTable({ a, editable }: { a: EsgAssessment; editable: boolean }) {
  const units = useUnits();
  const [remove, removeState] = useRemoveEsgInputMutation();
  const [removing, setRemoving] = React.useState<EsgInput | null>(null);
  if (!a.inputs.length) return <p className="text-sm text-gray-500">No indicators yet.</p>;
  return (
    <>
      {PILLARS.filter((p) => a.inputs.some((i) => i.category === p)).map((p) => (
        <div key={p} className="space-y-1">
          <h5 className="text-xs font-semibold text-gray-500">{PILLAR_TEXT[p]}</h5>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" aria-label={`${PILLAR_TEXT[p]} indicators`}>
            {a.inputs.filter((i) => i.category === p).map((i) => (
              <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm" data-testid={`esg-input-${i.indicatorCode}`}>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{i.indicatorName}</p>
                  <p className="text-gray-700">{indicatorValue(i, units.symbol(i.unitId))}</p>
                  <p className="text-xs text-gray-500">
                    {i.indicatorCode} · {i.sourceType === 'DYNAMIC_MEASUREMENT' ? 'from a checked reading' : `${(DATA_QUALITY_TEXT[i.dataQuality] ?? i.dataQuality).split(' (')[0].toLowerCase()} data`}
                    {i.evidenceFileId ? ' · with a document' : i.evidenceRequired ? ' · needs a document' : ''}
                  </p>
                  {i.rejectionReason && <p className="text-xs text-semantic-error-text">MINMEG: {i.rejectionReason}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {i.verificationStatus !== 'UNVERIFIED' && <StatusBadge status={i.verificationStatus}>{INPUT_STATUS_TEXT[i.verificationStatus]}</StatusBadge>}
                  {editable && <Button size="sm" variant="text" onClick={() => setRemoving(i)}>Remove</Button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.indicatorName ?? ''}?`}
        confirmLabel="Remove"
        tone="error"
        loading={removeState.isLoading}
        onConfirm={async () => {
          if (removing) await remove({ id: a.id, inputId: removing.id }).unwrap().catch(() => undefined);
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}

/** One ESG record: the result as issued, trust, indicators and what the owner can do next */
export function EsgDetail({ id, mode }: { id: string; mode: Mode }) {
  const query = useGetEsgAssessmentQuery(id);
  const [act, actState] = useEsgActionMutation();
  const [revise, reviseState] = useReviseEsgMutation();
  const { key, done } = useIdempotencyKey();
  const [form, setForm] = React.useState<'input' | 'reading' | 'result' | 'send' | null>(null);
  const [dialog, setDialog] = React.useState<'withdraw' | 'revise' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const a = query.data?.data;
  if (query.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!a) return <Alert severity="error">{query.error ? toApiError(query.error).message : 'Not found'}</Alert>;
  const owner = mode === 'owner';
  const draft = a.status === 'DRAFT';
  return (
    <div className="space-y-4" data-testid={`esg-${a.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {a.assessmentCode} · version {a.version}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {a.status !== 'VERIFIED' && <StatusBadge status={statusTone(a.status)}>{ASSESSMENT_STATUS_TEXT[a.status]}</StatusBadge>}
            <StatusBadge tone={trustTone(a.trust.level)} data-trust={a.trust.level}>{TRUST_TEXT[a.trust.level]}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-gray-500">{a.trust.label}. {owner ? 'Declared by your company.' : 'Declared by the supplier.'}</p>
        </div>
        {owner && (
          <div className="flex flex-wrap gap-2">
            {draft && <Button size="sm" variant="outlined" onClick={() => setForm('input')}>Add indicator</Button>}
            {draft && a.subjectType === 'BATCH' && <Button size="sm" variant="outlined" onClick={() => setForm('reading')}>From a reading</Button>}
            {draft && <Button size="sm" disabled={!a.inputs.length} onClick={() => setForm('result')}>Record the result</Button>}
            {a.status === 'ASSESSED' && <Button size="sm" onClick={() => setForm('send')}>Send to MINMEG</Button>}
            {['VERIFIED', 'INVALIDATED'].includes(a.status) && <Button size="sm" variant="outlined" onClick={() => setDialog('revise')}>New version</Button>}
            {isOpen(a) && <Button size="sm" variant="text" onClick={() => setDialog('withdraw')}>Withdraw</Button>}
          </div>
        )}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {owner && a.returnNotes && draft && <Alert severity="warning">MINMEG returned it: {a.returnNotes}</Alert>}
      {a.status === 'PENDING_VERIFICATION' && <p className="text-sm text-gray-600">Waiting for MINMEG to confirm it{a.submittedAt ? `, sent ${formatDateTime(a.submittedAt)}` : ''}.</p>}
      {a.status === 'ASSESSED' && owner && <p className="text-sm text-gray-600">The indicators are frozen. Send it to MINMEG, or withdraw it and start a new version to change them.</p>}
      {a.invalidationReason && <p className="text-sm text-gray-600">Withdrawn: {a.invalidationReason}</p>}
      <ResultBox a={a} />
      <VerificationBox v={a.verification} />
      {(a.status === 'VERIFIED' || a.status === 'SUPERSEDED') && <ProofSection subjectType="ESG_ASSESSMENT" subjectId={a.id} />}
      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Indicators</h4>
        <IndicatorsTable a={a} editable={owner && draft} />
      </section>
      <p className="text-xs text-gray-400">{NOT_A_RATING} Record ID <CopyableId value={a.id} /></p>
      {form === 'input' && <IndicatorForm assessment={a} onClose={() => setForm(null)} />}
      {form === 'reading' && <ReadingIndicatorForm assessment={a} onClose={() => setForm(null)} />}
      {form === 'result' && <ResultForm assessment={a} onClose={() => setForm(null)} />}
      {form === 'send' && <SendForm code={a.assessmentCode} onSend={(body) => act({ id: a.id, action: 'submit', ...body }).unwrap()} onClose={() => setForm(null)} />}
      <ConfirmDialog
        open={!!dialog}
        title={dialog === 'withdraw' ? `Withdraw ${a.assessmentCode}?` : 'Start a new version?'}
        description={dialog === 'withdraw' ? 'Buyers stop seeing it. It stays in the history.' : 'A copy of this version with its indicators, as a draft. Once MINMEG confirms the new one, it replaces this one.'}
        confirmLabel={dialog === 'withdraw' ? 'Withdraw' : 'Start'}
        tone={dialog === 'withdraw' ? 'error' : 'primary'}
        reason={{ label: 'Reason', minLength: 3 }}
        loading={actState.isLoading || reviseState.isLoading}
        onConfirm={async (reason) => {
          setError(null);
          try {
            if (dialog === 'withdraw') await act({ id: a.id, action: 'invalidate', reason }).unwrap();
            if (dialog === 'revise') {
              await revise({ id: a.id, idempotencyKey: key, changeReason: reason ?? '' }).unwrap();
              done();
            }
          } catch (err) {
            setError(toApiError(err).message);
          }
          setDialog(null);
        }}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

// =========================== per subject ===========================
function Row({ a, open, onToggle }: { a: EsgAssessment; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:bg-gray-50">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">
          {a.assessmentCode} · {a.frameworkCode} {a.frameworkVersion}
        </span>
        <span className="block text-xs text-gray-500">
          {a.assessedAt ? `${a.result.rating ?? 'Scores recorded'} · issued by ${a.result.issuedByName}` : 'Result not recorded yet'} · version {a.version}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {a.status !== 'VERIFIED' && <StatusBadge status={statusTone(a.status)}>{ASSESSMENT_STATUS_TEXT[a.status]}</StatusBadge>}
        <StatusBadge tone={trustTone(a.trust.level)} data-trust={a.trust.level}>{TRUST_TEXT[a.trust.level]}</StatusBadge>
      </span>
    </button>
  );
}

/** The ESG records of the company, a mine site or a batch; the owner can start one */
export function EsgFor({ subjectType, subjectId, mode, title = 'ESG' }: { subjectType: EsgSubject; subjectId: string; mode: Mode; title?: string }) {
  const list = useGetEsgAssessmentsQuery({ subjectType, subjectId, limit: 50 });
  const [open, setOpen] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const rows = list.data?.data ?? [];
  return (
    <section className="space-y-3" aria-label={title} data-testid={`esg-for-${subjectId}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{mode === 'owner' ? 'Results from ESG schemes, recorded as issued. Confirmed by MINMEG once an independent verifier has checked them.' : 'The supplier’s ESG results, as the scheme issued them. MINMEG does not rate them.'}</p>
        </div>
        {mode === 'owner' && <Button size="sm" variant="outlined" onClick={() => setStarting(true)}>Record an ESG result</Button>}
      </div>
      {list.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : list.error ? (
        <Alert severity="error">{toApiError(list.error).message}</Alert>
      ) : !rows.length ? (
        <p className="text-sm text-gray-500">{mode === 'owner' ? 'No ESG result yet.' : 'No ESG results shared yet.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {rows.map((a) => (
            <li key={a.id}>
              <Row a={a} open={open === a.id} onToggle={() => setOpen((o) => (o === a.id ? null : a.id))} />
              {open === a.id && (
                <div className="border-t border-gray-100 p-3">
                  <EsgDetail id={a.id} mode={mode} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {starting && <StartEsg subjectType={subjectType} subjectId={subjectId} onClose={() => setStarting(false)} onCreated={setOpen} />}
    </section>
  );
}

/** The ESG of a trade's supplier and goods (step 2.10b D2): the seller manages its own, the buyer reads */
export function TradeEsg({ sellerId, batches, seller }: { sellerId: string | null; batches: { id: string; batchCode: string }[]; seller: boolean }) {
  const mode: Mode = seller ? 'owner' : 'reader';
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5" data-testid="trade-esg">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">ESG</h3>
        <p className="mt-0.5 text-xs text-gray-500">{seller ? 'Your ESG results the buyer sees once recorded.' : 'The supplier’s ESG results, as the scheme issued them, with how far they have been checked. MINMEG does not rate them.'}</p>
      </div>
      {sellerId && <EsgFor subjectType="ORGANIZATION" subjectId={sellerId} mode={mode} title={seller ? 'Your company' : 'The supplier'} />}
      {batches.map((b) => <EsgFor key={b.id} subjectType="BATCH" subjectId={b.id} mode={mode} title={`Batch ${b.batchCode}`} />)}
    </section>
  );
}
