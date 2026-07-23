
"use client";

import React, { useState } from 'react';
import CompanyProfileAboutUsTab from './company-profile-about';
import CompanyProfileProductsTab from './company-profile-products';
import CompanyProfileLocationTab from './company-profile-location';
import CompanyProfileReviewTab from './company-profile-reviews';
import { Store, Package, MapPin, Star } from 'lucide-react';

const CompanyProfileTabs = ({ products }: { products: any }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const tabData = [
    { label: "About", icon: Store, component: <CompanyProfileAboutUsTab products={products} /> },
    { label: "Products", icon: Package, component: <CompanyProfileProductsTab products={products} /> },
    { label: "Location", icon: MapPin, component: <CompanyProfileLocationTab products={products} /> },
    { label: "Reviews", icon: Star, component: <CompanyProfileReviewTab products={products} /> },
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
                  className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
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

export default CompanyProfileTabs;
