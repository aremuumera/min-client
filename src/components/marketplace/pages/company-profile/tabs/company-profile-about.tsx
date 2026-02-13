
"use client";

import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

const BusinessInfo = ({ data }: { data: any }) => {
  const {
    // company_description,
    business_type,
    // year_experience,
    total_employees,
    selected_payments,
    selected_shippings,
    exportMarket,
    // businessCategory,
    selected_countryName,
    // selected_state,
    year_established,
    certifications,
    CoreValues,
    AnnualRevenue,
    MainProducts
  } = data || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 p-0 md:p-6 bg-white rounded-lg">
      {/* Column 1 */}
      <div>
        <div className="mt-8 md:mt-4 text-lg md:text-xl pb-4 flex items-center gap-2 border-b border-gray-100 mb-4">
            <CheckCircle2 className="text-green-600 w-5 h-5" />
            <h2 className="font-semibold text-gray-800">Company Profile</h2>
        </div>
        
        <div className="space-y-4">
            <div>
                 <span className='text-sm text-gray-500 block mb-1'>Year Established</span>
                 <span className="font-semibold text-gray-800 text-base">{year_established || 'N/A'}</span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
            <div>
                 <span className='text-sm text-gray-500 block mb-1'>Business Type</span>
                 <span className="font-semibold text-gray-800 text-base">{business_type || 'N/A'}</span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Location</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(selected_countryName) ? selected_countryName.join(', ') : (selected_countryName || 'Unavailable')}
                  </span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
            <div>
                 <span className='text-sm text-gray-500 block mb-1'>Certifications</span>
                 <span className="font-semibold text-gray-800 text-base">{certifications || "Unavailable"}</span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
            <div>
                 <span className='text-sm text-gray-500 block mb-1'>Core Values</span>
                 <span className="font-semibold text-gray-800 text-base">{CoreValues || 'N/A'}</span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Total Employees</span>
                 <span className="font-semibold text-gray-800 text-base">{total_employees || 'N/A'}</span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Main Products</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(MainProducts) ? MainProducts.join(', ') :  (MainProducts || 'Unavailable')}
                 </span>
            </div>
        </div>
      </div>

      {/* Column 2 */}
      <div>
         <div className="mt-8 md:mt-4 text-lg md:text-xl pb-4 flex items-center gap-2 border-b border-gray-100 mb-4">
             <CheckCircle2 className="text-green-600 w-5 h-5" />
            <h2 className="font-semibold text-gray-800">Trade Capacity</h2>
        </div>

        <div className="space-y-4">
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Export Market</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(exportMarket) ? exportMarket.join(', ') : (exportMarket || 'Unavailable')}
                </span>
            </div>
             <div className="h-px bg-gray-100 w-full" />
            
            {AnnualRevenue && (
                <>
                <div>
                    <span className='text-sm text-gray-500 block mb-1'>Annual Revenue</span>
                    <span className="font-semibold text-gray-800 text-base">{AnnualRevenue}</span>
                </div>
                 <div className="h-px bg-gray-100 w-full" />
                </>
            )}

            <div>
                 <span className='text-sm text-gray-500 block mb-1'>Location</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(selected_countryName) ? selected_countryName.join(', ') : (selected_countryName || 'Unavailable')}
                 </span>
            </div>
            <div className="h-px bg-gray-100 w-full" />
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Shipping Option</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(selected_shippings) ? selected_shippings.join(', ') : (selected_shippings || 'Unavailable')}
                </span>
            </div>
            <div className="h-px bg-gray-100 w-full" />
             <div>
                 <span className='text-sm text-gray-500 block mb-1'>Terms of Payment</span>
                 <span className="font-semibold text-gray-800 text-base">
                     {Array.isArray(selected_payments) ? selected_payments.join(', ') : (selected_payments || 'Unavailable')}
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};

const CompanyProfileAboutUsTab = ({ products }: { products: any }) => {
  const { company_description } = products || {};

  return (
    <div className="py-6 px-4 md:px-0">
      <div className="mb-10">
        <div className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-800">
           <Send className="w-5 h-5 text-green-600 rotate-[-45deg]" />
           <h2>Company Description</h2>
        </div>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
           {company_description}
        </p>
      </div>
      
      <BusinessInfo data={products} />
      
      {/* Certifications could be visually enhanced here separate from the list if there are images */}
    </div>
  );
};

export default CompanyProfileAboutUsTab;
