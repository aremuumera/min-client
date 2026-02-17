import React, { useEffect, useState, useMemo } from 'react';
import { useValidateProductStepMutation } from '@/redux/features/supplier-products/products_api';
import { setServerReadyData, updateProductLocation } from '@/redux/features/supplier-products/products_slice';
import { Button, TextField, SearchableSelect } from '@/components/ui';
import { Country, State } from 'country-state-city';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from '@/components/core/toaster';

const steps = ['Create Product', 'Product Location', 'Payment Terms', 'Confirm Product Information'];

const SupplierProductLocation = ({ handleNext, setActiveStep, activeStep, handleBack }: any) => {
  const [states, setStates] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const { productLocation } = useSelector((state: any) => state?.product);
  const { user, isTeamMember, ownerUserId } = useSelector((state: any) => state?.auth);
  const dispatch = useDispatch();

  const [validateProductStep, { isLoading }] = useValidateProductStepMutation();

  // Prepare country options
  const countryOptions = useMemo(() =>
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })),
    []);

  // Prepare state options
  const stateOptions = useMemo(() =>
    states.map((s: any) => ({ value: s.name, label: s.name })),
    [states]);

  // Handle country change
  const handleCountryChange = (event: any) => {
    const countryCode = event.target.value;
    const countryName = countryOptions.find((c) => c.value === countryCode)?.label;

    dispatch(
      updateProductLocation({
        selectedCountry: countryCode,
        selectedCountryName: countryName,
      })
    );

    setStates(State.getStatesOfCountry(countryCode));
    dispatch(updateProductLocation({ selectedState: '' }));
    setErrors((prevErrors: any) => ({ ...prevErrors, country: '' }));
  };

  // Handle state change
  const handleStateChange = (event: any) => {
    dispatch(updateProductLocation({ selectedState: event.target.value }));
    setErrors((prevErrors: any) => ({ ...prevErrors, state: '' }));
  };

  // Handle input changes for other fields
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    dispatch(updateProductLocation({ [name]: value }));
    setErrors((prevErrors: any) => ({ ...prevErrors, [name]: '' }));
  };

  // Load states when component mounts or country changes
  useEffect(() => {
    if (productLocation?.selectedCountry) {
      setStates(State.getStatesOfCountry(productLocation.selectedCountry));
    }
  }, [productLocation?.selectedCountry]);

  // Validate form fields
  const validateForm = () => {
    const newErrors: any = {};

    if (!productLocation?.selectedCountry) {
      newErrors.country = 'Country is required';
    }

    if (!productLocation?.selectedState) {
      newErrors.state = 'State is required';
    }

    if (!productLocation?.zipCode || !productLocation.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    }

    if (!productLocation?.streetNo || !productLocation.streetNo.trim()) {
      newErrors.streetNo = 'Street number is required';
    }

    if (!productLocation?.longitude || !productLocation.longitude.trim() || isNaN(productLocation.longitude)) {
      newErrors.longitude = 'Longitude is required and must be a number';
    }

    if (!productLocation?.latitude || !productLocation.latitude.trim() || isNaN(productLocation.latitude)) {
      newErrors.latitude = 'Latitude is required and must be a number';
    }

    if (!productLocation?.fullAddress || !productLocation.fullAddress.trim()) {
      newErrors.fullAddress = 'Full address is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0] as string;
      toast.error(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Create FormData and append step 2 fields
        const formDataToSend = new FormData();

        // Add step number
        formDataToSend.append('step', '2');

        // Add all location fields
        formDataToSend.append('fullAddress', productLocation.fullAddress || '');
        formDataToSend.append('latitude', String(productLocation.latitude || ''));
        formDataToSend.append('longitude', String(productLocation.longitude || ''));
        formDataToSend.append('selectedCountryName', productLocation.selectedCountryName || '');
        formDataToSend.append('selectedState', productLocation.selectedState || '');
        formDataToSend.append('streetNo', productLocation.streetNo || '');
        formDataToSend.append('zipCode', productLocation.zipCode || '');

        // Send the FormData to the API
        const response = await validateProductStep({
          supplierId: isTeamMember ? ownerUserId : user?.id,
          body: formDataToSend,
        }).unwrap();

        console.log('Step 2 validation response:', response);

        toast.success(`${response?.message || 'Product location submitted successfully!'}`);

        const validatedData = response?.validatedData;
        dispatch(setServerReadyData(validatedData));

        if (response?.success) {
          handleNext();
        } else {
          // Handle validation errors from the server
          if (response?.error) {
            setErrors({
              serverError: response?.error || response?.message,
            });
            toast.error(`${response?.error || 'Failed to submit product details. Please try again.'}`);
          }
        }
      } catch (error: any) {
        console.error('Error validating step 2:', error);
        toast.error(`${error?.data?.error || 'Failed to submit product details. Please try again.'}`);
        setErrors({
          serverError: error.response?.data?.message || 'Error submitting product location',
        });
      }
    }
  };

  return (
    <div>
      <div className="">
        <form className="" onSubmit={handleSubmit}>
          <div>
            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-start justify-center">
              <div className="w-full flex flex-col gap-1">
                <SearchableSelect
                  label="Country"
                  options={countryOptions}
                  value={productLocation?.selectedCountry || ''}
                  onChange={handleCountryChange}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  error={!!errors.country}
                  errorMessage={errors.country}
                />
              </div>

              <div className="w-full flex flex-col gap-1">
                <SearchableSelect
                  label="State"
                  options={stateOptions}
                  value={productLocation?.selectedState || ''}
                  onChange={handleStateChange}
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                  disabled={!productLocation?.selectedCountry || states.length === 0}
                  error={!!errors.state}
                  errorMessage={errors.state}
                  helperText="Kindly select your country before the state"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center pt-4">
              <div className="w-full">
                <TextField
                  label="Zip Code"
                  placeholder="Enter zip code"
                  name="zipCode"
                  value={productLocation?.zipCode || ''}
                  onChange={handleInputChange}
                  error={!!errors.zipCode}
                />
                {errors.zipCode && <span className="text-red-500 text-xs">{errors.zipCode}</span>}
              </div>
              <div className="w-full">
                <TextField
                  label="Street No"
                  placeholder="Enter street number"
                  name="streetNo"
                  value={productLocation?.streetNo || ''}
                  onChange={handleInputChange}
                />
                {errors.streetNo && <span className="text-red-500 text-xs">{errors.streetNo}</span>}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center pt-4">
              <div className="w-full">
                <TextField
                  label="Co-ordinates (Longitude)"
                  placeholder="Enter value"
                  name="longitude"
                  value={productLocation?.longitude || ''}
                  onChange={handleInputChange}
                />
                {errors.longitude && <span className="text-red-500 text-xs">{errors.longitude}</span>}
              </div>
              <div className="w-full">
                <TextField
                  label="Co-ordinates (Latitude)"
                  placeholder="Enter value"
                  name="latitude"
                  value={productLocation?.latitude || ''}
                  onChange={handleInputChange}
                />
                {errors.latitude && <span className="text-red-500 text-xs">{errors.latitude}</span>}
              </div>
            </div>

            <div className="pt-[20px]">
              <label className="text-sm font-medium mb-1 block">Full Address</label>
              <textarea
                id="fullAddress"
                className="w-full p-2 border rounded-md"
                placeholder="Enter your Company Full Address"
                rows={4}
                name="fullAddress"
                value={productLocation?.fullAddress || ''}
                onChange={handleInputChange}
              />
              {errors.fullAddress && <span className="text-red-500 text-xs">{errors.fullAddress}</span>}
            </div>

            {errors.serverError && <div className="text-red-500 mt-2 text-center">{errors.serverError}</div>}
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
              variant="contained"
              type="submit"
              disabled={isLoading || activeStep === steps.length - 1}
              className="w-full min-h-[48px] bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                'Loading...'
              ) : activeStep === steps.length - 1 ? (
                'Finish'
              ) : (
                'Save and Continue'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierProductLocation;
