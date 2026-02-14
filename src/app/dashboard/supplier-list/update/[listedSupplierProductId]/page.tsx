import React, { Suspense } from 'react';
import EditSupProduct from '@/components/dashboard/Supplier/Edit/EditProducts';

export const metadata = {
    title: 'Update Product | MINMEG',
    description: 'Edit your listed product details on MINMEG.',
};

export default function UpdateProductPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditSupProduct />
        </Suspense>
    );
}
