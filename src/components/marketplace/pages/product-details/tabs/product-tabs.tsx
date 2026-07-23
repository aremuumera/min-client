
"use client";

import React, { useState } from 'react';
import ProductDetailTab from './product-detail-tab';
import ProductDescriptionTab from './product-description-tab';
import ProductAttachmentTab from './product-attachment-tab';
import ProductLocationTab from './product-location-tab';
import ProductDetailReview from '../product-detail-review';
import { Layers, FileText, Paperclip, MapPin, Star } from 'lucide-react';

const ProductTabs = ({ products }: { products: any }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const tabData = [
    { label: "Product Details", icon: Layers, component: <ProductDetailTab products={products} /> },
    { label: "Description", icon: FileText, component: <ProductDescriptionTab products={products} /> },
    { label: "Attachments", icon: Paperclip, component: <ProductAttachmentTab products={products} /> },
    { label: "Location", icon: MapPin, component: <ProductLocationTab products={products} /> },
    { label: "Reviews", icon: Star, component: <ProductDetailReview products={products} /> },
  ];

  return (
    <section className="py-6 bg-transparent w-full">
      <div className="w-full">
        {/* Modern Segmented Pill Header */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-gray-100/90 backdrop-blur-md rounded-2xl border border-gray-200/80 max-w-full overflow-x-auto no-scrollbar">
            {tabData.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = currentTab === index;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentTab(index)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-green-700 border border-gray-200/80 scale-[1.01]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="transition-all duration-300">
          {tabData.map((tab, index) => (
            <div key={index} className={currentTab === index ? 'block' : 'hidden'}>
              {tab.component}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductTabs;
