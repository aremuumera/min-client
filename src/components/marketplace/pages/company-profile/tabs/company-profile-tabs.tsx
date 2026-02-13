
"use client";

import React, { useState } from 'react';
import CompanyProfileAboutUsTab from './company-profile-about';
import CompanyProfileProductsTab from './company-profile-products';
import CompanyProfileLocationTab from './company-profile-location';
import CompanyProfileReviewTab from './company-profile-reviews';

const CompanyProfileTabs = ({ products }: { products: any }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const tabData = [
    { label: "About", component: <CompanyProfileAboutUsTab products={products} />},
    { label: "Products", component: <CompanyProfileProductsTab products={products} />},
    { label: "Location", component: <CompanyProfileLocationTab products={products} />},
    { label: "Reviews", component: <CompanyProfileReviewTab products={products} />},
  ];

  return (
    <section className="py-8 bg-white w-full">
      <div className="w-full mt-4">
        {/* Tabs Header */}
        <div className="flex justify-center border-b-2 border-gray-100 mb-8 overflow-x-auto">
            <div className="flex gap-8 px-4 w-full md:w-auto min-w-max">
                {tabData.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentTab(index)}
                        className={`pb-3 px-4 text-base font-medium transition-all relative whitespace-nowrap ${
                            currentTab === index 
                            ? 'text-green-700' 
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                        {currentTab === index && (
                            <span className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-green-600 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
           {tabData[currentTab].component}
        </div>
      </div>
    </section>
  );
};

export default CompanyProfileTabs;
