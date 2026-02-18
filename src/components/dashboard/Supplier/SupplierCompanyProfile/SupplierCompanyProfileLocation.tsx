import React, { useEffect, useState } from 'react';
import { useCreateStoreProfileMutation } from '@/redux/features/supplier-profile/supplier_profile_api';
import {
  resetProductState,
  updateSupplierLocationInfo,
} from '@/redux/features/supplier-profile/supplier_profile_slice';
import { Button, MenuItem, Select, TextField, FormControl, InputLabel, FormHelperText, CircularProgress, SearchableSelect } from '@/components/ui';
import { Country, State, IState } from 'country-state-city';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import { clearAllFilesFromIndexedDB, getAllFilesFromIndexedDBForServer } from '@/utils/indexDb';
import { z } from 'zod';

interface SupplierLocationInfo {
  longitude?: string;
  latitude?: string;
  fullAddress?: string;
  selectedCountry?: string;
  selectedCountryName?: string;
  selectedState?: string;
  streetNo?: string;
  zipCode?: string;
  [key: string]: any;
}

const locationSchema = z.object({
  selectedCountry: z.string().min(1, 'Country is required'),
  selectedState: z.string().min(1, 'State is required'),
  fullAddress: z.string().min(1, 'Full address is required'),
  longitude: z.string().min(1, 'Longitude is required'),
  latitude: z.string().min(1, 'Latitude is required'),
});

