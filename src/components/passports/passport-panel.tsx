'use client';

import * as React from 'react';
import { Alert, Button, ConfirmDialog, CopyableId, DropdownSelect, FormField, Modal, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import {
  PASSPORT_STATUS_TEXT,
  passportTone,
  SOURCE_TEXT,
  valueText,
  valueTrust,
  words,
  type Passport,
  type PassportVersion,
  type TemplateField,
  type VersionField,
} from '@/lib/passports';
import { numberText } from '@/lib/traceability';
import {
  useCheckPassportVersionMutation,
  useClearPassportValueMutation,
  useCreatePassportMutation,
  useDiscardPassportVersionMutation,
  useGetBatchResultsQuery,
  useGetPassportQuery,
  useGetPassportsQuery,
  useGetPassportTypesQuery,
  useGetPassportVerificationQuery,
  useGetPassportVersionQuery,
  useGetTemplateQuery,
  useGetTemplatesQuery,
  useGetVisibilityPoliciesQuery,
  useNewPassportVersionMutation,
  usePassportActionMutation,
  useSetPassportValueMutation,
} from '@/redux/features/passports/passports_api';
import { useGetReadingsQuery } from '@/redux/features/traceability/traceability_api';
import { useGetCarbonAssessmentsQuery } from '@/redux/features/esg/esg_api';
import { amount } from '@/lib/esg';
import { useGetFilesQuery } from '@/redux/features/vault/vaultApi';
import { ComplianceSection } from './compliance-section';
import { DownloadPdfButton, SharePanel } from './certificate-detail';
import { DetailsSection, FillSeveral, MaterialsSection, parseTyped, RecordTrail, TypedInput } from './passport-extras';

/*
 * A batch's digital passport (step 2.9b, decisions #74, #108).
 *  - owner: issue it on a published template, fill the fields (typed, from a reading, from a
 *    released lab or inspection result, or a document), check, publish; a correction is a new version
 *  - reader (the trade's buyer or supplier, the inspector): the published version only, filtered by
 *    the server, with a count of what is hidden
 * Typed values show as declared; values taken from checked records show as verified.
 */
type Mode = 'owner' | 'reader';
const RANK: Record<string, number> = { PUBLIC: 0, AUTHENTICATED: 1, TRADE_PARTICIPANTS: 2, SUPPLY_CHAIN_PARTICIPANTS: 2, INSPECTOR: 3, OWNER: 4, COMPLIANCE: 4, ADMIN: 4 };
const OPEN = ['DRAFT', 'VALIDATED'];
const CLOSED = ['SUSPENDED', 'REVOKED', 'ARCHIVED'];

function shown(f: VersionField) {
  if (f.dynamic) {
    const r = f.latestReading as { value?: string; unit?: { symbol?: string } | null; measuredAt?: string } | null | undefined;
    return r?.value ? `${numberText(r.value)} ${r.unit?.symbol ?? ''} (latest reading${r.measuredAt ? `, ${formatDateTime(r.measuredAt)}` : ''})` : 'No reading yet';
  }
  return f.value ? valueText(f.value.value) : '';
}

/** Set one field: typed, from a reading, from a released lab or inspection result, or a document */
function ValueForm({ version, field, def, batchId, onClose }: { version: PassportVersion; field: VersionField; def: TemplateField | undefined; batchId: string | null; onClose: () => void }) {
  const isFile = def?.dataType === 'FILE';
  const [source, setSource] = React.useState<string>(isFile ? 'DOCUMENT' : field.value?.sourceType && field.value.sourceType !== 'SYSTEM' ? field.value.sourceType : 'USER');
  const [typed, setTyped] = React.useState(field.value && field.value.sourceType === 'USER' ? valueText(field.value.value) : '');
  const [sourceId, setSourceId] = React.useState(field.value?.sourceId ?? '');
  const [visibilityId, setVisibilityId] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const readings = useGetReadingsQuery({ subjectType: 'BATCH', subjectId: batchId ?? '' }, { skip: !batchId || source !== 'MEASUREMENT' });
  const results = useGetBatchResultsQuery(batchId ?? '', { skip: !batchId || source !== 'INSPECTION' });
  const files = useGetFilesQuery({ limit: 100, page: 1 }, { skip: source !== 'DOCUMENT' });
  const carbon = useGetCarbonAssessmentsQuery({ subjectType: 'BATCH', subjectId: batchId ?? '', status: 'VERIFIED', limit: 50 }, { skip: !batchId || source !== 'ASSESSMENT' });
  const policies = useGetVisibilityPoliciesQuery();
  const [save, { isLoading }] = useSetPassportValueMutation();
  const current = RANK[field.visibility ?? 'PUBLIC'] ?? 0;
  const stricter = (policies.data?.data ?? []).filter((p) => p.active && p.code !== 'CUSTOM' && p.code !== 'ADMIN' && (RANK[p.code] ?? 99) > current);
  const readingOptions = (readings.data?.data ?? []).filter((r) => r.status === 'ACTIVE').map((r) => ({ value: r.id, label: `${r.measurementType?.name ?? 'Reading'}: ${numberText(r.value)} ${r.unit?.symbol ?? ''} · ${formatDateTime(r.measuredAt)}${r.verificationStatus === 'VERIFIED' ? ' · checked' : ''}` }));
  const resultOptions = [
    ...(results.data?.data.assayResults ?? []).filter((r) => r.status !== 'INVALIDATED').map((r) => ({ value: r.id, label: `Lab result, ${r.laboratoryName}${r.grade ? `: ${r.grade.parameter} ${numberText(r.grade.value)} ${r.grade.unit}` : ''}${r.status === 'VERIFIED' ? ' · checked' : ''}` })),
    ...(results.data?.data.inspectionResults ?? []).map((r) => ({ value: r.id, label: `Inspection findings${r.quantityVerified ? `: quantity verified ${numberText(r.quantityVerified)}` : ''}${r.status === 'VERIFIED' ? ' · checked' : ''}` })),
  ];
  const fileOptions = (files.data?.data ?? []).map((f) => ({ value: f.id, label: f.displayName }));
  const carbonOptions = (carbon.data?.data ?? []).map((a) => ({ value: a.id, label: `${a.assessmentCode}: ${amount(a.totalEmissions.value)} ${a.totalEmissions.unit ?? ''}${a.intensity ? ` · ${amount(a.intensity.value)} ${a.intensity.unit ?? ''}` : ''}` }));
  const numeric = def?.dataType === 'NUMBER' || def?.dataType === 'INTEGER';
  const problem = source === 'USER' ? (!typed.trim() ? 'Enter the value.' : null) : !sourceId ? 'Choose where the value comes from.' : null;

  const submit = async () => {
    setError(null);
    let value: unknown;
    try {
      value = source === 'USER' ? parseTyped(def?.dataType ?? 'STRING', typed) : source === 'DOCUMENT' ? sourceId : undefined;
    } catch {
      setConfirming(false);
      return setError('That is not valid for this kind of value.');
    }
    try {
      await save({
        versionId: version.id,
        fieldId: field.fieldId,
        sourceType: source,
        ...(value !== undefined ? { value } : {}),
        ...(source !== 'USER' ? { sourceId } : {}),
        ...(visibilityId ? { visibilityPolicyId: visibilityId } : {}),
      }).unwrap();
      onClose();
    } catch (err) {
      setConfirming(false);
      setError(toApiError(err).message);
    }
  };

  const sources = isFile
    ? [{ value: 'DOCUMENT', label: 'A document from your files' }]
    : [
        { value: 'USER', label: 'Type it' },
        ...(batchId ? [{ value: 'MEASUREMENT', label: 'From a reading on the batch' }, { value: 'INSPECTION', label: 'From a lab or inspection result' }] : []),
        ...(batchId && numeric ? [{ value: 'ASSESSMENT', label: 'From a carbon assessment MINMEG confirmed' }] : []),
        { value: 'DOCUMENT', label: 'A document from your files' },
      ];
  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{field.label}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {def?.description ?? 'Typed values show as declared by your company. Values taken from a checked reading or a lab or inspection result released by MINMEG show as verified.'}
          </p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="value-source" label="Where the value comes from" required>
          <DropdownSelect id="value-source" aria-label="Where the value comes from" value={source} onValueChange={(v) => { setSource(v); setSourceId(''); }} options={sources} />
        </FormField>
        {source === 'USER' && (
          <FormField htmlFor="value-input" label="Value" required info={def?.enumValues ? undefined : def?.validationRules && Object.keys(def.validationRules).length ? `Rules: ${JSON.stringify(def.validationRules)}` : undefined}>
            <TypedInput def={def} value={typed} onChange={setTyped} />
          </FormField>
        )}
        {source === 'MEASUREMENT' && (
          <FormField htmlFor="value-reading" label="Reading" required info="MINMEG copies the value; it shows as verified once the reading is checked">
            <DropdownSelect id="value-reading" aria-label="Reading" value={sourceId} placeholder={readingOptions.length ? 'Choose' : 'No readings on this batch'} options={readingOptions} onValueChange={setSourceId} />
          </FormField>
        )}
        {source === 'INSPECTION' && (
          <FormField htmlFor="value-result" label="Lab or inspection result" required info="Only results MINMEG released to you are listed">
            <DropdownSelect id="value-result" aria-label="Lab or inspection result" value={sourceId} placeholder={resultOptions.length ? 'Choose' : 'No released results yet'} options={resultOptions} onValueChange={setSourceId} />
          </FormField>
        )}
        {source === 'ASSESSMENT' && (
          <FormField htmlFor="value-carbon" label="Carbon assessment" required info="The figure is copied and converted to this field's unit: the total for an emissions field, the figure per tonne for an intensity field. A carbon value can't be typed.">
            <DropdownSelect id="value-carbon" aria-label="Carbon assessment" value={sourceId} placeholder={carbonOptions.length ? 'Choose' : 'No carbon assessment MINMEG confirmed for this batch'} options={carbonOptions} onValueChange={setSourceId} />
          </FormField>
        )}
        {source === 'DOCUMENT' && (
          <FormField htmlFor="value-file" label="Document" required>
            <DropdownSelect id="value-file" aria-label="Document" value={sourceId} placeholder={fileOptions.length ? 'Choose' : 'No files in your documents'} options={fileOptions} onValueChange={setSourceId} searchable={fileOptions.length > 8} />
          </FormField>
        )}
        {!!stricter.length && (
          <FormField htmlFor="value-visibility" label="Show it to fewer people" optional info={`The field is visible to: ${words(field.visibility)}. You can only make it stricter.`}>
            <DropdownSelect id="value-visibility" aria-label="Show it to fewer people" value={visibilityId} placeholder="As the template says" options={stricter.map((p) => ({ value: p.id, label: p.name }))} onValueChange={setVisibilityId} />
          </FormField>
        )}
        {problem && <p className="text-sm text-gray-500">{problem}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!!problem} onClick={() => setConfirming(true)}>Save value</Button>
        </div>
      </div>
      <ConfirmDialog open={confirming} title={`Save ${field.label}?`} description={version.status === 'VALIDATED' ? 'The checked version goes back to draft: check it again before publishing.' : undefined} confirmLabel="Save" loading={isLoading} onConfirm={submit} onClose={() => setConfirming(false)} />
    </Modal>
  );
}

