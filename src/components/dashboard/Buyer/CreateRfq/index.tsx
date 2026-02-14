"use client";

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IoIosArrowBack } from "react-icons/io";
import ProgressBar from '@/utils/progress_tracker';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import RfqDetails from './rfqDetails';
import BuyerAddressDetails from './BuyerAddressDetails';
import RfqConfirmDetails from './rfqConfirmDetails';
import RfQProductReview from './rfqReview';

const BuyerRfQs = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  const [progress, setProgress] = useState(10);

  const getProgressLabel = () => {
    switch (activeStep) {
      // case 1:
      //   return 'Address details';
      // case 2:
      //   return 'Address details';
      // case 2:
      //   return "RFQ Review";
      default:
        return 'Create RFQ’s';
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

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      setProgress((prev) => Math.min(100, prev + (100 / (steps.length - 1))));
      window.scrollTo(0, 0);
    } else {
      setProgress(100);
    }
  };



  const handleBacks = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setProgress((prev) => (prev > 0 ? prev - 25 : 0)); // Increment progress
      window.scrollTo(0, 0)

    }
  };

  return (
    <div>
      <div>
        <div className=' flex justify-start'>
          {activeStep !== 0 &&
            (
              <button type="button" onClick={handleBacks} className='flex gap-[5px] justify-center items-center cursor-pointer hover:underline'>
                <IoIosArrowBack className='text-[15px]' /> Back
              </button>
            )}
        </div>

        <div className='bg-bgSecondary w-full h-full p-[15px] rounded-[20px] mt-[16px]'>
          <div>
            <Box sx={{ p: 1 }}>
              <h1 className='text-[25px] font-[500] pb-[20px]'>{getProgressLabel()}</h1>
              {/* <ProgressBar steps={steps} progress={progress} /> */}
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
              <RfqDetails setActiveStep={setActiveStep} activeStep={activeStep} handleNext={handleNext} handleBack={handleBacks} />
            )}

            {/* {activeStep === 1 && ( 
                <BuyerAddressDetails setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks} />
                )} */}


            {/* {activeStep === 1 && ( 
                <RfQProductReview setActiveStep={setActiveStep} activeStep={activeStep}  handleNext={handleNext} handleBack={handleBacks} />
                )} */}

            {activeStep === 2 && (
              <RfqConfirmDetails />
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerRfQs

const steps = [
  "RFQ’s details",
  // "Address details",
  // "RFQ Review",
  // "RFQ Uploaded Successfully",

];
