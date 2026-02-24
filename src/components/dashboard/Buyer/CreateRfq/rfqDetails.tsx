'use client'

import React, { useState } from 'react';
import { useCreateRFQMutation } from '@/redux/features/buyer-rfq/rfq-api';
import {
  deleteUploadedFile,
  resetProductState,
  setRfqSuccessData,
  setStates,
  setUploadedFiles,
  updateRfqProductDetailsFormData,
} from '@/redux/features/buyer-rfq/rfq-slice';
import {
  useGetCategoryQuery,
  useGetMainCategoryQuery,
  useGetSubCategoryQuery,
} from '@/redux/features/categories/cat_api';
import { config } from '@/lib/config';
const WEB_URL = config.site.url;
import { formatCompanyNameForUrl } from '@/lib/url-formatter';
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { paths } from '@/config/paths';
import { MoqUnits as Moq } from '@/lib/marketplace-data';
import { z } from 'zod';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormLabel as InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  ListItemText,
  FormHelperText,
  Chip,
} from '@/components/ui';
import { Loader2 } from 'lucide-react';
import {
  MdCheckCircle as CheckCircle,
  MdClose as Close,
  MdContentCopy as ContentCopy,
  MdShare as Share,
} from 'react-icons/md';
import { Country, State } from 'country-state-city';
import { FaUpload } from 'react-icons/fa6';
import { MdOutlineCancel } from 'react-icons/md';
import { PiWarningLight } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Option } from '@/components/core/option';
import { paymentTerms, shippingTerms } from '../../Supplier/CreateProducts/paymentTerms';
import { useAppDispatch, useAppSelector } from '@/redux';
import { SearchableSelectLocal } from '@/components/ui/searchable-select-local';
import { MultiCheckboxSelectLocal } from '@/components/ui/multi-checkbox-select-local';

const rfqSchema = z.object({
  rfqProductName: z.string().min(1, 'Product name is required'),
  durationOfSupply: z.string().min(1, 'Duration of supply is required'),
  quantityMeasure: z.string().min(1, 'Quantity measure is required'),
  quantityRequired: z.string().min(1, 'Quantity required is required'),
  deliveryPeriod: z.string().min(1, 'Delivery period is required'),
  rfqProductMainCategory: z.string().min(1, 'Main category is required'),
  rfqProductCategory: z.string().optional(),
  rfqProductSubCategory: z.string().min(1, 'Sub category is required'),
  rfqDescription: z.string().min(1, 'RFQ description is required'),
  paymentTermsDescribed: z.string().min(1, 'Payment terms description is required'),
  shippingTermsDescribed: z.string().min(1, 'Shipping terms description is required'),
  selectedPayments: z.array(z.string()).min(1, 'Select at least one payment term'),
  selectedShippings: z.array(z.string()).min(1, 'Select at least one shipping term'),
  purity_grade: z.string().optional(),
  moisture_max: z.string().optional(),
  packaging: z.string().optional(),
  sampling_method: z.string().optional(),
  inquiry_type: z.string().optional().default('immediate'),
  recurring_frequency: z.string().optional(),
  recurring_duration: z.string().optional(),
  is_inspection_required: z.boolean().optional().default(false),
  is_shipment_included: z.boolean().optional().default(false),
  urgency_level: z.string().optional().default('standard'),
});


interface CategoryItem {
  id: string;
  name: string;
  tag: string;
  original_id?: string;
  submenu?: boolean;
}

interface CategoryData {
  id?: string;
  children?: CategoryItem[];
  original_id?: string;
  name?: string;
  tag?: string;
  submenu?: boolean;
}

interface RfqFormData {
  rfqProductName?: string;
  durationOfSupply?: string;
  quantityMeasure?: string;
  quantityRequired?: string;
  deliveryPeriod?: string;
  rfqProductMainCategory?: string;
  rfqProductCategory?: string;
  rfqProductSubCategory?: string;
  category_tag?: string;
  productDestination?: string;
  selectedCountryName?: string;
  selectedStateName?: string;
  selectedPayments?: string[];
  selectedShippings?: string[];
  paymentTermsDescribed?: string;
  shippingTermsDescribed?: string;
  rfqDescription?: string;
  purity_grade?: string;
  moisture_max?: string;
  packaging?: string;
  sampling_method?: string;
  inquiry_type?: string;
  recurring_frequency?: string;
  recurring_duration?: string;
  is_inspection_required?: boolean;
  is_shipment_included?: boolean;
  urgency_level?: string;
  [key: string]: any;
}

