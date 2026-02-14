

import React from 'react';
import AllProductsView from '@/components/marketplace/pages/all-products-view';
import CategoryProductsView from '@/components/marketplace/pages/products/category-products-view';
import CategorySubProductsView from '@/components/marketplace/pages/products/category-sub-products-view';
import SubCategoriesProductsView from '@/components/marketplace/pages/products/sub-categories-products-view';

export default async function DashboardProductsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    // Level 0: All Products (/dashboard/products/all-mineral-cp)
    if (!slug || slug.length === 0) {
        return <AllProductsView />;
    }

    // Level 1: Main Category (/dashboard/products/all-mineral-cp/[mainCategory])
    if (slug.length === 1) {
        return <CategoryProductsView mainCategoryId={slug[0]} />;
    }

    // Level 2: Sub Category (/dashboard/products/all-mineral-cp/[mainCategory]/[subCategory])
    if (slug.length === 2) {
        return <CategorySubProductsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} />;
    }

    // Level 3: Sub Sub Category (/dashboard/products/all-mineral-cp/[mainCategory]/[subCategory]/[subSubCategory])
    if (slug.length === 3) {
        return <SubCategoriesProductsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} subMineralCategoryId={slug[2]} />;
    }

    // Fallback if deeper nesting (shouldn't happen with current data structure)
    return <SubCategoriesProductsView mainCategoryId={slug[0]} mineralCategoryId={slug[1]} subMineralCategoryId={slug[2]} />;
}

