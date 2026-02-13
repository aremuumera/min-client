
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { User, Send, MapPin, X } from 'lucide-react';
import LoginModal from '@/utils/login-modal';
import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';

// Image Modal Component
const ImageModal = ({ isOpen, onClose, imageUrl }: { isOpen: boolean, onClose: () => void, imageUrl: string }) => {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};

const RfqDetailDescription = ({ rfqProduct }: { rfqProduct: any }) => {
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
  });

  const { showAlert } = useAlert();
  const { isAuth, user } = useSelector((state: any) => state.auth);

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
  } = rfqProduct;

  // Handle potential id naming differences
  const effectiveRfqId = rfqId || rfqProduct.rfqId || rfqProduct._id;

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

  const openImageModal = (url: string) => {
    setImageModal({ isOpen: true, imageUrl: url });
  };

  return (
    <div className="bg-white rounded-lg p-0 md:p-6 shadow-sm border border-gray-100 md:border-none">
      <div className="p-4 md:p-0">
        {/* Header Section */}
        <div className="mt-2 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
              Looking For - {rfqProductName}
            </h2>
            <div className="self-start md:self-auto">
              <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={rfqProduct} />
            </div>
          </div>
          <p className="text-gray-600 mt-4 leading-relaxed whitespace-pre-line text-sm sm:text-base">
            {rfqDescription}
          </p>
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <>
            <div className="bg-gray-100 h-px my-8 w-full"></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Referenced Images</h3>
              <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-4">
                  {attachments.map((attachment: any, index: number) => {
                    const url = typeof attachment === 'string' ? attachment : attachment.url;
                    return (
                      <div
                        key={index}
                        className="w-[100px] h-[100px] min-w-[100px] rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all bg-gray-50 flex items-center justify-center"
                        onClick={() => openImageModal(url)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Ref ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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
                <p className="text-sm text-gray-500 mb-1">Deadline for Quote:</p>
                <p className="font-semibold text-gray-800">{deadlineDate || 'Unavailable'}</p>
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
          </div>

        </div>

        {/* Action Button */}
        <div className="mt-10">
          <button
            onClick={handleRequestQuote}
            className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm text-base md:min-w-[200px]"
          >
            Submit Quote
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
      <ImageModal isOpen={imageModal.isOpen} onClose={() => setImageModal({ ...imageModal, isOpen: false })} imageUrl={imageModal.imageUrl} />
    </div>
  );
};

export default RfqDetailDescription;
