

import React from 'react';
import AllRfqsView from '@/components/marketplace/pages/all-rfqs-view';

export default async function DashboardRfqProductsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Level 0: All RFQs (/dashboard/products/rfq-products)
    if (!slug || slug.length === 0) {
        return <AllRfqsView />;
    }

    // Level 1: Main Category (/dashboard/products/rfq-products/[mainCategory])
    if (slug.length === 1) {
        return <AllRfqsView mainCategoryId={slug[0]} />;
    }

    // Level 2: Sub Category (/dashboard/products/rfq-products/[mainCategory]/[subCategory])
    if (slug.length === 2) {
        return <AllRfqsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} />;
    }

    // Level 3: Sub Sub Category (/dashboard/products/rfq-products/[mainCategory]/[subCategory]/[subSubCategory])
    if (slug.length === 3) {
        return <AllRfqsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} subMineralCategoryId={slug[2]} />;
    }

    // Fallback
    return <AllRfqsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} subMineralCategoryId={slug[2]} />;
}

