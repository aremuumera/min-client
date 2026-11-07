'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { DropdownSelect } from './dropdown-select';
import { Pagination } from './pagination';

export interface PaginationBarProps {
  /** The backend's paged-list meta */
  meta?: { currentPage: number; totalPages: number; totalItems: number };
  page: number;
  onPage: (page: number) => void;
  /** Rows per page */
  limit: number;
  /** Changing the size goes back to page 1 (the caller resets its page) */
  onLimit: (limit: number) => void;
  /** Sizes offered; the backend allows at most 100 */
  limitOptions?: readonly number[];
  className?: string;
}

export const PAGE_SIZES = [10, 20, 50, 100] as const;

/**
 * Under a server-paged list: the total, a rows-per-page choice, Previous / Next, and the page numbers
 * (phones show "Page 2 of 5" between Previous and Next instead of the numbers).
 */
export function PaginationBar({ meta, page, onPage, limit, onLimit, limitOptions = PAGE_SIZES, className }: PaginationBarProps) {
  const id = React.useId();
  if (!meta || meta.totalItems === 0) return null;
  const first = (meta.currentPage - 1) * limit + 1;
  const last = Math.min(meta.currentPage * limit, meta.totalItems);
  return (
    <div className={`mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-steel">
        <span>
          {first}–{last} of {meta.totalItems}
        </span>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <DropdownSelect
            id={id}
            aria-label="Rows per page"
            value={String(limit)}
            onValueChange={(v) => onLimit(Number(v))}
            options={limitOptions.map((n) => ({ value: String(n), label: String(n) }))}
            searchable={false}
            className="w-24"
          />
        </div>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
          <Button type="button" variant="outlined" color="secondary" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} startIcon={<ChevronLeft className="h-4 w-4" aria-hidden />} className="h-11 md:h-9">
            Previous
          </Button>
          <span className="text-sm text-steel md:hidden" aria-live="polite">
            Page {page} of {meta.totalPages}
          </span>
          <Pagination count={meta.totalPages} page={page} onChange={onPage} hideArrows className="hidden md:flex" />
          <Button type="button" variant="outlined" color="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={page >= meta.totalPages} endIcon={<ChevronRight className="h-4 w-4" aria-hidden />} className="h-11 md:h-9">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
