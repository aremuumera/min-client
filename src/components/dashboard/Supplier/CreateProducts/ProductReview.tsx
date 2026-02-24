'use client'

import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { PiWarningLight } from "react-icons/pi";
import { useDispatch } from 'react-redux';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { toast } from 'sonner';
import { useCreateProductMutation } from '@/redux/features/supplier-products/products_api';
import { resetProductState, setProductSuccessData } from '@/redux/features/supplier-products/products_slice';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import { CircularProgress, Typography } from '@/components/ui';
import { useState } from 'react';

interface SupplierProductReviewProps {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
  productImages: File[];
  productAttachments: File[];
  setProductImages: (files: File[]) => void;
  setProductAttachments: (files: File[]) => void;
  steps: string[];
}

const SupplierProductReview: React.FC<SupplierProductReviewProps> = ({
  handleNext,
  setActiveStep,
  activeStep,
  handleBack,
  productImages,
  productAttachments,
  setProductImages,
  setProductAttachments,
  steps
}) => {
  const {
    productPaymentData,
    productLocation,
    uploadedFiles,
    productDetailsFormData,
    serverReadyData,
    productSuccessData
  } = useAppSelector((state) => state?.product);

  const {
    color, composition, deliveryPeriod, density, hardness,
    measure, prevPrice, productCategory, productName,
    productSubCategory, quantity, realPrice, unitCurrency,
    productHeaderDescription, purity_grade, moisture_max,
    packaging, sampling_method, supply_type, frequency,
    duration, trade_scope
  } = productDetailsFormData;

  const {
    selectedCountryName, selectedState, fullAddress,
    zipCode, streetNo
  } = productLocation;

  const [currentIndex, setCurrentIndex] = useState(0);
  const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state?.auth);
  const dispatch = useDispatch();

  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleNextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % (uploadedFiles?.length || 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + (uploadedFiles?.length || 1)) % (uploadedFiles?.length || 1));
  };

  const imageContainerStyle = {
    width: `${uploadedFiles?.length * 100}%`,
    transform: `translateX(-${(currentIndex / uploadedFiles?.length) * 100}%)`,
    transition: "transform 0.5s ease-in-out",
  };

  const getCurrencySymbol = (currency: string | undefined) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'NGN': return '₦';
      default: return '₦';
    }
  };

  const formatPrice = (price: any) => {
    if (!price) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Product Information
      formData.append('productName', productName);
      formData.append('productCategory', productCategory);
      formData.append('productSubCategory', productSubCategory);
      formData.append('color', color || '');
      formData.append('composition', composition || '');
      formData.append('deliveryPeriod', deliveryPeriod);
      formData.append('density', density || '');
      formData.append('hardness', hardness || '');
      formData.append('measure', measure);
      formData.append('prevPrice', prevPrice || '');
      formData.append('realPrice', realPrice);
      formData.append('quantity', quantity);
      formData.append('unitCurrency', unitCurrency || 'NGN');

      formData.append('purity_grade', purity_grade || '');
      formData.append('moisture_max', moisture_max || '');
      formData.append('packaging', packaging || '');
      formData.append('sampling_method', sampling_method || '');
      formData.append('supply_type', supply_type || 'immediate');
      formData.append('frequency', frequency || '');
      formData.append('duration', duration || '');
      formData.append('trade_scope', trade_scope || 'local');

      // Location Data
      formData.append('fullAddress', fullAddress);
      formData.append('latitude', productLocation.latitude || '');
      formData.append('longitude', productLocation.longitude || '');
      formData.append('selectedCountryName', selectedCountryName);
      formData.append('selectedState', selectedState);
      formData.append('streetNo', streetNo || fullAddress);
      formData.append('zipCode', zipCode || '');
      formData.append('productMainCategory', serverReadyData.productMainCategory || '');
      formData.append('categoryTag', serverReadyData.categoryTag || '');

      // Payment Data
      if (productPaymentData?.selectedPayments) {
        productPaymentData.selectedPayments.forEach((payment: string) => {
          formData.append(`selectedPayments`, payment);
        });
      }

      if (productPaymentData?.selectedShippings) {
        productPaymentData.selectedShippings.forEach((shipping: string) => {
          formData.append(`selectedShipping`, shipping);
        });
      }
      formData.append('paymentsTermsDescribed', productPaymentData.paymentTermsDescribed || '');
      formData.append('shippingTermsDescribed', productPaymentData.shippingTermsDescribed || '');

      // Description Data
      formData.append('productHeaderDescription', productHeaderDescription || "Product Description");
      formData.append('productDetailDescription', JSON.stringify(serverReadyData.productDetailDescription || []));

      // Metadata & Files
      formData.append('step', '4');
      // formData.append('supplierId', user?.id);

      if (productImages && productImages.length > 0) {
        productImages.forEach((file) => {
          formData.append('productImages', file);
        });
      }

      if (productAttachments && productAttachments.length > 0) {
        productAttachments.forEach((file) => {
          formData.append('productAttachments', file);
        });
      }


      console.log('formData', formData)


      const response = await createProduct({
        supplierId: isTeamMember ? ownerUserId : user?.id,
        body: formData
      }).unwrap();
      //   console.log('API
      if (response && response.message) {
        toast.success(`${response?.message || 'Product listed successfully!'}`);
        handleNext();
      }
      // submitted', response);
      dispatch(setProductSuccessData({
        productName: response?.product?.product_name || '',
        productId: response?.product?.id || '',
      }));

      dispatch(resetProductState());
      setProductImages([]);
      setProductAttachments([]);
      // handleNext(); // This was moved inside the if block above

    } catch (error: any) {
      console.error('Error during form')
      if (error) {
        toast.error(`${error?.data?.message || 'Failed to submit product details. Please try again.'}`);
      }
    }
  };

  console.log('productSuccessData', productSuccessData)

  return (
    <div>
      <div className="">
        {/* Example Form */}
        <h2 className='font-bold text-xl my-6 text-center text-gray-600'>Kindly review some information</h2>
        <form
          onSubmit={handleSubmit}
          className="">

          <div className='flex flex-col lg:flex-row gap-8 mt-8'>
            {/* Left Column: Image Gallery */}
            <div className='w-full lg:w-1/3'>
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4'>
                <div className='relative h-[300px] rounded-xl overflow-hidden bg-gray-50'>
                  <div className="w-full h-full flex" style={imageContainerStyle}>
                    {uploadedFiles?.map((j: any, i: number) => (
                      <div
                        className="relative h-full shrink-0"
                        style={{ width: `${100 / (uploadedFiles?.length || 1)}%` }}
                        key={i}
                      >
                        {j.type?.startsWith('video/') ? (
                          <video
                            src={j.url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={j.url}
                            alt={productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {uploadedFiles.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 transition-all"
                      >
                        <MdNavigateBefore size={24} className="text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10 transition-all"
                      >
                        <MdNavigateNext size={24} className="text-gray-700" />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {uploadedFiles.map((_: any, i: number) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${currentIndex === i ? "w-6 bg-primary" : "w-1.5 bg-white/60"
                              }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className='mt-4'>
                  <h3 className='font-semibold text-gray-900 line-clamp-2'>{productName}</h3>
                  <div className='flex items-baseline gap-2 mt-1'>
                    <span className='text-2xl font-bold text-primary'>{getCurrencySymbol(unitCurrency)}{formatPrice(realPrice)}</span>
                    {prevPrice && (
                      <span className='text-sm text-gray-400 line-through'>{getCurrencySymbol(unitCurrency)}{formatPrice(prevPrice)}</span>
                    )}
                  </div>

                  <div className='mt-4 flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100'>
                    <PiWarningLight className='shrink-0 mt-0.5' size={18} />
                    <p className='text-xs font-medium leading-relaxed'>
                      Note: If your product images are not displaying above, please go back to the first step and re-select them before submitting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Info */}
            <div className='w-full lg:w-2/3 space-y-6'>
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <span className='w-1 h-6 bg-primary rounded-full'></span>
                  Product Specifications
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8'>
                  <InfoRow label="Main Category" value={serverReadyData.productMainCategory} />
                  <InfoRow label="Product Category" value={productCategory} />
                  <InfoRow label="Sub Category" value={productSubCategory} />
                  <InfoRow label="M.O.Q" value={`${quantity} ${measure}`} />
                  <InfoRow label="Delivery Period" value={deliveryPeriod} />
                  <InfoRow label="Composition" value={composition} />
                  <InfoRow label="Density" value={density} />
                  <InfoRow label="Hardness" value={hardness} />
                  <InfoRow label="Color" value={color} />
                  <InfoRow label="Purity/Grade" value={purity_grade} />
                  <InfoRow label="Max Moisture" value={moisture_max ? `${moisture_max}%` : ''} />
                  <InfoRow label="Packaging" value={packaging} />
                  <InfoRow label="Sampling" value={sampling_method} />
                  <InfoRow label="Supply Type" value={supply_type} />
                  {supply_type === 'contract' && (
                    <>
                      <InfoRow label="Frequency" value={frequency} />
                      <InfoRow label="Duration" value={duration} />
                    </>
                  )}
                  <InfoRow label="Trade Scope" value={trade_scope} />
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <span className='w-1 h-6 bg-primary rounded-full'></span>
                  Location & Logistics
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8'>
                  <InfoRow label="Country" value={selectedCountryName} />
                  <InfoRow label="State" value={selectedState} />
                  <InfoRow label="Full Address" value={fullAddress} />
                  <InfoRow label="Zip Code" value={zipCode} />
                </div>
              </div>

              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <span className='w-1 h-6 bg-primary rounded-full'></span>
                  Payment & Shipping Terms
                </h3>
                <div className='space-y-4'>
                  <div>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1'>Payment Terms</p>
                    <div className='flex flex-wrap gap-2 mb-2'>
                      {productPaymentData?.selectedPayments?.map((p: string) => (
                        <span key={p} className='px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100'>{p}</span>
                      ))}
                    </div>
                    <p className='text-sm text-gray-600 italic'>{productPaymentData.paymentTermsDescribed}</p>
                  </div>
                  <div className='pt-4 border-t border-gray-50'>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1'>Shipping Terms</p>
                    <div className='flex flex-wrap gap-2 mb-2'>
                      {productPaymentData?.selectedShippings?.map((s: string) => (
                        <span key={s} className='px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100'>{s}</span>
                      ))}
                    </div>
                    <p className='text-sm text-gray-600 italic'>{productPaymentData.shippingTermsDescribed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
            <Button
              disabled={activeStep === 0 || isLoading}
              onClick={handleBack}
              variant="outlined"
              color="primary"
              className="w-full"
              type='button'
            >
              Back
            </Button>
            <Button
              disabled={isLoading || activeStep === steps.length - 1}
              variant="contained"
              color="primary"
              className="w-full min-h-[48px] text-white! bg-primary! border-primary! border! border-solid! disabled:bg-primary! disabled:border-primary! disabled:text-white! "
              type="submit"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <CircularProgress
                    size={20}
                    strokeWidth={3}
                    color="inherit"
                    indeterminate
                    className="text-white"
                  />
                  Uploading...
                </span>
              ) : (
                "Upload Product"
              )}
            </Button>
          </div>
        </form>
        {/* Add other step forms here */}
      </div>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string, value: any }) => (
  <div className='flex flex-col gap-1'>
    <span className='text-xs font-medium text-gray-400 uppercase tracking-wider'>{label}</span>
    <span className='text-sm font-semibold text-gray-700'>{value || 'N/A'}</span>
  </div>
);

export default SupplierProductReview;