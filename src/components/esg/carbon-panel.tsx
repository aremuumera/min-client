'use client';

import * as React from 'react';
import { Alert, Button, ConfirmDialog, CopyableId, DropdownSelect, FormField, Input, Modal, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import {
  amount,
  ASSESSMENT_STATUS_TEXT,
  BOUNDARIES,
  BOUNDARY_TEXT,
  DATA_QUALITY_TEXT,
  INPUT_STATUS_TEXT,
  INPUT_TYPES,
  isOpen,
  SCOPE_TEXT,
  statusTone,
  SUBJECT_TEXT,
  TRUST_TEXT,
  trustTone,
  words,
  type CarbonAssessment,
  type CarbonInput,
  type CarbonSubject,
  type UnitOption,
} from '@/lib/esg';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  useAddCarbonInputFromReadingMutation,
  useAddCarbonInputMutation,
  useCarbonActionMutation,
  useCreateCarbonAssessmentMutation,
  useGetCarbonAssessmentQuery,
  useGetCarbonAssessmentsQuery,
  useGetUnitOptionsQuery,
  useRemoveCarbonInputMutation,
  useReviseCarbonMutation,
} from '@/redux/features/esg/esg_api';
import { useGetReadingsQuery } from '@/redux/features/traceability/traceability_api';
import { useGetFilesQuery } from '@/redux/features/vault/vaultApi';

/*
 * Carbon assessments (step 2.10a, decisions #77 and #110). The owner declares its activities and its
 * own emission factors (each with its source) or documented figures; the server adds up. MINMEG
 * supplies no factor and confirms only against an independent verifier's statement.
 *  - owner: start, add and remove inputs, calculate, send to MINMEG, withdraw, start a new version
 *  - reader (the trade's buyer, the carrier): calculated and later versions, never drafts
 */
type Mode = 'owner' | 'reader';
const CODE = /^[A-Z][A-Z0-9_]{1,63}$/;
const DECIMAL = /^\d{1,16}(\.\d{1,8})?$/;
const NOT_A_RATING = 'MINMEG adds up your own figures. It supplies no emission factor and does not rate or certify the result.';

function useUnits() {
  const units = useGetUnitOptionsQuery();
  const all = units.data?.data ?? [];
  const emissions = all.filter((u) => u.measurementType?.code === 'EMISSIONS');
  const label = (u: UnitOption) => `${u.name ?? u.code} (${u.symbol})`;
  const symbol = (id: string | null | undefined) => all.find((u) => u.id === id)?.symbol ?? '';
  return { all, emissions, label, symbol };
}

function useFileOptions(skip: boolean) {
  const files = useGetFilesQuery({ limit: 100, page: 1 }, { skip });
  return (files.data?.data ?? []).map((f) => ({ value: f.id, label: f.displayName }));
}

