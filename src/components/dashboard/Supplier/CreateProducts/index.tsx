'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IoIosArrowBack } from "react-icons/io";
import ProgressBar from '@/utils/progress_tracker';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { UnsavedChangesModal } from '@/components/ui';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useAppSelector } from '@/redux/hooks';
import SupplierProductDetails from './productDetails';
import SupplierProductLocation from './productsLocation';
import SupplierPaymentTerms from './paymentTerms';
import ConfirmSupplierProductsInfo from './ConfirmProductsInfo';
import SupplierProductReview from './ProductReview';

const SupplierListing = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [progress, setProgress] = useState(10);

  const { productDetailsFormData } = useAppSelector((state) => state.product || {});

  // RAW FILE STATE (Lifted from children to replace IndexedDB)
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productAttachments, setProductAttachments] = useState<File[]>([]);

  const isDirty = useMemo(() => {
    if (activeStep >= 4) return false;
    if (activeStep > 0) return true;
    if (productImages.length > 0 || productAttachments.length > 0) return true;
    if (
      productDetailsFormData?.productName?.trim() ||
      productDetailsFormData?.productCategory ||
      productDetailsFormData?.productHeaderDescription?.trim()
    ) {
      return true;
    }
    return false;
  }, [activeStep, productImages.length, productAttachments.length, productDetailsFormData]);

  const { showPrompt, stayOnPage, confirmLeave } = useUnsavedChanges({
    isDirty,
    isSubmitting,
  });

  const steps = [
    "Product Details",
    "Product Location",
    "Payment terms",
    "Product Review",
    "Product Uploaded Successfully",
  ];


  const getProgressLabel = () => {
    switch (activeStep) {
      case 1:
        return 'Product Location';
      case 2:
        return 'Payment terms';
      case 3:
        return 'Product Review';
      case 4:
        return 'Product Uploaded';
      default:
        return 'Product Details';
    }
  };


  const handleBack = () => {
    const from = searchParams.get('from');
    if (from) {
      router.push(from);
      window.scrollTo(0, 0);
    } else {
      router.back();
    }
  };


  // useEffect(() => {
  //   console.log('Previous page:', location.state?.from);
  // }, [location]);

  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       setProgress((prev) => (prev < 100 ? prev + 20 : 100)); // Increment progress
  //     }, 6000); // Update every second

  //     return () => clearInterval(timer); // Cleanup
  //   }, []);

  // const handleNext = () => {
  //     if (activeStep < steps.length - 1) {
  //         setActiveStep(activeStep + 1);
  //         setProgress((prev) => (prev < 100 ? prev + 20 : 100)); // Increment progress
  //         window.scrollTo(0,0)
  //     }
  //   };

  const progressPerStep = 100 / (steps.length - 1);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      setProgress(Math.min(100, nextStep * progressPerStep));
      window.scrollTo(0, 0);
    }
  };

  // const handleBacks = () => {
  //     if (activeStep > 0) {
  //         setActiveStep(prev => prev - 1);
  //         setProgress(prev => Math.max(0, prev - progressPerStep));
  //         window.scrollTo(0, 0);
  //     } else {
  //         // If at first step, use the route back handler
  //         handleBack();
  //     }
  // };

  const handleBacks = () => {
    if (activeStep > 0 && activeStep < steps.length - 1) {
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      setProgress(Math.max(0, prevStep * progressPerStep));
      window.scrollTo(0, 0);
    } else if (activeStep === steps.length - 1) {
      setActiveStep(0);
      setProgress(0);
      window.scrollTo(0, 0);
    } else {
      handleBack();
    }
  };

  // Interactive Stepper Handler
  const handleStepClick = (stepIndex: number) => {
    // Only allow navigating to steps already reached or backward
    // For now, let's allow free navigation between steps that have been "unlocked"
    // (In this case, simple navigation is fine as per user request to click and go)
    if (stepIndex < steps.length) {
      setActiveStep(stepIndex);
      setProgress(Math.min(100, stepIndex * progressPerStep));
      window.scrollTo(0, 0);
    }
  };

  return (
    <div>
      <div>
        <div className=' flex justify-start'>
          {activeStep !== 0 &&
            (
              <button onClick={handleBacks} className='flex gap-[5px] justify-center items-center text-gray-600 hover:text-primary transition-colors'>
                <IoIosArrowBack className='text-[15px]' /> Back
              </button>
            )}
        </div>

        <div className='bg-bgSecondary w-full h-full p-[15px] rounded-[20px] mt-[16px]'>
          <div>
            <Box sx={{ p: 1 }}>
              <h1 className='text-[25px] font-medium pb-[20px] text-gray-800'>{'Create' + " " + getProgressLabel()}</h1>
              <ProgressBar
                steps={steps}
                progress={progress}
                // onStepClick={handleStepClick}
                activeStep={activeStep}
              />
              {/* <Button 
                        onClick={() => setProgress(0)} 
                        variant="contained" 
                        color="primary"
                        sx={{ mt: 2 }}
                    >
                        Reset Progress
                    </Button> */}
            </Box>
          </div>
          <div className="mt-4">
            {activeStep === 0 && (
              <SupplierProductDetails
                setActiveStep={setActiveStep}
                activeStep={activeStep}
                handleNext={handleNext}
                handleBack={handleBacks}
                productImages={productImages}
                setProductImages={setProductImages}
                productAttachments={productAttachments}
                setProductAttachments={setProductAttachments}
              />
            )}

            {activeStep === 1 && (
              <SupplierProductLocation
                setActiveStep={setActiveStep}
                activeStep={activeStep}
                handleNext={handleNext}
                handleBack={handleBacks}
              />
            )}

            {activeStep === 2 && (
              <SupplierPaymentTerms
                setActiveStep={setActiveStep}
                activeStep={activeStep}
                handleNext={handleNext}
                handleBack={handleBacks}
              />
            )}

            {
              activeStep === 3 && (
                <SupplierProductReview
                  setActiveStep={setActiveStep}
                  activeStep={activeStep}
                  handleNext={handleNext}
                  handleBack={handleBacks}
                  productImages={productImages}
                  productAttachments={productAttachments}
                  setProductImages={setProductImages}
                  setProductAttachments={setProductAttachments}
                  steps={steps}
                  setIsSubmitting={setIsSubmitting}
                />
              )
            }

            {activeStep === 4 && (
              <ConfirmSupplierProductsInfo
              //  setActiveStep={setActiveStep}
              // activeStep={activeStep} 
              //  handleNext={handleNext} 
              //  handleBack={handleBacks} 
              />
            )}
          </div>
        </div>
      </div>

      <UnsavedChangesModal
        open={showPrompt}
        isSubmitting={isSubmitting}
        onStay={stayOnPage}
        onLeave={confirmLeave}
        title={isSubmitting ? 'Product Upload in Progress' : 'Unsaved Product Details'}
        description={
          isSubmitting
            ? 'Your product is currently being uploaded. Please wait until the upload completes to avoid losing data.'
            : 'You have entered details for this product. If you leave or reload now, all entered information will be discarded.'
        }
      />
    </div>
  )
}

export default SupplierListing;
