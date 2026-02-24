
"use client";

import React from 'react';
import { useGetDetailFfqQuery } from '@/redux/features/buyer-rfq/rfq-api';
import RfqDetailSkeleton from '@/utils/skeleton/rfq_detail_skeleton';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import RfqDetailDescription from './rfq-details/rfq-detail-description';
import RelatedRfqs from './rfq-details/related-rfqs';
import { ViewModeProvider } from '@/contexts/view-product-mode';

const RfqDetailsView = ({ id }: { id: string }) => {
  const router = useRouter();

  const { data, isLoading, isError } = useGetDetailFfqQuery(
    { rfqId: id },
    {
      refetchOnMountOrArgChange: true,
      pollingInterval: 30000,
      skip: !id
    }
  );

  const rfqProduct = data?.data || {};

  if (isLoading) {
    // Temporary skeleton approach
    return (
      <ViewModeProvider>
        <RfqDetailSkeleton />
      </ViewModeProvider>
    );
  }

  if (isError || !rfqProduct || Object.keys(rfqProduct).length === 0) {
    return (
      <div className="text-center py-20 mt-[100px]">
        <h2 className="text-xl font-semibold text-gray-700">RFQ Not Found</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-green-600 font-medium hover:underline"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <ViewModeProvider>
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="max-w-[1280px] mx-auto ">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-green-700 bg-white border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors shadow-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <RfqDetailDescription rfqProduct={rfqProduct} />
          <RelatedRfqs rfqProduct={rfqProduct} />
        </div>
      </div>
    </ViewModeProvider>
  );
};

export default RfqDetailsView;
