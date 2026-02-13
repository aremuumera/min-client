import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   TABLE
   ============================================ */

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> { }

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

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> { }

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn('bg-neutral-50 [&_tr]:border-b', className)}
        {...props}
      />
    );
  }
);

TableHeader.displayName = 'TableHeader';

/* ============================================
   TABLE BODY
   ============================================ */

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> { }

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

export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> { }

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          'border-t bg-neutral-50 font-medium [&>tr]:last:border-b-0',
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
          'border-b border-neutral-200 transition-colors',
          'hover:bg-neutral-50',
          selected && 'bg-primary-50',
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

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> { }

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-semibold text-neutral-700',
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

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> { }

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-3 align-middle text-neutral-900',
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

export interface TableCaptionProps
  extends React.HTMLAttributes<HTMLTableCaptionElement> { }

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-neutral-500', className)}
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
