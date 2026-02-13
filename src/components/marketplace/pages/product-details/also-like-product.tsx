
"use client";

import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProductWidgets from '@/components/marketplace/product-widgets/product-widget';
import { useSelector } from 'react-redux';
import { useGetAllProductBySupplierIdQuery } from '@/redux/features/supplier-products/products_api';

const AlsoLikeProduct = ({ products }: { products: any }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { supplierId: sup } = products || {};

    // Assuming we want to use the same filters as the main marketplace or just default?
    // The original code uses `useSelector` to get filters. Maybe this filters the supplier's products too?
    // It seems it applies global filters to the supplier specific query. `limit` etc.
    const { 
        limit, page, category, mainCategory, subCategory,
        search, sort 
    } = useSelector((state: any) => state.marketplace);
    
    // We probably don't want to use global pagination for this "Also Like" section, 
    // but the original code did use `limit` and `page`. 
    // This might be weird if the user is on page 5 of global results, checking a product,
    // and then this query asks for page 5 of THIS supplier.
    // However, I will stick to the original logic for parity, or better, force page 1.
    // For "Also Like", usually we want a few items.
    
    const { data: supIdData } = useGetAllProductBySupplierIdQuery({
        // overriding page to 1 for "Related" strip usually makes sense unless we want full browsing here
        limit: 10, // hardcode limit for a slider
        page: 1,
        // category, // keep category filter? Or show all from supplier?
        // Original code passed all these. I'll just pass supplierId mainly.
        supplierId: sup,
        // search, sort... maybe exclude these to show diverse products from supplier
    }, {
        refetchOnMountOrArgChange: true,
        skip: !sup
    });

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    if (!supIdData?.products || supIdData.products.length === 0) {
        return <div className="p-4"></div>;
    }

    return (
        <div className="relative py-8">
            <h2 className="text-xl font-bold text-left px-4 md:px-0 max-w-[1280px] mx-auto mb-6">
                More Products from this Supplier
            </h2>
            
            <div className="relative max-w-[1280px] mx-auto group">
                 {/* Desktop Navigation Arrows */}
                <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md border text-gray-700 hover:text-green-600 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                >
                    <ArrowLeft size={24} />
                </button>
                
                <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md border text-gray-700 hover:text-green-600 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                >
                    <ArrowRight size={24} />
                </button>

                {/* Scrollable Product List */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar px-4 pb-4"
                    style={{
                        scrollbarWidth: 'none',
                        // msOverflowStyle: 'none'
                    }}
                >
                    {supIdData.products.map((prod: any, i: number) => (
                        <div key={i} className="min-w-[280px] sm:min-w-[300px] flex-shrink-0">
                            <ProductWidgets products={prod} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AlsoLikeProduct;
