'use client';

import * as React from 'react';
import { Check, ChevronDown, ListChecks, X } from 'lucide-react';
import { useGetClientStagesQuery } from '@/redux/features/doc-hub/doc_hub_api';
import { cn } from '@/utils/helper';
import {
  BUYER_PRODUCT_STEPPER,
  SUPPLIER_PRODUCT_STEPPER,
  INSPECTOR_STEPPER,
  getRoleStepNumber,
  formatTradeStatusLabel,
  type RoleStepDefinition,
} from '@/config/trade-stepper-config';

/*
 * The trade's status in the trade room (owner, 2026-11-24: design C, "Trade status bar" page of the design canvas).
 *  - TradeStatusStepper: one line under the room header with the stage, the current step, whose turn it is
 *    and a "Trade status" button.
 *  - TradeStatusPanel: the whole trade as a vertical timeline. Every stage ends in a chevron and opens to its
 *    steps; every step shows its description and who acts next. Phone: full screen over the chat. Tablet: over
 *    the right side of the chat. Wide screens: beside the chat, which narrows.
 * Stages and steps come from GET /trade/inquiry/:id/stages (role labels, visibility, action_by, reached_at).
 */

export interface TradeStatusProps {
  inquiryId: string;
  itemType?: string;
  currentStatus?: string;
  userRole?: 'buyer' | 'supplier' | 'inspector' | string;
}

interface StageStep {
  key: string;
  label: string;
  description?: string;
  is_active?: boolean;
  is_completed?: boolean;
  is_pending?: boolean;
  is_skipped?: boolean;
  /** Who acts next at this step (decision #147) */
  action_by?: string | null;
  /** When the trade last reached this step */
  reached_at?: string | null;
}

interface TradeStage {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  sub_statuses?: StageStep[];
  is_current_stage?: boolean;
  is_completed_stage?: boolean;
  active_sub_status?: StageStep | null;
}

type Side = 'buyer' | 'supplier' | 'inspector';
type Turn = 'you' | 'minmeg' | 'both' | 'transit';
type StepState = 'done' | 'now' | 'next' | 'skipped';

/** Same words and colours as "whose turn" on the overview */
const TURN: Record<Turn, { label: string; className: string }> = {
  you: { label: 'Your turn', className: 'bg-brand-dark text-on-dark' },
  minmeg: { label: 'With MINMEG', className: 'bg-brand-green-soft text-primary-pressed' },
  both: { label: 'Both sides sign', className: 'bg-brand-green-soft text-primary-pressed' },
  transit: { label: 'On the road', className: 'border border-hairline bg-surface text-slate' },
};

const viewerSide = (role?: string): Side => {
  const r = (role || '').toLowerCase();
  return r === 'inspector' ? 'inspector' : r === 'supplier' ? 'supplier' : 'buyer';
};

/** Hub and spoke: anyone other than you (MINMEG, the inspector, the other party) reads as "With MINMEG" */
function turnFor(actionBy: string | null | undefined, side: Side): Turn | null {
  if (!actionBy || actionBy === 'none') return null;
  if (actionBy === 'transit') return 'transit';
  if (actionBy === side) return 'you';
  if (actionBy === 'both') return side === 'inspector' ? 'minmeg' : 'both';
  return 'minmeg';
}

const stepState = (s: StageStep): StepState =>
  s.is_active ? 'now' : s.is_completed ? 'done' : s.is_skipped || (s.is_pending === false && !s.is_completed) ? 'skipped' : 'next';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

interface StepRow {
  key: string;
  label: string;
  descriptions: string[];
  state: StepState;
  actionBy: string | null;
  reachedAt: string | null;
}

/** One line per step; two steps in a row that read the same for this role are shown once */
function rowsOf(steps: StageStep[]): StepRow[] {
  const rows: StepRow[] = [];
  for (const s of steps) {
    const state = stepState(s);
    const last = rows[rows.length - 1];
    if (last && last.label === s.label) {
      if (s.description && !last.descriptions.includes(s.description)) last.descriptions.push(s.description);
      if (state === 'now' || last.state === 'now') last.state = 'now';
      else if (!(state === 'done' && last.state === 'done')) last.state = state === 'skipped' && last.state === 'skipped' ? 'skipped' : 'next';
      if (state === 'now' || !last.actionBy) last.actionBy = s.action_by ?? last.actionBy;
      last.reachedAt = s.reached_at ?? last.reachedAt;
      continue;
    }
    rows.push({ key: s.key, label: s.label, descriptions: s.description ? [s.description] : [], state, actionBy: s.action_by ?? null, reachedAt: s.reached_at ?? null });
  }
  return rows;
}

