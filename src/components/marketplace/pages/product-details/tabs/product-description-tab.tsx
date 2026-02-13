
"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import LoginModal from '@/utils/login-modal';
import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import { useAlert } from '@/providers';
import { paths } from '@/config/paths';

const ProductDescriptionTab = ({ products }: { products: any }) => {
  const { productDetailDescription, product_name, supplierId, id, supplierProfile, supplier } = products || {};
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { showAlert } = useAlert();

  const { isAuth, user } = useSelector((state: any) => state.auth);

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

  return (
    <div className="w-full py-8 md:px-4">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
            Product Detail Description
          </h1>

          <div className="space-y-8">
            {productDetailDescription?.map((section: any, index: number) => (
              <div key={index} className="transition-all duration-300 hover:bg-gray-50 py-4 px-3 rounded-lg">
                {section.header && (
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-1.5 h-6 bg-green-200 rounded-full mr-3 hidden md:block"></span>
                    {section.header}
                  </h2>
                )}

                {section.description && (
                  <div className="ml-0 md:ml-4">
                    <p className="text-base text-gray-700 leading-relaxed max-w-none">{section.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-50 p-6 border-t mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-800">Need more information?</h3>
              <p className="text-gray-600 text-sm">Our product specialists are here to help</p>
            </div>
            <button
              onClick={handleRequestQuote}
              className="px-6 py-2.5 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors font-medium shadow-sm"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        productName={product_name}
        initialMessage=""
        itemType="product"
        itemId={id}
        receiverId={supplierId}
        companyName={supplierProfile?.company_name}
        receiverName={`${supplier?.first_name} ${supplier?.last_name}`}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        loginPath={paths.auth.signIn}
      />
    </div>
  );
};

export default ProductDescriptionTab;
