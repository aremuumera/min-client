import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { useDispatch, useSelector } from "react-redux";
import { updateSupplierMediaInfo } from "@/redux/features/supplier-profile/supplier_profile_slice";
import validateSocialURL from "@/utils/helper";
import { useAppSelector } from "@/redux";

const SupplierCompanyProfileContactInfo = ({ handleNext, setActiveStep, activeStep, handleBack }:{
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}) => {
  const { supplierMediaInfo, profileDetailsFormData, profileDescriptionFields, supplierProfileLogo, supplierProfileBanner  } = useAppSelector((state) => state?.supplierProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(updateSupplierMediaInfo({ [name]: value })); // Update Redux state
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); // Clear errors for the field
  };

  // Validate form fields
  const validateForm = () => {
    let newErrors: any = {};

    // Required fields
    if (!supplierMediaInfo?.companyEmail) newErrors.companyEmail = "Company email is required.";
    if (!supplierMediaInfo?.companyPhone) newErrors.companyPhone = "Company phone number is required.";
    if (!supplierMediaInfo?.linkedIn) newErrors.linkedIn = "LinkedIn URL is required.";
    if (!supplierMediaInfo?.facebook) newErrors.facebook = "Facebook URL is required.";
    if (!supplierMediaInfo?.instagram) newErrors.instagram = "Instagram URL is required.";
    if (!supplierMediaInfo?.xSocial) newErrors.xSocial = "X (Twitter) URL is required.";
    // if (!supplierMediaInfo?.zipCode) newErrors.zipCode = "Zip code is required.";
    if (!supplierMediaInfo?.streetNo) newErrors.streetNo = "Street number is required.";
    if (!supplierMediaInfo?.fullAddress) newErrors.fullAddress = "Full address is required.";

    
    // Email validation
    if (supplierMediaInfo?.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierMediaInfo?.companyEmail)) {
      newErrors.companyEmail = "Invalid email address.";
    }

    // Phone number validation
    if (supplierMediaInfo?.companyPhone && !/^\d{10,15}$/.test(supplierMediaInfo?.companyPhone)) {
      newErrors.companyPhone = "Invalid phone number.";
    }

    // URL validation
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;    if (supplierMediaInfo?.linkedIn && !urlPattern.test(supplierMediaInfo?.linkedIn)) {
      newErrors.linkedIn = "Invalid LinkedIn URL.";
    }
    if (supplierMediaInfo?.linkedIn) {
      if (!validateSocialURL(supplierMediaInfo.linkedIn, 'linkedin')) {
        newErrors.linkedIn = "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)";
      }
    }
    
    if (supplierMediaInfo?.facebook) {
      if (!validateSocialURL(supplierMediaInfo.facebook, 'facebook')) {
        newErrors.facebook = "Please enter a valid Facebook URL (e.g., https://facebook.com/username)";
      }
    }

    if (supplierMediaInfo?.instagram) {
      if (!validateSocialURL(supplierMediaInfo.instagram, 'instagram')) {
        newErrors.instagram = "Please enter a valid Instagram URL (e.g., https://instagram.com/username)";
      }
    }
    if (supplierMediaInfo?.xSocial) {
      if (!validateSocialURL(supplierMediaInfo.xSocial, 'x')) {
        newErrors.xSocial = "Please enter a valid X (Twitter) URL (e.g., https://x.com/username)";
      }
    }

    // if (supplierMediaInfo?.xSocial && !urlPattern.test(supplierMediaInfo?.xSocial)) {
    //   newErrors.xSocial = "Invalid X (Twitter) URL.";
    // }

    console.log('Validation errors:', newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log('Failed validation for:', Object.keys(newErrors));
    }

    setErrors(newErrors); // Set errors
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      // console.log("Form data is valid:", supplierMediaInfo, profileDetailsFormData, profileDescriptionFields, supplierProfileLogo, supplierProfileBanner );
      handleNext(); // Proceed to the next step
    } else {
      console.log("Form has errors:", errors);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="">
        <div>
          {/* Company Email and Phone Number */}
          <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
            <div className="w-full">
              <TextField
                label="Company email address"
                name="companyEmail"
                fullWidth
                margin="normal"
                placeholder="eg... hello@mineralltd.com"
                value={supplierMediaInfo?.companyEmail || ""}
                onChange={handleInputChange}
                error={!!errors.companyEmail}
                helperText={errors.companyEmail}
              />
            </div>
            <div className="w-full">
              <TextField
                label="Company phone number"
                name="companyPhone"
                fullWidth
                margin="normal"
                placeholder="eg... 0801234567890"
                value={supplierMediaInfo?.companyPhone || ""}
                onChange={handleInputChange}
                error={!!errors.companyPhone}
                helperText={errors.companyPhone}
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
            <div className="w-full">
              <TextField
                label="Social media - LinkedIn"
                name="linkedIn"
                fullWidth
                margin="normal"
                placeholder="eg... https://linkedin.com/mineralltd"
                value={supplierMediaInfo?.linkedIn || ""}
                onChange={handleInputChange}
                error={!!errors.linkedIn}
                helperText={errors.linkedIn}
              />
            </div>
            <div className="w-full">
              <TextField
                label="Social media - Facebook"
                name="facebook"
                fullWidth
                margin="normal"
                placeholder="eg... https://facebook.com/mineralltd"
                value={supplierMediaInfo?.facebook || ""}
                onChange={handleInputChange}
                error={!!errors.facebook}
                helperText={errors.facebook}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
            <div className="w-full">
              <TextField
                label="Social media - Instagram"
                name="instagram"
                fullWidth
                margin="normal"
                placeholder="eg... https://instagram.com/mineralltd"
                value={supplierMediaInfo?.instagram || ""}
                onChange={handleInputChange}
                error={!!errors.instagram}
                helperText={errors.instagram}
              />
            </div>
            <div className="w-full">
              <TextField
                label="Social media - X"
                name="xSocial"
                fullWidth
                margin="normal"
                placeholder="eg... https://x.com/mineralltd"
                value={supplierMediaInfo?.xSocial || ""}
                onChange={handleInputChange}
                error={!!errors.xSocial}
                helperText={errors.xSocial}
              />
            </div>
          </div>

          {/* Zip Code and Street Number */}
          <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
            <div className="w-full">
              <TextField
                label="Zip Code"
                name="zipCode"
                fullWidth
                margin="normal"
                placeholder="Enter zip code"
                value={supplierMediaInfo?.zipCode || ""}
                onChange={handleInputChange}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
              />
            </div>
            <div className="w-full">
              <TextField
                label="Street No"
                name="streetNo"
                fullWidth
                margin="normal"
                placeholder="Enter street number"
                value={supplierMediaInfo?.streetNo || ""}
                onChange={handleInputChange}
                error={!!errors.streetNo}
                helperText={errors.streetNo}
              />
            </div>
          </div>

          {/* Full Address */}
          <div className="pt-[20px]">
            <TextField
              label="Full Address"
              name="fullAddress"
              fullWidth
              multiline
              placeholder="Enter your Company Full Address"
              rows={4}
              value={supplierMediaInfo?.fullAddress || ""}
              onChange={handleInputChange}
              error={!!errors.fullAddress}
              helperText={errors.fullAddress}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
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
            type="submit"
            variant="contained"
            color="primary"
            className="w-full"
          >
            {"Save and Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const steps = [
  "Company Description",
  "Contact Info",
  "Location",
  "Confirm details",
];

export default SupplierCompanyProfileContactInfo;