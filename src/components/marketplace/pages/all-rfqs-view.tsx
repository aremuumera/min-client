
"use client";

import React, { useRef } from 'react';
import { useGetAllRfqQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { setPage } from '@/redux/features/marketplace/marketplace_slice';
import NoProducts from '@/utils/no-products';
import { AllRfqsSkeleton } from '@/utils/skeleton/rfq_skeleton';
import { Pagination } from '@/components/ui';
import { useDispatch, useSelector } from 'react-redux';
// import RfqWidget from './rfqwidgets'; // Need to locate or migrate this
import RfqWidget from '@/components/marketplace/pages/rfq-pages/rfq-widget'; // Assuming this is the correct path based on previous check

interface AllRfqsViewProps {
    mainCategoryId?: string;
    mineralCategoryId?: string;
    subMineralCategoryId?: string;
}

const AllRfqsView = ({ mainCategoryId, mineralCategoryId, subMineralCategoryId }: AllRfqsViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { limit, page, category, mainCategory, subCategory, filters, search, sort } =
        useSelector((state: any) => state.marketplace);

    const dispatch = useDispatch();

    const handleChange = (value: number) => {
        dispatch(setPage(value));

        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const { data, isLoading } = useGetAllRfqQuery(
        {
            limit,
            page,
            category: mineralCategoryId,
            mainCategory: mainCategoryId,
            subCategory: subMineralCategoryId,
            search,
            sort,
            measure: filters?.measure,
            quantity: filters?.quantity,
            status: filters?.rfqsStatus,
        },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
            pollingInterval: 30000,
        }
    );

    return (
        <div ref={scrollRef} className="px-4 py-8">
            <h5 className="font-bold mb-6 text-xl">
                All RFQ
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                    <AllRfqsSkeleton count={8} />
                ) : data?.data?.length > 0 ? (
                    data?.data?.map((item: any) => (
                        <div key={item.id}>
                            <RfqWidget rfqProduct={item} />
                        </div>
                    ))
                ) : (
                    // Show no products message
                    <div className="flex truncate justify-center items-center mx-auto pt-4 col-span-full">
                        <NoProducts image="/assets/no product.png" message="Oopppss!!!!! There is no rfqs at this time" />
                    </div>
                )}
            </div>
            {/* pagination */}
            <div className="flex justify-center my-10">
                {data?.pages > 0 && (
                    <>
                        <Pagination
                            count={data?.pages}
                            page={page}
                            onChange={handleChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AllRfqsView;
