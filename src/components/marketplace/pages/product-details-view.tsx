
"use client";

import React from 'react';
import { useGetAllProductDetailsQuery } from '@/redux/features/supplier-products/products_api';
import NoProducts from '@/utils/no-products';
import ProductDetailsSkeleton from '@/utils/skeleton/product-detail-skeleton';
import { ViewModeProvider } from '@/contexts/view-product-mode';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import DetailImageWidget from './product-details/detail-image-widget';
import CompanyDetailInfo from './product-details/company-detail-info';
import DetailsInfo from './product-details/details-info';
import ProductTabs from './product-details/tabs/product-tabs';
import ProductDetailReview from './product-details/product-detail-review';
import AlsoLikeProduct from './product-details/also-like-product';
import SideBar from '../layout/sidebar'; // Import sidebar if needed or if layout handles it.

interface ProductDetailsViewProps {
  id: string;
}

const ProductDetailsView = ({ id }: ProductDetailsViewProps) => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetAllProductDetailsQuery(
    { productId: id },
    { refetchOnMountOrArgChange: true, skip: !id }
  );

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (isError || !data?.product) {
    return (
      <div className="py-20 px-4">
        <NoProducts />
      </div>
    );
  }

  const prodData = data.product;

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-10 ">
      <div className="mb-6 ">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-green-700 bg-white border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
        {/* Left Column: Images & Company Info (Desktop) */}
        <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col gap-6">
          <DetailImageWidget images={prodData?.images} />
          <div className="hidden lg:block">
            <CompanyDetailInfo products={prodData} />
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="w-full lg:w-[45%] xl:w-[50%]">
          <DetailsInfo products={prodData} />
        </div>

        {/* Mobile Company Info (Below Images/Info on Mobile) */}
        <div className="lg:hidden w-full">
          <CompanyDetailInfo products={prodData} />
        </div>
      </div>

      <div className="pt-8">
        <ProductTabs products={prodData} />
        <ProductDetailReview products={prodData} />
      </div>

      <div className="pt-4 border-t border-gray-100 mt-8">
        <AlsoLikeProduct products={prodData} />
      </div>
    </div>
  );
};

export default ProductDetailsView;
