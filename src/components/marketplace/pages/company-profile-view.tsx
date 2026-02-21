
"use client";

import React from 'react';
import { useGetStoreProfileWebQuery } from '@/redux/features/supplier-profile/supplier_profile_api';
// import { CompanyProfileHeroSkeleton, CompanyProfileTabSkeleton } from '@/utils/skeleton/company_profile_skeleton'; // Need migration
import ProductSkeleton from '@/utils/skeleton/product-skeleton'; // Using generic skeleton
import { decodeCompanyNameFromUrl } from '@/utils/url-formatter';
import { useRouter } from 'next/navigation';
import CompanyProfileHero from './company-profile/company-profile-hero';
import CompanyProfileTabs from './company-profile/tabs/company-profile-tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { companyUsersData } from '@/components/marketplace/pages/fake-product-data'; // Need to migrate or assume empty/unneeded?
// The original code used `companyUsersData` to match `detailProduct` but then passed `theProduct` (from API) to components.
// `const theProduct = data ? data : {};`
// So it seems `companyUsersData` was for some offline/mock fallback or unused logic (commented out images usage).
// I will ignore `fake-product-data` for now and rely on API.

interface CompanyProfileViewProps {
  slug: string;
}

const CompanyProfileView = ({ slug }: CompanyProfileViewProps) => {
  const router = useRouter();

  // The slug is likely URL encoded. Original code used decodeCompanyNameFromUrl.
  const decodedName = decodeCompanyNameFromUrl(slug);

  const { data, isLoading, isError } = useGetStoreProfileWebQuery({
    supplierName: decodedName, // Pass decoded name for API matching
  }, {
    skip: !slug,
    refetchOnMountOrArgChange: true
  });

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto pt-8 px-4">
        <div className="h-64 bg-gray-200 rounded-lg w-full animate-pulse mb-8"></div>
        <ProductSkeleton count={1} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      // Simple error state
      <div className="fixed inset-0 z-11100 flex items-center justify-center bg-black bg-opacity-75">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Company Not Found</h2>
        <button onClick={() => router.back()} className="text-green-600 hover:underline">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-10 ">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-700 bg-white border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
        <CompanyProfileHero products={data} />
        <div className="mt-8">
          <CompanyProfileTabs products={data} />
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileView;
