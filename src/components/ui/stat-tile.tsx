import * as React from 'react';
import { cn } from '@/utils/helper';

/* StatTile — one figure on a dashboard (flat card, hairline border). `dark` = the brand-dark highlight card. */
export interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

export function StatTile({ label, value, hint, icon, dark, className }: StatTileProps) {
  return (
    <div className={cn('min-w-0 rounded-lg p-4 md:p-5', dark ? 'bg-brand-dark text-on-dark' : 'border border-hairline bg-canvas', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('text-[13px] font-medium', dark ? 'text-on-dark-muted' : 'text-steel')}>{label}</div>
        {icon && <div className={cn('shrink-0', dark ? 'text-brand-green-light' : 'text-primary')}>{icon}</div>}
      </div>
      <div className={cn('mt-2 break-words text-2xl font-medium', dark ? 'text-on-dark' : 'text-ink')}>{value}</div>
      {hint && <div className={cn('mt-1 text-[13px]', dark ? 'text-on-dark-muted' : 'text-steel')}>{hint}</div>}
    </div>
  );
}
