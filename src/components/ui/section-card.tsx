import * as React from 'react';
import Link from 'next/link';
import { Card } from './card';
import { cn } from '@/utils/helper';

/* SectionCard — a flat dashboard card (hairline border, no shadow) with a title and an optional link or action on the right. */
export interface SectionCardProps {
  title?: React.ReactNode;
  /** Any control on the right of the title */
  action?: React.ReactNode;
  /** Or a plain link on the right */
  actionHref?: string;
  actionLabel?: string;
  /** false: the body runs edge to edge (tables) */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

export function SectionCard({ title, action, actionHref, actionLabel, padded = true, className, children, ...rest }: SectionCardProps) {
  const right = action ?? (actionHref && actionLabel ? <Link href={actionHref} className="text-[13px] font-medium text-primary hover:text-primary-pressed">{actionLabel}</Link> : null);
  return (
    <Card outlined className={cn('min-w-0 rounded-xl bg-canvas', padded && 'p-5', className)} data-testid={rest['data-testid']}>
      {(title || right) && (
        <div className={cn('flex flex-wrap items-center justify-between gap-2', padded ? 'mb-3' : 'px-5 pb-3 pt-5')}>
          {title && <h2 className="text-base font-medium text-ink">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </Card>
  );
}
