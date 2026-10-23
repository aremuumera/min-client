'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/helper';
import { Skeleton } from './skeleton';
import { EmptyState, ErrorState } from './states';

/*
 * DataTable — every list in the app (frontend-design-rules.md §3):
 *   tablet / desktop (≥ 768px): a table that scrolls inside its card, first column fixed;
 *   phone: each row becomes a card (the `title` column on top, then the other columns as label / value).
 * Loading, error and empty states are built in. Rows are 44px+ and fully clickable when onRowClick is set.
 */
export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  /** On phones: the card's title, a line under it, a label / value field (default), or hidden */
  mobile?: 'title' | 'subtitle' | 'field' | 'hidden';
  /** e.g. "min-w-[180px]" */
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
  loading?: boolean;
  /** The backend's error message; shows ErrorState */
  error?: React.ReactNode;
  onRetry?: () => void;
  empty?: { title: string; description?: React.ReactNode; action?: React.ReactNode };
  /** Accessible name of the table */
  caption: string;
  className?: string;
}

export function DataTable<T>({ columns, rows, getRowId, onRowClick, selectedId, loading, error, onRetry, empty, caption, className }: DataTableProps<T>) {
  const frame = cn('overflow-hidden rounded-lg border border-hairline bg-canvas', className);

  if (error) return <div className={frame}><ErrorState description={error} onRetry={onRetry} /></div>;

  if (loading && !rows?.length) {
    return (
      <div className={frame} aria-busy="true" aria-label={`Loading ${caption}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-hairline-soft px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="hidden h-4 w-1/4 md:block" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows?.length) return <div className={frame}><EmptyState title={empty?.title ?? 'Nothing here yet'} description={empty?.description} action={empty?.action} /></div>;

  const title = columns.find((c) => c.mobile === 'title') ?? columns[0];
  const subtitle = columns.filter((c) => c.mobile === 'subtitle');
  const fields = columns.filter((c) => c !== title && c.mobile !== 'subtitle' && c.mobile !== 'hidden');
  const activate = (row: T) => (e: React.KeyboardEvent) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={frame}>
      {/* tablet / desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface">
            <tr className="border-b border-hairline">
              {columns.map((c, i) => (
                <th key={c.key} scope="col" className={cn('h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[1px] text-steel', c.align === 'right' ? 'text-right' : 'text-left', i === 0 && 'sticky left-0 z-[1] bg-surface', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              const selected = selectedId === id;
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={activate(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={selected || undefined}
                  className={cn('border-b border-hairline-soft last:border-0', onRowClick && 'cursor-pointer hover:bg-surface focus-visible:bg-surface', selected && 'bg-brand-green-soft hover:bg-brand-green-soft')}
                >
                  {columns.map((c, i) => (
                    <td key={c.key} className={cn('h-12 px-4 py-3 align-middle text-ink', c.align === 'right' && 'text-right tabular-nums', i === 0 && cn('sticky left-0 z-[1]', selected ? 'bg-brand-green-soft' : 'bg-canvas'), c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* phone: cards */}
      <ul className="divide-y divide-hairline-soft md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const id = getRowId(row);
          const Body = (
            <>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="break-words text-sm font-semibold text-ink">{title.cell(row)}</div>
                  {subtitle.map((c) => (
                    <div key={c.key} className="mt-0.5 break-words text-[13px] text-steel">{c.cell(row)}</div>
                  ))}
                </div>
                {onRowClick && <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-stone" aria-hidden />}
              </div>
              {fields.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {fields.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-[1px] text-steel">{c.header}</dt>
                      <dd className="mt-0.5 break-words text-sm text-ink">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          );
          return (
            <li key={id} className={cn(selectedId === id && 'bg-brand-green-soft')}>
              {onRowClick ? (
                <button type="button" onClick={() => onRowClick(row)} className="block min-h-11 w-full px-4 py-3 text-left active:bg-surface">
                  {Body}
                </button>
              ) : (
                <div className="px-4 py-3">{Body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {loading && <div className="border-t border-hairline-soft px-4 py-2 text-[13px] text-steel" aria-live="polite">Refreshing…</div>}
    </div>
  );
}
