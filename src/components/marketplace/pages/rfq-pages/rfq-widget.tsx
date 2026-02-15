
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { User, Calendar, MapPin, Loader2 } from 'lucide-react'; // Replaced icons
import Link from 'next/link';
import LoginModal from '@/utils/login-modal';
import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import { useAlert } from '@/providers';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import { paths } from '@/config/paths';

const RfqWidget = ({ rfqProduct }: { rfqProduct: any }) => {
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { isAuth, user } = useSelector((state: any) => state.auth);
  const { showAlert } = useAlert();

  const {
    id: rfqId, // Assuming 'id' is mapped to 'rfqId' or 'rfqId' exists. The original destructured rfqId.
    // If the data structure has id, we use it. Original code used rfqId from rfqProduct.
    userId,
    buyer,
    updatedAt,
    description,
    // business_name,
    rfqProductName,
    quantityRequired,
    quantityMeasure,
    country,
    productDestination,
    // attachments,
  } = rfqProduct || {};

  // rfqId handling: sometimes API returns _id or id
  const effectiveRfqId = rfqId || rfqProduct?.rfqId || rfqProduct?.id || rfqProduct?._id;

  const isOwner = isAuth && user?.id === userId;

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
  };

  const handleRequestQuote = () => {
    if (isOwner) {
      showAlert('You cannot request a quote for your own RFQ', 'warning');
      return;
    }

    if (!isAuth) {
      setShowLoginModalForSave(true);
    } else {
      setShowQuoteModal(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-[#efefef] flex flex-col h-full">
        <div className="p-4 grow h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="grow">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {buyer?.name || 'Buyer'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[11px] text-gray-500">
                  {buyer?.company_name || 'Individual Buyer'}
                </p>
                {buyer?.verified && (
                  <span className="shrink-0 bg-blue-50 text-blue-600 px-1 rounded text-[9px] font-medium border border-blue-100 uppercase tracking-tighter">
                    Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={rfqProduct} />
              <div className="flex items-center text-green-800 bg-green-50 px-2 py-1 rounded-md text-xs font-medium">
                <Calendar className="mr-1.5 w-3 h-3" />
                {updatedAt ? format(new Date(updatedAt), 'dd/MM/yyyy') : 'N/A'}
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-gray-800 mb-3 line-clamp-2 min-h-[40px]">
            {description}
          </p>

          <div className="text-sm text-gray-600 space-y-2 mt-auto">
            <p>
              <span className="font-semibold text-gray-700">Product: </span>
              {rfqProductName}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Quantity: </span>
              {quantityRequired} {quantityMeasure}
            </p>
            <div className="flex gap-2 items-center">
              <span className="font-semibold text-gray-700 whitespace-nowrap">Buyer From: </span>
              <div className="flex items-center gap-2 overflow-hidden">
                {country?.flagImage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <div className="w-6 h-4 shrink-0">
                    <img src={country.flagImage} alt="Flag" className="w-full h-full object-cover rounded-[1px]" />
                  </div>
                )}
                <span className="text-sm truncate">{productDestination}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-gray-100 flex gap-3 mt-auto">
          <Link
            href={paths.marketplace.rfqDetails(effectiveRfqId, formatCompanyNameForUrl(rfqProductName || 'rfq'))}
            className="flex-1 text-center py-2 px-3 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors"
          >
            View more info
          </Link>
          <button
            onClick={handleRequestQuote}
            className="flex-1 py-2 px-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            Contact Now
          </button>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModalForSave}
        onClose={() => setShowLoginModalForSave(false)}
        loginPath={paths.auth.signIn}
      />

      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={closeQuoteModal}
        productName={rfqProductName}
        receiverName={`${buyer?.first_name} ${buyer?.last_name}`}
        companyName={`${buyer?.business_name}`}
        initialMessage=""
        itemType="rfq"
        itemId={effectiveRfqId}
        receiverId={userId}
        rfqMessage={'Request About this RFQ'}
      />
    </>
  );
};

export default RfqWidget;
