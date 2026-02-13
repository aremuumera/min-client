
"use client";

import React from 'react';
import { useViewMode } from '@/contexts/view-product-mode';

const ProductSkeleton = ({ count = 4 }: { count?: number }) => {
  const { isGridView } = useViewMode();
  
  const SingleSkeleton = () => (
    <div className={`group ${isGridView ? 'flex w-full max-w-[300px] flex-col' : 'flex flex-row w-full justify-around gap-[30px]'} shadow-sm shadow-[#0000002a] mb-[14px] bg-[#fff] pt-[10px] px-[10px] rounded-[15px] pb-[10px] min-h-full animate-pulse`}>
      {/* Image skeleton */}
      <div>
        <div className={`${isGridView ? 'max-w-[300px] w-full' : 'max-w-[430px] w-full'} relative h-[230px]`}>
          <div className="w-full h-full bg-gray-200 rounded-[20px]" />
        </div>
        <div className="flex justify-center mt-[3px] gap-[10px]">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Description skeleton */}
      <div className={isGridView ? 'w-full' : 'flex-grow'}>
        <div className="w-[80%] h-6 bg-gray-200 rounded my-1" />
        <div className="pt-2">
          <div className="w-[40%] h-8 bg-gray-200 rounded" />
        </div>
        <div className="py-1">
          <div className="w-[60%] h-5 bg-gray-200 rounded" />
        </div>
        <div className="py-1">
          <div className="w-[70%] h-5 bg-gray-200 rounded" />
        </div>
        <div className="py-1 flex items-center gap-2">
          <div className="w-[30%] h-5 bg-gray-200 rounded" />
          <div className="w-[1px] h-5 bg-gray-200" />
          <div className="w-[40%] h-5 bg-gray-200 rounded" />
        </div>
        <div className="pt-4 flex gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="w-[50%] h-5 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Button skeleton */}
      <div className={`${isGridView ? 'w-full' : 'max-w-[190px]'} flex flex-col pt-[40px] items-end justify-center gap-[10px] w-full mt-auto`}>
        <div className="w-full h-9 bg-gray-200 rounded" />
        {/* <div className="w-full h-9 bg-gray-200 rounded" /> */}
      </div>
    </div>
  );

  return (
    <div className={`grid ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'grid-cols-1 gap-4'} mt-5`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <SingleSkeleton />
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
