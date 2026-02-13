
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
import NoProducts from '@/utils/no-products';

interface SubCategoriesProductsViewProps {
    mainCategoryId: string;
    mineralCategoryId: string;
    subMineralCategoryId: string;
}

const SubCategoriesProductsView = ({ mainCategoryId, mineralCategoryId, subMineralCategoryId }: SubCategoriesProductsViewProps) => {
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
            category: mineralCategoryId,
            mainCategory: mainCategoryId,
            subCategory: subMineralCategoryId,
            minPrice: filters?.minPrice,
            maxPrice: filters?.maxPrice,
            country: filters?.location,
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

    const mineralsCategoryName = mineralCategoryId || '';

    const currentCategory = real.find((cat) => cat.tag === mainCategoryId);
    const subCategories = currentCategory?.children?.find((c) => c.tag === mineralCategoryId);
    const subCate = subCategories?.children || [];

    const SubCategoryByNam = subCate.find((item) => item.tag === subMineralCategoryId)?.name;
    const SubCategoryByName = data?.products?.length > 0 ? data?.products : [];

    return (
        <div ref={scrollRef}>
            <div className="w-full lg:max-w-[65vw]">
                <div className="p-4 relative h-full">
                    <h2 className="sm:text-2xl text-[1rem] pl-2 pt-2 font-bold mb-4"> All {mineralsCategoryName}</h2>
                    <div>
                        <div className="relative !overflow-x-hidden w-full">
                            <div className="relative px-1 flex flex-row overflow-x-auto scroll-style scrollbar-hide">
                                <div className="flex flex-row gap-6 scroll-smooth">
                                    {subCate?.map((item: any, i: number) => (
                                        <Link
                                            href={paths.marketplace.subSubCategory(mainCategoryId, mineralCategoryId, item.tag!)}
                                            key={i}
                                            className="h-full w-full max-w-[100px] flex-none text-center group"
                                        >
                                            <div
                                                className={`shadow-lg ${subMineralCategoryId === item.tag ? 'bg-primary-50 ring-2 ring-primary-500' : ''} mx-auto border h-24 w-24 p-1 border-gray-200 rounded-full transform transition-transform group-hover:scale-105 relative overflow-hidden`}
                                            >
                                                <img src={item.img} alt={item.name} className="w-full h-full rounded-full object-cover" />
                                            </div>
                                            <p className={`text-sm font-medium mt-4 ${subMineralCategoryId === item.tag ? 'text-primary-600' : ''}`}>{item.name}</p>
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
                    {`All ${SubCategoryByNam || ''}`}{' '}
                    {subCategories?.submenu && mainCategoryId === undefined ? `All ${subCategories?.name}` : ''}{' '}
                </h2>
                {isLoading ? (
                    <ProductSkeleton count={8} />
                ) : SubCategoryByName?.length > 0 ? (
                    <div
                        className={`grid ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'grid-cols-1 gap-4'
                            } mt-[20px]`}
                    >
                        {SubCategoryByName?.map((prod: any, i: number) => (
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
                        {/* <NoProducts /> */}
                    </div>
                )}
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

export default SubCategoriesProductsView;
