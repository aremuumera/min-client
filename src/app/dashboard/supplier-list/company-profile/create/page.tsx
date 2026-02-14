import React, { Suspense } from 'react';
import CompanyStoreProfile from '@/components/dashboard/Supplier/SupplierCompanyProfile';

export const metadata = {
    title: 'Store Profile | MINMEG',
    description: 'Manage your company store profile on MINMEG.',
};

export default function StoreProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CompanyStoreProfile />
        </Suspense>
    );
}
