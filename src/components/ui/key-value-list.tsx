import * as React from 'react';
import { cn } from '@/utils/helper';

/*
 * KeyValueList — a record's details. One column on phones; label beside value from tablet up.
 * Long values wrap (ids, codes and names are never cut).
 */
export interface KeyValueItem {
  label: React.ReactNode;
  value: React.ReactNode;
  /** span both columns of the grid */
  wide?: boolean;
}

export function KeyValueList({ items, columns = 1, className }: { items: KeyValueItem[]; columns?: 1 | 2; className?: string }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', columns === 2 && 'md:grid-cols-2', className)}>
      {items.map((item, i) => (
        <div key={i} className={cn('min-w-0', item.wide && columns === 2 && 'md:col-span-2')}>
          <dt className="text-[11px] font-semibold uppercase tracking-[1px] text-steel">{item.label}</dt>
          <dd className="mt-1 break-words text-sm text-ink">{item.value ?? <span className="text-muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
