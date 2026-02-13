import * as React from 'react';
import { cn } from '@/utils/helper';
import { Button } from './button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Total number of pages */
  count: number;
  /** Current page index */
  page?: number;
  /** Callback when page changes */
  onChange?: (page: number) => void;
  /** Number of boundary pages to show */
  boundaryCount?: number;
  /** Number of sibling pages to show */
  siblingCount?: number;
  /** Color variant */
  color?: 'primary' | 'secondary';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Shape variant */
  shape?: 'circular' | 'rounded';
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      count,
      page = 1,
      onChange,
      boundaryCount = 1,
      siblingCount = 1,
      color = 'primary',
      size = 'md',
      shape = 'circular',
      ...props
    },
    ref
  ) => {
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, i) => start + i);
    };

    const generatePages = () => {
      const startPages = range(1, Math.min(boundaryCount, count));
      const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

      const siblingsStart = Math.max(
        Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
        boundaryCount + 2
      );

      const siblingsEnd = Math.min(
        Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
        endPages.length > 0 ? endPages[0] - 2 : count - 1
      );

      const itemList = [
        ...startPages,
        ...(siblingsStart > boundaryCount + 2
          ? ['ellipsis']
          : boundaryCount + 1 < count - boundaryCount
            ? [boundaryCount + 1]
            : []),
        ...range(siblingsStart, siblingsEnd),
        ...(siblingsEnd < count - boundaryCount - 1
          ? ['ellipsis']
          : count - boundaryCount > boundaryCount
            ? [count - boundaryCount]
            : []),
        ...endPages,
      ];

      return itemList;
    };

    const pages = generatePages();

    return (
      <nav
        ref={ref}
        aria-label="pagination navigation"
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        <Button
          variant="text"
          size={size === 'sm' ? 'sm' : 'md'}
          className={cn('p-1 h-auto min-w-0', shape === 'circular' && 'rounded-full')}
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) => (
          p === 'ellipsis' ? (
            <div key={`ellipsis-${i}`} className="flex items-center justify-center w-8 text-neutral-400">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          ) : (
            <Button
              key={`page-${p}`}
              variant={page === p ? 'contained' : 'text'}
              color={page === p ? color : undefined}
              size={size === 'sm' ? 'sm' : 'md'}
              className={cn(
                'min-w-[32px] p-0 h-8',
                shape === 'circular' && 'rounded-full',
                page !== p && 'text-neutral-700 hover:bg-neutral-100'
              )}
              onClick={() => onChange?.(p as number)}
            >
              {p}
            </Button>
          )
        ))}

        <Button
          variant="text"
          size={size === 'sm' ? 'sm' : 'md'}
          className={cn('p-1 h-auto min-w-0', shape === 'circular' && 'rounded-full')}
          disabled={page >= count}
          onClick={() => onChange?.(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export interface TablePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: any, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  component?: React.ElementType;
}

const TablePagination = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: TablePaginationProps) => {
  const from = page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  return (
    <div className="flex items-center justify-end py-4 px-2 gap-4 text-sm text-neutral-600">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          className="bg-transparent border border-neutral-300 rounded px-1 py-0.5 outline-none focus:border-primary-500"
        >
          {[5, 10, 25, 50].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        {from}-{to} of {count}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="text"
          size="sm"
          className="p-1 h-auto min-w-0"
          disabled={page === 0}
          onClick={(e) => onPageChange(e, page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="text"
          size="sm"
          className="p-1 h-auto min-w-0"
          disabled={to >= count}
          onClick={(e) => onPageChange(e, page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export { Pagination, TablePagination };
