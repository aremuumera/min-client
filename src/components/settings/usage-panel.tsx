'use client';

import * as React from 'react';
import { Alert } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useGetMyCompanyControlsQuery } from '@/redux/features/analytics/analytics_api';

const MB = 1024 * 1024;
const size = (b: number) => (b >= 1024 * MB ? `${Math.round((b / (1024 * MB)) * 10) / 10} GB` : `${Math.round((b / MB) * 10) / 10} MB`);

/** One use against its limit: a flat bar, or "no limit" */
function Meter({ label, used, max, text, testId }: { label: string; used: number; max: number | null; text: (n: number) => string; testId: string }) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const near = max !== null && used >= max * 0.9;
  return (
    <div className="space-y-2 rounded-xl border border-hairline p-4" data-testid={testId}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-sm tabular-nums text-steel">{text(used)} of {max === null ? 'no limit' : text(max)}</p>
      </div>
      {max !== null && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className={near ? 'h-full bg-semantic-warning-text' : 'h-full bg-brand-green'} style={{ width: `${pct}%` }} />
        </div>
      )}
      {near && <p className="text-xs text-semantic-warning-text">{used >= (max ?? 0) ? 'You have reached the limit.' : 'You are close to the limit.'} Contact MINMEG to raise it.</p>}
    </div>
  );
}

/**
 * Decision #135: what the company uses against the limits MINMEG set for it. No limit set means
 * "no limit"; MINMEG sets them, the company only reads them.
 */
export function UsagePanel() {
  const q = useGetMyCompanyControlsQuery();
  const d = q.data?.data;
  if (q.isError) return <Alert severity="error">{toApiError(q.error).message}</Alert>;
  if (!d) return <p className="text-sm text-steel">Loading…</p>;
  return (
    <div className="space-y-4" data-testid="usage">
      <Meter label="Team members" used={d.usage.teamMembers} max={d.limits.maximumUsers} text={(n) => String(n)} testId="usage-team" />
      <Meter label="Document storage" used={d.usage.storageBytes} max={d.limits.maximumStorageBytes} text={size} testId="usage-storage" />
      <p className="text-sm text-steel">{d.limits.maximumFileBytes === null ? 'There is no limit on the size of one file beyond the usual 20 MB.' : `One file can be at most ${size(d.limits.maximumFileBytes)}.`}</p>
    </div>
  );
}
