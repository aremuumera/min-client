
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { User, Calendar, MapPin, Loader2, Timer, Clock, AlertCircle, Box } from 'lucide-react'; // Replaced icons
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import Link from 'next/link';
import LoginModal from '@/utils/login-modal';
// import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import ProductInquiryModal from '@/components/marketplace/modals/ProductInquiryModal';
import { useAlert } from '@/providers';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import { paths } from '@/config/paths';

const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<any>(null);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(deadline);
      const diff = differenceInSeconds(target, now);

      if (diff <= 0) return null;

      const days = Math.floor(diff / (24 * 3600));
      const hours = Math.floor((diff % (24 * 3600)) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (!remaining) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return (
    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-wider">
      <Clock size={12} /> Bidding Expired
    </div>
  );

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`flex items-center gap-2 ${isUrgent ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'} px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider shadow-sm transition-all animate-pulse-slow`}>
      <Timer size={12} className={isUrgent ? 'animate-bounce' : ''} />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s Left
      </span>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const isNegotiating = status === 'in_negotiation';
  const isClosed = status === 'closed' || status === 'finalized';
  const isExpired = status === 'expired';

  if (isNegotiating) return (
    <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
      <AlertCircle size={12} /> In Negotiation
    </div>
  );

  if (isClosed) return (
    <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-100 uppercase tracking-wider">
      <Box size={12} /> Bidding Closed
    </div>
  );

  if (isExpired) return (
    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-100 uppercase tracking-wider">
      <Clock size={12} /> Expired
    </div>
  );

  return null;
};

const RfqWidget = ({ rfqProduct }: { rfqProduct: any }) => {
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { isAuth, user } = useSelector((state: any) => state.auth);
  const { showAlert } = useAlert();

  const {
    rfqId, // Assuming 'id' is mapped to 'rfqId' or 'rfqId' exists. The original destructured rfqId.
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
    bidding_deadline,
    status,
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-gray-900 leading-tight">
                  {buyer?.name || 'Buyer'}
                </p>
                {buyer?.verified && (
                  <span className="shrink-0 bg-blue-50 text-blue-600 px-1 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-tighter">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">
                {buyer?.company_name || 'Individual Buyer'}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {status && status !== 'pending' && status !== 'supplier_matched' ? (
                <StatusBadge status={status} />
              ) : (
                bidding_deadline && <CountdownTimer deadline={bidding_deadline} />
              )}
              <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={rfqProduct} />
            </div>
          </div>

          <div className="flex items-center justify-between  bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
            <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="mr-1.5 w-3 h-3 text-emerald-600" />
              Posted: {updatedAt ? format(new Date(updatedAt), 'dd MMM yyyy') : 'N/A'}
            </div>
            {productDestination && (
              <div className="flex items-center gap-1.5">
                {country?.flagImage && (
                  <img src={country.flagImage} alt="Flag" className="w-4 h-2.5 object-cover rounded shadow-xs" />
                )}
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{productDestination}</span>
              </div>
            )}
          </div>

          {/* <p className="text-sm font-medium text-gray-800 mb-3 line-clamp-2 min-h-[40px]">
            {description}
          </p> */}

          <div className="text-sm text-gray-600 space-y-2 mt-auto bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/50">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Product</span>
              <span className="font-black text-emerald-700">{rfqProductName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Volume Required</span>
              <span className="font-black text-gray-900">{quantityRequired} {quantityMeasure}</span>
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


      {/* 
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
      */}

      <ProductInquiryModal
        isOpen={showQuoteModal}
        onClose={closeQuoteModal}
        product={{
          id: effectiveRfqId.toString(),
          rfqId: effectiveRfqId.toString(),
          name: rfqProductName,
          mineral_tag: rfqProduct?.mineral_tag || 'mineral',
          supplier_id: userId?.toString()
        }}
        itemType="rfq"
      />
    </>
  );
};

export default RfqWidget;
