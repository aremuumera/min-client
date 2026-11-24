import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helper';

/* QuickAction — a flat tile that opens a page: icon in a soft green square, then the label. */
export interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function QuickAction({ href, icon: Icon, label, className }: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn('flex min-h-16 items-center gap-3 rounded-lg border border-hairline bg-canvas px-3.5 py-3 text-sm font-medium text-ink transition-colors hover:border-primary', className)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-green-soft text-primary">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate whitespace-nowrap" title={label}>
        {label}
      </span>
    </Link>
  );
}