const steps = ['Create Product', 'Product Location', 'Payment terms', 'Confirm Product Information'];

const RfqDetails = ({
  handleNext,
  setActiveStep,
  activeStep,
  handleBack,
}: {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [selectedShippings, setSelectedShippings] = useState<string[]>([]);
  const { rfqProductDetailsFormData, rfqSuccessData, states } = useAppSelector((state) => state?.rfqProduct);
  const typedFormData = rfqProductDetailsFormData as RfqFormData;
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state?.auth);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdRfqId, setCreatedRfqId] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<{
    mainCategory: CategoryItem;
    productCategory: CategoryItem;
    subCategory: CategoryItem;
  }>({
    mainCategory: { id: '', name: '', tag: '' },
    productCategory: { id: '', name: '', tag: '' },
    subCategory: { id: '', name: '', tag: '' },
  });

  const [createRFQ, { isLoading: isCreatingRfq }] = useCreateRFQMutation();

  const { data: mainCatData, isLoading: isMainCatLoading } = useGetMainCategoryQuery();

  const {
    data: productCatData,
    isLoading: isProductCatLoading,
    refetch: refetchProductCategories,
  } = useGetCategoryQuery(selectedCategories.mainCategory.tag, {
    skip: !selectedCategories.mainCategory.tag,
  });

  const {
    data: subCatData,
    isLoading: isSubCatLoading,
    refetch: refetchSubCategories,
  } = useGetSubCategoryQuery(selectedCategories.productCategory.id, { skip: !selectedCategories.productCategory.id });

  const handleCategoryChanges = (level: 'mainCategory' | 'productCategory' | 'subCategory', value: string, name: string = '', tag: string = '') => {
    setSelectedCategories((prev) => {
      const newState = { ...prev };

      // Update the selected category first
      newState[level] = {
        id: value,
        name: name,
        tag: tag,
      };

      const selectedProductCategory = productCatData?.children?.find(
        (cat: CategoryItem) => (cat.original_id || cat.id) === newState.productCategory.id
      );

      // Reset downstream selections when upstream changes
      if (level === 'mainCategory') {
        newState.productCategory = { id: '', name: '', tag: '' };
        newState.subCategory = { id: '', name: '', tag: '' };
      } else if (level === 'productCategory' && selectedProductCategory?.submenu) {
        newState.subCategory = { id: '', name: '', tag: '' };
      }

      let finalCategoryTag = '';
      if (newState.subCategory.tag) {
        finalCategoryTag = newState.subCategory.tag;
      } else if (newState.productCategory.tag) {
        finalCategoryTag = newState.productCategory.tag;
      } else if (newState.mainCategory.tag) {
        finalCategoryTag = newState.mainCategory.tag;
      }

      // Update the form data
      // Prepare the form data update
      const formDataUpdate: Partial<RfqFormData> = {
        rfqProductMainCategory: newState.mainCategory.name,
        rfqProductCategory: newState.productCategory.name,
        category_tag: finalCategoryTag,
      };

      // If the product category has submenu AND a sub-category is selected, include it
      if (selectedProductCategory?.submenu && newState.subCategory.id !== '') {
        formDataUpdate.rfqProductSubCategory = newState.subCategory.name;
      }
      // If the product category does NOT have submenu, explicitly remove sub-category from Redux
      else {
        formDataUpdate.rfqProductSubCategory = ''; // Clear it from Redux
      }

      // Update the form data
      dispatch(updateRfqProductDetailsFormData(formDataUpdate));
      return newState;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(updateRfqProductDetailsFormData({ [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: any) => {
    dispatch(updateRfqProductDetailsFormData({ [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      const validFiles = fileArray.filter((file) => {
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
        const maxSizeMB = isVideo ? 15 : 5;

        if (file.size > maxSize) {
          toast.error(`${file.name} exceeds ${maxSizeMB}MB limit and won't be uploaded`, {
            position: 'top-right',
            style: {
              background: '#f44336',
              color: '#fff',
            },
            duration: 3000,
          });
          return false;
        }
        const allowedTypes = [
          'image/png', 'image/jpeg', 'image/webp',
          'video/mp4',
          'application/pdf'
        ];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} has unsupported format`, {
            position: 'top-right',
            style: {
              background: '#f44336',
              color: '#fff',
            },
            duration: 3000,
          });
          return false;
        }

        // Video check - max 1 video
        if (file.type.startsWith('video/')) {
          const videoCount = uploadedFiles.filter(f => f.type.startsWith('video/')).length +
            fileArray.filter((f, i) => f.type.startsWith('video/') && i < fileArray.indexOf(file)).length;
          if (videoCount >= 1) {
            toast.error('Only one video can be uploaded', {
              position: 'top-right',
            });
            return false;
          }
        }

        return true;
      });

      if (validFiles.length + uploadedFiles.length > 5) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productImages: 'Maximum of 5 attachments is required',
        }));
        toast.error('Maximum of 5 attachments allowed', {
          position: 'top-right',
          style: {
            background: '#f44336',
            color: '#fff',
          },
          duration: 3000,
        });
        return;
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));
      }

      // Update both local state and redux store
      const onDrop = (files: File[]) => {
        setUploadedFiles((prev: File[]) => [...prev, ...files]);
      };
      const newFiles = [...(uploadedFiles as File[]), ...validFiles];
      setUploadedFiles(newFiles);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'productDestination') {
      const selectedCountryData = Country.getAllCountries().find((country) => country.isoCode === value);
      setSelectedCountry(value); // Store isoCode for binding
      dispatch(setStates(State.getStatesOfCountry(value) || []));
      dispatch(
        updateRfqProductDetailsFormData({
          [name]: value,
          selectedCountryName: selectedCountryData?.name || '',
        })
      );
    } else if (name === 'selectedState') {
      const selectedStateData = states.find((state: any) => state.isoCode === value);
      setSelectedState(value); // Store isoCode for binding
      dispatch(
        updateRfqProductDetailsFormData({
          [name]: value,
          selectedStateName: selectedStateData?.name || '',
        })
      );
    } else {
      dispatch(updateRfqProductDetailsFormData({ [name]: value }));
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  // console.log('uploadedFiles:', uploadedFiles)
  const handleDeleteFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);

    toast.success('File removed successfully', {
      position: 'top-right',
      style: { background: '#4CAF50', color: '#fff' },
      duration: 3000,
    });
  };

  const validateForm = () => {
    try {
      const dataToValidate = {
        rfqProductName: rfqProductDetailsFormData?.rfqProductName || '',
        durationOfSupply: rfqProductDetailsFormData?.durationOfSupply || '',
        quantityMeasure: rfqProductDetailsFormData?.quantityMeasure || '',
        quantityRequired: rfqProductDetailsFormData?.quantityRequired || '',
        deliveryPeriod: rfqProductDetailsFormData?.deliveryPeriod || '',
        rfqDescription: rfqProductDetailsFormData?.rfqDescription || '',
        paymentTermsDescribed: rfqProductDetailsFormData?.paymentTermsDescribed || '',
        shippingTermsDescribed: rfqProductDetailsFormData?.shippingTermsDescribed || '',
        rfqProductMainCategory: typedFormData?.rfqProductMainCategory || selectedCategories.mainCategory.name || '',
        rfqProductCategory: typedFormData?.rfqProductCategory || selectedCategories.productCategory.name || '',
        rfqProductSubCategory: typedFormData?.rfqProductSubCategory || selectedCategories.subCategory.name || '',
        selectedPayments: rfqProductDetailsFormData?.selectedPayments || [],
        selectedShippings: rfqProductDetailsFormData?.selectedShippings || [],
        purity_grade: rfqProductDetailsFormData?.purity_grade || '',
        moisture_max: rfqProductDetailsFormData?.moisture_max || '',
        packaging: rfqProductDetailsFormData?.packaging || '',
        sampling_method: rfqProductDetailsFormData?.sampling_method || '',
        inquiry_type: rfqProductDetailsFormData?.inquiry_type || 'immediate',
        urgency_level: rfqProductDetailsFormData?.urgency_level || 'standard',
      };

      rfqSchema.parse(dataToValidate);
      setErrors({});
      return { isValid: true, errors: {} };
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);
        return { isValid: false, errors: newErrors };
      }
      return { isValid: false, errors: {} };
    }
  };

  // console.log("Form submitted successfully:", rfqProductDetailsFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { isValid, errors: validationErrors } = validateForm();
      if (!isValid) {
        const firstErrorMessage = Object.values(validationErrors)[0] || 'Please fill all required fields.';

        toast.error(firstErrorMessage, {
          position: 'top-right',
          style: {
            background: '#f44336',
            color: '#fff',
          },
          duration: 3000,
        });

        return;
      }

      const formData = new FormData();
      // console.log('you', formData)  countryCode

      // Correct the field name (remove the extra 's')
      formData.append('deliveryPeriod', typedFormData.deliveryPeriod || '');
      formData.append('durationOfSupply', typedFormData.durationOfSupply || '');
      formData.append('productDestination', typedFormData.selectedCountryName || '');
      formData.append('quantityMeasure', typedFormData.quantityMeasure || '');
      formData.append('quantityRequired', typedFormData.quantityRequired || '');
      formData.append('rfqDescription', typedFormData.rfqDescription || '');
      formData.append('rfqProductCategory', typedFormData.rfqProductCategory || '');
      formData.append('countryCode', typedFormData.productDestination || '');

      formData.append('rfqProductName', typedFormData.rfqProductName?.trim() || '');
      formData.append('rfqProductMainCategory', typedFormData.rfqProductMainCategory || '');
      if (typedFormData.rfqProductSubCategory) {
        formData.append('rfqProductSubCategory', typedFormData.rfqProductSubCategory);
      }
      formData.append('category_tag', typedFormData.category_tag || '');

      // Fix the typo here - remove the extra 's'
      formData.append('paymentsTermsDescribed', (typedFormData.paymentTermsDescribed || '').trim());
      formData.append('shippingTermsDescribed', (typedFormData.shippingTermsDescribed || '').trim());

      formData.append('purity_grade', typedFormData.purity_grade || '');
      formData.append('moisture_max', typedFormData.moisture_max || '');
      formData.append('packaging', typedFormData.packaging || '');
      formData.append('sampling_method', typedFormData.sampling_method || '');

      const paymentsArray = Array.isArray(typedFormData.selectedPayments)
        ? typedFormData.selectedPayments
        : [typedFormData.selectedPayments];

      if (typedFormData.selectedPayments && typedFormData.selectedPayments.length > 0) {
        typedFormData.selectedPayments.forEach((payment: string) => {
          formData.append('selectedPayments', payment);
        });
      }

      formData.append('inquiry_type', typedFormData.inquiry_type || 'immediate');
      formData.append('recurring_frequency', typedFormData.recurring_frequency || '');
      formData.append('recurring_duration', typedFormData.recurring_duration || '');
      formData.append('is_inspection_required', String(typedFormData.is_inspection_required || false));
      formData.append('is_shipment_included', String(typedFormData.is_shipment_included || false));
      formData.append('urgency_level', typedFormData.urgency_level || 'standard');

      if (typedFormData.selectedShippings && typedFormData.selectedShippings.length > 0) {
        typedFormData.selectedShippings.forEach((shipping: string) => {
          formData.append('selectedShippings', shipping);
        });
      }

      // Add files
      if (uploadedFiles && uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          formData.append(`rfqAttachment`, file);
        });
      }
      console.log('you', formData);
      const res = await createRFQ({
        buyerId: isTeamMember ? ownerUserId : user?.id,
        rfqData: formData,
      }).unwrap();
      console.log('res', res);

      toast.success('RFQ created successfully', {
        position: 'top-right',
        style: {
          background: '#4CAF50',
          color: '#fff',
        },
      });

      dispatch(
        setRfqSuccessData({
          name: res?.data?.rfqProductName,
          id: res?.data?.rfqId,
        })
      );

      dispatch(resetProductState());
      dispatch(updateRfqProductDetailsFormData({}));
      setErrors({});
      setUploadedFiles([]);
      setSuccessModalOpen(true);

      // Properly inspect FormData (FormData doesn't show in console.log)
      console.log('Form Data Contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Now you can submit your formData to an API
      // Example: submitFormData(formData);

      // handleNext();
    } catch (error: any) {
      console.error(`Error creating RFQ:`, error);
      toast.error(`${error?.data?.message || error?.error || 'Error creating RFQ'}`, {
        position: 'top-right',
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
    }
  };

  // console.log('res', rfqSuccessData)

  const isLocal = process.env.NODE_ENV === 'development';

  const theWebUrl = (isLocal ? 'http://localhost:3000' : `${WEB_URL}`).replace(/\/$/, '');

  const rfqPath = paths.marketplace.rfqDetails(
    rfqSuccessData?.id || '',
    rfqSuccessData?.name ? formatCompanyNameForUrl(rfqSuccessData?.name) : ''
  );

  const viewCopyLink = `${theWebUrl}${rfqPath}`;

  const handleViewRfq = () => {
    // Navigate to the RFQ detail page
    window.open(viewCopyLink, '_blank');
    setSuccessModalOpen(false);
  };

  // console.log('updateRfqProductDetails:', rfqProductDetailsFormData)

  return (
    <div>
      <div className="lg:px-6 ">
        <form onSubmit={handleSubmit}>
          <div>
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Looking For"
                fullWidth
                margin="normal"
                placeholder="Enter mineral name"
                name="rfqProductName"
                value={typedFormData?.rfqProductName || ''}
                onChange={handleInputChange}
                error={!!errors.rfqProductName}
                helperText={errors.rfqProductName}
              />
              <TextField
                label="Duration of supply"
                fullWidth
                margin="normal"
                name="durationOfSupply"
                placeholder="e.g. 2 months, 3weeks, 4months"
                value={typedFormData?.durationOfSupply || ''}
                onChange={handleInputChange}
                error={!!errors.durationOfSupply}
                helperText={errors.durationOfSupply}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center ">
              <TextField
                label="Purity / Grade"
                fullWidth
                margin="normal"
                placeholder="e.g. 95%+, Grade A"
                name="purity_grade"
                value={typedFormData?.purity_grade || ''}
                onChange={handleInputChange}
                error={!!errors.purity_grade}
                helperText={errors.purity_grade}
              />
              <TextField
                label="Max Moisture (%)"
                fullWidth
                margin="normal"
                placeholder="e.g. 5.1"
                name="moisture_max"
                type="number"
                value={typedFormData?.moisture_max || ''}
                onChange={handleInputChange}
                error={!!errors.moisture_max}
                helperText={errors.moisture_max}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Packaging"
                fullWidth
                margin="normal"
                placeholder="e.g. 50kg Bags, Bulk"
                name="packaging"
                value={typedFormData?.packaging || ''}
                onChange={handleInputChange}
                error={!!errors.packaging}
                helperText={errors.packaging}
              />
              <TextField
                label="Sampling Method"
                fullWidth
                margin="normal"
                placeholder="e.g. SGS, Bureau Veritas"
                name="sampling_method"
                value={typedFormData?.sampling_method || ''}
                onChange={handleInputChange}
                error={!!errors.sampling_method}
                helperText={errors.sampling_method}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center ">
              <FormControl fullWidth error={!!errors.quantityMeasure}>
                <SearchableSelectLocal
                  label="Quantity(measured)"
                  name="quantityMeasure"
                  value={typedFormData?.quantityMeasure || ''}
                  onChange={(val: any) => handleSelectChange('quantityMeasure', val)}
                  options={Moq.map(unit => ({ value: unit, label: unit }))}
                  placeholder="Select Quantity e.g (tons, kg)"
                />
                {errors.quantityMeasure && <FormHelperText error>{errors.quantityMeasure}</FormHelperText>}
              </FormControl>

              {/* Quantity required */}
              <TextField
                label="Quantity required"
                fullWidth
                margin="normal"
                placeholder="Enter quantity amount e.g 20, 2000, 100"
                name="quantityRequired"
                value={typedFormData?.quantityRequired || ''}
                onChange={handleInputChange}
                error={!!errors.quantityRequired}
                helperText={errors.quantityRequired}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px]  items-center justify-center">
              <div className="w-full">
                <SearchableSelectLocal
                  label="Main Product Category"
                  name="mainCategory"
                  value={selectedCategories.mainCategory.id}
                  onChange={(val: any) => {
                    const selected = mainCatData.find((cat: CategoryData) => (cat.original_id || cat.id) === val);
                    handleCategoryChanges('mainCategory', val, selected?.name, selected?.tag);
                  }}
                  options={mainCatData?.map((cat: CategoryData) => ({
                    value: cat.original_id || cat.id,
                    label: cat.name
                  })) || []}
                  placeholder="Select a main category"
                  disabled={isMainCatLoading}
                />
                {errors.rfqProductMainCategory && <FormHelperText error>{errors.rfqProductMainCategory}</FormHelperText>}
              </div>

              {selectedCategories.mainCategory.id &&
                mainCatData?.find((cat: CategoryData) => cat.original_id === selectedCategories.mainCategory.id)?.submenu && (
                  <div className="w-full">
                    <SearchableSelectLocal
                      label="Product Category"
                      name="productCategory"
                      value={selectedCategories.productCategory.id}
                      onChange={(val: any) => {
                        const selected = productCatData?.children?.find((cat: CategoryItem) => (cat.original_id || cat.id) === val);
                        handleCategoryChanges('productCategory', val, selected?.name, selected?.tag);
                      }}
                      options={productCatData?.children?.map((cat: CategoryItem) => ({
                        value: cat.original_id || cat.id,
                        label: cat.name
                      })) || []}
                      placeholder="Select a category"
                      disabled={isProductCatLoading}
                    />
                    {errors.rfqProductCategory && <FormHelperText error>{errors.rfqProductCategory}</FormHelperText>}
                  </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-[15px]  items-center justify-center">
              {selectedCategories.productCategory.id &&
                productCatData?.children?.find((cat: CategoryItem) => cat.original_id === selectedCategories.productCategory.id)
                  ?.submenu && (
                  <div className="w-full">
                    <SearchableSelectLocal
                      label="Product Sub Category"
                      name="subCategory"
                      value={selectedCategories.subCategory.id}
                      onChange={(val: any) => {
                        const selected = subCatData?.children?.find((cat: CategoryItem) => (cat.original_id || cat.id) === val);
                        handleCategoryChanges('subCategory', val, selected?.name, selected?.tag);
                      }}
                      options={subCatData?.children?.map((cat: CategoryItem) => ({
                        value: cat.original_id || cat.id,
                        label: cat.name
                      })) || []}
                      placeholder="Select a sub-category"
                      disabled={isSubCatLoading}
                    />
                    {errors.rfqProductSubCategory && <FormHelperText error>{errors.rfqProductSubCategory}</FormHelperText>}
                  </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Del Period"
                fullWidth
                margin="normal"
                name="deliveryPeriod"
                placeholder="e.g. 2 months, 3weeks, 4months"
                value={typedFormData?.deliveryPeriod || ''}
                onChange={handleInputChange}
                error={!!errors.deliveryPeriod}
                helperText={errors.deliveryPeriod}
              />

              <div className="w-full">
                <SearchableSelectLocal
                  label="Product Destination"
                  name="productDestination"
                  value={typedFormData?.productDestination || ''}
                  onChange={(val: any) => {
                    const selectedCountryData = Country.getAllCountries().find((country) => country.isoCode === val);
                    setSelectedCountry(val);
                    dispatch(setStates(State.getStatesOfCountry(val) || []));
                    dispatch(
                      updateRfqProductDetailsFormData({
                        productDestination: val,
                        selectedCountryName: selectedCountryData?.name || '',
                      })
                    );
                    setErrors((prevErrors) => ({ ...prevErrors, productDestination: '' }));
                  }}
                  options={Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name, isoCode: c.isoCode }))}
                  placeholder="Select Destination"
                />
                {errors.productDestination && <FormHelperText error>{errors.productDestination}</FormHelperText>}
              </div>
            </div>

            <div className="flex flex-col pt-[10px] md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <MultiCheckboxSelectLocal
                  label="Shipping Terms"
                  name="selectedShippings"
                  value={typedFormData?.selectedShippings || []}
                  onChange={(val: any[]) => handleSelectChange('selectedShippings', val)}
                  options={shippingTerms.map(term => ({ value: term.code, label: `${term.code} - ${term.name}` }))}
                  placeholder="Select Shipping Terms"
                />
                {errors.selectedShippings && <FormHelperText error>{errors.selectedShippings}</FormHelperText>}
              </div>

              <div className="w-full">
                <MultiCheckboxSelectLocal
                  label="Payment Terms"
                  name="selectedPayments"
                  value={typedFormData?.selectedPayments || []}
                  onChange={(val: any[]) => handleSelectChange('selectedPayments', val)}
                  options={paymentTerms.map(term => ({ value: term.code, label: `${term.code} - ${term.name}` }))}
                  placeholder="Select Payment Terms"
                />
                {errors.selectedPayments && <FormHelperText error>{errors.selectedPayments}</FormHelperText>}
              </div>
            </div>

            <div className="flex pt-[10px] flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                id="message"
                label="Describe Payment Terms"
                fullWidth
                multiline
                placeholder="Kindly describe payment terms..."
                rows={4}
                name="paymentTermsDescribed"
                value={typedFormData?.paymentTermsDescribed || ''}
                onChange={handleInputChange}
                error={!!errors.paymentTermsDescribed}
                helperText={errors.paymentTermsDescribed}
              />
              <TextField
                id="message"
                label="Describe Shipping Terms"
                fullWidth
                multiline
                placeholder="Kindly describe shipping terms... "
                rows={4}
                name="shippingTermsDescribed"
                value={typedFormData?.shippingTermsDescribed || ''}
                onChange={handleInputChange}
                error={!!errors.shippingTermsDescribed}
                helperText={errors.shippingTermsDescribed}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] pt-4 items-center">
              <FormControl fullWidth>
                <InputLabel className='mb-1 '>Inquiry Type</InputLabel>
                <Select
                  name="inquiry_type"
                  value={typedFormData?.inquiry_type || 'immediate'}
                  onChange={(e: any) => handleInputChange(e as any)}
                >
                  <MenuItem value="immediate">Individual (One-time)</MenuItem>
                  <MenuItem value="recurring">Recurring (Supply Chain)</MenuItem>
                </Select>
              </FormControl>

              {typedFormData?.inquiry_type === 'recurring' && (
                <div className="w-full flex gap-3">
                  <FormControl fullWidth>
                    <InputLabel className='mb-1'>Frequency</InputLabel>
                    <Select
                      name="recurring_frequency"
                      value={typedFormData?.recurring_frequency || 'monthly'}
                      onChange={(e: any) => handleInputChange(e as any)}
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Duration (Months)"
                    name="recurring_duration"
                    type="number"
                    value={typedFormData?.recurring_duration || ''}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 items-center">
              <FormControl fullWidth>
                <InputLabel className='mb-1'>Urgency Level</InputLabel>
                <Select
                  name="urgency_level"
                  value={typedFormData?.urgency_level || 'standard'}
                  onChange={(e: any) => handleInputChange(e as any)}
                >
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>

              <div className="w-full flex flex-col gap-2">
                <div
                  onClick={() => dispatch(updateRfqProductDetailsFormData({ is_inspection_required: !typedFormData?.is_inspection_required }))}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${typedFormData?.is_inspection_required ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <Checkbox checked={!!typedFormData?.is_inspection_required} color="success" readOnly />
                  <Typography variant="body2" className='font-semibold'>Request Inspection</Typography>
                </div>
                <div
                  onClick={() => dispatch(updateRfqProductDetailsFormData({ is_shipment_included: !typedFormData?.is_shipment_included }))}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${typedFormData?.is_shipment_included ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <Checkbox checked={!!typedFormData?.is_shipment_included} color="success" readOnly />
                  <Typography variant="body2" className='font-semibold'>Include Shipment</Typography>
                </div>
              </div>
            </div>

            <div>
              <div className="py-[20px]">
                <h2 className="font-medium text-[1.4rem]">Upload RFQ Attachemnt (Optional)</h2>
                <p className="text-[#838383] text-[.9rem] ">Maximum of 5 attachment is required</p>
              </div>
              <Box
                sx={{
                  width: '100%',
                  height: '150px',
                  border: '2px dashed #ccc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: '#ffff',
                  '&:hover': {
                    backgroundColor: '#f7f7f7',
                  },
                }}
                onClick={() => {
                  const input = document.getElementById('file-upload');
                  if (input) input.click();
                }}
              >
                <FaUpload size={20} color="#888" />
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  placeholder="Click to Upload/browse file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/webp, video/mp4, application/pdf"
                />
                <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
                <p className="text-[#696969] text-[.75rem]">
                  Images/Docs must not exceed 5MB, Video 15MB | Max 1 Video | Supported: *jpg, *png, *webp, *mp4, *pdf
                </p>
              </Box>
              <div className="pt-[10px]">
                {uploadedFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-[10px]">
                    {uploadedFiles?.map((fileName, index) => (
                      <Box
                        key={index}
                        className="p-1 relative bg-neutral-50 rounded-md"
                      >
                        <IconButton
                          type="button"
                          aria-label="Remove file"
                          className="absolute -right-4 -top-5 flex justify-center text-center text-sm"
                          onClick={() => handleDeleteFile(index)}
                        >
                          <MdOutlineCancel className="z-20" />
                        </IconButton>
                        <Typography variant="body2">
                          {index + 1}: {(fileName as File).name} {((fileName as File).size / 1024 / 1024).toFixed(2)}MB)
                        </Typography>
                        {(fileName as File).size > 5 * 1024 * 1024 && (
                          <Typography color="error" variant="caption">
                            File too large!
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="pt-[20px]">
                <TextField
                  id="message"
                  label="RFQ's description"
                  fullWidth
                  multiline
                  placeholder="Describe your RFQ's"
                  rows={4}
                  name="rfqDescription"
                  value={typedFormData?.rfqDescription || ''}
                  onChange={handleInputChange}
                  error={!!errors.rfqDescription}
                  helperText={errors.rfqDescription}
                />
              </div>
            </div>

            <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
              <Button disabled={isCreatingRfq} variant="contained" color="primary" className="w-full" type="submit">
                {isCreatingRfq ? (
                  <Loader2 className="animate-spin text-white" size={18} />
                ) : (
                  'Publish your RFQ'
                )}
              </Button>
            </div>
          </div>
        </form>

        <SuccessModal
          open={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          rfqLink={`${viewCopyLink}`}
          onViewRfq={handleViewRfq}
        />
      </div>
    </div>
  );
};

export default RfqDetails;

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  rfqLink: string;
  onViewRfq: () => void;
}

const SuccessModal = ({ open, onClose, rfqLink, onViewRfq }: SuccessModalProps) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(rfqLink);
    toast.success('Link copied to clipboard!', {
      position: 'top-right',
      style: {
        background: '#4CAF50',
        color: '#fff',
      },
      duration: 3000,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'New RFQ Created',
          text: 'Check out this RFQ I just created',
          url: rfqLink,
        })
        .catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
        <IconButton aria-label="Close success modal" onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <DialogContent className="text-center py-8">
        <CheckCircle className="text-success-500 text-7xl mb-4 mx-auto" />

        <Typography variant="h5">
          RFQ Created Successfully!
        </Typography>

        <Typography variant="body1">
          Your Request for Quotation has been successfully published.
        </Typography>

        <Box
          className="bg-white p-4 rounded mt-4 break-all shadow-sm"
        >
          <Typography variant="caption" color="text.primary">
            {rfqLink}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions className="justify-center pb-6">
        <Button type="button" variant="outlined" onClick={handleCopyLink} className="mr-4">
          <ContentCopy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>

        <Button type="button" variant="outlined" onClick={handleShare} className="mr-4">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>

        <Button type="button" variant="contained" color="primary" onClick={onViewRfq}>
          View RFQ
        </Button>
      </DialogActions>
    </Dialog>
  );
};
