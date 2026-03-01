
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Send, MapPin, X, Box, CheckCircle, Package, Timer, Clock, AlertCircle } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import LoginModal from '@/utils/login-modal';
// import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import ProductInquiryModal from '@/components/marketplace/modals/ProductInquiryModal';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';
import { useAppSelector } from '@/redux';

// Media Modal Component
const MediaModal = ({ isOpen, onClose, url, type }: { isOpen: boolean, onClose: () => void, url: string, type: 'image' | 'video' | 'document' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-12000 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          <X size={24} />
        </button>
        {type === 'video' ? (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        )}
      </div>
    </div>
  );
};

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
    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-xs font-bold border border-red-100 uppercase tracking-widest shadow-sm">
      <Clock size={16} className="animate-pulse" /> Bidding Expired
    </div>
  );

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className={`flex items-center gap-3 ${isUrgent ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'} px-5 py-2.5 rounded-xl text-sm font-black border uppercase tracking-widest shadow-md transition-all`}>
      <Timer size={18} className={isUrgent ? 'animate-bounce' : ''} />
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
    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg text-xs font-bold border border-green-100 uppercase tracking-widest shadow-sm">
      <AlertCircle size={16} /> In Negotiation
    </div>
  );

  if (isClosed) return (
    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold border border-gray-100 uppercase tracking-widest shadow-sm">
      <Box size={16} /> Bidding Closed
    </div>
  );

  if (isExpired) return (
    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-xs font-bold border border-red-100 uppercase tracking-widest shadow-sm">
      <Clock size={16} /> Expired
    </div>
  );

  return null;
};

const RfqDetailDescription = ({ rfqProduct }: { rfqProduct: any }) => {
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [mediaModal, setMediaModal] = useState({
    isOpen: false,
    url: '',
    type: 'image' as 'image' | 'video' | 'document',
  });

  const { showAlert } = useAlert();
  const { isAuth, user } = useAppSelector((state) => state.auth);

  if (!rfqProduct) return null;

  const {
    id: rfqId, // Using id as rfqId
    buyer,
    userId,
    // updatedAt,
    rfqDescription,
    // business_name,
    rfqProductName,
    quantityRequired,
    quantityMeasure,
    selectedShippings,
    selectedPayments,
    country,
    productDestination,
    deadlineDate,
    attachments,
    purity_grade,
    moisture_max,
    packaging,
    sampling_method,
    inquiry_type,
    urgency_level,
    rfqProductSubCategory,
    rfqProductCategory,
    deliveryPeriod,
    durationOfSupply,
    is_inspection_required,
    is_shipment_included,
    recurring_frequency,
    recurring_duration,
    status,
    bidding_deadline,
  } = rfqProduct;

  // Handle potential id naming differences - prioritize the UUID rfqId
  const effectiveRfqId = rfqProduct.rfqId || rfqId || rfqProduct._id || rfqProduct.id;

  const isOwner = isAuth && user?.id === userId;

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

  const openMediaModal = (url: string, type: 'image' | 'video' | 'document') => {
    if (type === 'document') {
      window.open(url, '_blank');
      return;
    }
    setMediaModal({ isOpen: true, url, type });
  };

  return (
    <div className="bg-white rounded-lg p-0 md:p-6 shadow-sm border border-gray-100 md:border-none">
      <div className="p-4 md:p-0">
        {/* Header Section */}
        <div className="mt-2 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-gray-50">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                Looking For - {rfqProductName}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-400 font-bold uppercase tracking-wider">
                  <User size={14} className="text-emerald-600" />
                  {buyer?.name || 'Buyer'}
                </div>
                {buyer?.verified && (
                  <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-black border border-green-100 uppercase tracking-widest">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              {status && status !== 'pending' && status !== 'supplier_matched' ? (
                <StatusBadge status={status} />
              ) : (
                bidding_deadline && <CountdownTimer deadline={bidding_deadline} />
              )}
              <div className="flex items-center gap-3 mt-1">
                <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={rfqProduct} />
              </div>
            </div>
          </div>

          <p className="text-gray-600 mt-8 leading-relaxed whitespace-pre-line text-base sm:text-lg font-medium opacity-90">
            {rfqDescription}
          </p>
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <>
            <div className="bg-gray-100 h-px my-8 w-full"></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Referenced Media</h3>
              <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-4">
                  {attachments.map((attachment: any, index: number) => {
                    const url = typeof attachment === 'string' ? attachment : attachment.url;
                    const type = typeof attachment === 'string' ? 'image' : attachment.type;

                    return (
                      <div
                        key={index}
                        className="w-[120px] h-[120px] min-w-[120px] rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all bg-gray-50 flex items-center justify-center relative group"
                        onClick={() => openMediaModal(url, type)}
                      >
                        {type === 'video' ? (
                          <div className="w-full h-full relative">
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              muted
                              onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play()}
                              onMouseOut={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                              <div className="bg-white/80 rounded-full p-2">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            </div>
                          </div>
                        ) : type === 'document' ? (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span className="text-[10px] text-gray-500 truncate w-full text-center">Document</span>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Ref ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-gray-100 h-px my-8 w-full"></div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">

          {/* Column 1 */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact Person:</p>
                <p className="font-semibold text-gray-800">{buyer?.first_name} {buyer?.last_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Quantity Requirement:</p>
                <p className="font-semibold text-gray-800">{quantityRequired} {quantityMeasure}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Expected Delivery:</p>
                <p className="font-semibold text-gray-800">{deliveryPeriod || 'Unavailable'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration of Supply:</p>
                <p className="font-semibold text-gray-800">
                  {durationOfSupply || 'One-off'}
                  {inquiry_type === 'recurring' && recurring_frequency && (
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({recurring_frequency} for {recurring_duration} cycles)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Terms:</p>
                <p className="font-semibold text-gray-800">
                  {Array.isArray(selectedPayments) ? selectedPayments.join(', ') : selectedPayments || 'Unavailable'}
                </p>
              </div>
            </div>

            {packaging && (
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Packaging:</p>
                  <p className="font-semibold text-gray-800">{packaging}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-green-600 font-bold mt-0.5 flex items-center justify-center">!</div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Urgency:</p>
                <p className={`font-semibold ${urgency_level === 'urgent' ? 'text-red-600' : 'text-gray-800 uppercase'}`}>
                  {urgency_level || 'Standard'}
                </p>
              </div>
            </div>

          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Buyer From:</p>
                <div className="flex items-center gap-2">
                  {country?.flagImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={country.flagImage} alt="Flag" className="w-6 h-4 object-cover rounded shadow-sm" />
                  )}
                  <p className="font-semibold text-gray-800">{productDestination}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Destination:</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{productDestination || 'Same as above'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Shipping Terms:</p>
                <p className="font-semibold text-gray-800">
                  {Array.isArray(selectedShippings) ? selectedShippings.join(', ') : selectedShippings || 'Unavailable'}
                </p>
              </div>
            </div>

            {/* Additional RFQ Details */}
            {purity_grade && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-green-600 font-bold mt-0.5 flex items-center justify-center">%</div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Purity / Grade:</p>
                  <p className="font-semibold text-gray-800">{purity_grade}</p>
                </div>
              </div>
            )}

            {moisture_max && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-green-600 font-bold mt-0.5 flex items-center justify-center">H2O</div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Max Moisture:</p>
                  <p className="font-semibold text-gray-800">{moisture_max}%</p>
                </div>
              </div>
            )}


            {/* {sampling_method && (
              <div className="flex items-start gap-3">
                <Send className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sampling Method:</p>
                  <p className="font-semibold text-gray-800">{sampling_method}</p>
                </div>
              </div>
            )} */}



            {is_inspection_required && (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Inspection:</p>
                  <p className="font-semibold text-gray-800">Required</p>
                </div>
              </div>
            )}

            {is_shipment_included && (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Shipping:</p>
                  <p className="font-semibold text-gray-800">Included in RFQ</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Action Button */}
        <div className="mt-12 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-lg font-black text-gray-900">Interested in this RFQ?</p>
              <p className="text-sm text-gray-500 font-medium">Submit your best offer to the Min-meg Trade Desk.</p>
            </div>
            <button
              onClick={handleRequestQuote}
              disabled={status === 'closed' || status === 'finalized' || status === 'expired'}
              className={`w-full md:w-auto px-10 py-4 ${status === 'closed' || status === 'finalized' || status === 'expired' ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 '} text-white rounded-xl transition-all font-black text-sm md:min-w-[240px] uppercase tracking-widest`}
            >
              {status === 'closed' || status === 'finalized' || status === 'expired' ? 'Submission Closed' : 'Submit Best Quote'}
            </button>
          </div>
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
        onClose={() => setShowQuoteModal(false)}
        productName={rfqProductName}
        initialMessage=""
        itemType="rfq"
        itemId={effectiveRfqId}
        receiverId={userId}
        receiverName={`${buyer?.first_name} ${buyer?.last_name}`}
        companyName={`${buyer?.business_name}`}
        rfqMessage={'Request About this RFQ'}
      /> 
      */}

      <ProductInquiryModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        product={{
          id: effectiveRfqId.toString(),
          rfqId: effectiveRfqId.toString(),
          name: rfqProductName,
          mineral_tag: rfqProduct.mineral_tag || rfqProduct.category_tag || 'mineral', // Use category_tag as fallback
          supplier_id: userId?.toString()
        }}
        itemType="rfq"
      />
      <MediaModal
        isOpen={mediaModal.isOpen}
        onClose={() => setMediaModal({ ...mediaModal, isOpen: false })}
        url={mediaModal.url}
        type={mediaModal.type}
      />
    </div>
  );
};

export default RfqDetailDescription;
