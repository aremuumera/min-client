import React from 'react';

const ProductDetailsSkeleton = () => {
    return (
        <div className="w-full max-w-[1280px] mx-auto px-[10px] mt-[100px] animate-pulse">
            <div className="h-[500px] bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-[200px] bg-gray-100 rounded-lg"></div>
        </div>
    );
};

export default ProductDetailsSkeleton;
