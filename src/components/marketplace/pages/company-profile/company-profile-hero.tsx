
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Facebook, Linkedin, Instagram, Phone, Mail, CheckCircle2, MapPin } from 'lucide-react';
import LoginModal from '@/utils/login-modal';
// import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import ProductInquiryModal from '@/components/marketplace/modals/ProductInquiryModal';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';

const CompanyProfileHero = ({ products }: { products: any }) => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const { isAuth, user } = useSelector((state: any) => state.auth);
  const { showAlert } = useAlert();

  const {
    company_name,
    company_description,
    profileDetailDescription,
    business_type,
    selected_countryName,
    year_established,
    revenue,
    userId,
    banner,
    logo,
    supplierProfileId,
    ratingAverage,
    year_experience,
    company_email,
    company_phone,
    company_facebook,
    company_linkedIn,
    company_instagram,
  } = products || {};

  const isOwner = isAuth && user?.id === userId;

  const handleRequestQuote = () => {
    if (isOwner) {
      showAlert(`You are the owner of this company profile.`, 'warning');
      return;
    }

    if (isAuth) {
      setShowQuoteModal(true);
    } else {
      setShowLoginModalForSave(true);
    }
  };

  const countryDisplay = Array.isArray(selected_countryName) ? selected_countryName.join(', ') : selected_countryName;
  const heroDescription =
    company_description ||
    (Array.isArray(profileDetailDescription) && profileDetailDescription.length > 0
      ? `${profileDetailDescription[0]?.header ? `${profileDetailDescription[0].header}: ` : ''}${profileDetailDescription[0]?.description}`
      : null);

  return (
    <div className="w-full">
      {/* Banner Image */}
      <div className="relative w-full max-w-[1280px] mx-auto md:mt-4">
        <div className="w-full h-36 sm:h-48 md:h-60 lg:h-72 rounded-xl overflow-hidden bg-gray-900">
          {banner ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={banner} alt={`${company_name} banner`} className="w-full h-full object-cover opacity-85" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-green-800 to-gray-900" />
          )}
        </div>

        {/* Company Logo */}
        <div className="absolute left-4 sm:left-8 md:left-12 bottom-0 transform translate-y-1/2 p-1.5 bg-white rounded-2xl border border-gray-200 z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo || '/placeholder-logo.png'}
            alt={`${company_name} logo`}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl object-cover bg-white"
          />
        </div>
      </div>

      {/* Company Information Container */}
      <div className="w-full mt-12 sm:mt-14 md:mt-16 lg:mt-20 px-4 sm:px-8 md:px-12 max-w-[1350px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-10 border-b border-gray-100 pb-8">
          {/* Company Name, Tagline & Description */}
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">{company_name}</h1>
              <CheckCircle2 className="text-green-600 w-6 h-6 shrink-0" />
            </div>

            {(business_type || countryDisplay) && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
                {business_type && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md border border-green-200/60">
                    {business_type}
                  </span>
                )}
                {countryDisplay && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{countryDisplay}</span>
                  </span>
                )}
                {year_established && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                    Est. {year_established}
                  </span>
                )}
              </div>
            )}

            {heroDescription && (
              <p className="text-gray-600 text-sm md:text-base leading-relaxed line-clamp-3 mb-4">
                {heroDescription}
              </p>
            )}

            <button
              onClick={handleRequestQuote}
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base w-[160px] md:w-[180px] cursor-pointer"
            >
              Contact Sales
            </button>
          </div>

          {/* Social Links and Company Stats */}
          <div className="flex flex-col gap-6 md:items-end">
            {/* Social Media Icons */}
            <div className="flex flex-wrap gap-3">
              {company_phone && (
                <Link
                  href={`tel:${company_phone}`}
                  className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  <Phone size={20} />
                </Link>
              )}
              {company_email && (
                <Link
                  href={`mailto:${company_email}`}
                  className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  <Mail size={20} />
                </Link>
              )}
              {company_facebook && (
                <Link
                  href={company_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  <Facebook size={20} />
                </Link>
              )}
              {company_linkedIn && (
                <Link
                  href={company_linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  <Linkedin size={20} />
                </Link>
              )}
              {company_instagram && (
                <Link
                  href={company_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-pink-100 hover:text-pink-600 transition-colors"
                >
                  <Instagram size={20} />
                </Link>
              )}
            </div>

            {/* Company Stats */}
            <div className="flex gap-8 md:gap-12">
              <div className="flex flex-col md:items-end">
                <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Revenue</span>
                <span className="text-sm sm:text-base font-bold text-gray-800">{revenue || 'N/A'}</span>
              </div>

              <div className="flex flex-col md:items-end">
                <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Rating</span>
                <span className="text-sm sm:text-base font-bold text-gray-800">
                  {ratingAverage ? `${Math.round(ratingAverage * 100) / 100}/5` : 'N/A'}
                </span>
              </div>

              {year_experience && (
                <div className="flex flex-col md:items-end">
                  <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Experience</span>
                  <span className="text-sm sm:text-base font-bold text-gray-800">{year_experience} years</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* 
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        productName={company_name}
        initialMessage=""
        itemType="business"
        receiverId={userId}
        itemId={supplierProfileId}
        receiverName={company_name}
      /> 
      */}

      <ProductInquiryModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        product={{
          id: supplierProfileId?.toString() || '',
          rfqId: supplierProfileId?.toString() || '',
          name: company_name || 'Business',
          mineral_tag: 'general', // Generic for business contact
          supplier_id: userId?.toString()
        }}
        itemType="business"
      />

      <LoginModal
        isOpen={showLoginModalForSave}
        onClose={() => setShowLoginModalForSave(false)}
        loginPath={paths.auth.signIn}
      />
    </div>
  );
};

export default CompanyProfileHero;
