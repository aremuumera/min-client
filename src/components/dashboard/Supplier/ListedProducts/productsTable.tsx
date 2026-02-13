'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';

import { Typography } from '@/components/ui/typography';

import ProductTableSet from './ProductTableSet';
import TableSkeleton, { EmptyState } from '@/utils/skeleton/table-skeleton';

export function SupplierProductsTable({ rows = [], 
  isLoading, 
  isError,
  emptyMessage = "No products found",
  errorMessage = "Failed to load products",
 }:{
   isLoading: boolean;
   isError: boolean;
   emptyMessage: string;
   errorMessage: string;
   rows: any[];
 }) {
    
    const columns = [
      { id: "name", label: "Product Name", width: "250px" },
      { id: "category", label: "Category", width: "120px" },
      { id: "quantity", label: "Quantity", width: "120px" },
      { id: "dateCreated", label: "Date Created", width: "150px" },
      // { id: "expirationDate", label: "Expiration Date", width: "150px" },
      // { id: "status", label: "Status", width: "100px" },
      { id: "action", label: "Action", width: "100px" },
    ];

    if (isLoading) {
      return <TableSkeleton columns={columns} />;
    }

    if (isError) {
      // return <EmptyState message={errorMessage} />;
    }
  
    if (rows.length === 0) {
      return <EmptyState message={emptyMessage} />;
    }
  
    return (
      <React.Fragment>
        {rows.length > 0 ? (
          <ProductTableSet columns={columns} rows={rows} />
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center" }}
              variant="body2"
            >
              No products found
            </Typography>
          </Box>
        )}
      </React.Fragment>
    );
  }

