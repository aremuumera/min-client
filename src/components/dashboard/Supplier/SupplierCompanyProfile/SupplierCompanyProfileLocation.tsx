import React, { useEffect, useState } from 'react';
import { useCreateStoreProfileMutation } from '@/redux/features/supplier-profile/supplier_profile_api';
import {
  resetProductState,
  updateSupplierLocationInfo,
} from '@/redux/features/supplier-profile/supplier_profile_slice';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/components/ui/menu';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/input';
import { FormControl, FormLabel as InputLabel } from '@/components/ui/form-control';
import { FormHelperText } from '@/components/ui/input';
import { CircularProgress } from '@/components/ui/progress';
import { Country, State, IState } from 'country-state-city';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RootState } from '@/redux/store';
import { clearAllFilesFromIndexedDB, getAllFilesFromIndexedDBForServer } from '@/utils/indexDb';

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

const SupplierCompanyProfileLocation = ({ handleNext, setActiveStep, activeStep, handleBack }: any) => {
  const {
    supplierLocationInfo,
    supplierMediaInfo,
    profileDetailsFormData,
    profileDescriptionFields,
    // supplierProfileLogo,
    // supplierProfileBanner,
  } = useSelector((state: RootState) => state.supplierProfile);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [states, setStates] = useState<IState[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  const dispatch = useDispatch();

  const [createStoreProfile, { isLoading }] = useCreateStoreProfileMutation();

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
    const countryName = Country.getAllCountries().find((country) => country.isoCode === countryCode)?.name;

    dispatch(
      updateSupplierLocationInfo({
        selectedCountry: countryCode,
        selectedCountryName: countryName,
      })
    );

    setStates(State.getStatesOfCountry(countryCode));
    dispatch(updateSupplierLocationInfo({ selectedState: '' }));
    setErrors((prevErrors) => ({ ...prevErrors, country: '' }));
  };

  // Handle state change
  const handleStateChange = (event: any) => {
    dispatch(updateSupplierLocationInfo({ selectedState: event.target.value }));
    setErrors((prevErrors) => ({ ...prevErrors, state: '' }));
  };

  // Validate form fields
  const validateForm = () => {
    let newErrors: Record<string, string> = {};
    const info = supplierLocationInfo as SupplierLocationInfo;

    if (!info?.longitude) newErrors.longitude = 'Longitude is required.';
    if (!info?.latitude) newErrors.latitude = 'Latitude is required.';
    if (!info?.fullAddress) newErrors.fullAddress = 'Full address is required.';
    if (!info?.selectedCountry) newErrors.country = 'Country is required.';
    if (!info?.selectedState) newErrors.state = 'State is required.';

    setErrors(newErrors); // Set errors
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handle form submission
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const [logoFiles, bannerFiles] = await Promise.all([
  //     getAllFilesFromIndexedDBForServer('supplierProfileLogo'),
  //     getAllFilesFromIndexedDBForServer('supplierProfileBanner')
  //   ]);

  //   const payload = {
  //     ...supplierLocationInfo,
  //     ...supplierMediaInfo,
  //     ...profileDetailsFormData,
  //     ...profileDescriptionFields,
  //     supplierProfileLogo: logoFiles,
  //     supplierProfileBanner: bannerFiles,
  //   };
  //   // console.log("Form data is valid:", supplierMediaInfo, profileDetailsFormData, );

  //    console.log("Form data payload", payload);

  //   if (!validateForm()) {
  //     console.log("Form data is valid:", supplierLocationInfo);
  //     handleNext(); // Proceed to the next step
  //   } else {
  //     console.log("Form has errors:", errors);
  //   }
  // };

  useEffect(() => {
    console.log('ResponseData state changed:', responseData);
  }, [responseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log('Form has errors:', errors);
      return;
    }

    try {
      // Get files from IndexedDB
      const [logoFiles, bannerFiles] = await Promise.all([
        getAllFilesFromIndexedDBForServer('supplierProfileLogo'),
        getAllFilesFromIndexedDBForServer('supplierProfileBanner'),
      ]);

      // Create FormData object
      // Create FormData object
      const formData = new FormData();
      const locationInfo = supplierLocationInfo as SupplierLocationInfo;

      // 1. Append location info
      formData.append('longitude', locationInfo.longitude || '');
      formData.append('latitude', locationInfo.latitude || '');
      formData.append('selectedCountry', locationInfo.selectedCountry || '');
      formData.append('selectedCountryName', locationInfo.selectedCountryName || '');
      formData.append('selectedState', locationInfo.selectedState || '');
      formData.append('fullAddress', locationInfo.fullAddress || '');
      formData.append('streetNo', locationInfo.streetNo || '');
      formData.append('zipCode', locationInfo.zipCode || '');

      // 2. Append company profile details
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

      // 3. Append social media info
      formData.append('facebook', supplierMediaInfo.facebook);
      formData.append('instagram', supplierMediaInfo.instagram);
      formData.append('linkedIn', supplierMediaInfo.linkedIn);
      formData.append('xSocial', supplierMediaInfo.xSocial);

      // 4. Append arrays and complex objects
      // formData.append('selectedPayments', JSON.stringify(supplierLocationInfo.selectedPayments));
      // formData.append('selectedShippings', JSON.stringify(supplierLocationInfo.selectedShippings));
      formData.append('productDetailDescription', JSON.stringify(profileDescriptionFields));

      // 5. Append files if they exist
      if (logoFiles && logoFiles.length > 0) {
        formData.append('logo', logoFiles[0]);
      }
      if (bannerFiles && bannerFiles.length > 0) {
        formData.append('banner', bannerFiles[0]);
      }

      // For debugging: Verify FormData before submission
      console.log('logoFiles', logoFiles);
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('🚀 Starting API call...'); // Add this

      // Call the API mutation
      const response = await createStoreProfile({
        profileData: formData,
        supplierId: user?.id,
      }).unwrap();

      console.log('✅ API Response received:', response); // This is crucial
      console.log('✅ Response type:', typeof response); // Add this
      console.log('✅ Response keys:', Object.keys(response || {}));

      console.log('API Response:', response);
      setResponseData(response.data);
      toast.success('Profile created successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#4CAF50',
          color: '#fff',
        },
      });

      // console.log("API Response:", response);
      dispatch(resetProductState());
      clearAllFilesFromIndexedDB('supplierProfileLogo')
        .then((data: any) => {
          console.log('all indexdb data cleared:', data);
        })
        .catch((error: any) => {
          console.error('Error:', error);
        });

      clearAllFilesFromIndexedDB('supplierProfileBanner')
        .then((data: any) => {
          console.log('all indexdb data cleared:', data);
        })
        .catch((error: any) => {
          console.error('Error:', error);
        });

      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(`${error?.data?.message + error?.data?.error || 'Profile creation failed'}`, {
        position: 'top-right',
        duration: 3000, // Corrected from autoClose
        style: {
          background: '#F44336',
          color: '#fff',
        },
      });
      console.error('Submission failed:', error);
      // Optionally show error to user
    }
  };

  const payload = {
    ...supplierLocationInfo,
    ...supplierMediaInfo,
    ...profileDetailsFormData,
    productDetailDescription: profileDescriptionFields,
    // supplierProfileLogo: logoFiles,
    // supplierProfileBanner: bannerFiles,
  };

  console.log('Form data payload', payload, supplierMediaInfo);

  return (
    <div>
      <form onSubmit={handleSubmit} className="">
        <div>
          <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
            <div className="w-full">
              <TextField
                label="Longitude"
                name="longitude"
                fullWidth
                margin="normal"
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
                margin="normal"
                placeholder="eg... 45.678"
                value={supplierLocationInfo?.latitude || ''}
                onChange={handleInputChange}
                error={!!errors.latitude}
                helperText={errors.latitude}
              />
            </div>
          </div>

          <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">
            <FormControl fullWidth error={!!errors.country}>
              <InputLabel>Country</InputLabel>
              <Select
                value={supplierLocationInfo?.selectedCountry || ''}
                onChange={handleCountryChange}
                className="w-full"
              >
                <MenuItem value="">Select</MenuItem>
                {Country.getAllCountries().map((country) => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.state}>
              <InputLabel>State</InputLabel>
              <Select
                value={supplierLocationInfo?.selectedState || ''}
                onChange={handleStateChange}
                disabled={states.length === 0}
                className="w-full"
              >
                <MenuItem value="">Select</MenuItem>
                {states.map((state) => (
                  <MenuItem key={state.isoCode} value={state.name}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
              <p className="text-[#696969] text-[.75rem]">Kindly select your country before the state</p>
            </FormControl>
          </div>

          <div className="pt-[20px]">
            <TextField
              id="fullAddress"
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
        </div>

        <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            color="primary"
            className="w-full"
          >
            Back
          </Button>
          <Button
            disabled={isLoading || activeStep === steps.length - 1}
            variant="contained"
            color="primary"
            className="w-full min-h-[48px]"
            type="submit"
          >
            {isLoading ? <CircularProgress size={24} className="text-white" /> : 'Save and Continue'}
          </Button>
        </div>
      </form>
      {showSuccessModal && (
        <SuccessModal
          onEdit={() => {
            setShowSuccessModal(false);
            // handleNext();
            window.location.reload();
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ zIndex: 2900 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4"
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
                console.log('Company name:', responseData?.company_name);
                console.log('Navigate function:', router.push);
                router.push(`/business/${responseData?.company_name}`);
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
