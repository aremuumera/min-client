import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
import { useDispatch, useSelector } from "react-redux";
import { updateSupplierMediaInfo } from "@/redux/features/supplier-profile/supplier_profile_slice";
import validateSocialURL from "@/utils/helper";
import { useAppSelector } from "@/redux";

import { z } from 'zod';
import { toast } from 'sonner';

const contactSchema = z.object({
  companyEmail: z.string().min(1, 'Company email is required').email('Invalid email address'),
  companyPhone: z.string().min(1, 'Company phone number is required').regex(/^\d{10,15}$/, 'Invalid phone number'),
  linkedIn: z.string().min(1, 'LinkedIn URL is required').refine(val => validateSocialURL(val, 'linkedin'), 'Invalid LinkedIn URL'),
  facebook: z.string().min(1, 'Facebook URL is required').refine(val => validateSocialURL(val, 'facebook'), 'Invalid Facebook URL'),
  instagram: z.string().min(1, 'Instagram URL is required').refine(val => validateSocialURL(val, 'instagram'), 'Invalid Instagram URL'),
  xSocial: z.string().min(1, 'X (Twitter) URL is required').refine(val => validateSocialURL(val, 'x'), 'Invalid X URL'),
  zipCode: z.string().optional(),
  streetNo: z.string().min(1, 'Street number is required'),
  fullAddress: z.string().min(1, 'Full address is required'),
});

const SupplierCompanyProfileContactInfo = ({ handleNext, setActiveStep, activeStep, handleBack }: {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}) => {
  const { supplierMediaInfo } = useAppSelector((state) => state?.supplierProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch(updateSupplierMediaInfo({ [name]: value })); // Update Redux state
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); // Clear errors for the field
  };

  // Validate form fields
  const validateForm = () => {
    try {
      contactSchema.parse(supplierMediaInfo);
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      handleNext(); // Proceed to the next step
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
            className="w-full"
            type="button"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
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