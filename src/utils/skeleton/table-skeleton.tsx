import React from 'react';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="body1">
      {message}
    </Typography>
  </Box>
);

const TableSkeleton = ({ columns }: { columns: any[] }) => {
  return (
    <div className="rounded-md border-[#f5f5f5] border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} style={{ width: column.width }}>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} style={{ width: column.width }}>
                  <div className="flex items-center gap-3">
                    {/* Assuming first column might have an image, like in product table */}
                    {colIndex === 0 && <Skeleton className="h-10 w-10 rounded-md shrink-0" />}
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableSkeleton;
