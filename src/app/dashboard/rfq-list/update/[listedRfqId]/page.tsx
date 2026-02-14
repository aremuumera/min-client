import React, { Suspense } from 'react';
import EditRfQs from '@/components/dashboard/Buyer/Edit/RfqEdit';

export const metadata = {
    title: 'Edit RFQ | MINMEG',
    description: 'Edit your listed RFQ on MINMEG.',
};

export default function EditRfqPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditRfQs />
        </Suspense>
    );
}
