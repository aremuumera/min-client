
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Facebook, Linkedin, Instagram, Phone, Mail, CheckCircle2 } from 'lucide-react';
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
    revenue,
    userId,
    // companyExperience,
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
    // companySocialMediaLinks,
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

  return (
    <div className="w-full">
      {/* Banner Image */}
      <div className="relative w-full max-w-[1280px] mx-auto bg-gray-900 md:mt-4 rounded-lg">
        <div className="w-full h-32 sm:h-40 md:h-52 lg:h-64 xl:h-72 rounded-b-lg overflow-hidden md:rounded-lg">
          {banner ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={banner} alt={`${company_name} banner`} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-green-900 to-gray-900" />
          )}
        </div>

        {/* Company Logo */}
        <div className="absolute left-4 sm:left-8 md:left-12 bottom-0 transform translate-y-1/2 p-1.5 bg-white rounded-2xl shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo || '/placeholder-logo.png'}
            alt={`${company_name} logo`}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-xl object-cover border border-gray-100 bg-white"
          />
        </div>
      </div>

      {/* Company Information Container */}
      <div className="w-full mt-12 sm:mt-14 md:mt-16 lg:mt-20 px-4 sm:px-8 md:px-12 max-w-[1350px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-10 border-b border-gray-100 pb-8">
          {/* Company Name and Contact Button */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 my-4 sm:my-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{company_name}</h1>
              <CheckCircle2 className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <button
              onClick={handleRequestQuote}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm text-sm sm:text-base w-[160px] md:w-[180px]"
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
