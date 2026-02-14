import React, { Suspense } from 'react';
import BuyerRfQs from '@/components/dashboard/Buyer/CreateRfq';

export const metadata = {
    title: 'Create RFQ | MINMEG',
    description: 'Create a new RFQ on MINMEG.',
};

export default function CreateRfqPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BuyerRfQs />
        </Suspense>
    );
}
