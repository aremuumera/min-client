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
import { toast } from "sonner";
import { useAppSelector } from '@/redux';

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
  const { productPaymentData,  serverReadyData, serverReadyImagesData, serverReadyAttachmentData } = useAppSelector((state) => state?.product);
  const { user } = useAppSelector((state) => state?.auth);
  const dispatch = useDispatch();
  
  const [validateProductStep, { isLoading }] = useValidateProductStepMutation();
  const [formErrors, setFormErrors] = useState({});

  // Handle payment terms selection
  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // For multiple select, access selectedOptions
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    dispatch(updateProductPaymentData({ selectedPayments: selectedOptions }));
    setFormErrors((prevErrors) => ({ ...prevErrors, selectedPayments: "" }));
  };

  // Handle shipping terms selection
  const handleShippingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    dispatch(updateProductPaymentData({ selectedShippings: selectedOptions }));
    setFormErrors((prevErrors) => ({ ...prevErrors, selectedShippings: "" }));
  };

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
        
        toast.success(`${response?.message || 'Payment terms submitted successfully!'}`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#4CAF50',
            color: '#fff',
          },
        });

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
            toast.error(`${response?.error || 'Failed to submit payment details. Please try again.'}`, {
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
        console.error('Error validating step 3:', error);
        toast.error(`${error?.data?.error || 'Failed to submit payment details. Please try again.'}`, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#f44336',
            color: '#fff',
          },
        });
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
            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">

              <div className="w-full">
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <select
                  multiple
                  name='selectedPayments'
                  value={(productPaymentData as any)?.selectedPayments || []}
                  onChange={handlePaymentChange}
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
                >
                  {paymentTerms.map((term) => (
                    <option key={term.code} value={term.code}>
                      {term.code} - {term.name}
                    </option>
                  ))}
                </select>
                {(formErrors as any).selectedPayments && <p className="text-red-500 text-xs mt-1">{(formErrors as any).selectedPayments}</p>}
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium mb-1">Shipping Terms</label>
                <select
                  multiple
                  name='selectedShippings'
                  value={(productPaymentData as any)?.selectedShippings || []}
                  onChange={handleShippingChange}
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
                >
                  {shippingTerms.map((term) => (
                    <option key={term.code} value={term.code}>
                      {term.code} - {term.name}
                    </option>
                  ))}
                </select>
                {(formErrors as any).selectedShippings && <p className="text-red-500 text-xs mt-1">{(formErrors as any).selectedShippings}</p>}
              </div>
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