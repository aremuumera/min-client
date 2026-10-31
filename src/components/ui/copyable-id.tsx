'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/utils/helper';

/*
 * CopyableId — shows an id exactly as the backend sends it (never shortened, hyphens kept;
 * AGENTS.md rule 8), wrapping on narrow screens, with a 44px copy button.
 */
export interface CopyableIdProps {
  value: string | null | undefined;
  /** Shown before the id, e.g. "Batch ID" */
  label?: string;
  className?: string;
  /** Monospace (ids, hashes); false for codes like MB-2026-000001 */
  mono?: boolean;
}

export function CopyableId({ value, label, className, mono = true }: CopyableIdProps) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return <span className="text-muted">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available: the value stays selectable */
    }
  };

  return (
    <span className={cn('inline-flex max-w-full items-start gap-1', className)}>
      <span className="min-w-0">
        {label && <span className="mr-1 text-steel">{label}</span>}
        <span className={cn('select-all break-all text-ink', mono && 'font-mono text-[13px]')}>{value}</span>
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : `Copy ${label ?? 'id'}`}
        title={copied ? 'Copied' : 'Copy'}
        className="-my-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-steel hover:bg-surface-soft hover:text-ink md:-my-1.5 md:h-8 md:w-8"
      >
        {copied ? <Check className="h-4 w-4 text-primary" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </span>
  );
}
