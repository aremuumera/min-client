import React from 'react';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';

export const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="body1">
      {message}
    </Typography>
  </Box>
);

const TableSkeleton = ({ columns }: { columns: any[] }) => {
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', py: 2, borderBottom: '1px solid #e5e5e5' }}>
        {columns.map((column, index) => (
          <Box key={index} sx={{ width: column.width || '150px', px: 2 }}>
            <Skeleton variant="text" className="h-6 w-4/5" />
          </Box>
        ))}
      </Box>
      {[...Array(5)].map((_, rowIndex) => (
        <Box 
          key={rowIndex} 
          sx={{ display: 'flex', py: 2, borderBottom: '1px solid #f3f3f3' }}
        >
          {columns.map((column, colIndex) => (
            <Box key={colIndex} sx={{ width: column.width || '150px', px: 2 }}>
              <Skeleton variant="text" className="h-5 w-[90%]" />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default TableSkeleton;
