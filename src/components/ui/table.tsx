import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   TABLE
   ============================================ */

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        />
      </div>
    );
  }
);

Table.displayName = 'Table';

/* ============================================
   TABLE HEADER
   ============================================ */

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-surface [&_tr]:border-b', className)}
        {...props}
      />
    );
  }
);

TableHeader.displayName = 'TableHeader';

/* ============================================
   TABLE BODY
   ============================================ */

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
      />
    );
  }
);

TableBody.displayName = 'TableBody';

/* ============================================
   TABLE FOOTER
   ============================================ */

export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          'border-t border-hairline bg-surface font-medium [&>tr]:last:border-b-0',
          className
        )}
        {...props}
      />
    );
  }
);

TableFooter.displayName = 'TableFooter';

/* ============================================
   TABLE ROW
   ============================================ */

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Whether the row is selected */
  selected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b border-hairline-soft transition-colors',
          'hover:bg-surface',
          selected && 'bg-brand-green-soft',
          className
        )}
        {...props}
      />
    );
  }
);

TableRow.displayName = 'TableRow';

/* ============================================
   TABLE HEAD (th)
   ============================================ */

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[1px] text-steel',
          '[&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      />
    );
  }
);

TableHead.displayName = 'TableHead';

/* ============================================
   TABLE CELL (td)
   ============================================ */

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-3 align-middle text-ink',
          '[&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      />
    );
  }
);

TableCell.displayName = 'TableCell';

/* ============================================
   TABLE CAPTION
   ============================================ */

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-steel', className)}
        {...props}
      />
    );
  }
);

TableCaption.displayName = 'TableCaption';

const TableContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full overflow-auto", className)}
    {...props}
  />
));
TableContainer.displayName = "TableContainer";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableContainer,
};