/** The fields of a version, grouped by section, each with its value, where it came from and how far it can be trusted */
function FieldsView({ version, editable, defs, batchId }: { version: PassportVersion; editable: boolean; defs: TemplateField[]; batchId: string | null }) {
  const [editing, setEditing] = React.useState<VersionField | null>(null);
  const [clearing, setClearing] = React.useState<VersionField | null>(null);
  const [clear, clearState] = useClearPassportValueMutation();
  const groups = new Map<string, VersionField[]>();
  for (const f of [...version.fields].sort((a, b) => a.order - b.order)) groups.set(f.group ?? '', [...(groups.get(f.group ?? '') ?? []), f]);
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([group, fields]) => (
        <section key={group || 'main'} className="space-y-1">
          {group && <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{group}</h4>}
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {fields.map((f) => {
              const trust = f.dynamic ? { label: 'From readings', status: 'NEUTRAL' } : valueTrust(f.value);
              const system = f.value?.sourceType === 'SYSTEM';
              return (
                <li key={f.fieldId} className="flex flex-wrap items-start justify-between gap-2 p-3" data-testid={`pfield-${f.key}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {f.label} {f.required && <span className="text-xs font-normal text-gray-500">(required)</span>}
                    </p>
                    <p className="break-words text-sm text-gray-700">{shown(f) || <span className="text-gray-400">Not filled</span>}</p>
                    {f.value && <p className="text-xs text-gray-500">From {SOURCE_TEXT[f.value.sourceType ?? 'USER'] ?? 'the company'} · visible to {words(f.visibility)}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={trust.status}>{trust.label}</StatusBadge>
                    {editable && !f.dynamic && !system && <Button size="sm" variant="outlined" onClick={() => setEditing(f)}>{f.value ? 'Change' : 'Fill in'}</Button>}
                    {editable && f.value && !system && !f.required && <Button size="sm" variant="text" onClick={() => setClearing(f)}>Clear</Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {editing && <ValueForm version={version} field={editing} def={defs.find((d) => d.id === editing.fieldId)} batchId={batchId} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!clearing}
        title={`Clear ${clearing?.label ?? ''}?`}
        confirmLabel="Clear"
        tone="error"
        loading={clearState.isLoading}
        onConfirm={async () => {
          if (clearing) await clear({ versionId: version.id, fieldId: clearing.fieldId }).unwrap().catch(() => undefined);
          setClearing(null);
        }}
        onClose={() => setClearing(null)}
      />
    </div>
  );
}

/** The open version the owner fills, checks and publishes */
function VersionEditor({ passport, versionId, batchId }: { passport: Passport; versionId: string; batchId: string | null }) {
  const version = useGetPassportVersionQuery({ id: passport.id, versionId });
  const v = version.data?.data;
  const template = useGetTemplateQuery(v?.templateId ?? '', { skip: !v });
  const [check, checkState] = useCheckPassportVersionMutation();
  const [discard, discardState] = useDiscardPassportVersionMutation();
  const [act, actState] = usePassportActionMutation();
  const [dialog, setDialog] = React.useState<'publish' | 'discard' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  if (version.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!v) return <Alert severity="error">{version.error ? toApiError(version.error).message : 'Version not found'}</Alert>;
  const report = v.validationReport;
  const issues = report?.issues ?? [];
  const runCheck = async () => {
    setError(null);
    try {
      await check({ id: passport.id, versionId: v.id }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  return (
    <div className="space-y-4" data-testid="passport-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Version {v.versionNumber} · {v.status === 'VALIDATED' ? 'checked, not published' : 'draft'}</h3>
          <p className="text-xs text-gray-500">Template {v.template.name} ({v.template.code} revision {v.template.version}){v.changeReason ? ` · ${v.changeReason}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FillSeveral version={v} defs={template.data?.data.fields ?? []} />
          <Button size="sm" variant="outlined" loading={checkState.isLoading} onClick={runCheck}>Check</Button>
          {v.status === 'VALIDATED' && <Button size="sm" onClick={() => setDialog('publish')}>Publish</Button>}
          {v.versionNumber > 1 && <Button size="sm" variant="text" onClick={() => setDialog('discard')}>Discard draft</Button>}
        </div>
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {report && (
        <div className="space-y-1 rounded-lg border border-gray-200 p-3" aria-label="Check results">
          <p className="text-sm font-semibold text-gray-900">{report.valid ? 'Checked: ready to publish' : 'The check found problems to fix'}</p>
          {issues.map((i, n) => (
            <p key={n} className={`text-sm ${i.level === 'ERROR' ? 'text-semantic-error-text' : 'text-semantic-warning-text'}`}>
              {i.level === 'ERROR' ? 'Fix: ' : 'Note: '}
              {i.message}
              {i.fieldKey ? ` (${i.fieldKey})` : ''}
            </p>
          ))}
        </div>
      )}
      <FieldsView version={v} editable defs={template.data?.data.fields ?? []} batchId={batchId} />
      <MaterialsSection version={v} editable />
      <DetailsSection version={v} editable />
      <ConfirmDialog
        open={!!dialog}
        title={dialog === 'publish' ? `Publish version ${v.versionNumber}?` : `Discard version ${v.versionNumber}?`}
        description={dialog === 'publish' ? 'It is checked again first. Once published it never changes, and the buyers on your trades see it.' : 'Its values go with it. Version numbers are not reused.'}
        confirmLabel={dialog === 'publish' ? 'Publish' : 'Discard'}
        tone={dialog === 'discard' ? 'error' : 'primary'}
        loading={actState.isLoading || discardState.isLoading}
        onConfirm={async () => {
          setError(null);
          try {
            if (dialog === 'publish') await act({ id: passport.id, action: 'publish' }).unwrap();
            else await discard({ id: passport.id, versionId: v.id }).unwrap();
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

/** A published version, as readers see it (filtered by the server) */
export function PublishedView({ passport, versionId }: { passport: Passport; versionId: string }) {
  const version = useGetPassportVersionQuery({ id: passport.id, versionId });
  const verification = useGetPassportVerificationQuery(passport.id);
  const v = version.data?.data;
  if (version.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!v) return <Alert severity="error">{version.error ? toApiError(version.error).message : 'Not available'}</Alert>;
  const tally = (verification.data?.data as { valueVerification?: Record<string, number> } | undefined)?.valueVerification;
  const counts = tally ? { verified: tally.VERIFIED ?? 0, total: Object.values(tally).reduce((a, b) => a + b, 0) } : null;
  return (
    <div className="space-y-4" data-testid="passport-published">
      <p className="text-xs text-gray-500">
        Version {v.versionNumber}, published {v.publishedAt ? formatDateTime(v.publishedAt) : ''} · template {v.template.name}
        {counts?.total ? ` · ${counts.verified ?? 0} of ${counts.total} values verified` : ''}
      </p>
      <FieldsView version={v} editable={false} defs={[]} batchId={null} />
      {!!v.hiddenFieldCount && <p className="text-sm text-gray-500">{v.hiddenFieldCount} field{v.hiddenFieldCount === 1 ? '' : 's'} not shared with you.</p>}
      <MaterialsSection version={v} editable={false} />
      <DetailsSection version={v} editable={false} />
    </div>
  );
}

/** Issue a passport on a published template of the batch passport type */
function IssuePassport({ subjectId }: { subjectId: string }) {
  const types = useGetPassportTypesQuery();
  const batchType = types.data?.data.find((t) => t.code === 'BATCH_PASSPORT');
  const templates = useGetTemplatesQuery({ passportTypeId: batchType?.id, status: 'PUBLISHED', limit: 100 }, { skip: !batchType });
  const options = (templates.data?.data ?? []).filter((t) => t.active).map((t) => ({ value: t.id, label: `${t.name} (revision ${t.version})${t.isDefault ? ' · default' : ''}` }));
  const fallback = (templates.data?.data ?? []).find((t) => t.isDefault)?.id ?? '';
  const [templateId, setTemplateId] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { key, done } = useIdempotencyKey();
  const [create, { isLoading }] = useCreatePassportMutation();
  const chosen = templateId || fallback;
  if (!batchType) return null;
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-gray-300 p-4">
      <p className="text-sm text-gray-700">This batch has no passport yet. Issue one on a template MINMEG published; the batch code and its material are filled for you.</p>
      {error && <Alert severity="error">{error}</Alert>}
      {!options.length ? (
        <p className="text-sm text-gray-500">No batch passport template is published yet. Ask MINMEG for one under Template requests.</p>
      ) : (
        <>
          <FormField htmlFor="issue-template" label="Template" required>
            <DropdownSelect id="issue-template" aria-label="Template" value={chosen} options={options} onValueChange={setTemplateId} />
          </FormField>
          <Button disabled={!chosen} onClick={() => setConfirming(true)}>Issue passport</Button>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        title="Issue a passport for this batch?"
        description="It starts as a draft only you and MINMEG see. One passport per batch."
        confirmLabel="Issue"
        loading={isLoading}
        onConfirm={async () => {
          setError(null);
          try {
            await create({ idempotencyKey: key, certificateType: batchType.code, subjectId, templateId: chosen }).unwrap();
            done();
          } catch (err) {
            setError(toApiError(err).message);
          }
          setConfirming(false);
        }}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

/** One passport: status, then the owner's editor or the published view */
export function PassportDetail({ passportId, mode, batchId }: { passportId: string; mode: Mode; batchId: string | null }) {
  const query = useGetPassportQuery(passportId);
  const [act, actState] = usePassportActionMutation();
  const [newVersion, newState] = useNewPassportVersionMutation();
  const { key, done } = useIdempotencyKey();
  const [dialog, setDialog] = React.useState<'version' | 'invalidate' | 'archive' | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showPublished, setShowPublished] = React.useState(false);
  const p = query.data?.data;
  if (query.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!p) return <Alert severity="error">{query.error ? toApiError(query.error).message : 'Passport not found'}</Alert>;
  const open = mode === 'owner' && p.openVersion && OPEN.includes(p.openVersion.status) ? p.openVersion : null;
  const closed = CLOSED.includes(p.status);
  return (
    <div className="space-y-4" data-testid={`passport-${p.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{p.certificateType?.name ?? 'Passport'} · {p.passportCode}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={passportTone(p.status)}>{PASSPORT_STATUS_TEXT[p.status]}</StatusBadge>
            {p.correctionPending && <StatusBadge status="ON_HOLD">Correction in progress</StatusBadge>}
          </div>
          {p.suspensionReason && p.status === 'SUSPENDED' && <p className="mt-1 text-sm text-gray-600">MINMEG: {p.suspensionReason}</p>}
          {p.revocationReason && <p className="mt-1 text-sm text-gray-600">MINMEG: {p.revocationReason}</p>}
        </div>
        {mode === 'owner' && !closed && (
          <div className="flex flex-wrap gap-2">
            {!open && <Button size="sm" variant="outlined" onClick={() => setDialog('version')}>New version</Button>}
            {p.publishedVersion && <Button size="sm" variant="outlined" onClick={() => setDialog('invalidate')}>Withdraw the published version</Button>}
            <Button size="sm" variant="text" onClick={() => setDialog('archive')}>Archive</Button>
          </div>
        )}
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {(p.status === 'SUSPENDED' || p.status === 'REVOKED') && mode === 'reader' && <p className="text-sm text-gray-500">MINMEG has {p.status === 'SUSPENDED' ? 'suspended' : 'revoked'} this passport, so its content is not shown.</p>}
      {open && <VersionEditor passport={p} versionId={open.id} batchId={batchId} />}
      {p.publishedVersion && (mode === 'reader' || !open || showPublished) && !(mode === 'reader' && (p.status === 'SUSPENDED' || p.status === 'REVOKED')) && <PublishedView passport={p} versionId={p.publishedVersion.id} />}
      {open && p.publishedVersion && <Button size="sm" variant="text" onClick={() => setShowPublished((s) => !s)}>{showPublished ? 'Hide' : 'Show'} the published version {p.publishedVersion.versionNumber}</Button>}
      {!p.publishedVersion && !open && mode === 'reader' && <p className="text-sm text-gray-500">Nothing published yet.</p>}
      {p.publishedVersion && !['SUSPENDED', 'REVOKED'].includes(p.status) && (
        <div className="flex flex-wrap gap-2">
          <DownloadPdfButton id={p.id} code={p.passportCode} label="Download the published version (PDF)" />
        </div>
      )}
      {mode === 'owner' && p.publishedVersion && !closed && <SharePanel resourceType="PASSPORT" resourceId={p.id} />}
      {!(mode === 'reader' && (p.status === 'SUSPENDED' || p.status === 'REVOKED')) && <ComplianceSection passportId={p.id} owner={mode === 'owner' && !closed} published={!!p.publishedVersion} />}
      <RecordTrail id={p.id} />
      <p className="text-xs text-gray-400">Passport ID <CopyableId value={p.id} /></p>
      <ConfirmDialog
        open={!!dialog}
        title={{ version: 'Start a new version?', invalidate: 'Withdraw the published version?', archive: 'Archive this passport?', '': '' }[dialog ?? '']}
        description={{ version: 'It is a copy of the latest version. The published one stays visible until the new one is published.', invalidate: 'Buyers stop seeing it at once. Publish a corrected version afterwards.', archive: 'It can no longer change or be published again. This is final.', '': '' }[dialog ?? '']}
        confirmLabel={{ version: 'Start', invalidate: 'Withdraw', archive: 'Archive', '': '' }[dialog ?? '']}
        tone={dialog === 'version' ? 'primary' : 'error'}
        reason={dialog === 'archive' ? { label: 'Reason (optional)', minLength: 0 } : { label: 'Reason', minLength: 3 }}
        loading={actState.isLoading || newState.isLoading}
        onConfirm={async (reason) => {
          setError(null);
          try {
            if (dialog === 'version') {
              await newVersion({ id: p.id, changeReason: reason ?? '', idempotencyKey: key }).unwrap();
              done();
            } else await act({ id: p.id, action: dialog === 'invalidate' ? 'invalidate' : 'archive', reason: reason || undefined }).unwrap();
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

/** The Passport tab of a batch: issue one, or open the batch's passport */
export function BatchPassport({ batchId, mode }: { batchId: string; mode: Mode }) {
  const list = useGetPassportsQuery({ subjectType: 'BATCH', subjectId: batchId, limit: 10 });
  if (list.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (list.error) return <Alert severity="error">{toApiError(list.error).message}</Alert>;
  const passports = list.data?.data ?? [];
  if (!passports.length) return mode === 'owner' ? <IssuePassport subjectId={batchId} /> : <p className="text-sm text-gray-500">No passport published for this batch yet.</p>;
  return (
    <div className="space-y-6">
      {passports.map((p) => (
        <PassportDetail key={p.id} passportId={p.id} mode={mode} batchId={batchId} />
      ))}
    </div>
  );
}
