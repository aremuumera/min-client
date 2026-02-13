
"use client";

import React, { useState } from 'react';
import ProductDetailTab from './product-detail-tab';
import ProductDescriptionTab from './product-description-tab';
import ProductAttachmentTab from './product-attachment-tab';
import ProductLocationTab from './product-location-tab';

const ProductTabs = ({ products }: { products: any }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const tabData = [
    { label: "Product Details",  component: <ProductDetailTab products={products} />},
    { label: "Description",  component: <ProductDescriptionTab products={products} />},
    { label: "Attachments",  component: <ProductAttachmentTab products={products} />},
    { label: "Location",  component: <ProductLocationTab products={products} />},
  ];

  return (
    <section className="py-8 bg-white w-full">
      <div className="w-full mt-[20px]">
        {/* Tabs Header */}
        <div className="flex justify-center border-b-2 border-gray-100 mb-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 sm:gap-8 px-4 w-full sm:w-auto min-w-max">
                {tabData.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentTab(index)}
                        className={`pb-3 px-2 sm:px-4 text-sm sm:text-base transition-all font-medium relative whitespace-nowrap ${
                            currentTab === index 
                            ? 'text-green-700 font-semibold' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                        {currentTab === index && (
                            <span className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-green-600 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4 min-h-[200px] animate-in fade-in duration-300">
           {tabData[currentTab].component}
        </div>
      </div>
    </section>
  );
};

export default ProductTabs;
