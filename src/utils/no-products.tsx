
import React from 'react';
// import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography'; // Replacing with Tailwind

interface NoProductsProps {
  image?: string;
  message?: string;
  height?: string;
}

const NoProducts = ({
  image = '/assets/no product.png', // Ensure this asset exists
  message = 'Ooppsss!!!!! There are no products at this time',
  height = 'h-64',
}: NoProductsProps) => {
  return (
    <div className={`flex flex-col items-center pt-[50px] justify-center ${height}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="No products" className="max-w-[200px] mb-4 object-contain" />
      <p className="text-sm text-gray-500 font-medium text-center">{message}</p>
    </div>
  );
};

export default NoProducts;
