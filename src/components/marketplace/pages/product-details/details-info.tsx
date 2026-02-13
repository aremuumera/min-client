
"use client";

import React, { useState } from 'react';
import LoginModal from '@/utils/login-modal';
import { paths } from '@/config/paths';
import { Star } from 'lucide-react'; // Using Lucide Star
import { useSelector } from 'react-redux';
import { useAlert } from '@/providers';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import ShareButton from '@/components/marketplace/product-widgets/share-button';
import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';

interface Products {
  id: string | number;
  images?: string[];
  product_name: string;
  supplierId: string | number;
  real_price: number | string;
  selected_payments?: string[];
  supplier?: any;
  productHeaderDescription?: string;
  delivery_period?: string;
  productRating?: { average: number, count: number };
  quantity?: number | string;
  measure?: string;
  storeProfile?: any;
  [key: string]: any;
}

interface DetailsInfoProps {
  products: Products;
}

const DetailsInfo = ({ products }: DetailsInfoProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const { showAlert } = useAlert();

  const { isAuth, user } = useSelector((state: any) => state.auth);

  if (!products) return null;

  const {
    id,
    product_name,
    supplierId,
    real_price,
    selected_payments,
    supplier,
    productHeaderDescription,
    delivery_period,
    productRating,
    quantity,
    measure,
    storeProfile,
  } = products;

  const isOwner = isAuth && user?.id === supplierId;

  const handleRequestQuote = () => {
    if (isOwner) {
      showAlert('You cannot request a quote for your own product', 'warning');
      return;
    }

    if (!isAuth) {
      setShowLoginModal(true);
    } else {
      setShowQuoteModal(true);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
  };

  return (
    <div className="w-full">
      <div className="w-full px-3 sm:px-0 bg-white sm:bg-transparent rounded-lg p-4 sm:p-0 shadow-sm sm:shadow-none">

        {/* Title */}
        <h2 className="font-semibold text-xl sm:text-3xl text-gray-900 leading-snug">{product_name}</h2>

        <div className="w-full bg-gray-200 mt-4 mb-4 h-px"></div>

        <div className="space-y-3">
          {/* Price */}
          <div className="w-full flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">${real_price || 'nil'}</span>
            <span className="text-gray-500 text-sm sm:text-base font-medium">/ton</span>
          </div>

          {/* MOQ */}
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 font-medium text-sm sm:text-base min-w-[120px]">M.O.Q:</span>
            <span className="text-gray-800 text-sm sm:text-base font-medium">
              {quantity} {measure || ''}
            </span>
          </div>

          {/* Delivery */}
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 font-medium text-sm sm:text-base min-w-[120px]">Delivery Period:</span>
            <span className="text-gray-800 text-sm sm:text-base font-medium">{delivery_period || 'N/A'}</span>
          </div>

          {/* Payment */}
          <div className="flex gap-2 items-start">
            <span className="text-gray-500 font-medium text-sm sm:text-base min-w-[120px] pt-0.5">Payment Method:</span>
            <span className="text-gray-800 text-sm sm:text-base font-medium leading-relaxed">
              {selected_payments?.join(', ') || 'Contact for details'}
            </span>
          </div>

          <div className="w-full my-4 bg-gray-200 h-px"></div>

          {/* Reviews */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 rounded-md border border-yellow-100">
              <Star className="text-yellow-400 fill-yellow-400 w-4 h-4" />
              <span className="font-semibold text-gray-800">{Math.round((productRating?.average || 0) * 100) / 100}</span>
              <span className="text-xs text-gray-400">/ 5</span>
            </div>
            <span className="text-green-600 font-medium text-sm sm:text-base hover:underline cursor-pointer">
              ({productRating?.count || 0} {(productRating?.count || 0) > 1 ? 'reviews' : 'review'})
            </span>
          </div>
        </div>

        {/* Description Short */}
        <div className="mt-4">
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {productHeaderDescription}
          </p>
        </div>

        {/* Actions */}
        <div className="gap-4 w-full mt-6">
          <div className="flex items-center gap-6 mb-4">
            <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={products} />
            <ShareButton productName={product_name} />
          </div>

          <button
            onClick={handleRequestQuote}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all shadow-sm hover:shadow active:scale-[0.99]"
          >
            Request Quote
          </button>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal || showLoginModalForSave}
        onClose={() => {
          setShowLoginModal(false);
          setShowLoginModalForSave(false);
        }}
        loginPath={paths.auth.signIn} // check path
      />

      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={closeQuoteModal}
        productName={product_name}
        receiverId={supplierId?.toString()} // Ensure string
        companyName={storeProfile?.company_name}
        receiverName={`${supplier?.first_name} ${supplier?.last_name}`}
        itemId={id}
        initialMessage=""
        itemType="product"
      />
    </div>
  );
};

export default DetailsInfo;
