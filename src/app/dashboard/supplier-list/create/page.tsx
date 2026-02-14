import React, { Suspense } from 'react';
import SupplierListing from '@/components/dashboard/Supplier/CreateProducts';

export const metadata = {
    title: 'Create Product | MINMEG',
    description: 'Add a new product to your MINMEG store.',
};

export default function CreateProductPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SupplierListing />
        </Suspense>
    );
}
