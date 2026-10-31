'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/utils/helper';

/*
 * FilterBar — search plus filters above a list. Phones: the search and a "Filters" button that
 * opens the filters below; tablet up: everything in one wrapping row.
 */
export interface FilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Selects, toggles… */
  children?: React.ReactNode;
  /** Number of filters set (shown on the phone button) */
  activeCount?: number;
  onClear?: () => void;
  className?: string;
}

export function FilterBar({ search, onSearchChange, searchPlaceholder = 'Search', children, activeCount = 0, onClear, className }: FilterBarProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex gap-2">
        {onSearchChange && (
          <label className="relative flex min-w-0 flex-1 items-center md:max-w-sm">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-stone" aria-hidden />
            <input
              type="search"
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-lg border border-hairline-strong bg-surface pl-9 pr-3 text-base text-ink placeholder:text-muted focus:border-primary focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary md:text-sm"
            />
          </label>
        )}
        {children && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-hairline-strong bg-canvas px-4 text-sm font-semibold text-ink md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
        )}
        {children && <div className="hidden flex-1 flex-wrap items-center gap-2 md:flex">{children}</div>}
        {onClear && activeCount > 0 && (
          <button type="button" onClick={onClear} className="hidden h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary-pressed hover:bg-brand-green-soft md:inline-flex">
            <X className="h-4 w-4" aria-hidden /> Clear
          </button>
        )}
      </div>
      {children && open && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-3 md:hidden">
          {children}
          {onClear && activeCount > 0 && (
            <button type="button" onClick={onClear} className="h-11 rounded-full text-sm font-semibold text-primary-pressed">Clear filters</button>
          )}
        </div>
      )}
    </div>
  );
}
