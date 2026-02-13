import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const RfqDetailSkeleton = () => {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-[10px] mt-[140px] animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default RfqDetailSkeleton;
