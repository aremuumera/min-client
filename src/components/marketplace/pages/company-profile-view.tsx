
"use client";

import React from 'react';
import { useGetStoreProfileWebQuery } from '@/redux/features/supplier-profile/supplier_profile_api';
import { CompanyProfileHeroSkeleton, CompanyProfileTabSkeleton } from '@/utils/skeleton/company_profile_skeleton';
import { decodeCompanyNameFromUrl } from '@/utils/url-formatter';
import { useRouter } from 'next/navigation';
import CompanyProfileHero from './company-profile/company-profile-hero';
import CompanyProfileTabs from './company-profile/tabs/company-profile-tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ViewModeProvider } from '@/contexts/view-product-mode';

interface CompanyProfileViewProps {
  slug: string;
}

const CompanyProfileView = ({ slug }: CompanyProfileViewProps) => {
  const router = useRouter();

  // The slug is likely URL encoded. Original code used decodeCompanyNameFromUrl.
  const decodedName = decodeCompanyNameFromUrl(slug);

  const { data, isLoading, isError, error } = useGetStoreProfileWebQuery({
    supplierName: decodedName, // Pass decoded name for API matching
  }, {
    skip: !slug,
    refetchOnMountOrArgChange: true
  });

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto pt-8 px-4">
        <CompanyProfileHeroSkeleton />
        <CompanyProfileTabSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    console.error('CompanyProfileView load error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Company Profile Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The requested supplier store profile could not be loaded.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ViewModeProvider>
      <div className="w-full bg-gray-50 min-h-screen pb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-4">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-green-700 bg-white border border-green-200 px-3 md:px-4 py-2 rounded-xl hover:bg-green-50 transition-colors font-semibold text-sm cursor-pointer"
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
    </ViewModeProvider>
  );
};

export default CompanyProfileView;
