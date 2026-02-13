
"use client";

import React from 'react';
import { useGetAllProductDetailsQuery } from '@/redux/features/supplier-products/products_api';
import NoProducts from '@/utils/no-products';
// import ProductDetailsSkeleton from '@/utils/skeleton/product-detail-skeleton'; // Need migration of this
import ProductSkeleton from '@/utils/skeleton/product-skeleton'; // Reuse generic product skeleton for now
import { ViewModeProvider } from '@/contexts/view-product-mode';

import DetailImageWidget from './product-details/detail-image-widget';
import CompanyDetailInfo from './product-details/company-detail-info';
import DetailsInfo from './product-details/details-info';
import ProductTabs from './product-details/tabs/product-tabs';
import ProductDetailReview from './product-details/product-detail-review';
import AlsoLikeProduct from './product-details/also-like-product';
import SideBar from '../layout/sidebar'; // Import sidebar if needed or if layout handles it.
// The layout handles SideBar. But ProductDetails replaces the Listing view.
// In the original code `ProductDetailsMarket` returns a full layout with `TopNav` commented out?
// `ProductDetailsMarket` is rendered inside `MarketPlace` layout which has `SideBar`?
// In `App.js` or `routes`: `/products` has `MarketLayout` which has `Outlet`.
// `AllProduct` is an outlet page. `ProductDetails` is an outlet page.
// The `MarketLayout` has `SideBar` on the left.
// `ProductDetails` has `className="lg:flex-row flex-col lg:flex items-start gap-[30px]"` in original code?
// Wait, `ProductDetailsMarket` code:
// `<div className="w-full px-[10px] mt-[100px] ... max-w-[1280px] ...">`
// It seems `ProductDetails` is a full page width component, possibly NOT showing the sidebar alongside it?
// Let's check `MarketPlace/Layout/MarketPlace.jsx`. 
// If `MarketPlace.jsx` layout *always* shows sidebar, then details will be squeezed.
// But usually details pages are full width or have their own layout.

// However, my `layout.tsx` in `src/app/products/layout.tsx` includes:
// `<div className="flex md:gap-x-[20px] max-w-[1800px]"><div className="..."><SideBar /></div> ... {children} ...`
// So `children` (the page) will be rendered NEXT to the sidebar.
// Does `ProductDetails` want this?
// The original `ProductDetailsMarket` has:
// `<div className="pt-[60px] ... lg:flex-row ... flex ... items-start gap-[30px]">`
// It divides into `DetailImageWidget` (left) and `DetailsInfoMarket` (right).
// This structure fits INSIDE the main content area of `MarketLayout`.
// So it should be fine.

// Note: `ProductDetailsMarket` has `ViewModeProvider` in original.
// My `products/layout.tsx` has `ViewModeProvider`. So I don't need it again here.

interface ProductDetailsViewProps {
  id: string;
}

const ProductDetailsView = ({ id }: ProductDetailsViewProps) => {
  const { data, isLoading, isError } = useGetAllProductDetailsQuery(
    { productId: id },
    { refetchOnMountOrArgChange: true, skip: !id }
  );

  if (isLoading) {
    return <div className="mt-10"><ProductSkeleton count={1} /></div>; // Simple skeleton suitable for details? Not really but works.
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
    <div className="w-full max-w-[1600px] mx-auto pb-10">
      <div className="pt-6 flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
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
