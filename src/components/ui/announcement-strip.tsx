'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/utils/helper';

/*
 * AnnouncementStrip — one thin dark line at the top of a page: a short message, one link and a close (×).
 * Flat (no shadow). Closing hides it for this visit only: it shows again when the page is reloaded
 * (owner, 2026-11-24, for the premium strip).
 */
export interface AnnouncementStripProps {
  title: string;
  message?: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
  'data-testid'?: string;
}

export function AnnouncementStrip({ title, message, actionLabel, actionHref, className, ...rest }: AnnouncementStripProps) {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return (
    <div role="note" data-testid={rest['data-testid']} className={cn('flex flex-wrap items-center gap-3 rounded-xl bg-brand-dark py-2 pl-4 pr-2 text-on-dark', className)}>
      <Sparkles className="size-4 shrink-0 text-brand-green-light" aria-hidden="true" />
      <p className="min-w-[220px] flex-1 text-sm leading-snug">
        <span className="font-medium">{title}</span>
        {message && <span className="text-on-dark-muted"> {message}</span>}
      </p>
      <Link href={actionHref} className="inline-flex min-h-8 items-center rounded-md bg-brand-green-light px-3 text-[13px] font-medium text-brand-dark hover:opacity-90">
        {actionLabel}
      </Link>
      <button type="button" onClick={() => setHidden(true)} aria-label="Hide for now" className="inline-flex size-8 items-center justify-center rounded-md text-on-dark-muted hover:text-on-dark">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
