'use client'

import React, { useEffect, useState } from 'react';
import ProgressBar from '@/utils/progress_tracker';
import { Box } from '@/components/ui/box';
import { IoIosArrowBack } from 'react-icons/io';
import { useSelector } from 'react-redux';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import EditCompanyProfile, { supplierMockData } from './EditSupplierCompanyProducts/EditCompanyProfile';
import SupplierCompanyProfileContactInfo from './SupplierCompanyProfileContactInfo';
import SupplierCompanyProfileDescription from './SupplierCompanyProfileDescription';
import SupplierCompanyProfileLocation from './SupplierCompanyProfileLocation';
import { useAppSelector } from '@/redux';

const CompanyStoreProfile = () => {
  const [hasSubmittedStoreinfo, setSubmittedStoreinfo] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0); // Start at step 0 by default
  const [progress, setProgress] = useState(0); // Start at 0% progress
  const { profileCreated } = supplierMockData;
  const { appData } = useAppSelector((state) => state?.auth);

  // console.log('appData:', appData);
  const YO = appData?.isProfileCreated;

  useEffect(() => {
    // If profile already exists, skip to edit mode (step 3)
    if (YO) {
      setSubmittedStoreinfo(true);
      setActiveStep(3);
      setProgress(100);
    }
  }, [location, YO]);

  const getProgressLabel = () => {
    switch (activeStep) {
      case 1:
        return {
          header: 'Contact Information',
          paragraph: 'Upload your company contact information for more visibility',
        };
      case 2:
        return {
          header: 'Location Information',
          paragraph: 'Upload your company location information for more visibility',
        };
      case 3:
        return {
          header: 'Store Profile information',
          paragraph: 'Edit your store information',
        };
      default:
        return {
          header: 'Store Profile information',
          paragraph: 'Add your store information for more visibility',
        };
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

  const progressPerStep = 100 / (steps.length - 1);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      const newStep = activeStep + 1;
      setActiveStep(newStep);
      setProgress(Math.min(100, (newStep / (steps.length - 1)) * 100));
      window.scrollTo(0, 0);
    } else if (activeStep === 2) {
      // Special case when completing Location step (step 2)
      setActiveStep(3); // Move to edit mode
      setProgress(100); // Complete progress
    }
  };

  const handleBacks = () => {
    if (activeStep > 0) {
      const newStep = activeStep - 1;
      setActiveStep(newStep);
      setProgress(Math.max(0, (newStep / (steps.length - 1)) * 100));
      window.scrollTo(0, 0);
    } else {
      handleBack();
    }
  };

  const renderStepContent = () => {
    // Edit mode (step 3) shows for both new submissions and existing profiles
    if (activeStep === 3) {
      return (
        <EditCompanyProfile
          setActiveStep={setActiveStep}
          activeStep={activeStep}
          handleNext={handleNext}
          handleBack={handleBacks}
        />
      );
    }

    // Creation flow steps
    switch (activeStep) {
      case 0:
        return (
          <SupplierCompanyProfileDescription
            setActiveStep={setActiveStep}
            activeStep={activeStep}
            handleNext={handleNext}
            handleBack={handleBacks}
          />
        );
      case 1:
        return (
          <SupplierCompanyProfileContactInfo
            setActiveStep={setActiveStep}
            activeStep={activeStep}
            handleNext={handleNext}
            handleBack={handleBacks}
          />
        );
      case 2:
        return (
          <SupplierCompanyProfileLocation
            setActiveStep={setActiveStep}
            activeStep={activeStep}
            handleNext={handleNext} // This will move to step 3 (edit mode)
            handleBack={handleBacks}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="">
        <div>
          <div>
            <div className="flex justify-start">
              {activeStep !== 0 &&
                activeStep !== 3 && ( // Don't show back button in edit mode
                  <button onClick={handleBacks} className="flex gap-[5px] justify-center items-center">
                    <IoIosArrowBack className="text-[15px]" /> Back
                  </button>
                )}
            </div>

            <div className="bg-bgSecondary w-full h-full p-[15px] rounded-[20px] mt-[16px]">
              <div>
                <Box sx={{ p: 1 }}>
                  <h1 className="text-[25px] font-[500] pb-[8px]">{getProgressLabel().header}</h1>
                  <p className="text-[#969696c7] pb-[20px] text-[.85rem]">{getProgressLabel().paragraph}</p>
                  <ProgressBar steps={steps} progress={progress} />
                </Box>
              </div>
              <div>{renderStepContent()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyStoreProfile;

const steps = [
  'Company Description',
  'Contact Info',
  'Location',
  'Edit your Store Profile', // Edit mode
  // Note: 'Edit your Store Profile' is not included in steps since it's a separate mode
];
