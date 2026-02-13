import React, { useState } from 'react';
import LoginModal from '@/utils/login_check_modal';
import { paths } from '@/config/paths';
import { formatCompanyNameForUrl } from '@/utils/UrlFormatter';
import { MdAttachFile, MdCalendarToday, MdDelete, MdPerson } from 'react-icons/md';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import Link from 'next/link';

import QuoteRequestModal from '@/components/marketplace/modals/quote-request-modal';
import { useAppSelector } from '@/redux';


const SavedRfqWidget = ({ rfqProduct, onDelete, isSaved }: any) => {
  const [showLoginModalForSave, setShowLoginModalForSave] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
  };

  const handleRequestQuote = () => {
    if (!isAuth) {
      setShowLoginModalForSave(true);
    } else {
      setShowQuoteModal(true);
    }
  };

  const {
    rfqId,
    id,
    buyer,
    updatedAt,
    rfqDescription,
    rfqProductName,
    quantityRequired,
    quantityMeasure,
    country,
    productDestination,
    attachments,
  } = rfqProduct;

  // Use either rfqId or id depending on what's available
  const rfqIdentifier = rfqId || id;

  // Check if attachments exist and has length
  const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;

  // Product name fallback
  const productName = rfqProductName || rfqProduct.rfqProductName;

  return (
    <>
      <div className="shadow-md hover:shadow-lg transition-shadow h-full flex flex-col relative bg-white rounded-lg overflow-hidden">
        {/* Delete button for saved items */}
        {isSaved && (
          <div style={{ position: 'absolute', top: 120, right: 8, zIndex: 2 }}>
            <button
              title="Remove from saved items"
              onClick={onDelete}
              className="p-1 bg-white/80 hover:bg-white/90 rounded-full"
            >
              <MdDelete className="text-red-500 text-sm" />
            </button>
          </div>
        )}

        <div className="flex-grow p-4">
          <div className="flex items-center justify-between mb-3">
            <Typography className="flex items-center text-primary text-sm font-medium">
              <MdPerson className="mr-1 text-primary" />
              {buyer?.first_name} {buyer?.last_name}
            </Typography>
            <Typography className="flex items-center text-primary bg-[#CCE6CC70] px-[8px] py-[5px] rounded-[10px] text-sm font-medium">
              <MdCalendarToday className="mr-1" />
              {updatedAt ? format(new Date(updatedAt), 'dd/MM/yyyy') : 'N/A'}
            </Typography>
          </div>

          {/* <Typography className="text-sm font-[500] text-gray-800 mb-3">
            {rfqDescription}
          </Typography> */}

          <div className="text-sm text-gray-600">
            <p>
              <span className="font-bold">Product: </span>
              {productName}
            </p>
            <p className="pt-2">
              <span className="font-bold">Quantity: </span>
              {quantityRequired} {quantityMeasure}
            </p>
            <div className="pt-[5px] flex gap-[10px] items-center">
              <span className="font-bold">Buyer From: </span>
              {country?.flagImage && (
                <div className="w-10 h-5">
                  <img src={country.flagImage} alt="Country Flag" className="w-full h-full object-cover" />
                </div>
              )}
              <span className="sm:text-[15px] text-[12px] cursor-pointer font-[500]">{productDestination}</span>
            </div>
          </div>

          {/* Attachments Section - Only shown if attachments exist */}
          {hasAttachments && (
            <div className="mt-3">
              <div className="flex items-center gap-1 mb-2">
                <MdAttachFile className="text-gray-600 text-sm" />
                <Typography variant="body2" className="font-medium text-gray-700">
                  Attachments ({attachments.length})
                </Typography>
              </div>
              <Box className="flex flex-wrap gap-2">
                {attachments.map((attachment: any, index: any) => (
                  <Box key={index} className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden bg-gray-100">
                    <img
                      src={attachment}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => window.open(attachment, '_blank')}
                    />
                  </Box>
                ))}
              </Box>
            </div>
          )}
        </div>

        <div className="flex justify-between px-3 pb-3 mt-auto">
          <Link
            href={`/rfqs/details/${rfqIdentifier}/${formatCompanyNameForUrl(productName)}`}
            className="!text-green-600 !bg-transparent !border !border-green-600 hover:!bg-green-100"
          >
            View more info
          </Link>
          {/* <Button
            size="small"
            onClick={handleRequestQuote}
            fullWidth
            className="!text-white !bg-green-600 hover:!bg-green-700"
          >
            Contact Now
          </Button> */}
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
        productName={productName}
        initialMessage=""
        itemType="rfq"
        receiverId={rfqId}
        rfqMessage={'Request About this RFQ'}
      />
    </>
  );
};

export default SavedRfqWidget;
