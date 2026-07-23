
"use client";

import React from 'react';
import { Store, ShieldCheck, Globe2, Users, Calendar, Award, CreditCard, Truck, FileText } from 'lucide-react';

const BusinessInfoCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-8 hover:border-gray-200 transition-all duration-200">
    <div className="flex items-center gap-3 pb-5 border-b border-gray-100 mb-6">
      <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className="text-sm font-semibold text-gray-800 text-right">{value || 'N/A'}</span>
  </div>
);

const CompanyProfileAboutUsTab = ({ products }: { products: any }) => {
  const {
    company_description,
    profileDetailDescription,
    business_type,
    total_employees,
    selected_payments,
    selected_shippings,
    exportMarket,
    selected_countryName,
    year_established,
    certifications,
    CoreValues,
    AnnualRevenue,
    MainProducts,
    businessCategory
  } = products || {};

  const formatList = (val: any) => {
    if (!val) return 'N/A';
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'N/A';
    return String(val);
  };

  const hasDetailDescriptions = Array.isArray(profileDetailDescription) && profileDetailDescription.length > 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 sm:px-6 md:px-0">
      {/* Primary Company Description Card */}
      {company_description && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">About the Company</h2>
          </div>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
            {company_description}
          </p>
        </div>
      )}


      {/* 2-Column Business Overview & Trade Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Company Overview */}
        <BusinessInfoCard title="Company Overview" icon={Store}>
          <DetailRow label="Year Established" value={year_established} />
          <DetailRow label="Business Category" value={businessCategory || 'Mineral & Industrial'} />
          <DetailRow label="Business Type" value={business_type} />
          <DetailRow label="Total Employees" value={total_employees} />
          <DetailRow
            label="Location"
            value={Array.isArray(selected_countryName) ? selected_countryName.join(', ') : selected_countryName}
          />
          <DetailRow label="Certifications" value={certifications || 'Verified Supplier'} />
        </BusinessInfoCard>

        {/* Trade & Supply Capacity */}
        <BusinessInfoCard title="Trade & Supply Capacity" icon={ShieldCheck}>
          <DetailRow label="Export Markets" value={formatList(exportMarket)} />
          <DetailRow label="Shipping Terms" value={formatList(selected_shippings)} />
          <DetailRow label="Payment Terms" value={formatList(selected_payments)} />
          {AnnualRevenue && <DetailRow label="Annual Revenue" value={AnnualRevenue} />}
          {MainProducts && <DetailRow label="Main Products" value={formatList(MainProducts)} />}
          {CoreValues && <DetailRow label="Core Values" value={CoreValues} />}
        </BusinessInfoCard>
      </div>


      {/* Custom Detail Description Sections */}
      {hasDetailDescriptions && (
        <div className="space-y-6">
          {profileDetailDescription.map((item: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-700">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.header || 'Company Details'}</h3>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default CompanyProfileAboutUsTab;
