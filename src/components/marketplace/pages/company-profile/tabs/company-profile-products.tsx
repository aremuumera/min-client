
"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { useGetAllProductBySupplierIdQuery } from '@/redux/features/supplier-products/products_api';
import ProductWidgets from '@/components/marketplace/product-widgets/product-widget';
import ProductSkeleton from '@/utils/skeleton/product-skeleton';
import { Search } from 'lucide-react';
// Remove ViewModeProvider import as we might not need separate provider unless we re-implement grid/list toggle here specifically
// Or assume layout provides it or just stick to grid.
// The original code uses `useViewMode`.
// I'll stick to grid for simplicity unless explicitly asked for view toggle in tabs.

const CompanyProfileProductsTab = ({ products }: { products: any }) => {
  const { userId } = products || {};

  const {
    limit, page, category, mainCategory, subCategory,
    search, sort
  } = useSelector((state: any) => state.marketplace);

  const { data: supIdData, isLoading: isSupIdLoading } = useGetAllProductBySupplierIdQuery({
    limit,
    page,
    category,
    mainCategory,
    subCategory,
    search,
    sort,
    supplierId: userId,
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000,
  });

  const productList = supIdData?.products || [];

  return (
    <div className="w-full py-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Our Listed Products
        </h2>
        <div className="relative w-full md:w-auto min-w-[300px]">
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            placeholder="Search for products..."
            type="text"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      <div>
        {isSupIdLoading ? (
          <ProductSkeleton count={8} />
        ) : productList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productList.slice(0, 8).map((prod: any, i: number) => (
              <div key={i}>
                <ProductWidgets products={prod} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/no product.png" alt="No products" className="w-48 mb-4 opacity-50 grayscale" />
            <p className="text-lg font-medium text-gray-500">No products listed at this time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileProductsTab;
