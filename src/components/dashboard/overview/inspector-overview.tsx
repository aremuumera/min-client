'use client';

import * as React from 'react';
import Link from 'next/link';
import { Briefcase, Calendar, CheckSquare, FileCheck2, FlaskConical, FileText, Inbox, MessagesSquare, ReceiptText, ShieldCheck, Microscope, BadgeCheck, TriangleAlert } from 'lucide-react';
import { ActionChip, DropdownSelect, QuickAction, SectionCard, SegmentProgress, StatTile } from '@/components/ui';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { useSse } from '@/lib/realtime/use-sse';
import { DEFAULT_WINDOW, PRESETS, duration, number, pick, words, windowQuery, type Preset, type WindowChoice } from '@/lib/analytics';
import { INSPECTOR_STAGE_LABELS, NEXT_ACTION_LABELS, STAGE_SHADES, type InspectorJob, type InspectorOverview as Data } from '@/lib/overview';
import { INSPECTOR_STEPPER, getRoleStepNumber } from '@/config/trade-stepper-config';
import { paths } from '@/config/paths';
import { cn } from '@/utils/helper';
import { useGetInspectionAnalyticsQuery } from '@/redux/features/analytics/analytics_api';
import { useGetInspectorAssignmentsQuery, useGetInspectorOverviewQuery } from '@/redux/features/inspector/inspector_api';
import AssignmentDetailsModal from '../inspections/AssignmentDetailsModal';
import { ActivityTimeline } from './activity-timeline';

/*
 * The inspector's overview (decisions #147 to #149; design "Overview per role", Inspector).
 * Jobs instead of trades; this week; report deadlines from the end of the site visit; the company's
 * service limits. Inspectors talk only to MINMEG (rule 12): the chat action opens their MINMEG thread.
 */

const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDue = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const ACTIONS = [
  { href: paths.dashboard.inspections.list, icon: Briefcase, label: 'Inspections hub' },
  { href: `${paths.dashboard.inspections.list}/calendar`, icon: Calendar, label: 'Calendar' },
  { href: paths.dashboard.inspections.services.matrix, icon: CheckSquare, label: 'Capability matrix' },
  { href: paths.dashboard.inspections.services.pricing, icon: ReceiptText, label: 'Pricing and add-ons' },
  { href: paths.dashboard.inspections.services.limits, icon: ShieldCheck, label: 'Operational limits' },
  { href: paths.dashboard.chat.base, icon: MessagesSquare, label: 'Chat with MINMEG' },
];

