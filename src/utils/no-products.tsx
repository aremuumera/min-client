
import React from 'react';

interface NoProductsProps {
  image?: string;
  message?: string;
  height?: string;
  className?: string;
}

const NoProducts = ({
  image = '/assets/no product.png',
  message = 'Ooooppppsss!!!!! There are no products at this time',
  height = 'py-8 md:py-12',
  className = '',
}: NoProductsProps) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 w-full ${height} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt="No products"
        className="w-24 sm:w-32 md:w-40 max-w-full mb-3 object-contain transition-all"
      />
      <p className="text-xs sm:text-sm md:text-base font-medium text-gray-500 max-w-md leading-relaxed text-center">
        {message}
      </p>
    </div>
  );
};

export default NoProducts;
