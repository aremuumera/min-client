
import React from 'react';
import RfqDetailsView from '@/components/marketplace/pages/rfq-details-view';

export default async function RfqDetailsPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return <RfqDetailsView id={id} />;
}
