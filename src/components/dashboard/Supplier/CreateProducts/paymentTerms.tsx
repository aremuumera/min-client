'use client'

import React, { useState } from 'react';
// TODO: Migrate CircularProgress from @mui/material
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/input';
// import { Select } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
import { PiWarningLight } from "react-icons/pi";
import { updateProductPaymentData, setServerReadyData } from '@/redux/features/supplier-products/products_slice';
import { useDispatch, useSelector } from 'react-redux';
import { useValidateProductStepMutation } from "@/redux/features/supplier-products/products_api";
import { toast } from '@/components/core/toaster';
import { useAppSelector } from '@/redux';
import { MultiCheckboxSelect } from '@/components/ui';

const steps = [
  "Create Product",
  "Product Location",
  "Payment Terms",
  "Confirm Product Information",
];

const SupplierPaymentTerms = ({ handleNext, setActiveStep, activeStep, handleBack }: {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}) => {
  const { productPaymentData, serverReadyData, serverReadyImagesData, serverReadyAttachmentData } = useAppSelector((state) => state?.product);
  const { user } = useAppSelector((state) => state?.auth);
  const dispatch = useDispatch();

  const [validateProductStep, { isLoading }] = useValidateProductStepMutation();
  const [formErrors, setFormErrors] = useState({});

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch(updateProductPaymentData({ [name]: value }));
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  // Validate form data
  const validateData = () => {
    const newErrors: any = {};

    // Check if payment terms are selected
    const pd = productPaymentData as any;
    if (!pd?.selectedPayments || pd.selectedPayments.length === 0) {
      newErrors.selectedPayments = "Payment terms selection is required";
    }

    // Check if shipping terms are selected
    if (!pd?.selectedShippings || pd.selectedShippings.length === 0) {
      newErrors.selectedShippings = "Shipping terms selection is required";
    }

    // Check payment terms description
    if (!pd?.paymentTermsDescribed || pd.paymentTermsDescribed.trim() === '') {
      newErrors.paymentTermsDescribed = "Payment terms description is required";
    }

    // Check shipping terms description
    if (!pd?.shippingTermsDescribed || pd.shippingTermsDescribed.trim() === '') {
      newErrors.shippingTermsDescribed = "Shipping terms description is required";
    }

    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0] as string;
      toast.error(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (validateData()) {
      try {
        // Create FormData and append step 3 fields
        const formDataToSend = new FormData();

        // Add step number
        formDataToSend.append('step', String(3));

        // Add all payment fields
        const pd = productPaymentData as any;
        // Add all payment fields
        if (pd?.selectedPayments) {
          pd.selectedPayments.forEach((payment: string, index: number) => {
            formDataToSend.append(`selectedPayments`, payment);
          });
        }

        if (pd?.selectedShippings) {
          pd.selectedShippings.forEach((shipping: string, index: number) => {
            formDataToSend.append(`selectedShipping`, shipping);
          });
        }

        formDataToSend.append('paymentsTermsDescribed', pd?.paymentTermsDescribed || '');
        formDataToSend.append('shippingTermsDescribed', pd?.shippingTermsDescribed || '');

        // Send the FormData to the API
        const response = await validateProductStep({
          supplierId: user?.id,
          body: formDataToSend,
        }).unwrap();

        console.log('Step 3 validation response:', response);

        toast.success(`${response?.message || 'Payment terms submitted successfully!'}`);

        // Update the Redux store with validated data from server
        const validatedData = response?.validatedData;
        dispatch(setServerReadyData(validatedData));

        if (response?.success) {
          handleNext();
        } else {
          // Handle validation errors from the server
          if (response?.error) {
            setFormErrors({
              serverError: response?.error || response?.message
            });
            toast.error(`${response?.error || 'Failed to submit payment details. Please try again.'}`);
          }
        }
      } catch (error: any) {
        console.error('Error validating step 3:', error);
        toast.error(`${error?.data?.error || 'Failed to submit payment details. Please try again.'}`);
        setFormErrors({
          serverError: error.response?.data?.message || 'Error submitting payment terms'
        });
      }
    }
  };

  console.log('ServerReadyData:', serverReadyData);
  console.log('serverReadyImagesData:', serverReadyImagesData);
  console.log('serverReadyAttachmentData:', serverReadyAttachmentData);

  return (
    <div>
      <div className="">
        <form onSubmit={handleSubmit} className="">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 pt-[30px] gap-[15px] items-start">
              <MultiCheckboxSelect
                label="Payment Terms"
                options={paymentTerms.map(t => ({ value: t.code, label: `${t.code} - ${t.name}` }))}
                value={(productPaymentData as any)?.selectedPayments || []}
                onChange={(val) => dispatch(updateProductPaymentData({ selectedPayments: val }))}
                placeholder="Select payment terms"
                errorMessage={(formErrors as any).selectedPayments}
                fullWidth
              />

              <MultiCheckboxSelect
                label="Shipping Terms"
                options={shippingTerms.map(t => ({ value: t.code, label: `${t.code} - ${t.name}` }))}
                value={(productPaymentData as any)?.selectedShippings || []}
                onChange={(val) => dispatch(updateProductPaymentData({ selectedShippings: val }))}
                placeholder="Select shipping terms"
                errorMessage={(formErrors as any).selectedShippings}
                fullWidth
              />
            </div>

            <div className="flex pt-[20px] flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                id="paymentTermsDescribed"
                label="Describe Payment Terms"
                fullWidth
                multiline
                placeholder="Kindly describe payment terms..."
                rows={4}
                name='paymentTermsDescribed'
                value={(productPaymentData as any)?.paymentTermsDescribed || ""}
                onChange={handleChange}
              // error={!!(formErrors as any).paymentTermsDescribed}
              // helperText={(formErrors as any).paymentTermsDescribed}
              />
              <TextField
                id="shippingTermsDescribed"
                label="Describe Shipping Terms"
                fullWidth
                multiline
                placeholder="Kindly describe shipping terms..."
                rows={4}
                name='shippingTermsDescribed'
                value={(productPaymentData as any)?.shippingTermsDescribed || ""}
                onChange={handleChange}
              // error={!!(formErrors as any).shippingTermsDescribed}
              // helperText={(formErrors as any).shippingTermsDescribed}
              />
            </div>

            {(formErrors as any).serverError && (
              <div className="text-red-500 mt-2 text-center">
                {(formErrors as any).serverError}
              </div>
            )}
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
              className="w-full min-h-[48px] bg-primary text-white disabled:opacity-70"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                activeStep === steps.length - 1 ? "Finish" : "Save and Continue"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentTerms;

export const paymentTerms = [
  { code: "T/T", name: "Telegraphic Transfer" },
  { code: "L/C", name: "Letter of Credit" },
  { code: "D/P", name: "Documents Against Payment" },
  { code: "D/A", name: "Documents Against Acceptance" },
  { code: "D/D", name: "Demand Draft" },
  { code: "PayPal", name: "Online Payment Service" },
  { code: "Other", name: "Other" },
];

export const shippingTerms = [
  { code: "EXW", name: "Ex Works" },
  { code: "FAS", name: "Free Alongside Ship" },
  { code: "FOB", name: "Free On Board" },
  { code: "FCA", name: "Free Carrier" },
  { code: "CFR", name: "Cost and Freight" },
  { code: "CPT", name: "Carriage Paid To" },
  { code: "CIF", name: "Cost, Insurance, and Freight" },
  { code: "DAP", name: "Delivered At Place" },
  { code: "DDP", name: "Delivered Duty Paid" },
  { code: "DPU", name: "Delivered at Place Unloaded" },
  { code: "Other", name: "Other" },
];