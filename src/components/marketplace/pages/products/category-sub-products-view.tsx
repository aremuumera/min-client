
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

interface CategorySubProductsViewProps {
    mainCategoryId: string;
    mineralCategoryId: string;
}

const CategorySubProductsView = ({ mainCategoryId, mineralCategoryId }: CategorySubProductsViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { isGridView } = useViewMode();
    // Decode in case of URL encoding, though Next.js usually handles it.
    const mineralsCategoryName = mineralCategoryId || '';

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
            category: mineralCategoryId,
            mainCategory: mainCategoryId,
            subCategory,
            country: filters?.location,
            minPrice: filters?.minPrice,
            maxPrice: filters?.maxPrice,
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

    const currentCategory = real.find((cat) => cat.tag === mainCategoryId);
    const subCategories = currentCategory?.children?.find((c) => c.tag === mineralCategoryId);

    const subCate = subCategories?.children || [];
    const CategoryByName = data?.products?.length > 0 ? data?.products : [];

    return (
        <div ref={scrollRef}>
            <div>
                <div className="w-full ">
                    <div className="p-4 relative h-full  ">
                        <div className="flex justify-between items-center">
                            <h2 className="sm:text-2xl text-[1rem] pl-2 pt-2 font-bold mb-4"> All {subCategories?.name || mineralsCategoryName}</h2>
                            <h2 className="sm:text-2xl text-[1rem] pl-2 pt-2 font-bold mb-4">
                                {CategoryByName?.length > 0 ? `(${CategoryByName?.length})` : ''}
                            </h2>
                        </div>
                        <div>
                            <div className="relative !overflow-x-hidden w-full">
                                <div className="relative px-1 flex flex-row overflow-x-auto scroll-style scrollbar-hide">
                                    <div className="flex flex-row gap-6   scroll-smooth">
                                        {subCate?.length > 0 &&
                                            subCate?.map((item: any, i: number) => (
                                                <Link
                                                    href={paths.marketplace.subSubCategory(mainCategoryId, mineralCategoryId, item.tag!)}
                                                    key={i}
                                                    className="h-full w-full max-w-[100px] flex-none text-center group"
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
                    </div>
                </div>
                <div className="mt-[10px]">
                    <h2 className="sm:text-2xl text-[1rem] pl-2 font-bold mb-4">
                        {' '}
                        {subCategories?.submenu && mainCategoryId === undefined ? `All ${subCategories?.name}` : ''}
                    </h2>
                    {isLoading ? (
                        <ProductSkeleton count={8} />
                    ) : CategoryByName?.length > 0 ? (
                        <div
                            className={`grid ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 gap-4'
                                } mt-[20px]`}
                        >
                            {CategoryByName?.map((prod: any, i: number) => (
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
            </div>
            {/* pagination */}
            <div className="flex justify-center my-10">
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

export default CategorySubProductsView;
