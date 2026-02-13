
"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { useGetAllRfqQuery } from '@/redux/features/buyer-rfq/rfq-api'; // Assuming correct path
import RfqWidget from '@/components/marketplace/pages/rfq-pages/rfq-widget';
import NoProducts from '@/utils/no-products';
// import { AllRfqsSkeleton } from '@/utils/skeleton/rfq_skeleton'; // Need migration of this or reuse generic
import ProductSkeleton from '@/utils/skeleton/product-skeleton'; // Reuse generic

const RelatedRfqs = ({ rfqProduct }: { rfqProduct?: any }) => {
    // The original code passed `rfqProduct` but didn't use it.
    // It used global filters from Redux.

    // We should probably filter by category or similar if possible.
    // But sticking to original implementation:
    const {
        limit, page, category, mainCategory, subCategory,
        search, sort
    } = useSelector((state: any) => state.marketplace);

    const { data, isLoading } = useGetAllRfqQuery({
        limit: 8, // Force limit for related
        page: 1, // Force page 1
        category, // Maybe use category from `rfqProduct` instead of global?
        // original used global.
        mainCategory,
        subCategory,
        search,
        sort,
    }, {
        refetchOnMountOrArgChange: true,
        pollingInterval: 30000,
    });

    const rfqs = data?.data || [];
    const related = rfqs.slice(0, 6);

    return (
        <div className="py-8 mt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Related RFQs</h2>

            {isLoading ? (
                // <AllRfqsSkeleton count={4} />
                /* Reuse ProductSkeleton but adjust grid? Or simple loading */
                <ProductSkeleton count={4} />
            ) : related.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {related.map((item: any) => (
                        <div key={item.id || item._id} className="h-full">
                            <RfqWidget rfqProduct={item} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10">
                    <NoProducts
                        image="/assets/no product.png"
                        message="Oooops! There are no related RFQs at this time"
                        height="h-48"
                    />
                </div>
            )}
        </div>
    );
};

export default RelatedRfqs;
