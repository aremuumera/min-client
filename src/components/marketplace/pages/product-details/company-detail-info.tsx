
"use client";

import React, { useState } from 'react';
import { Verified, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { paths } from '@/config/paths';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';

interface CompanyDetailInfoProps {
  products: any;
}

const CompanyDetailInfo = ({ products }: CompanyDetailInfoProps) => {
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    storeProfile,
    images
  } = products || {};

  const validImages = images?.length > 0 ? images : ['/assets/placeholder.png'];

  const handleOpenModal = () => {
    setShowModal(true);
    setCurrentImageIndex(0);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  return (
    <div className="w-full px-2 sm:px-0">
      {/* Main content container */}
      <div className="mt-5 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8 items-start">
        {/* Company logo */}
        <div className="w-full sm:w-auto flex flex-col items-center sm:items-start">
          {storeProfile?.logo && (
            <div className="w-24 sm:w-32 h-auto flex justify-center sm:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storeProfile?.logo}
                alt="Company logo"
                className="max-w-full object-contain max-h-24"
              />
            </div>
          )}
          {storeProfile?.company_name && (
            <div className="flex gap-1 pt-2 items-center">
              <p className="font-medium text-sm sm:text-base">{storeProfile?.company_name}</p>
              <Verified className="text-green-600 w-4 h-4" />
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="w-full sm:flex-1 mt-4 sm:mt-0 px-2 sm:px-0 space-y-2">
          {storeProfile?.year_established && (
            <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-gray-100 pb-2">
              <span className="font-normal text-gray-600 text-xs sm:text-sm">Year Established:</span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm">{storeProfile.year_established}</span>
            </div>
          )}

          {storeProfile?.selected_countryName && (
            <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-gray-100 pb-2">
              <span className="font-normal text-gray-600 text-xs sm:text-sm">Company Location:</span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm">{storeProfile.selected_countryName}</span>
            </div>
          )}

          {storeProfile?.business_type && (
            <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-gray-100 pb-2">
              <span className="font-normal text-gray-600 text-xs sm:text-sm">Business Type:</span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm">{storeProfile.business_type}</span>
            </div>
          )}

          {storeProfile?.Certifications && (
            <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-gray-100 pb-2">
              <span className="font-normal text-gray-600 text-xs sm:text-sm">Certifications:</span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm">{storeProfile?.Certifications}</span>
            </div>
          )}
        </div>

        {/* Image preview */}
        <div className="w-full sm:w-auto flex flex-col items-center sm:items-start mt-4 sm:mt-0">
          <button
            className="flex gap-1 text-gray-600 items-center cursor-pointer hover:text-green-600 transition-colors mb-2"
            onClick={handleOpenModal}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="font-medium text-xs sm:text-sm">View Larger Image</span>
          </button>

          <div
            className="w-28 h-28 sm:w-32 sm:h-32 cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            onClick={handleOpenModal}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={validImages[0]}
              alt="Product preview"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Company Profile button */}
      <div className="w-full sm:w-1/2 md:w-2/5 mt-6 px-2 sm:px-0">
        <Link
          href={paths.marketplace.companyProfile(formatCompanyNameForUrl(storeProfile?.company_name))}
          className="block w-full text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
        >
          Company Profile
        </Link>
      </div>

      {/* Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/90 z-11100 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              className="absolute top-4 right-4 text-white z-20 p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setShowModal(false)}
            >
              <X size={32} />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-20 p-3 hover:bg-white/10 rounded-full transition-colors"
              onClick={prevImage}
            >
              <ChevronLeft size={40} />
            </button>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-20 p-3 hover:bg-white/10 rounded-full transition-colors"
              onClick={nextImage}
            >
              <ChevronRight size={40} />
            </button>

            <div className="max-h-[85vh] max-w-[90vw] relative flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={validImages[currentImageIndex]}
                alt={`Full view ${currentImageIndex + 1}`}
                className="max-h-[80vh] max-w-full object-contain rounded-md shadow-2xl"
              />

              <div className="mt-4 px-4 py-1 bg-black/50 text-white rounded-full text-sm">
                {currentImageIndex + 1} / {validImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                {validImages.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${currentImageIndex === idx ? 'border-green-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetailInfo;
