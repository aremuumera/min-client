
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IoIosArrowBack } from "react-icons/io";
import ProgressBar from '@/utils/progress_tracker';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import SupplierProductDetails from './productDetails';
import SupplierProductLocation from './productsLocation';
import SupplierPaymentTerms from './paymentTerms';
import ConfirmSupplierProductsInfo from './ConfirmProductsInfo';
import SupplierProductReview from './ProductReview';

const SupplierListing = () => {
    const searchParams = useSearchParams();
    const router = useRouter();  
    const [activeStep, setActiveStep] = useState(0);

    const [progress, setProgress] = useState(10);
    
    const steps = [
      "Create Product",
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
            return 'Create Product';
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
        setActiveStep(prev => prev + 1);
        setProgress(prev => Math.min(100, prev + progressPerStep));
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
      // Normal back behavior for intermediate steps
      setActiveStep(prev => prev - 1);
      setProgress(prev => Math.max(0, prev - progressPerStep));
      window.scrollTo(0, 0);
  } else if (activeStep === steps.length - 1) {
      // Special case for last step - go to first step
      setActiveStep(0);
      setProgress(0);
      window.scrollTo(0, 0);
  } else {
      // If at first step, use the route back handler
      handleBack();
  }
};

  return (
    <div>
       <div>
          <div className=' flex justify-start'>
            {activeStep !== 0 && 
            (
            <button  onClick={handleBacks} className='flex gap-[5px] justify-center items-center'>
              <IoIosArrowBack className='text-[15px]'/> Back
            </button> 
            )}  
          </div>

          <div className='bg-bgSecondary w-full h-full p-[15px] rounded-[20px] mt-[16px]'>
              <div>
              <Box sx={{p: 1 }}>
                    <h1 className='text-[25px] font-[500] pb-[20px]'>{getProgressLabel()}</h1>
                    <ProgressBar steps={steps} progress={progress} />
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
              <div>
               {activeStep === 0 && ( 
                <SupplierProductDetails setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks}  />
                )}

                {activeStep === 1 && ( 
                <SupplierProductLocation setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks} />
                )}

                {activeStep === 2 && ( 
                <SupplierPaymentTerms setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks} />
                )}

                {
                  activeStep === 3 && ( 
                    <SupplierProductReview  setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks} />
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
    </div>
  )
}

export default SupplierListing