// =========================== start ===========================
function StartCarbon({ subjectType, subjectId, onClose, onCreated }: { subjectType: CarbonSubject; subjectId: string; onClose: () => void; onCreated?: (id: string) => void }) {
  const units = useUnits();
  const [create, { isLoading }] = useCreateCarbonAssessmentMutation();
  const { key, done } = useIdempotencyKey();
  const [method, setMethod] = React.useState('');
  const [version, setVersion] = React.useState('');
  const [boundary, setBoundary] = React.useState<string>('CRADLE_TO_GATE');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [unitId, setUnitId] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const problem = !CODE.test(method.trim())
    ? 'Method: capital letters, digits and _ (for example GHG_PROTOCOL_PRODUCT).'
    : !version.trim()
      ? 'Enter the method version.'
      : from && to && to < from
        ? 'The period ends before it starts.'
        : quantity.trim() && (!DECIMAL.test(quantity.trim()) || !unitId)
          ? 'A quantity needs a number and its unit.'
          : null;
  const submit = async () => {
    setError(null);
    try {
      const made = await create({
        idempotencyKey: key,
        subjectType,
        subjectId,
        methodologyCode: method.trim(),
        methodologyVersion: version.trim(),
        systemBoundary: boundary,
        ...(from ? { calculationPeriodStart: from } : {}),
        ...(to ? { calculationPeriodEnd: to } : {}),
        ...(label.trim() ? { functionalUnit: label.trim() } : {}),
        ...(quantity.trim() ? { functionalUnitQuantity: quantity.trim(), functionalUnitUnitId: unitId } : {}),
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
          <h3 className="text-lg font-bold text-gray-900">Start a carbon assessment</h3>
          <p className="mt-1 text-sm text-gray-500">For {SUBJECT_TEXT[subjectType].toLowerCase()}. {NOT_A_RATING}</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="co2-method" label="Method" required info="The standard you follow, for example GHG_PROTOCOL_PRODUCT or ISO_14067">
            <Input id="co2-method" value={method} onChange={(e) => setMethod(e.target.value.toUpperCase())} maxLength={64} />
          </FormField>
          <FormField htmlFor="co2-version" label="Method version" required info="For example 2011 or 2018">
            <Input id="co2-version" value={version} onChange={(e) => setVersion(e.target.value)} maxLength={32} />
          </FormField>
        </div>
        <FormField htmlFor="co2-boundary" label="What it covers" required>
          <DropdownSelect id="co2-boundary" aria-label="What it covers" value={boundary} options={BOUNDARIES.map((b) => ({ value: b, label: BOUNDARY_TEXT[b] }))} onValueChange={setBoundary} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="co2-from" label="Period from" optional>
            <Input id="co2-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
          <FormField htmlFor="co2-to" label="Period to" optional>
            <Input id="co2-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="co2-quantity" label="Per how much" optional info={subjectType === 'BATCH' ? 'Empty: the batch’s own quantity. Used for the figure per tonne.' : 'Used for the figure per tonne when it is a mass.'}>
            <Input id="co2-quantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </FormField>
          <FormField htmlFor="co2-unit" label="Unit" optional>
            <DropdownSelect id="co2-unit" aria-label="Unit" value={unitId} placeholder="Choose" options={units.all.map((u) => ({ value: u.id, label: units.label(u) }))} onValueChange={setUnitId} searchable />
          </FormField>
        </div>
        <FormField htmlFor="co2-label" label="Described as" optional info="For example “one tonne of concentrate”">
          <Input id="co2-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={255} />
        </FormField>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Start</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Start this carbon assessment?" description="It starts as a draft only your company and MINMEG see." confirmLabel="Start" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== inputs ===========================
function InputForm({ assessment, onClose }: { assessment: CarbonAssessment; onClose: () => void }) {
  const units = useUnits();
  const [add, { isLoading }] = useAddCarbonInputMutation();
  const { key, done } = useIdempotencyKey();
  const [method, setMethod] = React.useState<'FACTOR' | 'DIRECT'>('FACTOR');
  const files = useFileOptions(false);
  const [f, setF] = React.useState({ name: '', type: 'FUEL', scope: '', value: '', unitId: '', factor: '', factorUnitId: '', source: '', sourceVersion: '', emissions: '', emissionsUnitId: '', evidence: '', quality: 'SECONDARY' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const activitySymbol = units.symbol(f.unitId);
  const problem = !f.name.trim()
    ? 'Name the activity.'
    : !DECIMAL.test(f.value.trim()) || !f.unitId
      ? 'Enter how much, with its unit.'
      : method === 'FACTOR' && (!DECIMAL.test(f.factor.trim()) || !f.factorUnitId || !f.source.trim())
        ? 'Enter your factor, its unit and where it comes from.'
        : method === 'DIRECT' && (!DECIMAL.test(f.emissions.trim()) || !f.emissionsUnitId || !f.evidence)
          ? 'Enter the documented emissions, their unit and the document.'
          : null;
  const submit = async () => {
    setError(null);
    try {
      await add({
        id: assessment.id,
        idempotencyKey: key,
        inputType: f.type,
        activityName: f.name.trim(),
        activityValue: f.value.trim(),
        activityUnitId: f.unitId,
        calculationMethod: method,
        dataType: f.quality,
        ...(f.scope ? { scope: f.scope } : {}),
        ...(f.evidence ? { evidenceFileId: f.evidence } : {}),
        ...(method === 'FACTOR'
          ? { emissionFactorValue: f.factor.trim(), emissionFactorUnitId: f.factorUnitId, emissionFactorSource: f.source.trim(), ...(f.sourceVersion.trim() ? { emissionFactorVersion: f.sourceVersion.trim() } : {}) }
          : { calculatedEmissionsValue: f.emissions.trim(), emissionsUnitId: f.emissionsUnitId }),
      }).unwrap();
      done();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };
  const emissionOptions = units.emissions.map((u) => ({ value: u.id, label: units.label(u) }));
  return (
    <Modal open onClose={onClose} size="lg">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Add an activity</h3>
          <p className="mt-1 text-sm text-gray-500">{NOT_A_RATING}</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="ci-name" label="Activity" required info="For example “Diesel for haul trucks”">
            <Input id="ci-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="ci-type" label="Kind" required>
            <DropdownSelect id="ci-type" aria-label="Kind" value={f.type} options={INPUT_TYPES.map((t) => ({ value: t, label: words(t) }))} onValueChange={(v) => set({ type: v })} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="ci-value" label="How much" required>
            <Input id="ci-value" inputMode="decimal" value={f.value} onChange={(e) => set({ value: e.target.value })} />
          </FormField>
          <FormField htmlFor="ci-unit" label="Unit" required>
            <DropdownSelect id="ci-unit" aria-label="Unit" value={f.unitId} placeholder="Choose" options={units.all.map((u) => ({ value: u.id, label: units.label(u) }))} onValueChange={(v) => set({ unitId: v })} searchable />
          </FormField>
        </div>
        <FormField htmlFor="ci-method" label="How the emissions are worked out" required>
          <DropdownSelect
            id="ci-method"
            aria-label="How the emissions are worked out"
            value={method}
            options={[
              { value: 'FACTOR', label: 'My factor: how much × my emission factor' },
              { value: 'DIRECT', label: 'A documented figure (a document is required)' },
            ]}
            onValueChange={(v) => setMethod(v as 'FACTOR' | 'DIRECT')}
          />
        </FormField>
        {method === 'FACTOR' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField htmlFor="ci-factor" label={`Emissions per 1 ${activitySymbol || 'unit'}`} required info="Your emission factor, for example 2.68 kgCO2e per litre of diesel">
                <Input id="ci-factor" inputMode="decimal" value={f.factor} onChange={(e) => set({ factor: e.target.value })} />
              </FormField>
              <FormField htmlFor="ci-factor-unit" label="In" required>
                <DropdownSelect id="ci-factor-unit" aria-label="Factor unit" value={f.factorUnitId} placeholder="Choose" options={emissionOptions} onValueChange={(v) => set({ factorUnitId: v })} />
              </FormField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField htmlFor="ci-source" label="Where the factor comes from" required info="For example DEFRA 2025, IEA Nigeria grid 2024, or your supplier's own figure">
                <Input id="ci-source" value={f.source} onChange={(e) => set({ source: e.target.value })} maxLength={255} />
              </FormField>
              <FormField htmlFor="ci-source-version" label="Its version" optional>
                <Input id="ci-source-version" value={f.sourceVersion} onChange={(e) => set({ sourceVersion: e.target.value })} maxLength={64} />
              </FormField>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField htmlFor="ci-emissions" label="Emissions" required>
              <Input id="ci-emissions" inputMode="decimal" value={f.emissions} onChange={(e) => set({ emissions: e.target.value })} />
            </FormField>
            <FormField htmlFor="ci-emissions-unit" label="In" required>
              <DropdownSelect id="ci-emissions-unit" aria-label="Emissions unit" value={f.emissionsUnitId} placeholder="Choose" options={emissionOptions} onValueChange={(v) => set({ emissionsUnitId: v })} />
            </FormField>
          </div>
        )}
        <FormField htmlFor="ci-evidence" label="Document" required={method === 'DIRECT'} optional={method === 'FACTOR'} info="From your documents, for example the fuel invoice or the utility statement. Every activity with a document makes the result “declared with evidence”.">
          <DropdownSelect id="ci-evidence" aria-label="Document" value={f.evidence} placeholder={files.length ? 'Choose' : 'No files in your documents'} options={files} onValueChange={(v) => set({ evidence: v })} searchable={files.length > 8} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="ci-scope" label="Scope" optional>
            <DropdownSelect id="ci-scope" aria-label="Scope" value={f.scope} placeholder="Not given" options={Object.entries(SCOPE_TEXT).map(([value, label]) => ({ value, label }))} onValueChange={(v) => set({ scope: v })} />
          </FormField>
          <FormField htmlFor="ci-quality" label="Kind of data" required>
            <DropdownSelect id="ci-quality" aria-label="Kind of data" value={f.quality} options={Object.entries(DATA_QUALITY_TEXT).map(([value, label]) => ({ value, label }))} onValueChange={(v) => set({ quality: v })} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Add activity</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Add ${f.name.trim() || 'this activity'}?`} confirmLabel="Add" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

/** A verified reading on the batch or shipment as the activity (primary data), with the owner's factor */
function ReadingForm({ assessment, onClose }: { assessment: CarbonAssessment; onClose: () => void }) {
  const units = useUnits();
  const readings = useGetReadingsQuery({ subjectType: assessment.subjectType as 'BATCH' | 'SHIPMENT', subjectId: assessment.subjectId });
  const [add, { isLoading }] = useAddCarbonInputFromReadingMutation();
  const { key, done } = useIdempotencyKey();
  const [f, setF] = React.useState({ reading: '', name: '', type: 'FUEL', scope: '', factor: '', factorUnitId: '', source: '', sourceVersion: '' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = (readings.data?.data ?? [])
    .filter((r) => r.status === 'ACTIVE' && r.verificationStatus === 'VERIFIED')
    .map((r) => ({ value: r.id, label: `${r.measurementType?.name ?? 'Reading'}: ${amount(r.value)} ${r.unit?.symbol ?? ''} · ${formatDateTime(r.measuredAt)}` }));
  const chosen = (readings.data?.data ?? []).find((r) => r.id === f.reading);
  const problem = !f.reading ? 'Choose the reading.' : !f.name.trim() ? 'Name the activity.' : !DECIMAL.test(f.factor.trim()) || !f.factorUnitId || !f.source.trim() ? 'Enter your factor, its unit and where it comes from.' : null;
  const submit = async () => {
    setError(null);
    try {
      await add({
        idempotencyKey: key,
        carbonAssessmentId: assessment.id,
        measurementId: f.reading,
        inputType: f.type,
        activityName: f.name.trim(),
        emissionFactorValue: f.factor.trim(),
        emissionFactorUnitId: f.factorUnitId,
        emissionFactorSource: f.source.trim(),
        ...(f.sourceVersion.trim() ? { emissionFactorVersion: f.sourceVersion.trim() } : {}),
        ...(f.scope ? { scope: f.scope } : {}),
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
          <h3 className="text-lg font-bold text-gray-900">Add an activity from a reading</h3>
          <p className="mt-1 text-sm text-gray-500">Only readings MINMEG has checked are listed. The amount comes from the reading and counts as primary data; the factor is still yours.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="cr-reading" label="Reading" required>
          <DropdownSelect id="cr-reading" aria-label="Reading" value={f.reading} placeholder={options.length ? 'Choose' : 'No checked readings yet'} options={options} onValueChange={(v) => set({ reading: v })} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cr-name" label="Activity" required>
            <Input id="cr-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="cr-type" label="Kind" required>
            <DropdownSelect id="cr-type" aria-label="Kind" value={f.type} options={INPUT_TYPES.map((t) => ({ value: t, label: words(t) }))} onValueChange={(v) => set({ type: v })} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cr-factor" label={`Emissions per 1 ${chosen?.unit?.symbol ?? 'unit'}`} required>
            <Input id="cr-factor" inputMode="decimal" value={f.factor} onChange={(e) => set({ factor: e.target.value })} />
          </FormField>
          <FormField htmlFor="cr-factor-unit" label="In" required>
            <DropdownSelect id="cr-factor-unit" aria-label="Factor unit" value={f.factorUnitId} placeholder="Choose" options={units.emissions.map((u) => ({ value: u.id, label: units.label(u) }))} onValueChange={(v) => set({ factorUnitId: v })} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cr-source" label="Where the factor comes from" required>
            <Input id="cr-source" value={f.source} onChange={(e) => set({ source: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="cr-source-version" label="Its version" optional>
            <Input id="cr-source-version" value={f.sourceVersion} onChange={(e) => set({ sourceVersion: e.target.value })} maxLength={64} />
          </FormField>
        </div>
        <FormField htmlFor="cr-scope" label="Scope" optional>
          <DropdownSelect id="cr-scope" aria-label="Scope" value={f.scope} placeholder="Not given" options={Object.entries(SCOPE_TEXT).map(([value, label]) => ({ value, label }))} onValueChange={(v) => set({ scope: v })} />
        </FormField>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Add activity</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Add ${f.name.trim() || 'this activity'}?`} confirmLabel="Add" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== send to MINMEG ===========================
function SendForm({ assessment, onClose }: { assessment: CarbonAssessment; onClose: () => void }) {
  const files = useFileOptions(false);
  const [act, { isLoading }] = useCarbonActionMutation();
  const [f, setF] = React.useState({ name: '', standard: '', file: '', on: '' });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const problem = !!f.name.trim() !== !!f.file ? 'The verifier’s name and their report go together.' : null;
  const submit = async () => {
    setError(null);
    try {
      await act({
        id: assessment.id,
        action: 'submit',
        ...(f.file ? { verifierName: f.name.trim(), statementFileId: f.file, ...(f.standard.trim() ? { verificationStandard: f.standard.trim() } : {}), ...(f.on ? { verifierVerifiedOn: f.on } : {}) } : {}),
      }).unwrap();
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
          <h3 className="text-lg font-bold text-gray-900">Send to MINMEG</h3>
          <p className="mt-1 text-sm text-gray-500">MINMEG confirms a carbon result only against an independent verifier’s report. Attach it now if you have it; MINMEG can also attach one it receives directly.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cs-name" label="Verifier" optional info="The firm that checked the figures, for example Bureau Veritas Nigeria">
            <Input id="cs-name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={255} />
          </FormField>
          <FormField htmlFor="cs-standard" label="Standard they used" optional info="For example ISO 14067:2018 or ISO 14064-3">
            <Input id="cs-standard" value={f.standard} onChange={(e) => set({ standard: e.target.value })} maxLength={255} />
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField htmlFor="cs-file" label="Their report" optional>
            <DropdownSelect id="cs-file" aria-label="Their report" value={f.file} placeholder={files.length ? 'Choose' : 'No files in your documents'} options={files} onValueChange={(v) => set({ file: v })} searchable={files.length > 8} />
          </FormField>
          <FormField htmlFor="cs-on" label="Verified on" optional>
            <Input id="cs-on" type="date" value={f.on} onChange={(e) => set({ on: e.target.value })} />
          </FormField>
        </div>
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Send</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Send ${assessment.assessmentCode} to MINMEG?`} description="MINMEG confirms it or returns it with notes. You can't change it while MINMEG looks at it." confirmLabel="Send" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

// =========================== the assessment ===========================
function Summary({ a }: { a: CarbonAssessment }) {
  const period = a.calculationPeriodStart || a.calculationPeriodEnd ? `${a.calculationPeriodStart ? formatDate(a.calculationPeriodStart) : '…'} to ${a.calculationPeriodEnd ? formatDate(a.calculationPeriodEnd) : '…'}` : null;
  const calculated = !!a.calculatedAt;
  const rows: [string, React.ReactNode][] = [
    ['Total', calculated ? `${amount(a.totalEmissions.value)} ${a.totalEmissions.unit ?? ''}` : 'Not calculated yet'],
    ['Per tonne', a.intensity ? `${amount(a.intensity.value)} ${a.intensity.unit ?? ''}` : calculated ? 'Not available (not per a mass)' : '—'],
    ['Primary data', a.primaryDataPercentage !== null ? `${amount(a.primaryDataPercentage)} %` : '—'],
    ['Method', `${a.methodologyCode} ${a.methodologyVersion}`],
    ['Covers', BOUNDARY_TEXT[a.systemBoundary] ?? words(a.systemBoundary)],
    ['Per', a.functionalUnit ?? (a.functionalUnitQuantity ? `${amount(a.functionalUnitQuantity)} ${a.functionalUnitUnit ?? ''}` : '—')],
    ...(period ? ([['Period', period]] as [string, React.ReactNode][]) : []),
  ];
  return (
    <dl className="grid gap-x-4 gap-y-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-2" aria-label="Result">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-gray-500">{k}</dt>
          <dd className="break-words text-sm font-medium text-gray-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function InputsTable({ a, editable }: { a: CarbonAssessment; editable: boolean }) {
  const units = useUnits();
  const [remove, removeState] = useRemoveCarbonInputMutation();
  const [removing, setRemoving] = React.useState<CarbonInput | null>(null);
  if (!a.inputs.length) return <p className="text-sm text-gray-500">No activities yet.</p>;
  return (
    <>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" aria-label="Activities">
        {a.inputs.map((i) => (
          <li key={i.id} className="space-y-1 p-3 text-sm" data-testid={`co2-input-${i.activityName}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{i.activityName}</p>
                <p className="text-gray-700">
                  {amount(i.activityValue)} {units.symbol(i.activityUnitId)} · {words(i.inputType)}
                  {i.scope ? ` · ${words(i.scope)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{amount(i.calculatedEmissionsValue)} {units.symbol(i.emissionsUnitId)}</span>
                {i.verificationStatus !== 'UNVERIFIED' && <StatusBadge status={i.verificationStatus}>{INPUT_STATUS_TEXT[i.verificationStatus]}</StatusBadge>}
                {editable && <Button size="sm" variant="text" onClick={() => setRemoving(i)}>Remove</Button>}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {i.calculationMethod === 'FACTOR'
                ? `Factor ${amount(i.emissionFactorValue)} ${units.symbol(i.emissionFactorUnitId)} per ${units.symbol(i.activityUnitId) || 'unit'}, from ${i.emissionFactorSource}${i.emissionFactorVersion ? ` (${i.emissionFactorVersion})` : ''}`
                : 'A documented figure'}
              {' · '}
              {i.sourceType === 'DYNAMIC_MEASUREMENT' ? 'from a checked reading' : words(i.dataType).toLowerCase() + ' data'}
              {i.evidenceFileId ? ' · with a document' : ''}
            </p>
            {i.rejectionReason && <p className="text-xs text-semantic-error-text">MINMEG: {i.rejectionReason}</p>}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.activityName ?? ''}?`}
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

/** One carbon assessment: result, trust, activities and what the owner can do next */
export function CarbonDetail({ id, mode }: { id: string; mode: Mode }) {
  const query = useGetCarbonAssessmentQuery(id);
  const [act, actState] = useCarbonActionMutation();
  const [revise, reviseState] = useReviseCarbonMutation();
  const { key, done } = useIdempotencyKey();
  const [form, setForm] = React.useState<'input' | 'reading' | 'send' | null>(null);
  const [dialog, setDialog] = React.useState<'calculate' | 'withdraw' | 'revise' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const a = query.data?.data;
  if (query.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!a) return <Alert severity="error">{query.error ? toApiError(query.error).message : 'Not found'}</Alert>;
  const owner = mode === 'owner';
  const draft = a.status === 'DRAFT';
  const v = a.verification;
  const canRevise = owner && ['VERIFIED', 'INVALIDATED'].includes(a.status);
  const canWithdraw = owner && isOpen(a);
  return (
    <div className="space-y-4" data-testid={`carbon-${a.id}`}>
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
            {draft && <Button size="sm" variant="outlined" onClick={() => setForm('input')}>Add activity</Button>}
            {draft && (a.subjectType === 'BATCH' || a.subjectType === 'SHIPMENT') && <Button size="sm" variant="outlined" onClick={() => setForm('reading')}>From a reading</Button>}
            {draft && <Button size="sm" disabled={!a.inputs.length} onClick={() => setDialog('calculate')}>Calculate</Button>}
            {a.status === 'CALCULATED' && <Button size="sm" onClick={() => setForm('send')}>Send to MINMEG</Button>}
            {canRevise && <Button size="sm" variant="outlined" onClick={() => setDialog('revise')}>New version</Button>}
            {canWithdraw && <Button size="sm" variant="text" onClick={() => setDialog('withdraw')}>Withdraw</Button>}
          </div>
        )}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {owner && a.returnNotes && draft && <Alert severity="warning">MINMEG returned it: {a.returnNotes}</Alert>}
      {a.status === 'PENDING_VERIFICATION' && <p className="text-sm text-gray-600">Waiting for MINMEG to confirm it{a.submittedAt ? `, sent ${formatDateTime(a.submittedAt)}` : ''}.</p>}
      {a.status === 'CALCULATED' && owner && <p className="text-sm text-gray-600">The activities are frozen. Send it to MINMEG, or withdraw it and start a new version to change them.</p>}
      {a.invalidationReason && <p className="text-sm text-gray-600">Withdrawn: {a.invalidationReason}</p>}
      <Summary a={a} />
      {(v.verifierName || v.confirmedAt) && (
        <div className="space-y-1 rounded-lg border border-gray-200 p-3 text-sm" aria-label="Verification">
          {v.verifierName && (
            <p className="text-gray-700">
              Checked by <span className="font-semibold text-gray-900">{v.verifierName}</span>
              {v.verificationStandard ? ` against ${v.verificationStandard}` : ''}
              {v.verifierVerifiedOn ? `, ${formatDate(v.verifierVerifiedOn)}` : ''}
            </p>
          )}
          {v.confirmedAt && <p className="text-gray-700">Confirmed by MINMEG {formatDateTime(v.confirmedAt)}{v.notes ? `: ${v.notes}` : ''}</p>}
        </div>
      )}
      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Activities</h4>
        <InputsTable a={a} editable={owner && draft} />
      </section>
      <p className="text-xs text-gray-400">{NOT_A_RATING} Assessment ID <CopyableId value={a.id} /></p>
      {form === 'input' && <InputForm assessment={a} onClose={() => setForm(null)} />}
      {form === 'reading' && <ReadingForm assessment={a} onClose={() => setForm(null)} />}
      {form === 'send' && <SendForm assessment={a} onClose={() => setForm(null)} />}
      <ConfirmDialog
        open={!!dialog}
        title={{ calculate: 'Calculate the result?', withdraw: `Withdraw ${a.assessmentCode}?`, revise: 'Start a new version?', '': '' }[dialog ?? '']}
        description={{ calculate: 'The server adds up your activities and freezes them. To change them afterwards, withdraw it and start a new version.', withdraw: 'Buyers stop seeing it. It stays in the history.', revise: 'A copy of this version with its activities, as a draft. Once MINMEG confirms the new one, it replaces this one.', '': '' }[dialog ?? '']}
        confirmLabel={{ calculate: 'Calculate', withdraw: 'Withdraw', revise: 'Start', '': '' }[dialog ?? '']}
        tone={dialog === 'withdraw' ? 'error' : 'primary'}
        reason={dialog === 'withdraw' || dialog === 'revise' ? { label: 'Reason', minLength: 3 } : undefined}
        loading={actState.isLoading || reviseState.isLoading}
        onConfirm={async (reason) => {
          setError(null);
          try {
            if (dialog === 'calculate') await act({ id: a.id, action: 'calculate' }).unwrap();
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
function Row({ a, open, onToggle }: { a: CarbonAssessment; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:bg-gray-50">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">
          {a.assessmentCode} · {a.methodologyCode} {a.methodologyVersion}
        </span>
        <span className="block text-xs text-gray-500">
          {a.calculatedAt ? `${amount(a.totalEmissions.value)} ${a.totalEmissions.unit ?? ''}${a.intensity ? ` · ${amount(a.intensity.value)} ${a.intensity.unit ?? ''}` : ''}` : 'Not calculated yet'} · version {a.version}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {a.status !== 'VERIFIED' && <StatusBadge status={statusTone(a.status)}>{ASSESSMENT_STATUS_TEXT[a.status]}</StatusBadge>}
        <StatusBadge tone={trustTone(a.trust.level)} data-trust={a.trust.level}>{TRUST_TEXT[a.trust.level]}</StatusBadge>
      </span>
    </button>
  );
}

/** The carbon assessments of one batch, shipment or the company; the owner can start one */
export function CarbonFor({ subjectType, subjectId, mode, title = 'Carbon' }: { subjectType: CarbonSubject; subjectId: string; mode: Mode; title?: string }) {
  const list = useGetCarbonAssessmentsQuery({ subjectType, subjectId, limit: 50 });
  const [open, setOpen] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const rows = list.data?.data ?? [];
  return (
    <section className="space-y-3" aria-label={title} data-testid={`carbon-for-${subjectId}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{mode === 'owner' ? 'Your own figures, added up by MINMEG. Confirmed by MINMEG once an independent verifier has checked them.' : 'The supplier’s own figures. The label says how far they have been checked.'}</p>
        </div>
        {mode === 'owner' && <Button size="sm" variant="outlined" onClick={() => setStarting(true)}>Start a carbon assessment</Button>}
      </div>
      {list.isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : list.error ? (
        <Alert severity="error">{toApiError(list.error).message}</Alert>
      ) : !rows.length ? (
        <p className="text-sm text-gray-500">{mode === 'owner' ? 'No carbon assessment yet.' : 'No carbon figures shared yet.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {rows.map((a) => (
            <li key={a.id}>
              <Row a={a} open={open === a.id} onToggle={() => setOpen((o) => (o === a.id ? null : a.id))} />
              {open === a.id && (
                <div className="border-t border-gray-100 p-3">
                  <CarbonDetail id={a.id} mode={mode} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {starting && <StartCarbon subjectType={subjectType} subjectId={subjectId} onClose={() => setStarting(false)} onCreated={setOpen} />}
    </section>
  );
}

export { StartCarbon };

/** The carbon of a trade's goods and shipments (step 2.10a D2): the seller manages its own, the buyer reads */
export function TradeCarbon({ batches, shipments, seller }: { batches: { id: string; batchCode: string }[]; shipments: { id: string; shipmentNumber: string }[]; seller: boolean }) {
  const mode: Mode = seller ? 'owner' : 'reader';
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5" data-testid="trade-carbon">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Carbon</h3>
        <p className="mt-0.5 text-xs text-gray-500">{seller ? 'Your carbon figures for these goods and shipments. The buyer sees them once calculated.' : 'The supplier’s own carbon figures for these goods and shipments, with how far they have been checked. MINMEG adds them up; it does not rate them.'}</p>
      </div>
      {!batches.length && !shipments.length && <p className="text-sm text-gray-500">No batch or shipment on this trade yet.</p>}
      {batches.map((b) => <CarbonFor key={b.id} subjectType="BATCH" subjectId={b.id} mode={mode} title={`Batch ${b.batchCode}`} />)}
      {shipments.map((s) => <CarbonFor key={s.id} subjectType="SHIPMENT" subjectId={s.id} mode={mode} title={`Shipment ${s.shipmentNumber}`} />)}
    </section>
  );
}
