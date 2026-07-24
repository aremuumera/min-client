"use client";

import React, { useState } from 'react';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import LoginModal from '@/utils/login-modal';
import ProductInquiryModal from '@/components/marketplace/modals/ProductInquiryModal';
import { useAlert } from '@/providers';

const ProductDescriptionTab = ({ products }: { products: any }) => {
  const { productDetailDescription, product_name, supplierId, id, supplierProfile, supplier } = products || {};
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { showAlert } = useAlert();

  const { isAuth, user, effectiveUserId } = useAuthIdentity();

  const isOwner = isAuth && effectiveUserId === supplierId;

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
    <div className="w-full py-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-8 py-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
            Product Detail Description
          </h1>

          <div className="space-y-6">
            {Array.isArray(productDetailDescription) && productDetailDescription.length > 0 ? (
              productDetailDescription.map((section: any, index: number) => (
                <div key={index} className="transition-all duration-200 hover:bg-gray-50/60 py-4 px-4 rounded-xl border border-transparent hover:border-gray-100">
                  {section.header && (
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="w-1.5 h-5 bg-green-500 rounded-full mr-3 hidden md:block"></span>
                      {section.header}
                    </h2>
                  )}

                  {section.description && (
                    <div className="ml-0 md:ml-4">
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-none">{section.description}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No detailed description provided for this product.</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-50/80 p-6 border-t border-gray-100 mt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-base font-semibold text-gray-900">Need more information?</h3>
              <p className="text-gray-500 text-xs md:text-sm">Our product specialists are here to help</p>
            </div>
            <button
              onClick={handleRequestQuote}
              className="px-6 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <ProductInquiryModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        product={{
          id: id?.toString() || '',
          rfqId: id?.toString() || '',
          name: product_name || '',
          mineral_tag: 'general',
          supplier_id: supplierId?.toString() || ''
        }}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default ProductDescriptionTab;
