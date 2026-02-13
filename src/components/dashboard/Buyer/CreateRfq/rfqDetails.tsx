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
  CircularProgress,
  FormHelperText
} from '@/components/ui';
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
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { Moq } from '@/components/marketplace/layout/sidebar';

import { paymentTerms, shippingTerms } from '../../Supplier/CreateProducts/paymentTerms';
import { useAppDispatch, useAppSelector } from '@/redux';
import { Chip } from '@/components/ui/chip';

interface CategoryItem {
  id: string;
  name: string;
  tag: string;
  original_id?: string;
  submenu?: boolean;
}

interface CategoryData {
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
  const { user } = useAppSelector((state) => state?.auth);
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

      const selectedProductCategory = productCatData?.children?.find(
        (cat: CategoryItem) => cat.original_id === newState.productCategory.id
      );

      // Reset downstream selections when upstream changes
      if (level === 'mainCategory') {
        newState.productCategory = { id: '', name: '', tag: '' };
        newState.subCategory = { id: '', name: '', tag: '' };
      } else if (level === 'productCategory' && selectedProductCategory?.submenu) {
        newState.subCategory = { id: '', name: '', tag: '' };
      }

      // Update the selected category
      newState[level] = {
        id: value,
        name: name,
        tag: tag,
      };

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
    validateForm();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      const validFiles = fileArray.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB limit and won't be uploaded`, {
            position: 'top-right',
            style: {
              background: '#f44336',
              color: '#fff',
            },
            duration: 3000,
          });
          return false;
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
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
    const requiredFields = {
      rfqProductName: 'Product name is required.',
      durationOfSupply: 'Duration of supply is required.',
      quantityMeasure: 'Quantity measure is required.',
      quantityRequired: 'Quantity required is mandatory.',
      deliveryPeriod: 'Delivery period is required.',
      // rfqProductCategory: "Please select a product category.",
      // rfqProductSubCategory: "Please select a product sub-category.",
      rfqDescription: 'RFQ description is required.',
      paymentTermsDescribed: 'Payment terms description is required.',
      shippingTermsDescribed: 'Shipping terms description is required.',
    };
    const mainCategory = mainCatData?.find((cat: CategoryData) => cat.original_id === selectedCategories.mainCategory.id);

    const listFields = {
      selectedPayments: 'Select at least one payment term.',
      selectedShippings: 'Select at least one shipping term.',
    };

    let newErrors: Record<string, string> = {};

    // Check required text fields
    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!rfqProductDetailsFormData?.[field]) {
        newErrors[field] = message;
      }
    });

    // Validate main category is selected
    if (!selectedCategories.mainCategory.id) {
      newErrors.productMainCategory = 'Main category is required';
      // toast.success("Main category is required ", {
      //   position: 'top-right',
      //   style: {
      //     background: '#f44336',
      //     color: '#fff',
      //   },
      //   autoClose: 3000,
      // });
    }
    // Validate if product category is required (when main category has submenu)
    else if (mainCategory?.submenu && !selectedCategories.productCategory.id) {
      newErrors.productCategory = 'Product category is required';
    }
    // Validate if subcategory is required (when product category has submenu)
    else if (
      selectedCategories.productCategory.id &&
      productCatData?.children?.find((cat: CategoryItem) => cat.original_id === selectedCategories.productCategory.id)?.submenu &&
      !selectedCategories.subCategory.id
    ) {
      newErrors.productSubCategory = 'Sub category is required';
    }

    // Check list fields
    Object.entries(listFields).forEach(([field, message]) => {
      if (!rfqProductDetailsFormData?.[field]?.length) {
        newErrors[field] = message;
      }
    });
    //  console.log('validation errors', newErrors)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // console.log("Form submitted successfully:", rfqProductDetailsFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!validateForm()) {
        toast.error('Please fill all required fields.', {
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
      formData.append('rfqProductSubCategory', typedFormData.rfqProductSubCategory || '');
      formData.append('category_tag', typedFormData.category_tag || '');

      // Fix the typo here - remove the extra 's'
      formData.append('paymentsTermsDescribed', (typedFormData.paymentTermsDescribed || '').trim());
      formData.append('shippingTermsDescribed', (typedFormData.shippingTermsDescribed || '').trim());

      const paymentsArray = Array.isArray(typedFormData.selectedPayments)
        ? typedFormData.selectedPayments
        : [typedFormData.selectedPayments];

      if (typedFormData.selectedPayments && typedFormData.selectedPayments.length > 0) {
        typedFormData.selectedPayments.forEach((payment: string) => {
          formData.append('selectedPayments', payment);
        });
      }

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
        buyerId: user?.id,
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
      toast.error(`${error?.data?.message || 'Error creating RFQ'}`, {
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

  const theWebUrl = isLocal ? 'http://localhost:3000' : `${WEB_URL}`;

  const viewCopyLink = `${theWebUrl}rfqs/details/${rfqSuccessData?.id || ''}/${rfqSuccessData?.name ? formatCompanyNameForUrl(rfqSuccessData?.name) : ''}`;

  const handleViewRfq = () => {
    // Navigate to the RFQ detail page
    window.open(viewCopyLink, '_blank');
    setSuccessModalOpen(false);
  };

  // console.log('updateRfqProductDetails:', rfqProductDetailsFormData)

  return (
    <div>
      <div className="lg:px-6 py-2">
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

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <FormControl fullWidth error={!!errors.quantityMeasure}>
                <InputLabel>Quantity(measured)</InputLabel>
                <Select
                  name="quantityMeasure"
                  value={typedFormData?.quantityMeasure || ''}
                  onChange={handleInputChange}
                >
                  <Option value="">Select Quantity e.g (tons, kg)</Option>
                  {Moq.map((unit) => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
                {errors.quantityMeasure && <FormHelperText>{errors.quantityMeasure}</FormHelperText>}
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

            {/* <div className="flex flex-col py-5 md:flex-row gap-[15px] items-center justify-center">
                        
                        <FormControl fullWidth error={!!(errors as any).rfqProductCategory}>
                          <InputLabel>Product request Category</InputLabel>
                          <Select 
                          defaultValue="" 
                          name="rfqProductCategory"
                          value={rfqProductDetailsFormData?.rfqProductCategory || ''}
                          onChange={handleInputChange}
                          >
                            <Option value="">Select a category</Option>
                            <Option value="minerals">Minerals</Option>
                          </Select>
                         {errors.rfqProductCategory && <FormHelperText>{errors.rfqProductCategory}</FormHelperText>}
                        </FormControl>
                        

                        <FormControl  fullWidth error={!!(errors as any).rfqProductSubCategory}>
                          <InputLabel>Product request Sub-Category</InputLabel>
                          <Select 
                          // defaultValue="" 
                          name="rfqProductSubCategory" 
                          value={rfqProductDetailsFormData?.rfqProductSubCategory || '' }
                          onChange={handleInputChange}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 250,
                              },
                            },
                          }}
                          disabled={rfqProductDetailsFormData?.rfqProductCategory !== 'minerals'}
                          >
                            <Option value="">Select a sub-category</Option>
                            <Option value="Metallic">Metallic min</Option>
                            <Option value="Non-metallic Industrial minerals">Non-metallic Industrial minerals</Option>
                            <Option value="Marble and Natural Stone">Marble and Natural Stone</Option>
                            <Option value="Gravel, Sand or Aggregate">Gravel, Sand or Aggregate</Option>
                            <Option value="Coal">Coal</Option>
                            <Option value="Other Minerals">Other Minerals</Option>
                            <Option value="Gems">Gems</Option>
                          </Select>
                          {errors.rfqProductSubCategory && <FormHelperText>{errors.rfqProductSubCategory}</FormHelperText>}
                        </FormControl>
                    </div> */}

            {/* all category selection */}
            <div className="flex flex-col md:flex-row gap-[15px] pt-4 items-center justify-center">
              <FormControl fullWidth error={!!(errors as any).productMainCategory}>
                <InputLabel>Main Product Category</InputLabel>
                <Select
                  value={selectedCategories.mainCategory.id}
                  onChange={(e) => {
                    const selected = mainCatData.find((cat: CategoryData) => cat.original_id === e.target.value);
                    handleCategoryChanges('mainCategory', e.target.value as string, selected?.name, selected?.tag);
                  }}
                  label="Main Product Category"
                  disabled={isMainCatLoading}
                >
                  <MenuItem value="">
                    <em>Select a main category</em>
                  </MenuItem>
                  {mainCatData?.map((category: CategoryData) => (
                    <MenuItem key={category.original_id} value={category.original_id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Only show Product Category select if the selected main category has submenu: true */}
              {selectedCategories.mainCategory.id &&
                mainCatData?.find((cat: CategoryData) => cat.original_id === selectedCategories.mainCategory.id)?.submenu && (
                  <FormControl fullWidth error={!!(errors as any).productCategory}>
                    <InputLabel>Product Category</InputLabel>
                    <Select
                      value={selectedCategories.productCategory.id}
                      onChange={(e) => {
                        const selected = productCatData?.children?.find((cat: CategoryItem) => cat.original_id === e.target.value);
                        handleCategoryChanges('productCategory', e.target.value as string, selected?.name, selected?.tag);
                      }}
                      label="Product Category"
                      disabled={isProductCatLoading}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {productCatData?.children?.map((category: CategoryItem) => (
                        <MenuItem key={category.original_id} value={category.original_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] pt-6 items-center justify-center">
              {/* Only show Sub Category select if the selected product category has submenu: true */}
              {selectedCategories.productCategory.id &&
                productCatData?.children?.find((cat: CategoryItem) => cat.original_id === selectedCategories.productCategory.id)
                  ?.submenu && (
                  <FormControl fullWidth error={!!(errors as any).productSubCategory}>
                    <InputLabel>Product Sub Category</InputLabel>
                    <Select
                      value={selectedCategories.subCategory.id}
                      onChange={(e) => {
                        const selected = subCatData?.children?.find((cat: CategoryItem) => cat.original_id === e.target.value);
                        handleCategoryChanges('subCategory', e.target.value as string, selected?.name, selected?.tag);
                      }}
                      label="Product Sub Category"
                      disabled={isSubCatLoading}
                    >
                      <MenuItem value="">
                        <em>Select a sub-category</em>
                      </MenuItem>
                      {subCatData?.children?.map((category: CategoryItem) => (
                        <MenuItem key={category.original_id} value={category.original_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

              {/* ... other form fields ... */}
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

              {/* <TextField
                          label="Product Destination"
                          fullWidth
                          margin="normal"
                          name='productDestination'
                          placeholder="e.g... Nigeria, China"
                          value={rfqProductDetailsFormData?.productDestination || ''}
                          onChange={handleInputChange}
                          error={!!(errors as any).productDestination}
                          helperText={errors.productDestination}
                        /> */}

              <FormControl fullWidth error={!!(errors as any).productDestination}>
                <InputLabel>Product Destination</InputLabel>
                <Select
                  name="productDestination"
                  value={typedFormData?.productDestination || ''}
                  onChange={handleCountryChange}
                >
                  <MenuItem value="">Select</MenuItem>
                  {Country.getAllCountries().map((country) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.productDestination && <FormHelperText>{errors.productDestination}</FormHelperText>}
              </FormControl>
            </div>

            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">
              {/* Shipping Terms Select */}
              <FormControl fullWidth error={!!errors.selectedShippings}>
                <InputLabel>Shipping Terms</InputLabel>
                <Select
                  // multiple is not supported by custom Select yet
                  name="selectedShippings"
                  value={typedFormData?.selectedShippings?.[0] || ''}
                  onChange={handleInputChange}
                >
                  {shippingTerms.map((term) => (
                    <MenuItem key={term.code} value={term.code}>
                      <Checkbox checked={(typedFormData?.selectedShippings || []).indexOf(term.code) > -1} />
                      <ListItemText primary={`${term.code} - ${term.name}`} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.selectedShippings && <FormHelperText>{errors.selectedShippings}</FormHelperText>}
              </FormControl>

              {/* Payment Terms Select */}
              <FormControl fullWidth error={!!errors.selectedPayments}>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  // multiple is not supported by custom Select yet
                  name="selectedPayments"
                  value={typedFormData?.selectedPayments?.[0] || ''}
                  onChange={handleInputChange}
                >
                  {paymentTerms.map((term) => (
                    <MenuItem key={term.code} value={term.code}>
                      <Checkbox checked={(typedFormData?.selectedPayments || []).indexOf(term.code) > -1} />
                      <ListItemText primary={`${term.code} - ${term.name}`} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.selectedPayments && <FormHelperText>{errors.selectedPayments}</FormHelperText>}
              </FormControl>
            </div>

            <div className="flex pt-[20px] flex-col md:flex-row gap-[15px] items-center justify-center">
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
                // sx={{ mt: 1 }}
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
                // sx={{ mt: 1 }}
                error={!!errors.shippingTermsDescribed}
                helperText={errors.shippingTermsDescribed}
              />
            </div>

            {/* File Upload Section */}
            <div>
              <div className="py-[20px]">
                <h2 className="font-[500] text-[1.4rem]">Upload RFQ Attachemnt (Optional)</h2>
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
                }} // Trigger input on box click
              >
                <FaUpload size={20} color="#888" />
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  placeholder="Click to Upload/browse file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                />
                <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
                <p className="text-[#696969] text-[.75rem]">
                  Image must not exceed 5mb | Supported format: *jpg, *png, *webp
                </p>
              </Box>
              {/* Display Uploaded Files' Names */}
              <div className="pt-[10px]">
                {uploadedFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-[10px]">
                    {uploadedFiles?.map((fileName, index) => (
                      <Box
                        key={index}
                        className="p-1 relative bg-neutral-50 rounded-md"
                      >
                        <IconButton
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
                  // sx={{ mt: 1 }}
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
                  <Chip label="Verified" color="success" size="sm" />
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
    // You can show a toast here if you want
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
      // Fallback for browsers that don't support Web Share API
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
        <Button variant="outlined" onClick={handleCopyLink} className="mr-4">
          <ContentCopy className="mr-2 h-4 w-4" />
          Copy Link
        </Button>

        <Button variant="outlined" onClick={handleShare} className="mr-4">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>

        <Button variant="contained" color="primary" onClick={onViewRfq}>
          View RFQ
        </Button>
      </DialogActions>
    </Dialog>
  );
};
