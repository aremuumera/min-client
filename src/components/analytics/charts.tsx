'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorState, Skeleton, StatTile } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { fillSeries, number, total, words, type Counts, type Series, type Window } from '@/lib/analytics';

/*
 * The building blocks of the Analytics page (step 2.14, D4): number tiles, a trend over the
 * window, and a breakdown by status. Each chart has a plain table (phones, screen readers). Flat,
 * no shadows; SVG takes colours as values, so the palette's hex codes are used here.
 */
const PRIMARY = '#1e8742';
const HAIRLINE = '#e1e5e8';
const STEEL = '#5c6c7a';

/** One titled block of the page, with its loading and error states */
export function Section({ title, description, query, children, testId }: { title: string; description?: string; query: { isLoading: boolean; isFetching?: boolean; isError: boolean; error?: unknown; refetch: () => void }; children: React.ReactNode; testId?: string }) {
  return (
    <section className="space-y-4 rounded-lg border border-hairline bg-canvas p-4 md:p-5" aria-label={title} data-testid={testId}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-steel">{description}</p>}
      </div>
      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : query.isError ? (
        <ErrorState description={toApiError(query.error).message} onRetry={query.refetch} />
      ) : (
        <div className={query.isFetching ? 'space-y-4 opacity-60 transition-opacity' : 'space-y-4'}>{children}</div>
      )}
    </section>
  );
}

/** A row of number tiles */
export function Tiles({ items }: { items: { label: string; value: React.ReactNode; hint?: React.ReactNode }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => <div key={i.label} data-tile={i.label} className="min-w-0"><StatTile label={i.label} value={i.value} hint={i.hint} className="h-full" /></div>)}
    </div>
  );
}

/** How many per period over the window, with 0 for quiet periods */
export function Trend({ title, series, window }: { title: string; series: Series | undefined; window: Window }) {
  const data = fillSeries(series, window);
  const sum = data.reduce((a, d) => a + d.count, 0);
  return (
    <figure className="space-y-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{title}</span>
        <span className="text-steel">{number(sum)} in this period</span>
      </figcaption>
      <div className="h-48 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={HAIRLINE} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: STEEL }} tickLine={false} axisLine={{ stroke: HAIRLINE }} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: STEEL }} tickLine={false} axisLine={false} width={44} />
            <Tooltip formatter={(v) => [number(Number(v)), title]} labelStyle={{ color: '#0a1f1a' }} contentStyle={{ borderRadius: 8, border: `1px solid ${HAIRLINE}`, boxShadow: 'none' }} />
            <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} fill={PRIMARY} fillOpacity={0.12} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-primary">Show as a table</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="border-b border-hairline text-steel"><th className="py-1 font-medium">Period</th><th className="py-1 text-right font-medium">Count</th></tr></thead>
          <tbody>{data.filter((d) => d.count).map((d) => <tr key={d.period} className="border-b border-hairline"><td className="py-1">{d.label}</td><td className="py-1 text-right">{number(d.count)}</td></tr>)}</tbody>
        </table>
        {!sum && <p className="mt-2 text-steel">Nothing in this period.</p>}
      </details>
    </figure>
  );
}

/** A count per status (or kind), largest first, as bars with their numbers; `labels` names the keys */
export function Breakdown({ title, counts, labels, empty = 'Nothing yet.' }: { title: string; counts: Counts | undefined; labels?: Record<string, string>; empty?: string }) {
  const rows = Object.entries(counts ?? {}).sort((a, b) => b[1] - a[1]);
  const all = total(counts);
  const max = rows[0]?.[1] ?? 0;
  return (
    <figure className="space-y-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{title}</span>
        {!!all && <span className="text-steel">{number(all)} in all</span>}
      </figcaption>
      {!rows.length ? (
        <p className="text-sm text-steel">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([key, n]) => (
            <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
              <span className="truncate text-ink">{labels?.[key] ?? words(key)}</span>
              <span className="text-right font-medium text-ink">{number(n)}</span>
              <span className="col-span-2 h-2 overflow-hidden rounded-full bg-hairline" aria-hidden>
                <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? Math.max(2, (n / max) * 100) : 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

/** Two charts side by side from tablet up */
export function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2">{children}</div>;
}
