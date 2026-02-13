
"use client";

import React, { useRef } from 'react';
import { setPage } from '@/redux/features/marketplace/marketplace_slice';
import { useGetAllProductQuery } from '@/redux/features/supplier-products/products_api';
import ProductSkeleton from '@/utils/skeleton/product-skeleton';
import { Pagination } from '@/components/ui';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useViewMode } from '@/contexts/view-product-mode';
import ProductWidgets from '@/components/marketplace/product-widgets/product-widget';
import { real } from '@/lib/marketplace-data';
import { paths } from '@/config/paths';

interface CategoryProductsViewProps {
    mainCategoryId: string;
}

const CategoryProductsView = ({ mainCategoryId }: CategoryProductsViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { isGridView } = useViewMode();

    const { limit, page, category, subCategory, filters, search, sort } =
        useSelector((state: any) => state.marketplace);
    const dispatch = useDispatch();

    const handleChange = (value: number) => {
        dispatch(setPage(value));

        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const { data, isLoading } = useGetAllProductQuery(
        {
            limit,
            page,
            category,
            country: filters?.location,
            mainCategory: mainCategoryId,
            minPrice: filters?.minPrice,
            maxPrice: filters?.maxPrice,
            subCategory,
            search,
            sort,
            supplierId: undefined,
            profileId: undefined,
            measure: filters?.measure,
            quantity: filters?.quantity,
            review: filters?.rating,
        },
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
            pollingInterval: 30000,
        }
    );

    const currentCategory = real.find((cat) => cat?.tag === mainCategoryId);
    const subCategories = currentCategory?.children || [];

    return (
        <div ref={scrollRef} className="mt-10 sm:mt-0">
            <div className="p-4 relative h-full w-full">
                <div className="flex justify-between items-center">
                    <h2 className="sm:text-2xl text-[1rem] pl-2 pt-2 font-bold mb-4">All {currentCategory?.name}</h2>
                    <h2 className="sm:text-2xl text-[1rem] pl-2 pt-2 font-bold mb-4">
                        {data?.products?.length > 0 ? `(${data?.products?.length})` : ''}
                    </h2>
                </div>

                <div className="relative overflow-x-hidden! w-full h-full">
                    <div className="relative px-1 flex flex-row overflow-x-auto scroll-style scrollbar-hide">
                        <div className="flex flex-row gap-6 scroll-smooth">
                            {subCategories?.map((item: any, i: number) => (
                                <Link
                                    href={paths.marketplace.subCategory(mainCategoryId, item.tag)}
                                    key={item.id || i}
                                    className="h-full w-full sm:max-w-[150px] max-w-[120px] flex-none text-center group"
                                >
                                    <div
                                        className={`shadow-lg mx-auto border h-24 w-24 p-1 border-gray-200 rounded-full transform transition-transform group-hover:scale-105 relative overflow-hidden`}
                                    >
                                        <img src={item.img} alt={item.name} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <p className="text-sm font-medium mt-4">{item.name}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-[10px]">
                <h2 className="text-2xl pl-2 font-bold mb-4">
                    {currentCategory?.submenu && mainCategoryId === undefined ? currentCategory?.name : ''}
                </h2>
                {isLoading ? (
                    <ProductSkeleton count={8} />
                ) : data?.products && data?.products.length > 0 ? (
                    <div
                        className={`grid ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 gap-4'
                            } mt-[20px]`}
                    >
                        {data?.products?.map((prod: any, i: number) => (
                            <div key={i}>
                                <ProductWidgets products={prod} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="relative w-[200px] h-[200px] mb-4">
                            <img src="/assets/no product.png" alt="No products" className="object-contain" />
                        </div>
                        <p className="text-lg font-medium">Ooooppppsss!!!!! There is no products at this time</p>
                    </div>
                )}
            </div>

            {/* pagination */}
            <div className="flex justify-center my-8">
                {data?.totalPages > 0 && (
                    <Pagination
                        count={data?.totalPages}
                        page={page}
                        onChange={handleChange}
                    />
                )}
            </div>
        </div>
    );
};

export default CategoryProductsView;
