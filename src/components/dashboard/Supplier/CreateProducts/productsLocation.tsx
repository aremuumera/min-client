import React, { useEffect, useState } from 'react';
import { useValidateProductStepMutation } from '@/redux/features/supplier-products/products_api';
import { setServerReadyData, updateProductLocation } from '@/redux/features/supplier-products/products_slice';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { Country, State } from 'country-state-city';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

const steps = ['Create Product', 'Product Location', 'Payment Terms', 'Confirm Product Information'];

const SupplierProductLocation = ({ handleNext, setActiveStep, activeStep, handleBack }: any) => {
  const [states, setStates] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const { productLocation } = useSelector((state: any) => state?.product);
  const { user } = useSelector((state: any) => state?.auth);
  const dispatch = useDispatch();

  const [validateProductStep, { isLoading }] = useValidateProductStepMutation();

  // Handle country change
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value;
    const countryName = Country.getAllCountries().find((country) => country.isoCode === countryCode)?.name;

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
  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
          supplierId: user?.id,
          body: formDataToSend,
        }).unwrap();

        console.log('Step 2 validation response:', response);

        toast.success(`${response?.message || 'Product location submitted successfully!'}`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#4CAF50',
            color: '#fff',
          },
        });

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
            toast.error(`${response?.error || 'Failed to submit product details. Please try again.'}`, {
              duration: 3000,
              position: 'top-right',
              style: {
                background: '#f44336',
                color: '#fff',
              },
            });
          }
        }
      } catch (error: any) {
        console.error('Error validating step 2:', error);
        toast.error(`${error?.data?.error || 'Failed to submit product details. Please try again.'}`, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#f44336',
            color: '#fff',
          },
        });
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
                <label className="text-sm font-medium">Country</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={productLocation?.selectedCountry || ''}
                  onChange={handleCountryChange}
                >
                  <option value="">Select</option>
                  {Country.getAllCountries().map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && <span className="text-red-500 text-xs">{errors.country}</span>}
              </div>

              <div className="w-full flex flex-col gap-1">
                <label className="text-sm font-medium">State</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={productLocation?.selectedState || ''}
                  onChange={handleStateChange}
                  disabled={states.length === 0}
                >
                  <option value="">Select</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {errors.state && <span className="text-red-500 text-xs">{errors.state}</span>}
                <p className="text-[#696969] text-[.75rem]">Kindly select your country before the state</p>
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