function useTradeStatus({ inquiryId, currentStatus, userRole }: TradeStatusProps) {
  const { data } = useGetClientStagesQuery({ inquiryId: inquiryId || '' }, { skip: !inquiryId });
  const side = viewerSide(userRole);
  const roleSteps: RoleStepDefinition[] = side === 'inspector' ? INSPECTOR_STEPPER : side === 'supplier' ? SUPPLIER_PRODUCT_STEPPER : BUYER_PRODUCT_STEPPER;
  const activeStepNum = getRoleStepNumber(roleSteps, currentStatus);
  const fetched: TradeStage[] | undefined = data?.data;

  return React.useMemo(() => {
    // One stage per slug (the RFQ stages are copies named "<slug>_rfq")
    const unique = new Map<string, TradeStage>();
    for (const st of Array.isArray(fetched) ? fetched : []) {
      const k = (st.slug || st.name).toLowerCase().replace(/_rfq$/, '').replace(/[^a-z0-9]/g, '');
      if (!unique.has(k)) unique.set(k, st);
    }
    // Before the stages load (or if none come back): the role's own steps from the stepper config
    const stages: TradeStage[] = unique.size
      ? [...unique.values()]
      : roleSteps.map((s) => ({ slug: `step_${s.step}`, name: s.title, description: s.description, sub_statuses: [], is_current_stage: s.step === activeStepNum, is_completed_stage: s.step < activeStepNum }));
    const found = stages.findIndex((s) => s.is_current_stage);
    const activeIndex = found !== -1 ? found : Math.max(0, Math.min(stages.length - 1, activeStepNum - 1));
    const activeStage = stages[activeIndex];
    const activeStep = activeStage?.active_sub_status ?? activeStage?.sub_statuses?.find((s) => s.is_active) ?? null;
    const stepLabel = activeStep?.label || formatTradeStatusLabel(currentStatus) || activeStage?.name || '';
    return { stages, activeIndex, activeStage, activeStep, stepLabel };
  }, [fetched, roleSteps, activeStepNum, currentStatus]);
}

function TurnChip({ turn, className }: { turn: Turn; className?: string }) {
  return <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', TURN[turn].className, className)}>{TURN[turn].label}</span>;
}

