'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Table } from '@/components/ui/table';
import { TableBody } from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';
import { TableHeader } from '@/components/ui/table';
import { TableRow } from '@/components/ui/table';
import { TableHead } from '@/components/ui/table';

export interface DataTableProps {
  columns: any[];
  rows: any[];
  hideHead?: boolean;
  hover?: boolean;
  onClick?: (event: React.MouseEvent, row: any) => void;
  onDeselectAll?: (event: React.ChangeEvent) => void;
  onDeselectOne?: (event: React.ChangeEvent, row: any) => void;
  onSelectOne?: (event: React.ChangeEvent, row: any) => void;
  onSelectAll?: (event: React.ChangeEvent) => void;
  selectable?: boolean;
  selected?: Set<string | number>;
  uniqueRowId?: (row: any) => string | number;
  [key: string]: any;
}

export function DataTable({
  columns,
  hideHead,
  hover,
  onClick,
  onDeselectAll,
  onDeselectOne,
  onSelectOne,
  onSelectAll,
  rows = [],
  selectable,
  selected,
  uniqueRowId,
  ...props
}: DataTableProps) {
  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  return (
    <Table {...props}>
      <TableHeader style={{ ...(hideHead && { visibility: 'collapse' }) }}>
        <TableRow>
          {selectable ? (
            <TableCell style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}>
              <Checkbox
                checked={selectedAll}
                indeterminate={selectedSome}
                onChange={(event) => {
                  if (selectedAll) {
                    onDeselectAll?.(event);
                  } else {
                    onSelectAll?.(event);
                  }
                }}
              />
            </TableCell>
          ) : null}
          {columns.map((column) => (
            <TableHead
              key={column.name}
              style={{
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
                ...(column.align && { textAlign: column.align }),
              }}
            >
              {column.hideName ? null : column.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const rowId = row.id ? row.id : uniqueRowId?.(row);
          const rowSelected = rowId ? selected?.has(rowId) : false;

          return (
            <TableRow
              key={rowId ?? index}
              selected={rowSelected}
              {...(onClick && {
                onClick: (event: React.MouseEvent) => {
                  onClick(event, row);
                },
              })}
              style={{ ...(onClick && { cursor: 'pointer' }) }}
            >
              {selectable ? (
                <TableCell>
                  <Checkbox
                    checked={rowId ? rowSelected : false}
                    onChange={(event) => {
                      if (rowSelected) {
                        onDeselectOne?.(event, row);
                      } else {
                        onSelectOne?.(event, row);
                      }
                    }}
                    onClick={(event) => {
                      if (onClick) {
                        event.stopPropagation();
                      }
                    }}
                  />
                </TableCell>
              ) : null}
              {columns.map((column) => (
                <TableCell key={column.name} style={{ ...(column.align && { textAlign: column.align }) }}>
                  {column.formatter ? column.formatter(row, index) : column.field ? row[column.field] : null}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