function JobsTable({ jobs, onRespond }: { jobs: InspectorJob[]; onRespond: (id: string) => void }) {
  return (
    <SectionCard padded={false} title="Jobs in progress" actionHref={paths.dashboard.inspections.list} actionLabel="All jobs" data-testid="inspector-jobs">
      <p className="-mt-2 px-5 pb-3 text-[13px] text-steel">Invitations and running jobs. Open one to go to its workbench.</p>
      {jobs.length === 0 ? (
        <p className="border-t border-hairline-soft px-5 py-8 text-center text-sm text-steel">No jobs right now.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[2.1fr_1.9fr_1.2fr_1.3fr_2fr] gap-4 border-y border-hairline-soft bg-surface px-5 py-2.5 text-xs font-medium text-steel">
              <span>Job</span>
              <span>Step</span>
              <span>Scheduled</span>
              <span>Place</span>
              <span>Next step</span>
            </div>
            {jobs.map((j) => {
              const step = Math.max(1, getRoleStepNumber(INSPECTOR_STEPPER, j.status));
              const row = (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{j.product}</span>
                    <span className="mt-0.5 block text-[13px] text-steel">{[j.quantity && `${Number(j.quantity).toLocaleString()} ${j.unit ?? ''}`.trim(), j.itemType === 'rfq' ? 'RFQ' : 'Product inquiry'].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm">{INSPECTOR_STAGE_LABELS[j.status]}</span>
                    <SegmentProgress className="mt-2" step={step} total={INSPECTOR_STEPPER.length} label={`Step ${step} of ${INSPECTOR_STEPPER.length}`} />
                  </span>
                  <span className="text-[13px] text-charcoal">{j.scheduledDate ? `${fmtDay(j.scheduledDate)}${j.scheduledTime ? `, ${j.scheduledTime.slice(0, 5)}` : ''}` : 'Not set yet'}</span>
                  <span className="truncate text-[13px] text-charcoal">{j.place ?? '—'}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-primary-pressed">{j.nextAction ? NEXT_ACTION_LABELS[j.nextAction] : '—'}</span>
                    {j.reportDueAt && (
                      <span className="mt-0.5 block text-xs text-steel">
                        Report {j.reportDueExpected ? 'expected by' : 'due'} {fmtDue(j.reportDueAt)}
                      </span>
                    )}
                  </span>
                </>
              );
              const cls = 'grid grid-cols-[2.1fr_1.9fr_1.2fr_1.3fr_2fr] items-center gap-4 border-b border-hairline-soft px-5 py-4 text-left text-ink hover:bg-surface';
              // an invitation is answered in the same window as before; a running job opens its workbench
              return j.status === 'ASSIGNED' ? (
                <button key={j.id} type="button" onClick={() => onRespond(j.id)} className={cn(cls, 'w-full')} aria-label={`Review and respond: ${j.product}`}>
                  {row}
                </button>
              ) : (
                <Link key={j.id} href={paths.dashboard.inspections.workbench(j.id)} className={cls}>
                  {row}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function JobStages({ data }: { data: Data }) {
  const rows = data.stages;
  const all = rows.reduce((n, r) => n + r.count, 0);
  return (
    <SectionCard title="Where your jobs are" actionHref={paths.dashboard.inspections.list} actionLabel="Inspections hub" className="flex-[999_1_560px]" data-testid="inspector-stages">
      <p className="-mt-2 mb-4 text-[13px] text-steel">
        {data.counts.invitations} {data.counts.invitations === 1 ? 'invitation' : 'invitations'}, {data.counts.running} running, {data.counts.completedInWindow} completed in the period.
      </p>
      <div aria-hidden="true" className="mb-2 flex h-3 gap-[3px] overflow-hidden rounded-full bg-surface-soft">
        {all > 0 && rows.map((r, i) => (r.count ? <span key={r.status} style={{ flex: r.count, background: STAGE_SHADES[i % STAGE_SHADES.length] }} /> : null))}
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.status} className="grid grid-cols-[14px_minmax(0,1fr)_48px] items-center gap-3 border-t border-hairline-soft py-3">
            <span className="size-3 rounded-sm" style={{ background: STAGE_SHADES[i % STAGE_SHADES.length] }} />
            <span className="text-sm text-ink">{INSPECTOR_STAGE_LABELS[r.status]}</span>
            <span className="text-right text-base font-medium text-ink">{r.count}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function ThisWeek({ week }: { week: Data['week'] }) {
  const KIND = { site_visit: { label: 'Site visit', cls: 'bg-brand-green-soft text-primary-pressed' }, report_due: { label: 'Report due', cls: 'bg-semantic-warning-bg text-semantic-warning-text' }, unavailable: { label: 'Unavailable', cls: 'bg-surface-soft text-slate' } } as const;
  return (
    <SectionCard title="This week" actionHref={`${paths.dashboard.inspections.list}/calendar`} actionLabel="Open calendar" className="flex-[1_1_320px]" data-testid="inspector-week">
      {week.length === 0 ? (
        <p className="text-sm text-steel">Nothing planned in the next seven days.</p>
      ) : (
        <ul>
          {week.map((w, i) => (
            <li key={`${w.kind}:${w.assignmentId ?? i}:${w.date}`} className="flex gap-3 border-t border-hairline-soft py-3 first:border-t-0">
              <span className="w-14 shrink-0 rounded-lg border border-hairline py-1.5 text-center">
                <span className="block text-[11px] font-medium text-steel">{new Date(`${w.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</span>
                <span className="block text-lg font-medium text-ink">{Number(w.date.slice(8, 10))}</span>
              </span>
              <span className="min-w-0">
                <span className={cn('inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium', KIND[w.kind].cls)}>{KIND[w.kind].label}</span>
                <span className="mt-1 block text-sm font-medium leading-snug text-ink">{w.kind === 'unavailable' ? 'You marked this day as unavailable' : `${w.product ?? 'Job'}${w.time ? `, ${w.time.slice(0, 5)}` : ''}`}</span>
                {w.place && <span className="mt-0.5 block text-xs text-steel">{w.place}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function InspectorOverview() {
  const { user } = useAuthIdentity();
  const [choice, setChoice] = React.useState<WindowChoice>(DEFAULT_WINDOW);
  const q = React.useMemo(() => windowQuery(choice) ?? {}, [choice]);
  const today = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const overview = useGetInspectorOverviewQuery({ from: q.from, to: q.to, today, limit: 6 });
  const analytics = useGetInspectionAnalyticsQuery(q).data?.data;
  const assignments = useGetInspectorAssignmentsQuery();
  const [responding, setResponding] = React.useState<string | null>(null);
  useSse('/notifications/stream', (e) => {
    if (e.event === 'notification') overview.refetch();
  });
  const data = overview.data?.data;
  const c = data?.counts;
  const s = data?.services;
  const available = (s?.availability ?? '').toUpperCase() === 'AVAILABLE';
  const respondTo = (assignments.data?.data ?? []).find((a: { id: string }) => String(a.id) === responding) ?? null;

  const waiting = c
    ? [
        { n: c.invitations, one: 'invitation to answer', many: 'invitations to answer', icon: Inbox, tone: 'primary' as const },
        { n: c.documentsToSign, one: 'assignment brief to sign', many: 'assignment briefs to sign', icon: FileCheck2, tone: 'primary' as const },
        { n: c.labResultsToRecord, one: 'lab result to record', many: 'lab results to record', icon: FlaskConical, tone: 'neutral' as const },
        { n: c.reportsToWrite, one: 'report to write', many: 'reports to write', icon: FileText, tone: 'warning' as const },
      ].filter((w) => w.n > 0)
    : [];

  return (
    <div className="space-y-6 pb-10" data-testid="inspector-overview">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-[34px]">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="mt-1.5 text-base text-slate">Your inspection work on MINMEG.</p>
          {s && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', available ? 'bg-brand-green-soft text-primary-pressed' : 'bg-surface-soft text-slate')}>
                <span className={cn('size-2 rounded-full', available ? 'bg-primary' : 'bg-stone')} />
                {s.availability ? (available ? 'Available for new jobs' : words(s.availability)) : 'Availability not set'}
              </span>
              <Link href={paths.dashboard.inspections.services.limits} className="px-1 text-[13px] font-medium text-primary hover:text-primary-pressed">
                Change availability
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownSelect aria-label="Period" value={choice.preset} onValueChange={(v) => setChoice({ ...DEFAULT_WINDOW, preset: v as Preset })} options={PRESETS.filter((p) => p.value !== 'custom')} className="w-44" />
          <Link href={paths.dashboard.inspections.analytics} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-deep">
            Open analytics
          </Link>
        </div>
      </section>

      <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {ACTIONS.map((a) => (
          <QuickAction key={a.label} href={a.href} icon={a.icon} label={a.label} />
        ))}
      </nav>

      <section aria-label="Key numbers for the period" className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6" data-testid="inspector-numbers">
        <StatTile className="rounded-xl" label="New invitations" value={number(c?.invitations)} hint="Accept or decline" />
        <StatTile className="rounded-xl" label="Jobs running" value={number(c?.running)} hint={s?.maxConcurrent ? `Out of ${s.maxConcurrent} you allow at once` : 'No limit set'} />
        <StatTile className="rounded-xl" label="Site visits this week" value={number(c?.siteVisitsThisWeek)} hint="In the next seven days" />
        <StatTile className="rounded-xl" label="Reports to write" value={number(c?.reportsToWrite)} hint={`Within ${s?.reportSlaHours ?? 48} hours of the visit`} />
        <StatTile className="rounded-xl" label="Completed" value={number(c?.completedInWindow)} hint="In the period" />
        <StatTile className="rounded-xl" label="Time to complete" value={duration(analytics?.assignments.averageHoursToComplete)} hint="On average, invitation to report" />
      </section>

      <section aria-labelledby="inspector-waiting-h" className="flex flex-wrap items-center gap-2.5 rounded-xl border border-hairline bg-canvas px-5 py-4">
        <h2 id="inspector-waiting-h" className="mr-2 text-[15px] font-medium text-ink">
          Waiting for you
        </h2>
        {overview.isLoading ? (
          <span className="text-[13px] text-steel">Checking…</span>
        ) : waiting.length ? (
          waiting.map((w) => <ActionChip key={w.one} href={paths.dashboard.inspections.list} icon={w.icon} tone={w.tone} label={`${w.n} ${w.n === 1 ? w.one : w.many}`} />)
        ) : (
          <span className="text-[13px] text-steel">Nothing is waiting for you.</span>
        )}
      </section>

      {data && (
        <div className="flex flex-wrap items-start gap-6">
          <JobStages data={data} />
          <ThisWeek week={data.week} />
        </div>
      )}

      {data && <JobsTable jobs={data.jobs} onRespond={setResponding} />}

      <div className="flex flex-wrap items-stretch gap-6">
        <div className="min-w-0 flex-[1_1_320px]">
          <ActivityTimeline />
        </div>
        <SectionCard title="Results you recorded" actionHref={paths.dashboard.inspections.analytics} actionLabel="Analytics" className="flex-[1_1_300px]" data-testid="inspector-results">
          {[
            { icon: FlaskConical, label: 'Lab results recorded', value: Object.values(analytics?.results.assayByStatus ?? {}).reduce((n, v) => n + v, 0), cls: 'bg-brand-green-soft text-primary' },
            { icon: BadgeCheck, label: 'Verified by MINMEG', value: pick(analytics?.results.assayByStatus, 'VERIFIED'), cls: 'bg-brand-green-soft text-primary' },
            { icon: TriangleAlert, label: 'Rejected or invalidated after review', value: pick(analytics?.results.assayByStatus, 'REJECTED', 'INVALIDATED'), cls: 'bg-semantic-warning-bg text-semantic-warning-text' },
          ].map((r) => (
            <div key={r.label} className="mt-2.5 flex items-center gap-3 border-t border-hairline-soft pt-3 first:mt-0 first:border-t-0 first:pt-0">
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', r.cls)}>
                <r.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm text-charcoal">{r.label}</span>
              <span className="text-lg font-medium text-ink">{number(r.value)}</span>
            </div>
          ))}
          {!!analytics?.grades.length && (
            <>
              <p className="mb-1.5 mt-4 text-xs font-medium text-steel">Average grade you recorded</p>
              {analytics.grades.slice(0, 3).map((g) => (
                <div key={g.parameter} className="flex justify-between gap-2 py-1.5 text-[13px]">
                  <span className="text-charcoal">{g.parameter}</span>
                  <span>
                    <span className="font-medium text-ink">{g.average}</span>
                    <span className="text-steel"> · {g.results} results</span>
                  </span>
                </div>
              ))}
            </>
          )}
        </SectionCard>
        <SectionCard title="Your services" actionHref={paths.dashboard.inspections.services.limits} actionLabel="Edit" className="flex-[1_1_300px]" data-testid="inspector-services">
          {s?.maxConcurrent ? (
            <div>
              <div className="flex justify-between gap-2 text-[13px]">
                <span className="text-charcoal">Jobs running at once</span>
                <span className="font-medium text-ink">
                  {s.running} of {s.maxConcurrent}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline-soft">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (s.running / s.maxConcurrent) * 100)}%` }} />
              </div>
            </div>
          ) : null}
          {[
            { label: 'Weekly limit', value: s?.maxWeekly ? `${s.maxWeekly} inspections` : 'Not set' },
            { label: 'Lead time', value: s?.leadTimeDays ? `${s.leadTimeDays} days notice` : 'Not set' },
            { label: 'Report deadline', value: `${s?.reportSlaHours ?? 48} hours after the visit` },
            { label: 'Minerals you cover', value: number(s?.mineralsCovered) },
          ].map((r) => (
            <div key={r.label} className="mt-2.5 flex justify-between gap-3 border-t border-hairline-soft pt-3 text-sm">
              <span className="text-charcoal">{r.label}</span>
              <span className="text-right font-medium text-ink">{r.value}</span>
            </div>
          ))}
          <Link href={paths.dashboard.inspections.services.matrix} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-pressed">
            <Microscope className="size-3.5" aria-hidden="true" />
            Capability matrix
          </Link>
        </SectionCard>
      </div>

      <AssignmentDetailsModal isOpen={!!respondTo} onClose={() => setResponding(null)} assignment={respondTo} />
    </div>
  );
}
