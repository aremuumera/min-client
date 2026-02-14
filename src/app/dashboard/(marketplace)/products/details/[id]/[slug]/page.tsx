
import React from 'react';
import ProductDetailsView from '@/components/marketplace/pages/product-details-view';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return <ProductDetailsView id={id} />;
}
