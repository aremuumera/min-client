
import * as React from 'react';
import { Box } from '@/components/ui/box';

import { Typography } from '@/components/ui/typography';

import RfqDataTable from './rfqTableSet';
import TableSkeleton, { EmptyState } from '@/utils/skeleton/table-skeleton';

export function RfqProductsTable({
  rows = [],
  isLoading,
  isError,
  emptyMessage = "No rfqs found",
  errorMessage = "Failed to load rfqs",
}: any) {
  const columns = [
    { id: "name", label: "Name", width: "150px" },
    { id: "category", label: "Category", width: "120px" },
    { id: "quantity", label: "Quantity", width: "120px" },
    { id: "purity", label: "Purity", width: "100px" },
    { id: "moisture", label: "Moisture", width: "100px" },
    { id: "dateCreated", label: "Date Created", width: "150px" },
    { id: "status", label: "Status", width: "100px" },
    { id: "action", label: "Action", width: "100px" },
  ];


  if (isLoading) {
    return <TableSkeleton columns={columns} />;
  }

  if (isError) {
    return <EmptyState message={errorMessage} />;
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <React.Fragment>
      {rows.length > 0 ? (
        <RfqDataTable columns={columns} rows={rows} />
      ) : (
        <Box className="p-3">
          <Typography
            variant="body2"
            className="text-gray-500 text-center"
          >
            No products found
          </Typography>
        </Box>
      )}
    </React.Fragment>
  );
}

