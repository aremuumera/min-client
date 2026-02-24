import React, { Suspense } from 'react';
import OfferBoardView from '@/components/dashboard/Buyer/offer-board-view';

export const metadata = {
    title: 'Offer Management Board | MINMEG',
    description: 'View and compare supplier offers for your RFQs.',
};

export default function OfferBoardPage() {
    return (
        <Suspense fallback={<div>Loading Offer Board...</div>}>
            <OfferBoardView />
        </Suspense>
    );
}
