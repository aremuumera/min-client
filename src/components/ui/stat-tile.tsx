import * as React from 'react';
import { cn } from '@/utils/helper';

/* StatTile — one figure on a dashboard (flat card, hairline border). `dark` = the brand-dark highlight card. */
export interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Shown beside the value, e.g. <SparkBars /> */
  trend?: React.ReactNode;
  /** Shown at the bottom of the card, e.g. a "Selling" / "Buying" chip */
  footer?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function StatTile({ label, value, hint, icon, trend, footer, dark, className }: StatTileProps) {
  return (
    <div className={cn('min-w-0 rounded-lg p-4 md:p-5', dark ? 'bg-brand-dark text-on-dark' : 'border border-hairline bg-canvas', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('min-w-0 text-[13px] font-medium', dark ? 'text-on-dark-muted' : 'text-steel')}>{label}</div>
        {icon && <div className={cn('shrink-0', dark ? 'text-brand-green-light' : 'text-primary')}>{icon}</div>}
      </div>
      {trend ? (
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className={cn('break-words text-2xl font-medium', dark ? 'text-on-dark' : 'text-ink')}>{value}</div>
          {trend}
        </div>
      ) : (
        <div className={cn('mt-2 break-words text-2xl font-medium', dark ? 'text-on-dark' : 'text-ink')}>{value}</div>
      )}
      {hint && <div className={cn('mt-1 text-[13px]', dark ? 'text-on-dark-muted' : 'text-steel')}>{hint}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
