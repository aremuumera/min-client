'use client';

import * as React from 'react';
import { DownloadButton, DropdownSelect, StatTile } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { number, percent, type CompletenessPart, type PassportCompleteness, type Window } from '@/lib/analytics';
import { useGetFieldAggregateQuery, useGetOnePassportCompletenessQuery, useGetPassportCompletenessQuery, useGetPassportNumberFieldsQuery } from '@/redux/features/analytics/analytics_api';
import { Breakdown, Pair, Section, Tiles } from '@/components/analytics/charts';

/*
 * Passport completeness (decision #133): how much of a passport is filled, and what is left to do.
 * Worked out by the backend when asked, on the version being worked on (the open draft, else the
 * published one).
 */

/** A bar from 0 to 100 % with its numbers; flat, no shadow */
export function CompletenessBar({ label, part, testId }: { label: string; part: CompletenessPart; testId?: string }) {
  const done = part.completed === part.total;
  return (
    <div className="space-y-1" data-testid={testId}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular-nums text-steel">{part.completed} of {part.total} · {part.percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={part.percentage}>
        <div className={done ? 'h-full bg-brand-green' : 'h-full bg-semantic-warning-text'} style={{ width: `${part.percentage}%` }} />
      </div>
    </div>
  );
}

/** On one passport (owner): the three parts and the empty fields, required first */
export function PassportCompletenessCard({ passportId }: { passportId: string }) {
  // the values are saved through the passport screens; ask again every 10 s while the page is in view so the bars follow
  const q = useGetOnePassportCompletenessQuery(passportId, { pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true });
  const c = q.data?.data;
  if (!c || !c.version) return null;
  const required = (c.missing ?? []).filter((m) => m.required);
  const optional = (c.missing ?? []).filter((m) => !m.required);
  return (
    <section className="space-y-3 rounded-xl border border-hairline p-4" aria-label="How complete it is" data-testid="passport-completeness">
      <div>
        <h3 className="text-sm font-bold text-ink">How complete it is</h3>
        <p className="text-xs text-steel">Version {c.version.versionNumber} ({c.version.status === 'PUBLISHED' ? 'published' : 'draft'}). {c.unverified ? `${c.unverified} value${c.unverified === 1 ? ' is' : 's are'} self-declared or waiting for a check.` : 'Every value is checked.'}</p>
      </div>
      <CompletenessBar label="Required fields" part={c.mandatory} testId="completeness-required" />
      <CompletenessBar label="Optional fields" part={c.optional} />
      {!!required.length && (
        <div className="text-sm">
          <p className="font-medium text-ink">Still needed to publish</p>
          <ul className="mt-1 list-disc pl-5 text-steel">{required.map((m) => <li key={m.fieldKey}>{m.label}{m.group ? ` (${m.group})` : ''}, empty since {formatDate(m.since)}</li>)}</ul>
        </div>
      )}
      {!!optional.length && <p className="text-xs text-steel">Optional and empty: {optional.map((m) => m.label).join(', ')}.</p>}
    </section>
  );
}

const row = (p: PassportCompleteness) => (
  <li key={p.passportId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
    <span className="font-medium text-ink">{p.passportCode}</span>
    <span className="text-steel">Required {p.mandatory.completed} of {p.mandatory.total} · version {p.version?.versionNumber ?? '—'} {p.version && p.version.status !== 'PUBLISHED' ? '(draft)' : ''}</span>
  </li>
);

/** Analytics: how complete the company's passports are, which need attention, and totals of a number field */
export function PassportCompletenessSection({ q, window, organizationId }: { q: { from?: string; to?: string; interval?: string }; window?: Window; organizationId?: string }) {
  const scope = organizationId ? { organizationId } : {};
  const report = useGetPassportCompletenessQuery({ attention: 5, ...scope });
  const fields = useGetPassportNumberFieldsQuery(scope);
  const [fieldKey, setFieldKey] = React.useState('');
  const chosen = fieldKey || fields.data?.data[0]?.key || '';
  const totals = useGetFieldAggregateQuery({ ...q, fieldKey: chosen, ...scope }, { skip: !chosen });
  const r = report.data?.data;
  const t = totals.data?.data;
  const missing = Object.fromEntries((r?.missingByGroup ?? []).filter((g) => g.required > 0).map((g) => [g.group, g.required]));
  return (
    <>
      <Section title="How complete your passports are" description="Today, on the version being worked on: the open draft, else the published one. Archived and revoked passports are left out." query={report} testId="analytics-completeness">
        {r && (
          <>
            <Tiles
              items={[
                { label: 'Passports', value: number(r.summary.passports), hint: `${number(r.summary.drafts)} with a draft open` },
                { label: 'Required fields all filled', value: number(r.summary.mandatoryComplete), hint: `${number(r.summary.mandatoryIncomplete)} still missing some` },
                { label: 'Required fields filled', value: percent(r.summary.averageMandatory), hint: 'On average' },
                { label: 'Values not yet checked', value: number(r.summary.unverifiedValues), hint: 'Self-declared or waiting' },
              ]}
            />
            <Pair>
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">Need attention</p>
                {r.requiresAttention.length ? <ul className="divide-y divide-hairline rounded-xl border border-hairline">{r.requiresAttention.map(row)}</ul> : <p className="text-sm text-steel">Every passport has its required fields filled.</p>}
              </div>
              <Breakdown title="Required fields missing, by section" counts={missing} empty="Nothing missing." />
            </Pair>
            <DownloadButton path="/analytics/passports/completeness.csv" params={scope} fileName="passport-completeness.csv" variant="text">Every passport with its completeness (CSV)</DownloadButton>
          </>
        )}
      </Section>
      <Section title="Totals of a field" description="Count, total, average, lowest and highest of a number field across your published passports in the period, for example carbon per tonne." query={fields} testId="analytics-field-totals">
        {fields.data && !fields.data.data.length && <p className="text-sm text-steel">No published passport has a number field yet.</p>}
        {!!fields.data?.data.length && (
          <>
            <DropdownSelect aria-label="Field" value={chosen} onValueChange={setFieldKey} options={fields.data.data.map((f) => ({ value: f.key, label: `${f.label} (${f.passports} passport${f.passports === 1 ? '' : 's'})` }))} className="md:w-96" />
            {t && window && !t.byUnit.length && <p className="text-sm text-steel">No passport with this field was published in the period.</p>}
            {t?.byUnit.map((u) => (
              <div key={u.unitId ?? 'none'} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label="Passports" value={number(u.count)} hint={u.unit ?? 'No unit'} />
                <StatTile label="Total" value={number(u.sum)} />
                <StatTile label="Average" value={number(u.average)} />
                <StatTile label="Lowest" value={number(u.min)} />
                <StatTile label="Highest" value={number(u.max)} />
              </div>
            ))}
            {t && t.byUnit.length > 1 && <p className="text-xs text-steel">The values are in different units, so they are shown apart.</p>}
          </>
        )}
      </Section>
    </>
  );
}
