import * as React from 'react';
import { cn } from '@/utils/helper';
import type { BadgeTone } from './status-badge';

/*
 * Timeline — a record's history (status history, audit timeline, custody), newest first.
 */
export interface TimelineEntry {
  id: string;
  title: React.ReactNode;
  /** ISO time (shown in the user's local time; full timestamp on hover) */
  at: string;
  description?: React.ReactNode;
  actor?: React.ReactNode;
  tone?: BadgeTone;
}

const DOT: Record<BadgeTone, string> = {
  success: 'bg-primary',
  neutral: 'bg-stone',
  warning: 'bg-semantic-warning',
  error: 'bg-semantic-error',
  dark: 'bg-brand-dark',
};

export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {entries.map((e, i) => {
        const at = new Date(e.at);
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-hairline" aria-hidden />}
            <span className={cn('mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full', DOT[e.tone ?? 'neutral'])} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <div className="break-words text-sm font-medium text-ink">{e.title}</div>
                <time dateTime={e.at} title={at.toISOString()} className="shrink-0 text-[13px] text-steel">
                  {Number.isNaN(at.getTime()) ? e.at : at.toLocaleString()}
                </time>
              </div>
              {e.actor && <div className="text-[13px] text-steel">{e.actor}</div>}
              {e.description && <div className="mt-1 break-words text-sm text-slate">{e.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