/** The line under the room header */
export function TradeStatusStepper({ open, onToggle, ...props }: TradeStatusProps & { open: boolean; onToggle: () => void }) {
  const { stages, activeIndex, activeStage, activeStep, stepLabel } = useTradeStatus(props);
  const turn = activeStep ? turnFor(activeStep.action_by, viewerSide(props.userRole)) : null;

  return (
    <div className="flex flex-none select-none items-center gap-2 border-b border-hairline bg-surface-soft px-3 py-2 sm:px-6">
      <ListChecks className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 truncate text-[13px] font-semibold text-ink">
        Stage {activeIndex + 1} of {stages.length}: {activeStage?.name || 'Trade progress'}
      </p>
      {stepLabel && stepLabel !== activeStage?.name && (
        <span className="hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-brand-green-soft px-2.5 py-0.5 text-xs font-medium text-primary-pressed md:inline-flex">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {stepLabel}
        </span>
      )}
      {turn && <TurnChip turn={turn} className="hidden sm:inline-flex" />}
      <span className="flex-1" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="trade-status-panel"
        className={cn(
          'inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[13px] font-medium transition-colors',
          open ? 'border-primary bg-brand-green-soft text-primary-pressed' : 'border-hairline-strong bg-surface text-ink hover:bg-surface-soft'
        )}
      >
        Trade status
        {open ? <X className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
      </button>
    </div>
  );
}

/** The whole trade as a vertical timeline (opened from "Trade status") */
export function TradeStatusPanel({ onClose, ...props }: TradeStatusProps & { onClose: () => void }) {
  const { stages, activeIndex } = useTradeStatus(props);
  const side = viewerSide(props.userRole);
  // The current stage starts open; a tap on any stage flips it
  const [flipped, setFlipped] = React.useState<Set<string>>(() => new Set());
  const isOpen = (slug: string, idx: number) => flipped.has(slug) !== (idx === activeIndex);
  const flip = (slug: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  const doneStages = stages.filter((s, i) => s.is_completed_stage || i < activeIndex).length;

  return (
    <aside
      id="trade-status-panel"
      aria-label="Trade status"
      className="fixed inset-0 z-50 flex flex-col bg-surface sm:absolute sm:inset-y-0 sm:left-auto sm:right-0 sm:z-20 sm:w-[380px] sm:max-w-full sm:border-l sm:border-hairline xl:static xl:z-auto xl:shrink-0"
    >
      <div className="flex flex-none items-start gap-3 border-b border-hairline px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-ink">Trade status</h2>
          <p className="text-xs text-steel">{doneStages} of {stages.length} stages done</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close trade status"
          className="-my-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-surface-soft hover:text-ink sm:size-8"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <ol className="no-scrollbar flex-1 overflow-y-auto py-3">
        {stages.map((stage, idx) => {
          const done = stage.is_completed_stage || idx < activeIndex;
          const current = !done && idx === activeIndex;
          // In a finished stage, a step the trade never took (another payment route, say) was not used
          const rows = rowsOf(stage.sub_statuses ?? []).map((r) => (done && r.state !== 'done' ? { ...r, state: 'skipped' as const } : r));
          const open = isOpen(stage.slug, idx);
          const last = idx === stages.length - 1;
          const dates = rows.map((r) => r.reachedAt).filter((d): d is string => Boolean(d)).sort();
          const summary = done
            ? dates.length ? `Done · ${shortDate(dates[dates.length - 1])}` : 'Done'
            : current
              ? rows.length ? `${rows.filter((r) => r.state === 'done').length} of ${rows.length} steps done` : 'In progress'
              : rows.length ? `${rows.length} ${rows.length === 1 ? 'step' : 'steps'}` : '';
          const bodyId = `trade-status-stage-${idx}`;

          return (
            <li key={stage.id || stage.slug} className="flex gap-3 px-4">
              <div className="flex w-6 flex-none flex-col items-center">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    done ? 'bg-primary text-on-primary' : current ? 'border-2 border-primary bg-surface text-primary' : 'border border-hairline-strong text-steel'
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : idx + 1}
                </span>
                {!last && <span className={cn('w-0.5 flex-1', done ? 'bg-primary' : 'bg-hairline')} aria-hidden />}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                <button type="button" onClick={() => flip(stage.slug)} aria-expanded={open} aria-controls={bodyId} className="flex w-full items-start gap-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm font-semibold leading-snug', done || current ? 'text-ink' : 'text-slate')}>{stage.name}</span>
                    {summary && <span className="block text-xs text-steel">{summary}</span>}
                  </span>
                  <span
                    className={cn(
                      'inline-flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                      open ? 'border-primary bg-brand-green-soft text-primary-pressed' : 'border-hairline text-slate'
                    )}
                  >
                    <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
                  </span>
                </button>

                {open && (
                  <div id={bodyId} className="mt-2 rounded-xl border border-hairline bg-surface-soft px-3 py-1">
                    {rows.length === 0 ? (
                      <p className="py-2 text-xs text-steel">{stage.description || 'No steps to show for this stage.'}</p>
                    ) : (
                      rows.map((row) => {
                        const turn = row.state === 'now' || row.state === 'next' ? turnFor(row.actionBy, side) : null;
                        return (
                          <div key={row.key} className={cn('flex gap-2 py-2', row.state === 'skipped' && 'opacity-60')}>
                            <span
                              className={cn(
                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                                row.state === 'done' ? 'bg-primary text-on-primary' : row.state === 'now' ? 'border-2 border-primary bg-surface' : 'border border-hairline-strong bg-surface'
                              )}
                              aria-hidden
                            >
                              {row.state === 'done' && <Check className="size-2.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn('block text-[13px] leading-snug', row.state === 'now' ? 'font-semibold text-ink' : row.state === 'done' ? 'text-ink' : 'text-slate')}>
                                {row.label}
                                {row.state === 'skipped' && <span className="text-steel"> (not used)</span>}
                              </span>
                              {row.descriptions.length > 0 && <span className="block text-xs leading-snug text-steel">{row.descriptions.join(', then ')}</span>}
                              {turn && <TurnChip turn={turn} className="mt-1" />}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
