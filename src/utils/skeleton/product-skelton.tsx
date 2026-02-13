import React from 'react';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { Divider } from '@/components/ui/divider';
import { useViewMode } from '@/contexts/viewProductMode';

const ProductSkeleton = ({ count = 4 }) => {
  const { isGridView } = useViewMode();
  
  const SingleSkeleton = () => (
    <div className={`group ${isGridView ? 'flex w-full max-w-[300px] flex-col' : 'flex flex-row w-full justify-around gap-[30px]'} shadow-sm shadow-[#0000002a] mb-[14px] bg-[#fff] pt-[10px] px-[10px] rounded-[15px] pb-[10px] min-h-full`}>
      {/* Image skeleton */}
      <div>
        <Box className={`${isGridView ? 'max-w-[300px] w-full' : 'max-w-[430px] w-full'} relative h-[230px]`}>
          <Skeleton variant="rounded" className="w-full h-full" />
        </Box>
        <Box className="flex justify-center mt-[3px] gap-[10px]">
          {[1, 2, 3].map((_, i) => (
            <Skeleton key={i} variant="circular" className="w-2 h-2" />
          ))}
        </Box>
      </div>

      {/* Description skeleton */}
      <Box className={isGridView ? 'w-full' : 'flex-grow'}>
        <Skeleton variant="text" className="w-4/5 h-4 mb-2" />
        <Box className="pt-2">
          <Skeleton variant="text" className="w-2/5 h-8" />
        </Box>
        <Box className="py-2">
          <Skeleton variant="text" className="w-3/5 h-5" />
        </Box>
        <Box className="py-2">
          <Skeleton variant="text" className="w-[70%] h-5" />
        </Box>
        <Box className="py-2 flex items-center gap-2">
          <Skeleton variant="text" className="w-[30%] h-5" />
          <Divider orientation="vertical" className="bg-neutral-200 w-[1px] h-5" />
          <Skeleton variant="text" className="w-2/5 h-5" />
        </Box>
        <Box className="pt-4 flex gap-2">
          <Skeleton variant="circular" className="w-6 h-6" />
          <Skeleton variant="text" className="w-[53%]" />
        </Box>
      </Box>

      {/* Button skeleton */}
      <Box className={`${isGridView ? 'w-full' : 'max-w-[190px]'} flex flex-col pt-[40px] items-end justify-center gap-[10px] w-full mt-auto`}>
        <Skeleton variant="rectangular" className="w-full h-9 rounded" />
        <Skeleton variant="rectangular" className="w-full h-9 rounded" />
      </Box>
    </div>
  );

  return (
    <div className={`grid ${isGridView ? 'grid-cols-4 product_widvgrid product_widvgrids gap-x-[12px] gap-y-[20px]' : ''} mt-[20px]`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <SingleSkeleton />
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;