const SupplierCompanyProfileLocation = ({ handleNext, setActiveStep, activeStep, handleBack }: any) => {
  const {
    supplierLocationInfo,
    supplierMediaInfo,
    profileDetailsFormData,
    profileDescriptionFields,
  } = useSelector((state: RootState) => state.supplierProfile);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [states, setStates] = useState<IState[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const dispatch = useDispatch();
  const [createStoreProfile, { isLoading }] = useCreateStoreProfileMutation();
  const router = useRouter();

  // Prepare country options
  const countryOptions = React.useMemo(() =>
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })),
    []);

  // Prepare state options
  const stateOptions = React.useMemo(() =>
    states.map(s => ({ value: s.name, label: s.name })),
    [states]);

  useEffect(() => {
    if ((supplierLocationInfo as SupplierLocationInfo)?.selectedCountry) {
      setStates(State.getStatesOfCountry((supplierLocationInfo as SupplierLocationInfo).selectedCountry));
    }
  }, [(supplierLocationInfo as SupplierLocationInfo)?.selectedCountry]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    dispatch(updateSupplierLocationInfo({ [name]: value })); // Update Redux state
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' })); // Clear errors for the field
  };

  const handleCountryChange = (event: any) => {
    const countryCode = event.target.value;
    const countryName = countryOptions.find((c) => c.value === countryCode)?.label;

    dispatch(
      updateSupplierLocationInfo({
        selectedCountry: countryCode,
        selectedCountryName: countryName,
      })
    );

    setStates(State.getStatesOfCountry(countryCode));
    dispatch(updateSupplierLocationInfo({ selectedState: '' }));
    setErrors((prevErrors) => ({ ...prevErrors, selectedCountry: '' }));
  };

  // Handle state change
  const handleStateChange = (event: any) => {
    dispatch(updateSupplierLocationInfo({ selectedState: event.target.value }));
    setErrors((prevErrors) => ({ ...prevErrors, selectedState: '' }));
  };

  // Validate form fields
  const validateForm = () => {
    try {
      locationSchema.parse(supplierLocationInfo);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);

        const firstError = Object.values(newErrors)[0] as string;
        toast.error(firstError);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Get files from IndexedDB
      const [logoFiles, bannerFiles] = await Promise.all([
        getAllFilesFromIndexedDBForServer('supplierProfileLogo'),
        getAllFilesFromIndexedDBForServer('supplierProfileBanner'),
      ]);

      const formData = new FormData();
      const locationInfo = supplierLocationInfo as SupplierLocationInfo;

      // Append all required data
      formData.append('longitude', locationInfo.longitude || '');
      formData.append('latitude', locationInfo.latitude || '');
      formData.append('selectedCountry', locationInfo.selectedCountry || '');
      formData.append('selectedCountryName', locationInfo.selectedCountryName || '');
      formData.append('selectedState', locationInfo.selectedState || '');
      formData.append('fullAddress', locationInfo.fullAddress || '');
      formData.append('streetNo', locationInfo.streetNo || '');
      formData.append('zipCode', locationInfo.zipCode || '');

      formData.append('companyName', profileDetailsFormData.companyName);
      formData.append('companyEmail', supplierMediaInfo.companyEmail);
      formData.append('companyPhone', supplierMediaInfo.companyPhone);
      formData.append('yearEstablished', profileDetailsFormData.yearEstablished);
      formData.append('yearExperience', profileDetailsFormData.yearExperience);
      formData.append('totalEmployees', profileDetailsFormData.totalEmployees);
      formData.append('totalRevenue', profileDetailsFormData.totalRevenue);
      formData.append('businessType', profileDetailsFormData.businessType);
      formData.append('businessCategory', profileDetailsFormData.businessCategory);
      formData.append('companyDescription', profileDetailsFormData.companyDescription);

      formData.append('facebook', supplierMediaInfo.facebook);
      formData.append('instagram', supplierMediaInfo.instagram);
      formData.append('linkedIn', supplierMediaInfo.linkedIn);
      formData.append('xSocial', supplierMediaInfo.xSocial);

      formData.append('productDetailDescription', JSON.stringify(profileDescriptionFields));

      if (logoFiles && logoFiles.length > 0) {
        formData.append('logo', logoFiles[0]);
      }
      if (bannerFiles && bannerFiles.length > 0) {
        formData.append('banner', bannerFiles[0]);
      }

      const response = await createStoreProfile({
        profileData: formData,
        supplierId: user?.id,
      }).unwrap();

      setResponseData(response.data);
      toast.success('Profile created successfully');

      // Cleanup
      dispatch(resetProductState());
      await Promise.all([
        clearAllFilesFromIndexedDB('supplierProfileLogo'),
        clearAllFilesFromIndexedDB('supplierProfileBanner')
      ]);

      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.data?.error || 'Profile creation failed');
      console.error('Submission failed:', error);
    }
  };

  return (
    <div>
      <div className="lg:px-6 py-2">
        <form onSubmit={handleSubmit}>
          <div>
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <SearchableSelect
                  label="Country"
                  options={countryOptions}
                  value={supplierLocationInfo?.selectedCountry || ''}
                  onChange={handleCountryChange}
                  placeholder="Select country"
                  errorMessage={errors.selectedCountry}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <SearchableSelect
                  label="State"
                  options={stateOptions}
                  value={supplierLocationInfo?.selectedState || ''}
                  onChange={handleStateChange}
                  placeholder="Select state"
                  disabled={!supplierLocationInfo?.selectedCountry || states.length === 0}
                  errorMessage={errors.selectedState}
                  helperText={!supplierLocationInfo?.selectedCountry ? "Kindly select your country before the state" : ""}
                  fullWidth
                />
              </div>
            </div>

            <div className="flex flex-col pt-[15px] md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <TextField
                  label="Longitude"
                  name="longitude"
                  fullWidth
                  placeholder="eg... 123.456"
                  value={supplierLocationInfo?.longitude || ''}
                  onChange={handleInputChange}
                  error={!!errors.longitude}
                  helperText={errors.longitude}
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Latitude"
                  name="latitude"
                  fullWidth
                  placeholder="eg... 45.678"
                  value={supplierLocationInfo?.latitude || ''}
                  onChange={handleInputChange}
                  error={!!errors.latitude}
                  helperText={errors.latitude}
                />
              </div>
            </div>

            <div className="pt-[20px]">
              <TextField
                name="fullAddress"
                label="Full Address"
                fullWidth
                multiline
                placeholder="Enter your Company Full Address"
                rows={4}
                value={supplierLocationInfo?.fullAddress || ''}
                onChange={handleInputChange}
                error={!!errors.fullAddress}
                helperText={errors.fullAddress}
              />
            </div>

            <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                className="w-full"
                type="button"
              >
                Back
              </Button>
              <Button
                disabled={isLoading}
                variant="contained"
                className="w-full min-h-[48px]"
                type="submit"
              >
                {isLoading ? <CircularProgress size={24} className="text-white" /> : 'Finish'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {showSuccessModal && (
        <SuccessModal
          onEdit={() => {
            setShowSuccessModal(false);
            handleNext();
          }}
          responseData={responseData}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

const SuccessModal = ({ onEdit, onClose, responseData }: any) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
      style={{ zIndex: 2900 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="text-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 0.6 }}
          >
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-bold mt-4">Profile Created Successfully!</h2>
          <p className="mt-2 text-gray-600">Your supplier profile has been successfully created.</p>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outlined" onClick={onEdit} className="w-full sm:w-auto">
              Edit Profile
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                const slug = responseData?.slug || responseData?.company_name || '';
                router.push(`/business/${slug}`);
                onClose();
              }}
              className="w-full sm:w-auto"
            >
              View Profile
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const steps = ['Company Description', 'Contact Info', 'Location', 'Confirm details'];

export default SupplierCompanyProfileLocation;
