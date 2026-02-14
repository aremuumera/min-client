
"use client";

import React, { useEffect, useRef } from 'react';
import { setPage, setFilter } from '@/redux/features/marketplace/marketplace_slice';
import { useGetAllProductQuery } from '@/redux/features/supplier-products/products_api';
import NoProducts from '@/utils/no-products';
import ProductSkeleton from '@/utils/skeleton/product-skeleton';
import { useDispatch, useSelector } from 'react-redux';
import { useViewMode } from '@/contexts/view-product-mode';
import ProductWidgets from '@/components/marketplace/product-widgets/product-widget';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Typography,
  FormControl,
  FormLabel as InputLabel
} from '@/components/ui';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';

const CustomPagination = ({ count, page, onChange }: { count: number, page: number, onChange: (val: number) => void }) => {
  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm">
        Page {page} of {count}
      </span>
      <button
        onClick={() => onChange(Math.min(count, page + 1))}
        disabled={page === count}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

const AllProductsView = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isGridView } = useViewMode();
  // Use 'any' for state for now
  const { limit, page, category, mainCategory, subCategory, filters, search, sort, supplierId, profileId } =
    useSelector((state: any) => state.marketplace);
  const dispatch = useDispatch();
  const params = useParams();

  // Sync URL params to Redux on mount or change
  useEffect(() => {
    if (params?.slug) {
      // Assuming structure: [tag] or [tag, subTag]
      // You might need to map tags to IDs or names if the API expects names/IDs.
      // The original logic seemed to map tags in the Sidebar.
      // But here we need to ensure Redux state matches URL.
      // If the Sidebar Link sets the URL, we need to read it here and update Redux if needed,
      // OR the Sidebar Link updates Redux and we just reflect it?
      // In Next.js App Router, URL is source of truth usually.
      // But `marketplace_api` uses `category`, `mainCategory` from Redux.

      // For now, let's assume SideBar handles navigation and maybe we should update Redux based on params?
      // Or if SideBar just links to URL, we MUST update Redux state from URL here.

      const slug = params.slug as string[];
      if (slug && slug.length > 0) {
        // Logic to map slug to category filter if API requires it.
        // dispatch(setFilter({ filterType: 'category', value: slug[0] })); 
        // Warning: This might loop if not careful.
      }
    }
  }, [params, dispatch]);

  const handleChange = (value: number) => {
    dispatch(setPage(value));

    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { data, isLoading, isError } = useGetAllProductQuery(
    {
      limit,
      page,
      category,
      country: filters?.location,
      mainCategory,
      subCategory,
      search,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      sort,
      supplierId: undefined, // ensure this is correct
      profileId: undefined,
      measure: filters?.measure,
      quantity: filters?.quantity,
      review: filters?.rating,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      // refetchOnError: true, // properties might differ in newer redux toolkit query versions or types
      pollingInterval: 30000,
    }
  );

  const productData = data?.products;
  const productsToShow = productData?.length > 0 ? productData : [];

  return (
    <div ref={scrollRef} className="">
      <div className="mt-[10px]">
        {isLoading ? (
          <ProductSkeleton count={8} />
        ) : productsToShow.length > 0 ? (
          <div
            className={`grid ${isGridView
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6'
              : 'grid-cols-1 gap-4'
              } mt-[20px]`}
          >
            {productsToShow.map((prod: any, i: number) => (
              <div key={i}>
                <ProductWidgets products={prod} />
              </div>
            ))}
          </div>
        ) : (
          <NoProducts image="/assets/no product.png" message="Ooooppppsss!!!!! There are no products at this time" />
        )}
      </div>

      {/* pagination */}
      <div className="flex justify-center my-10">
        {data?.totalPages > 0 && (
          <CustomPagination
            count={data.totalPages}
            page={page}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
};

export default AllProductsView;
