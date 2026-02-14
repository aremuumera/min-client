import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { FormControl, InputLabel, FormHelperText } from '@/components/ui/form-control';
import { MenuItem } from '@/components/ui/menu';
import { Select } from '@/components/ui/select';
import { countryOptions } from "@/utils/CountriesState";
import PhoneNumberInput from "@/utils/PhoneNumberInput";
import CustomDatePicker from "@/utils/CustomDatePicker";
import { PiWarningLight } from "react-icons/pi";
import { Option } from "@/components/core/option";
import { useDispatch, useSelector } from 'react-redux';
import { updateRfqProductDetailsFormData, setStates } from '@/redux/features/buyer-rfq/rfq-slice';
import { Country, State } from "country-state-city";
import { useAppSelector } from "@/redux";
import { SearchableSelectLocal } from "@/components/ui/searchable-select-local";

const steps = [
  "Company Information",
  "Address Details",
  "Upload Document",
  "Confirm Details",
  "Approval Checking",
];

const BuyerAddressDetails = ({ handleNext, setActiveStep, activeStep, handleBack }: { handleNext: () => void, setActiveStep: (step: number) => void, activeStep: number, handleBack: () => void }) => {
  const dispatch = useDispatch();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState("");
  // const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const { rfqProductDetailsFormData, states } = useAppSelector((state) => state?.rfqProduct);


  const validateForm = () => {
    const newErrors: any = {};

    if (!rfqProductDetailsFormData?.selectedCountry) {
      newErrors.country = "Country is required";
    }

    if (!rfqProductDetailsFormData?.selectedState) {
      newErrors.state = "State is required";
    }

    if (!rfqProductDetailsFormData?.zipCode?.trim()) {
      newErrors.zipCode = "Zip code is required";
    }

    if (!rfqProductDetailsFormData?.streetNo?.trim()) {
      newErrors.streetNo = "Street number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    dispatch(updateRfqProductDetailsFormData({ [name]: value }));
    setErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: any) => {
    if (name === "selectedCountry") {
      const selectedCountryData = Country.getAllCountries().find(country => country.isoCode === value);
      setSelectedCountry(value); // Store isoCode for binding
      dispatch(setStates(State.getStatesOfCountry(value) || []));
      dispatch(updateRfqProductDetailsFormData({
        [name]: value,
        selectedCountryName: selectedCountryData?.name || "",
      }));
    } else if (name === "selectedState") {
      const selectedStateData = Object.values(states).find((state: any) => state.isoCode === value);
      setSelectedState(value); // Store isoCode for binding
      dispatch(updateRfqProductDetailsFormData({
        [name]: value,
        selectedStateName: selectedStateData?.name || "",
      }));
    } else {
      dispatch(updateRfqProductDetailsFormData({ [name]: value }));
    }
    setErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
  }


  console.log('states list:', Object.values(states).length);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // if (!validateForm()) {
    //   handleNext();
    // }
    handleNext();
  };

  console.log('formdata: ', rfqProductDetailsFormData,)

  return (
    <div className="lg:px-6 py-2">
      <div className="">
        {/* Example Form */}
        <form
          //  onSubmit={handleSubmit}
          className="">
          <div>
            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">
              {/* Selected  Country */}
              <div className="w-full">
                <SearchableSelectLocal
                  label="Country"
                  name="selectedCountry"
                  value={rfqProductDetailsFormData?.selectedCountry || ""}
                  onChange={(val: any) => handleSelectChange("selectedCountry", val)}
                  options={Country.getAllCountries().map(country => ({ value: country.isoCode, label: country.name, isoCode: country.isoCode }))}
                  placeholder="Select Country"
                />
                {errors.selectedCountry && <FormHelperText error>{errors.selectedCountry}</FormHelperText>}
              </div>

              {/* Selected  State */}
              <div className="w-full">
                <SearchableSelectLocal
                  label="State"
                  name="selectedState"
                  value={rfqProductDetailsFormData?.selectedState || ""}
                  onChange={(val: any) => handleSelectChange("selectedState", val)}
                  options={Object.values(states)?.map((state: any) => ({ value: state.isoCode, label: state.name, isoCode: state.isoCode })) || []}
                  placeholder="Select State"
                  disabled={!rfqProductDetailsFormData?.selectedCountry || Object.values(states).length === 0}
                />
                {errors.selectedState && <FormHelperText error>{errors.selectedState}</FormHelperText>}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Zip Code"
                fullWidth
                margin="normal"
                placeholder="Enter zip code"
                name="zipCode"
                value={rfqProductDetailsFormData?.zipCode || ''}
                onChange={handleInputChange}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
              />
              <TextField
                label="street No"
                fullWidth
                margin="normal"
                placeholder="Enter street number"
                name="streetNo"
                value={rfqProductDetailsFormData?.streetNo || ''}
                onChange={handleInputChange}
                error={!!errors.streetNo}
                helperText={errors.streetNo}
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
              disabled={activeStep === steps.length - 1}
              onClick={handleNext}
              variant="contained"
              color="primary"
              className="w-full"
              type="submit"
            >
              {"Save and Continue"}
            </Button>
          </div>
        </form>
        {/* Add other step forms here */}
      </div>



    </div>
  );
};

export default BuyerAddressDetails;

