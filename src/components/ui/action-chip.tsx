import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helper';

/* ActionChip — a flat link chip for something waiting ("3 inquiries to answer"). Red and amber only for problems. */
export type ActionChipTone = 'primary' | 'warning' | 'error' | 'neutral';

const TONES: Record<ActionChipTone, string> = {
  primary: 'bg-brand-green-soft text-primary-pressed',
  warning: 'bg-semantic-warning-bg text-semantic-warning-text',
  error: 'bg-semantic-error-bg text-semantic-error-text',
  neutral: 'bg-surface-soft text-slate',
};

export interface ActionChipProps {
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: ActionChipTone;
  /** Shown on hover, e.g. the products it is about */
  title?: string;
  className?: string;
}

export function ActionChip({ href, icon: Icon, label, tone = 'neutral', title, className }: ActionChipProps) {
  return (
    <Link href={href} title={title} className={cn('inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-opacity hover:opacity-80', TONES[tone], className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
