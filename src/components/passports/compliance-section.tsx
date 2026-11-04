'use client';

import * as React from 'react';
import { Alert, Button, DropdownSelect, FormField, Input, Modal, StatusBadge, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { ASSESSMENT_TEXT, assessmentTone, RESULT_TEXT, resultTone, TRUST_TEXT, type Assessment } from '@/lib/passports';
import { useGetActiveStandardsQuery, useGetAssessmentsQuery, useGetComplianceProfilesQuery, useGetComplianceSummaryQuery, useReassessMutation, useRunAssessmentMutation } from '@/redux/features/passports/passports_api';

/*
 * Compliance of a published passport (step 2.9c, decision #75): checked against a named standard
 * version, requirement by requirement. The owner can check itself; MINMEG confirms. Readers always see
 * which standard and whether it was self-checked or confirmed by MINMEG, never a general badge.
 */

function RunCheck({ passportId, onClose }: { passportId: string; onClose: () => void }) {
  const profiles = useGetComplianceProfilesQuery({ active: true, limit: 100 });
  const standards = useGetActiveStandardsQuery();
  const [run, { isLoading }] = useRunAssessmentMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const [against, setAgainst] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const options = [
    ...(profiles.data?.data ?? []).map((p) => ({ value: `profile:${p.id}`, label: `${p.name} (all its standards)` })),
    ...(standards.data?.data ?? []).map((s) => ({ value: `standard:${s.id}`, label: `${s.name} (${s.code} ${s.version})` })),
  ];
  const submit = async () => {
    setError(null);
    if (!(await confirm({ title: 'Check this passport now?', description: 'Each requirement is checked against the published version. The result shows as self-checked until MINMEG confirms it.', confirmLabel: 'Check' }))) return;
    const [kind, id] = against.split(':');
    try {
      await run({ idempotencyKey: key, certificateId: passportId, ...(kind === 'profile' ? { complianceProfileId: id } : { passportStandardId: id }), ...(market.trim() ? { jurisdiction: market.trim().toUpperCase() } : {}) }).unwrap();
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
          <h3 className="text-lg font-bold text-gray-900">Check compliance</h3>
          <p className="mt-1 text-sm text-gray-500">Against one standard, or a market&apos;s or buyer&apos;s profile with all its standards.</p>
        </div>
        {error && <Alert severity="error">{error}</Alert>}
        <FormField htmlFor="check-against" label="Check against" required>
          <DropdownSelect id="check-against" aria-label="Check against" value={against} placeholder={options.length ? 'Choose' : 'No standards published yet'} options={options} onValueChange={setAgainst} searchable={options.length > 8} />
        </FormField>
        <FormField htmlFor="check-market" label="Market" optional info="Where the goods are going, for example EU. Some standards apply only there.">
          <Input id="check-market" value={market} onChange={(e) => setMarket(e.target.value)} placeholder="EU" />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!against} loading={isLoading} onClick={submit}>Check</Button>
        </div>
      </div>
      {dialog}
    </Modal>
  );
}

function AssessmentDetail({ a, canReassess }: { a: Assessment; canReassess: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [reassess, { isLoading }] = useReassessMutation();
  const { key, done } = useIdempotencyKey();
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3" data-testid={`assessment-${a.assessmentCode}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">{a.standard ? `${a.standard.name} (${a.standard.code} ${a.standard.version})` : 'Standard'}</span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={assessmentTone(a.status)}>{ASSESSMENT_TEXT[a.status]}</StatusBadge>
          <StatusBadge status={a.trustLabel === 'VERIFIED_BY_MINMEG' ? 'VERIFIED' : a.trustLabel === 'REJECTED_BY_MINMEG' ? 'REJECTED' : 'ON_HOLD'}>{TRUST_TEXT[a.trustLabel]}</StatusBadge>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {a.assessmentCode} · version {a.passportVersion?.versionNumber ?? '—'} · {a.assessedAt ? formatDateTime(a.assessedAt) : ''}
        {a.expiresAt ? ` · valid until ${formatDateTime(a.expiresAt)}` : ''}
      </p>
      {a.conditions && <p className="text-sm text-gray-700">Conditions: {a.conditions}</p>}
      {error && <Alert severity="error">{error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="text" onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Show'} each requirement ({a.findings.length})</Button>
        {canReassess && (
          <Button
            size="sm"
            variant="outlined"
            loading={isLoading}
            onClick={async () => {
              setError(null);
              try {
                await reassess({ id: a.id, idempotencyKey: key }).unwrap();
                done();
              } catch (err) {
                setError(toApiError(err).message);
              }
            }}
          >
            Check again
          </Button>
        )}
      </div>
      {open && (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white" aria-label="Requirements">
          {a.findings.map((f) => (
            <li key={f.propertyId} className="flex flex-wrap items-start justify-between gap-2 p-2 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{f.title}{f.required ? '' : ' (optional)'}</p>
                <p className="text-xs text-gray-500">{f.reason}</p>
              </div>
              <StatusBadge status={resultTone(f.result)}>{RESULT_TEXT[f.result]}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ComplianceSection({ passportId, owner, published }: { passportId: string; owner: boolean; published: boolean }) {
  const summary = useGetComplianceSummaryQuery(passportId, { skip: !published });
  const assessments = useGetAssessmentsQuery({ certificateId: passportId, limit: 50 }, { skip: !owner || !published });
  const [running, setRunning] = React.useState(false);
  if (!published) return owner ? <p className="text-sm text-gray-500">Compliance can be checked once a version is published.</p> : null;
  const s = summary.data?.data;
  const needAgain = new Set((s?.standards ?? []).filter((x) => x.reassessmentNeeded).map((x) => x.assessmentId));
  return (
    <section className="space-y-3 border-t border-gray-200 pt-4" aria-labelledby={`compliance-${passportId}`} data-testid="compliance-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 id={`compliance-${passportId}`} className="text-sm font-bold text-gray-900">Compliance</h4>
          <p className="text-xs text-gray-500">Each result applies to the named standard version only.</p>
        </div>
        {owner && <Button size="sm" variant="outlined" onClick={() => setRunning(true)}>Check compliance</Button>}
      </div>
      {summary.error && <Alert severity="error">{toApiError(summary.error).message}</Alert>}
      {!!s?.activeDisqualifications && <Alert severity="warning">MINMEG has disqualified this passport, so it cannot meet any standard until that is lifted.</Alert>}
      {s && !s.standards.length && <p className="text-sm text-gray-500">Not checked against any standard yet.</p>}
      {owner
        ? (assessments.data?.data ?? []).map((a) => <AssessmentDetail key={a.id} a={a} canReassess={needAgain.has(a.id)} />)
        : (s?.standards ?? []).map((x) => (
            <div key={x.assessmentId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-3" data-testid={`summary-${x.assessmentCode}`}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{x.standard ? `${x.standard.name} (${x.standard.code} ${x.standard.version})` : 'Standard'}</p>
                <p className="text-xs text-gray-500">
                  {x.assessedAt ? formatDateTime(x.assessedAt) : ''}
                  {x.expiresAt ? ` · valid until ${formatDateTime(x.expiresAt)}` : ''}
                  {x.reassessmentNeeded ? ' · made for an older version' : ''}
                </p>
                {x.conditions && <p className="text-sm text-gray-700">Conditions: {x.conditions}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={assessmentTone(x.status)}>{ASSESSMENT_TEXT[x.status]}</StatusBadge>
                <StatusBadge status={x.trustLabel === 'VERIFIED_BY_MINMEG' ? 'VERIFIED' : x.trustLabel === 'REJECTED_BY_MINMEG' ? 'REJECTED' : 'ON_HOLD'}>{TRUST_TEXT[x.trustLabel]}</StatusBadge>
              </div>
            </div>
          ))}
      {running && <RunCheck passportId={passportId} onClose={() => setRunning(false)} />}
    </section>
  );
}
