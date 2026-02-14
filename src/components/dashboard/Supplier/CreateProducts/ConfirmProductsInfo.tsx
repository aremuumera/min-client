import React from 'react';
import { TiTick } from "react-icons/ti";
import { FaCopy, FaShareAlt, FaEye } from "react-icons/fa";
import { toast } from 'sonner';
import { WEB_URL } from '@/lib/legacy-config';
import { formatCompanyNameForUrl } from '@/utils/UrlFormatter';
import { useAppSelector } from '@/redux';

const ConfirmSupplierProductsInfo = () => {
  const { productSuccessData } = useAppSelector((state) => state.product);


  // This would typically come from your router or state management
  const productId = "1e21c382d5f642a2b7cf7dc5fe3b5b8c";
  const productName = productSuccessData?.productName ? productSuccessData?.productName : '';
  // Determine base URL based on environment
  const isLocal = process.env.NODE_ENV === 'development';
  const baseUrl = isLocal
    ? 'http://localhost:3000'
    : `${WEB_URL}`;

  // Construct the product link
  const productLink = `${baseUrl}/products/details/${productSuccessData?.productId || ''}/${formatCompanyNameForUrl(productSuccessData?.productName || '')}`;

  console.log('productSuccessData', productSuccessData);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productLink)
      .then(() => {
        toast.success('Product link copied to clipboard!', {
          position: 'top-right',
          style: {
            background: '#4CAF50',
            color: '#fff',
          }
        });
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy link', {
          position: 'top-right',
        });
      });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Check out this ${productName}`,
        text: `I found this ${productName} you might be interested in`,
        url: productLink,
      });
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback for when share is cancelled or fails
      handleCopyLink();
    }
  };

  const handleViewProduct = () => {
    // Using window.open for better control (opens in new tab)
    window.open(productLink, '_blank');
  };

  return (
    <div className="lg:px-6 h-screen py-2">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="flex flex-col gap-[20px] justify-center items-center">
          <div className="flex justify-center items-center bg-primary p-[40px] rounded-full">
            <TiTick className="text-[54px] text-white" />
          </div>

          <div className="text-center">
            <h2 className="text-[20px] font-medium">Product listed successfully</h2>
            <p className="text-[16px] mx-auto w-full pt-4 max-w-[600px] text-[#757c84]">
              Thank you! Your {productName} has been listed successfully.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <FaCopy /> Copy Link
            </button>

            <button
              onClick={handleViewProduct}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition"
            >
              <FaEye /> View Product
            </button>

            {'share' in navigator && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <FaShareAlt /> Share
              </button>
            )}
          </div>

          {/* Debug info for local development */}
          {isLocal && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-full">
              <h3 className="text-sm font-medium mb-2">Development Info</h3>
              <p className="text-xs text-gray-600 break-all">Product Link: {productLink}</p>
              <p className="text-xs text-gray-600 mt-1">Environment: {process.env.NODE_ENV}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmSupplierProductsInfo;