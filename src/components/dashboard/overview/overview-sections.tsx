'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { ActionChip, SectionCard, SegmentProgress } from '@/components/ui';
import { cn } from '@/utils/helper';
import { BUYER_PRODUCT_STEPPER, SUPPLIER_PRODUCT_STEPPER, getRoleStepNumber } from '@/config/trade-stepper-config';
import { SETUP_LABELS, STAGE_SHADES, WAITING, WHOSE_TURN, tradeRoomHref, waitingText, type Overview, type OverviewSide, type RecentTrade, type WaitingItem } from '@/lib/overview';
import { paths } from '@/config/paths';

/*
 * The parts of the merchants overview (decisions #147 to #150). Flat cards with hairline borders,
 * no shadows; red and amber only for problems.
 */

/** The owner's set-up: one chip once done, a link to the next step while not */
export function SetupChip({ setup }: { setup: Overview['setup'] }) {
  if (!setup) return null;
  const done = setup.steps.filter((s) => s.done).length;
  const next = setup.steps.find((s) => !s.done);
  if (!next)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-soft px-3 py-1 text-[13px] font-medium text-primary-pressed">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Account set up
      </span>
    );
  return (
    <Link href={SETUP_LABELS[next.key].href} className="inline-flex items-center gap-1.5 rounded-full bg-semantic-warning-bg px-3 py-1 text-[13px] font-medium text-semantic-warning-text">
      Finish setting up · {done} of {setup.steps.length} done · next: {SETUP_LABELS[next.key].label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

/** A declined or pending role upgrade (kept from the old Profile Health card) */
export function RoleUpgradeNotice({ setup }: { setup: Overview['setup'] }) {
  const upgrade = setup?.roleUpgrade;
  if (!upgrade?.status || !['requested', 'rejected'].includes(upgrade.status)) return null;
  const declined = upgrade.status === 'rejected';
  return (
    <p role="status" className={cn('rounded-lg px-4 py-3 text-[13px]', declined ? 'bg-semantic-error-bg text-semantic-error-text' : 'bg-semantic-warning-bg text-semantic-warning-text')}>
      {declined ? `Your role upgrade request was declined. ${upgrade.reason ? `Reason: ${upgrade.reason}` : 'Please review the requirements and update your details.'}` : 'Your request to add the other role is being reviewed by MINMEG.'}
    </p>
  );
}

/** Waiting for you: one chip per item that has something (count above 0) */
export function WaitingForYou({ items, isLoading }: { items: WaitingItem[]; isLoading: boolean }) {
  const open = items.filter((i) => i.count > 0);
  return (
    <section aria-labelledby="waiting-h" className="flex flex-wrap items-center gap-2.5 rounded-xl border border-hairline bg-canvas px-5 py-4" data-testid="overview-waiting">
      <h2 id="waiting-h" className="mr-2 text-[15px] font-medium text-ink">
        Waiting for you
      </h2>
      {isLoading ? (
        <span className="text-[13px] text-steel">Checking…</span>
      ) : open.length ? (
        open.map((i) => <ActionChip key={i.key} href={WAITING[i.key].href} icon={WAITING[i.key].icon} tone={WAITING[i.key].tone} label={waitingText(i)} title={i.examples.join(' · ') || undefined} />)
      ) : (
        <span className="text-[13px] text-steel">Nothing is waiting for you.</span>
      )}
    </section>
  );
}

/** Where the trades are: a bar of the configured stages (decision #148), selling and buying apart for a company that does both */
export function TradeStages({ stages, both }: { stages: Overview['stages']; both: boolean }) {
  const sides = (['selling', 'buying'] as OverviewSide[]).filter((s) => stages[s]);
  if (!sides.length) return null;
  const rows = stages[sides[0]]!.inProgress;
  const count = (side: OverviewSide, order: number) => stages[side]?.inProgress.find((s) => s.order === order)?.count ?? 0;
  const examples = (order: number) => sides.flatMap((s) => stages[s]!.inProgress.find((x) => x.order === order)?.examples ?? []).slice(0, 2).join(' · ');
  const inProgress = (side: OverviewSide) => stages[side]!.inProgress.reduce((n, s) => n + s.count, 0);
  const summary = sides.map((s) => `${both ? (s === 'selling' ? 'Selling: ' : 'Buying: ') : ''}${inProgress(s)} in progress, ${stages[s]!.completedInWindow} completed`).join('. ');
  const most = Math.max(1, ...sides.map(inProgress));
  return (
    <SectionCard title="Where your trades are" actionHref={paths.dashboard.chat.base} actionLabel="All trades" className="flex-[999_1_560px]" data-testid="overview-stages">
      <p className="-mt-2 mb-4 text-[13px] text-steel">{summary} in the period.</p>
      <div aria-hidden="true" className="mb-2 grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        {sides.map((side) => (
          <React.Fragment key={side}>
            <span className="text-xs font-medium text-slate">{both ? (side === 'selling' ? 'Selling' : 'Buying') : 'Trades'}</span>
            <div className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-surface-soft" style={{ width: `${(inProgress(side) / most) * 100}%`, minWidth: inProgress(side) ? 12 : 0 }}>
              {rows.map((r, i) => (count(side, r.order) ? <span key={r.order} style={{ flex: count(side, r.order), background: STAGE_SHADES[i % STAGE_SHADES.length] }} /> : null))}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="text-xs text-steel">
              <th className="w-5 py-2 font-medium" aria-label="Colour" />
              <th className="py-2 font-medium">Stage</th>
              {sides.map((s) => (
                <th key={s} className="w-16 py-2 text-right font-medium">
                  {both ? (s === 'selling' ? 'Selling' : 'Buying') : 'Trades'}
                </th>
              ))}
              <th className="py-2 pl-4 font-medium">Examples</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.order} className="border-t border-hairline-soft">
                <td className="py-3">
                  <span className="block size-3 rounded-sm" style={{ background: STAGE_SHADES[i % STAGE_SHADES.length] }} />
                </td>
                <td className="py-3 text-ink">{r.name}</td>
                {sides.map((s) => (
                  <td key={s} className="py-3 text-right text-base font-medium text-ink">
                    {count(s, r.order)}
                  </td>
                ))}
                <td className="py-3 pl-4 text-[13px] text-steel">{examples(r.order) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/** Trades in progress: product, stage with the trade room's step number, whose turn, updated */
export function RecentTrades({ trades, both }: { trades: RecentTrade[]; both: boolean }) {
  const [filter, setFilter] = React.useState<'all' | OverviewSide>('all');
  const shown = trades.filter((t) => filter === 'all' || t.side === filter);
  return (
    <SectionCard
      padded={false}
      data-testid="overview-recent"
      title="Trades in progress"
      action={
        <div className="flex flex-wrap items-center gap-3">
          {both && (
            <div role="group" aria-label="Show trades" className="inline-flex gap-[3px] rounded-lg bg-surface-soft p-[3px]">
              {(['all', 'selling', 'buying'] as const).map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn('min-h-9 rounded-md px-3.5 text-[13px] font-medium', filter === f ? 'bg-canvas text-ink' : 'text-slate')}>
                  {f === 'all' ? 'All' : f === 'selling' ? 'Selling' : 'Buying'}
                </button>
              ))}
            </div>
          )}
          <Link href={paths.dashboard.chat.base} className="text-[13px] font-medium text-primary hover:text-primary-pressed">All trades</Link>
        </div>
      }
    >
      <p className="-mt-2 px-5 pb-3 text-[13px] text-steel">Your most recent trades. Open one to go to its trade room.</p>
      {shown.length === 0 ? (
        <p className="border-t border-hairline-soft px-5 py-8 text-center text-sm text-steel">No trades in progress.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[2.1fr_2fr_2.1fr_1.1fr_0.9fr] gap-4 border-y border-hairline-soft bg-surface px-5 py-2.5 text-xs font-medium text-steel">
              <span>Trade</span>
              <span>Stage</span>
              <span>Current step</span>
              <span>Whose turn</span>
              <span>Updated</span>
            </div>
            {shown.map((t) => {
              const steps = t.side === 'selling' ? SUPPLIER_PRODUCT_STEPPER : BUYER_PRODUCT_STEPPER;
              const step = Math.max(1, getRoleStepNumber(steps, t.subStatus.key));
              const turn = t.whoseTurn ? WHOSE_TURN[t.whoseTurn] : null;
              return (
                <Link key={`${t.type}:${t.id}`} href={tradeRoomHref(t)} className="grid grid-cols-[2.1fr_2fr_2.1fr_1.1fr_0.9fr] items-center gap-4 border-b border-hairline-soft px-5 py-4 text-ink hover:bg-surface">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{t.product ?? 'Trade'}</span>
                    <span className="mt-0.5 block text-[13px] text-steel">
                      {[t.quantity && `${Number(t.quantity).toLocaleString()} ${t.unit ?? ''}`.trim(), t.side === 'selling' ? 'Selling' : 'Buying', t.type === 'rfq_offer' ? 'RFQ' : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm">{t.stage.name}</span>
                    <SegmentProgress className="mt-2" step={step} total={steps.length} label={`Step ${step} of ${steps.length}`} />
                  </span>
                  <span className="text-sm leading-snug text-charcoal">{t.subStatus.label}</span>
                  <span>{turn ? <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', turn.className)}>{turn.label}</span> : <span className="text-[13px] text-steel">—</span>}</span>
                  <span className="text-[13px] text-steel">{new Date(t.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
