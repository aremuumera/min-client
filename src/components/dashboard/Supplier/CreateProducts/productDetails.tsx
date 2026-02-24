import React, { useEffect, useState } from 'react';
import {
  useGetCategoryQuery,
  useGetMainCategoryQuery,
  useGetSubCategoryQuery,
} from '@/redux/features/categories/cat_api';
import { useValidateProductStepMutation } from '@/redux/features/supplier-products/products_api';
import {
  addDescriptionField,
  deleteUploadedAttachment,
  deleteUploadedFile,
  removeDescriptionField,
  setServerReadyAttachmentData,
  setServerReadyData,
  setServerReadyImagesData,
  setUploadedAttachment,
  setUploadedFiles,
  updateDescriptionField,
  updateProductDetailsFormData,
} from '@/redux/features/supplier-products/products_slice';
import {
  useAppDispatch,
  useAppSelector,
} from '@/redux/hooks';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  IconButton,
  CircularProgress,
  Input,
  TextField,
  MenuItem,
  Modal,
  Select,
  Typography,
} from '@/components/ui';
import { FaUpload } from 'react-icons/fa6';
import { MdOutlineCancel } from 'react-icons/md';
import { PiWarningLight } from 'react-icons/pi';

import { Option } from '@/components/core/option';
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { toast } from '@/components/core/toaster';
import { MoqUnits as Moq } from '@/lib/marketplace-data';
import { z } from 'zod';
import { MultiCheckboxSelect, SearchableSelect } from '@/components/ui';

interface SupplierProductDetailsProps {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
  productImages: File[];
  setProductImages: React.Dispatch<React.SetStateAction<File[]>>;
  productAttachments: File[];
  setProductAttachments: React.Dispatch<React.SetStateAction<File[]>>;
}

const productSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  deliveryPeriod: z.string().min(1, 'Delivery period is required'),
  unitCurrency: z.string().min(1, 'Unit currency is required').default('NGN'),
  realPrice: z.string().min(1, 'Real price is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
  prevPrice: z.string().optional(),
  composition: z.string().optional(),
  density: z.string().optional(),
  hardness: z.string().optional(),
  color: z.string().optional(),
  measure: z.string().min(1, 'Measure unit is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  productHeaderDescription: z.string().min(1, 'Header description is required').max(500, 'Maximum 500 characters'),
  productMainCategory: z.string().min(1, 'Main category is required'),
  productCategory: z.string().optional(),
  productSubCategory: z.string().optional(),
  purity_grade: z.string().optional(),
  moisture_max: z.string().optional(),
  packaging: z.string().optional(),
  sampling_method: z.string().optional(),
  supply_type: z.string().min(1, 'Supply type is required').default('immediate'),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  trade_scope: z.string().min(1, 'Trade scope is required').default('local'),
});

const descriptionFieldSchema = z.object({
  header: z.string().min(1, 'Header is required'),
  description: z.string().min(1, 'Description is required'),
});

const steps = ['Create Product', 'Product Location', 'Payment terms', 'Confirm Product Information'];
let DB_VERSION = 1;

const SupplierProductDetails: React.FC<SupplierProductDetailsProps> = ({
  handleNext,
  setActiveStep,
  activeStep,
  handleBack,
  productImages,
  setProductImages,
  productAttachments,
  setProductAttachments,
}) => {
  const dispatch = useAppDispatch();
  // const [descriptionFields, setDescriptionFields] = useState([{ header: "", description: "" }]);
  const [openPreview, setOpenPreview] = useState(false);
  const [uploadedFileForServer, setUploadedFileForServer] = useState<any[]>([]);
  const [uploadedAttachmentForServer, setUploadedAttachmentForServer] = useState<any[]>([]);
  const [uploadedAttachmentName, setUploadedAttachmentName] = useState<any[]>([]);
  // const [uploadedFiles, setUploadedFiles] = useState([]); // Store the names of uploaded files
  // const [uploadedAttachment, setUploadedAttachment] = useState([]); // Store the names of uploaded Attachment
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    productDetailsFormData,
    descriptionFields,
    uploadedFiles,
    serverReadyData,
    uploadedAttachment,
  }: any = useAppSelector((state: any) => state.product || {});
  const { user, isTeamMember, ownerUserId } = useAppSelector((state: any) => state.auth);

  const [selectedCategories, setSelectedCategories] = useState({
    mainCategory: { id: '', name: '', tag: '' },
    productCategory: { id: '', name: '', tag: '' },
    subCategory: { id: '', name: '', tag: '' },
  });

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

  // console.log(' productDetailsFormData?:', productDetailsFormData);

  // Handle category selection changes

  const handleCategoryChanges = (
    level: 'mainCategory' | 'productCategory' | 'subCategory',
    value: string,
    name: string,
    tag: string = ''
  ) => {
    // 1. Compute the new state locally first
    const newState = { ...selectedCategories };

    // Reset downstream selections when upstream changes
    if (level === 'mainCategory') {
      newState.productCategory = { id: '', name: '', tag: '' };
      newState.subCategory = { id: '', name: '', tag: '' };
    } else if (level === 'productCategory') {
      newState.subCategory = { id: '', name: '', tag: '' };
    }

    // Update the selected category
    (newState as any)[level] = {
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

    // 2. Prepare the form data update
    const formDataUpdate: any = {
      productMainCategory: newState.mainCategory.name,
      productCategory: newState.productCategory.name,
      categoryTag: finalCategoryTag,
    };

    // Only include productSubCategory if it exists
    if (newState.subCategory.name || newState.subCategory.id !== '') {
      formDataUpdate.productSubCategory = newState.subCategory.name;
    }

    // 3. Perform side effects (dispatch and state update)
    setSelectedCategories(newState);
    dispatch(updateProductDetailsFormData(formDataUpdate));
    validateForm(false, { ...productDetailsFormData, ...formDataUpdate });
  };

  const [validateProductStep, { isLoading }] = useValidateProductStepMutation();

  // Handle change in the header/description fields
  const handleDescriptionChange = (index: number, field: string, value: string) => {
    dispatch(updateDescriptionField({ index, field: field as any, value }));
    validateEachDescriptionField(index, field, value);
  };

  const validateEachDescriptionField = (index: number, field: string, value: string) => {
    const fieldKey = `${field}${index}`;
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (!value?.trim()) {
        newErrors[fieldKey] = `${field === 'header' ? 'Header' : 'Description'} is required`;
      } else {
        delete newErrors[fieldKey];
      }
      return newErrors;
    });
  };

  // Handle adding new header-description fields
  const handleAddDescriptionField = () => {
    // setDescriptionFields([...descriptionFields, { header: "", description: "" }]);
    dispatch(addDescriptionField());
  };

  // Handle clearing header-description fields
  const handelClearDescriptionField = (index: number) => {
    // const updatedFields = descriptionFields.filter((_, idx) => idx !== index);
    dispatch(removeDescriptionField(index));
  };

  // Preview modal toggle
  const handlePreviewOpen = () => setOpenPreview(true);
  const handlePreviewClose = () => setOpenPreview(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const fileNames = fileArray.map((file) => file.name);

      const validFiles = fileArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'File size must not exceed 10MB',
          }));
          toast.error(`${file.name} exceeds 10MB limit`, {
            style: { background: '#f44336', color: '#fff' },
          });
          return false;
        }
        const allowedTypes = [
          'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
          'video/mp4'
        ];
        if (!allowedTypes.includes(file.type)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'Supported formats: PNG, JPEG, WEBP, MP4',
          }));
          toast.error(`${file.name} has unsupported format`);
          return false;
        }

        // Video check - max 1 video
        if (file.type.startsWith('video/')) {
          const existingVideos = productImages.filter(f => f.type.startsWith('video/')).length;
          const newVideosInArray = fileArray.filter((f, i) => f.type.startsWith('video/') && i < fileArray.indexOf(file)).length;
          if (existingVideos + newVideosInArray >= 1) {
            toast.error('Only one video can be uploaded');
            return false;
          }
        }

        return true;
      });

      if (validFiles.length + productImages.length < 5) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productImages: 'Minimum of 5 images is required',
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));
      }

      // Update parent state (Raw Files)
      setProductImages((prev) => [...prev, ...validFiles]);

      // Update Redux (Serializable Metadata for Preview)
      const newMetaData = validFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }));
      dispatch(setUploadedFiles([...uploadedFiles, ...newMetaData]));
    }
  };
  // this is the delete section for file and attachment
  const handleDeleteFile = (index: number) => {
    const fileName = uploadedFiles[index]?.name;
    if (fileName) {
      // Clean up Blob URL to prevent memory leaks
      if (uploadedFiles[index]?.url) {
        URL.revokeObjectURL(uploadedFiles[index].url);
      }
      dispatch(deleteUploadedFile(fileName));
      setProductImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const fileNames = fileArray.map((file) => file.name);

      const validFiles = fileArray.filter((file) => {
        if (file.size > 15 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            attachment: 'File size must not exceed 15MB',
          }));
          return false;
        }
        if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            attachment: 'Supported formats: PNG, JPEG, PDF',
          }));
          return false;
        }
        return true;
      });

      // Update parent state (Raw Files)
      setProductAttachments((prev) => [...prev, ...validFiles]);

      // Update Redux (Serializable Metadata for Preview)
      const newMetaData = validFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }));
      dispatch(setUploadedAttachment([...uploadedAttachment, ...newMetaData]));
      setErrors((prevErrors) => ({ ...prevErrors, attachment: '' }));
    }
  };

  //  the delete attachment
  const handleDeleteAttachment = (index: number) => {
    const fileName = uploadedAttachment[index]?.name;
    if (fileName) {
      if (uploadedAttachment[index]?.url) {
        URL.revokeObjectURL(uploadedAttachment[index].url);
      }
      dispatch(deleteUploadedAttachment(fileName));
      setProductAttachments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  type BaseChangeEvent =
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    | { target: { name: string; value: any } };

  const maxCharacters = 500;
  const handleInputChange = (e: BaseChangeEvent) => {
    const { name, value } = e.target as { name: string; value: string };

    // Apply character limit validation only for productHeaderDescription
    if (name === 'productHeaderDescription') {
      if (value.length > maxCharacters) {
        setErrors({ [name]: `Maximum ${maxCharacters} characters allowed.` });
        return;
      } else {
        // dispatch(clearError(name)); // Clear the error
      }
    }
    // setProductDetailsFormData((prev) => ({ ...prev, [name]: value }));
    const updatedFormData = { ...productDetailsFormData, [name]: value };
    dispatch(updateProductDetailsFormData({ [name]: value }));
    validateForm(false, updatedFormData);
  };

  const validateForm = (shouldToast = false, dataOverride?: any) => {
    try {
      const currentData = dataOverride || productDetailsFormData;
      const dataToValidate = {
        productName: '',
        deliveryPeriod: '',
        productHeaderDescription: '',
        productMainCategory: '',
        realPrice: '',
        measure: '',
        quantity: '',
        ...currentData,
        unitCurrency: currentData.unitCurrency || 'NGN',
        supply_type: currentData.supply_type || 'immediate',
        trade_scope: currentData.trade_scope || 'local',
      };
      productSchema.parse(dataToValidate);

      // Validate description fields
      const fieldErrors: Record<string, string> = {};
      descriptionFields.forEach((field: any, index: number) => {
        const result = descriptionFieldSchema.safeParse(field);
        if (!result.success) {
          result.error.issues.forEach((issue: any) => {
            fieldErrors[`description${issue.path[0]}${index}`] = issue.message;
          });
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        if (shouldToast) {
          toast.error('Please fill in all description fields correctly');
        }
        return false;
      }

      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          newErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(newErrors);

        if (shouldToast) {
          const firstError = Object.values(newErrors)[0] as string;
          toast.error(firstError);
        }
      }
      return false;
    }
  };

  const validateFilesBeforeSubmit = () => {
    let isValid = true;
    const newErrors: any = {};

    // Validate product images
    if (uploadedFiles.length < 5) {
      newErrors.productImages = 'Minimum of 5 images is required';
      isValid = false;
      toast.error('Minimum of 5 product images is required');
    }

    // Check individual file sizes (15MB for videos, 5MB for images)
    uploadedFiles.forEach((file: any) => {
      const isVideo = file.type?.startsWith('video/');
      const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
      const label = isVideo ? '15MB' : '5MB';
      if (file.size > maxSize) {
        newErrors.productImages = `${isVideo ? 'Video' : 'Image'} must not exceed ${label}`;
        isValid = false;
        toast.error(`${file.name} exceeds ${label} limit`);
      }
    });

    // Validate attachments
    uploadedAttachment.forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        newErrors.attachments = 'One or more attachments exceed 20MB limit';
        isValid = false;
        toast.error(`${file.name} exceeds 20MB limit`);
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // console.log('Uploaded Files:', uploadedFiles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form before submission
      if (!validateForm(true)) {
        console.error('Form validation failed');
        return;
      }

      if (!validateFilesBeforeSubmit()) {
        return;
      }

      // Create FormData object
      const formData = new FormData();

      // Add text fields from productDetailsFormData
      Object.entries(productDetailsFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      // Add description fields - stringify the array to preserve structure
      formData.append('productDetailDescription', JSON.stringify(descriptionFields));

      formData.append('step', '1');

      // Add raw files to FormData
      if (productImages && productImages.length > 0) {
        productImages.forEach((file) => {
          formData.append('productImages', file);
        });
      }

      if (productAttachments && productAttachments.length > 0) {
        productAttachments.forEach((file) => {
          formData.append('productAttachments', file);
        });
      }

      // Send the data to API
      const response = await validateProductStep({
        supplierId: isTeamMember ? ownerUserId : user?.id,
        body: formData,
      }).unwrap();
      console.log('API Response:', response);
      toast.success(`${response?.message || 'Product details submitted successfully!'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#4CAF50',
          color: '#fff',
        },
      });

      const validatedData = response?.validatedData;
      const validatedImage = Array.isArray(response?.imageUrls) ? response?.imageUrls : [];
      const validatedAttachment = Array.isArray(response?.attachmentUrls) ? response?.attachmentUrls : [];

      dispatch(setServerReadyData(validatedData));
      // dispatch(setServerReadyImagesData(validatedImage));
      // dispatch(setServerReadyAttachmentData(validatedAttachment))
      handleNext();
    } catch (error) {
      console.error('Error during form submission:', error);
      toast.error(`${(error as any)?.data?.message || (error as any)?.error || 'Failed to submit product details. Please try again.'}`, {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
    }
  };

  // console.log('setServerReadyData:', serverReadyData);

  return (
    <div>
      <div className="lg:px-6 py-2">
        <form onSubmit={handleSubmit} action="">
          <div>
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Product Name"
                fullWidth
                name="productName"
                margin="normal"
                placeholder="Enter product name"
                value={productDetailsFormData?.productName || ''}
                onChange={handleInputChange}
                error={!!errors.productName}
                helperText={errors.productName}
              />
              <TextField
                label="Delivery Period"
                fullWidth
                name="deliveryPeriod"
                margin="normal"
                placeholder="Delivery Period"
                value={productDetailsFormData?.deliveryPeriod || ''}
                onChange={handleInputChange}
                error={!!errors.deliveryPeriod}
                helperText={errors.deliveryPeriod}
              />
            </div>

            {/*  price section */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <SearchableSelect
                label="Unit Currency"
                options={[
                  { value: 'NGN', label: 'NGN' },
                  { value: 'USD', label: 'USD' },
                ]}
                value={productDetailsFormData?.unitCurrency || 'NGN'}
                onChange={(e: any) => handleInputChange({ target: { name: 'unitCurrency', value: e.target.value } })}
                placeholder="Select Currency"
                errorMessage={errors.unitCurrency}
                fullWidth
              />

              <TextField
                label="Real Price"
                fullWidth
                name="realPrice"
                margin="normal"
                placeholder="Enter amount"
                value={productDetailsFormData?.realPrice || ''}
                onChange={handleInputChange}
                error={!!errors.realPrice}
                helperText={errors.realPrice}
              />
              <div className="w-full">
                <TextField
                  label="Prev Price"
                  fullWidth
                  name="prevPrice"
                  margin="normal"
                  placeholder="Enter amount"
                  value={productDetailsFormData?.prevPrice || ''}
                  onChange={handleInputChange}
                  error={!!errors.prevPrice}
                  helperText={errors.prevPrice}
                />
                <p className="text-[#696969] text-[.75rem]">(Optional)</p>
              </div>
            </div>

            {/*  price section */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                name="composition"
                label="Composition (Optional)"
                fullWidth
                margin="normal"
                placeholder="Enter composition"
                value={productDetailsFormData?.composition || ''}
                onChange={handleInputChange}
                error={!!errors.composition}
                helperText={errors.composition}
              />
              <TextField
                name="density"
                label="Density (Optional)"
                fullWidth
                margin="normal"
                placeholder="Enter density"
                value={productDetailsFormData?.density || ''}
                onChange={handleInputChange}
                error={!!errors.density}
                helperText={errors.density}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center ">
              <TextField
                label="Purity / Grade (Optional)"
                fullWidth
                margin="normal"
                placeholder="e.g. 95%+, Grade A"
                name="purity_grade"
                value={productDetailsFormData?.purity_grade || ''}
                onChange={handleInputChange}
                error={!!errors.purity_grade}
                helperText={errors.purity_grade}
              />
              <TextField
                label="Max Moisture (%) (Optional)"
                fullWidth
                margin="normal"
                placeholder="e.g. 5.1"
                name="moisture_max"
                type="number"
                value={productDetailsFormData?.moisture_max || ''}
                onChange={handleInputChange}
                error={!!errors.moisture_max}
                helperText={errors.moisture_max}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Packaging (Optional)"
                fullWidth
                margin="normal"
                placeholder="e.g. 50kg Bags, Bulk"
                name="packaging"
                value={productDetailsFormData?.packaging || ''}
                onChange={handleInputChange}
                error={!!errors.packaging}
                helperText={errors.packaging}
              />
              <TextField
                label="Sampling Method (Optional)"
                fullWidth
                margin="normal"
                placeholder="e.g. SGS, Bureau Veritas"
                name="sampling_method"
                value={productDetailsFormData?.sampling_method || ''}
                onChange={handleInputChange}
                error={!!errors.sampling_method}
                helperText={errors.sampling_method}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center pt-4">
              <SearchableSelect
                label="Trade Scope"
                options={[
                  { value: 'local', label: 'Local' },
                  { value: 'international', label: 'International' },
                  { value: 'both', label: 'Local & International' },
                ]}
                value={productDetailsFormData?.trade_scope || 'local'}
                onChange={(e: any) => handleInputChange({ target: { name: 'trade_scope', value: e.target.value } })}
                placeholder="Select Trade Scope"
                errorMessage={errors.trade_scope}
                fullWidth
              />

              <SearchableSelect
                label="Supply Type"
                options={[
                  { value: 'immediate', label: 'Immediate' },
                  { value: 'recurring', label: 'Recurring' },
                ]}
                value={productDetailsFormData?.supply_type || 'immediate'}
                onChange={(e: any) => handleInputChange({ target: { name: 'supply_type', value: e.target.value } })}
                placeholder="Select Supply Type"
                errorMessage={errors.supply_type}
                fullWidth
              />
            </div>

            {productDetailsFormData?.supply_type === 'recurring' && (
              <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center pt-2">
                <SearchableSelect
                  label="Recurring Frequency"
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  value={productDetailsFormData?.frequency || ''}
                  onChange={(e: any) => handleInputChange({ target: { name: 'frequency', value: e.target.value } })}
                  placeholder="Select frequency"
                  errorMessage={errors.frequency}
                  fullWidth
                />
                <TextField
                  label="Contract Duration"
                  fullWidth
                  margin="normal"
                  placeholder="e.g. 1 Year, 6 Months"
                  name="duration"
                  value={productDetailsFormData?.duration || ''}
                  onChange={handleInputChange}
                  error={!!errors.duration}
                  helperText={errors.duration || 'Total duration of the supply contract'}
                />
              </div>
            )}

            {/* color and hardness section */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Hardness (Optional)"
                fullWidth
                name="hardness"
                margin="normal"
                placeholder="Enter Hardness"
                value={productDetailsFormData?.hardness || ''}
                onChange={handleInputChange}
                error={!!errors.hardness}
                helperText={errors.hardness}
              />
              <div className="w-full">
                <TextField
                  label="Color (Optional)"
                  fullWidth
                  margin="normal"
                  name="color"
                  placeholder="Enter Color"
                  value={productDetailsFormData?.color || ''}
                  onChange={handleInputChange}
                  error={!!errors.color}
                  helperText={errors.color}
                />
                <p className="text-[#696969] text-[.75rem]"></p>
              </div>
            </div>

            {/* Products Sub Category */}
            {/* <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <FormControl fullWidth error={!!errors.productSubCategory}>
                <InputLabel>Product Sub Category</InputLabel>
                <Select
                  defaultValue=""
                  name="productSubCategory"
                  value={productDetailsFormData?.productSubCategory || ''}
                  onChange={handleInputChange}
                  disabled={!productDetailsFormData?.productCategory}
                >
                  <Option value="">Select a sub-category</Option>
                  <Option value="Metallic">Metallic</Option>
                  <Option value="Non-metallic Industrial minerals">Non-metallic Industrial minerals</Option>
                  <Option value="Marble and Natural Stone">Marble and Natural Stone</Option>
                  <Option value="Gravel, Sand or Aggregate">Gravel, Sand or Aggregate</Option>
                  <Option value="Coal">Coal</Option>
                  <Option value="Other Minerals">Other Minerals</Option>
                  <Option value="Gems">Gems</Option>
                </Select>
                {errors.productSubCategory && <FormHelperText>{errors.productSubCategory}</FormHelperText>}
                <p className="text-[#696969] text-[.75rem]">Kindly select a category before a subcategory</p>
              </FormControl>
             
            </div> */}

            {/* all category selection */}
            <div className="flex flex-col md:flex-row gap-[15px] pt-4 items-center justify-center">
              <SearchableSelect
                label="Main Product Category"
                options={mainCatData?.map((category: any) => ({
                  value: category.original_id,
                  label: category.name,
                })) || []}
                value={selectedCategories.mainCategory.id}
                onChange={(e: any) => {
                  const selectedId = e.target.value;
                  const selected = (mainCatData as any[]).find((cat: any) => cat.original_id === selectedId);
                  handleCategoryChanges('mainCategory', selectedId, selected?.name, selected?.tag);
                }}
                placeholder="Select a main category"
                disabled={isMainCatLoading}
                errorMessage={errors.productMainCategory}
                fullWidth
              />

              {/* Only show Product Category select if the selected main category has submenu: true */}
              {selectedCategories.mainCategory.id &&
                mainCatData?.find((cat: any) => cat.original_id === selectedCategories.mainCategory.id)?.submenu && (
                  <SearchableSelect
                    label="Product Category"
                    options={productCatData?.children?.map((category: any) => ({
                      value: category.original_id,
                      label: category.name,
                    })) || []}
                    value={selectedCategories.productCategory.id}
                    onChange={(e: any) => {
                      const selectedId = e.target.value;
                      const selected = (productCatData as any)?.children?.find((cat: any) => cat.original_id === selectedId);
                      handleCategoryChanges('productCategory', selectedId, selected?.name, selected?.tag);
                    }}
                    placeholder="Select a category"
                    disabled={isProductCatLoading}
                    errorMessage={errors.productCategory}
                    fullWidth
                  />
                )}
            </div>

            {/* Sub Category Selection */}
            <div className="flex flex-col md:flex-row gap-[15px] pt-6 items-center justify-center">
              {/* Only show Sub Category select if the selected product category has submenu: true */}
              {selectedCategories.productCategory.id &&
                productCatData?.children?.find((cat: any) => cat.original_id === selectedCategories.productCategory.id)
                  ?.submenu && (
                  <SearchableSelect
                    label="Product Sub Category"
                    options={subCatData?.children?.map((category: any) => ({
                      value: category.original_id,
                      label: category.name,
                    })) || []}
                    value={selectedCategories.subCategory.id}
                    onChange={(e: any) => {
                      const selectedId = e.target.value;
                      const selected = (subCatData as any)?.children?.find((cat: any) => cat.original_id === selectedId);
                      handleCategoryChanges('subCategory', selectedId, selected?.name, selected?.tag);
                    }}
                    placeholder="Select a sub-category"
                    disabled={isSubCatLoading}
                    errorMessage={errors.productSubCategory}
                    fullWidth
                  />
                )}
            </div>
            {/* ... other form fields ... */}
          </div>

          {/* Measure */}
          <div className="flex flex-col pt-[10px] md:flex-row gap-[15px] items-center justify-center">
            <SearchableSelect
              label="Measure"
              options={Moq.map((unit: any) => ({
                value: unit,
                label: unit,
              }))}
              value={productDetailsFormData?.measure || ''}
              onChange={(e: any) => handleInputChange({ target: { name: 'measure', value: e.target.value } })}
              placeholder="Select a measure unit"
              errorMessage={errors.measure}
              fullWidth
            />
            <TextField
              label="M.O.Q / Available Quantity"
              fullWidth
              margin="normal"
              name="quantity"
              placeholder="Enter your M.O.Q value and select the measure unit"
              value={productDetailsFormData?.quantity || ''}
              onChange={handleInputChange}
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </div>

          <div className="pt-8">
            <TextField
              label="Product Header Description"
              fullWidth
              multiline
              rows={5}
              margin="normal"
              name="productHeaderDescription"
              placeholder="Enter a brief, engaging product description to be displayed at the top of the page..."
              value={productDetailsFormData?.productHeaderDescription || ''}
              onChange={handleInputChange}
              error={!!errors.productHeaderDescription}
              helperText={
                errors.productHeaderDescription
                  ? errors.productHeaderDescription
                  : `${maxCharacters - productDetailsFormData?.productHeaderDescription?.length || 0} characters remaining`
              }
            />
            {/* <p className="text-[#696969] text-right text-[.75rem]">{productDetailsFormData?.productHeaderDescription?.length} / 200</p> */}
          </div>

          {/* Description Fields */}
          <div className="pt-[20px]">
            <h2 className="font-medium pb-3 text-[1rem]">Product Detail Description</h2>
            <div className="space-y-2 relative!">
              {descriptionFields.map((field: any, index: number) => (
                <div key={index}>
                  {index === 0 ? (
                    ''
                  ) : (
                    <IconButton
                      onClick={() => handelClearDescriptionField(index)}
                      className="flex absolute right-0 justify-center text-center text-[1.4rem]"
                      aria-label="clear description field"
                    >
                      <MdOutlineCancel className="z-20" />
                    </IconButton>
                  )}
                  <div>
                    <TextField
                      label={`${index === 0 ? '1' : `${index + 1}:`} Header`}
                      fullWidth
                      name="header"
                      value={field.header}
                      onChange={(e) => handleDescriptionChange(index, 'header', e.target.value)}
                      margin="normal"
                      placeholder="Enter header"
                      error={!!errors[`header${index}`]}
                      helperText={errors[`header${index}`]}
                    />
                    <Box sx={{ mt: '8px' }}>
                      {/* <TextEditor
                          name="description"
                          placeholder="Describe your product here..."
                          value={field.description}
                           onUpdate={({ editor }) => handleDescriptionChange(index, "description", editor.getText())}
                        /> */}
                      <TextField
                        label="Section Description"
                        fullWidth
                        multiline
                        rows={5}
                        margin="normal"
                        name="description"
                        placeholder="Describe your product here..."
                        value={field.description}
                        onChange={(e) => handleDescriptionChange(index, 'description', e.target.value)}
                      />
                      {errors[`description${index}`] && (
                        <Typography variant="body2" color="error">
                          {errors[`description${index}`]}
                        </Typography>
                      )}
                    </Box>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Modal Button */}
          <div className="py-[20px] flex gap-4 w-full">
            <Button variant="contained" fullWidth onClick={handlePreviewOpen} color="primary" type="button">
              Preview
            </Button>
            <Button fullWidth onClick={handleAddDescriptionField} variant="outlined" sx={{}} color="primary" type="button">
              Add Description Field
            </Button>
          </div>

          {/* Preview Modal */}
          <Modal open={openPreview} onClose={handlePreviewClose}>
            <Box sx={{ maxWidth: 500, margin: 'auto', padding: 4, backgroundColor: '#fff', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Preview Description
              </Typography>
              <div>
                {descriptionFields.map((field: any, index: number) => (
                  <Box key={index} sx={{ mt: 3 }}>
                    <Typography variant="h6">{field.header}</Typography>
                    <Typography pt={'8px'} variant="body1">
                      {field.description}
                    </Typography>
                  </Box>
                ))}
              </div>
              <Button variant="contained" sx={{ mt: '26px' }} onClick={handlePreviewClose} color="secondary" type="button">
                Close Preview
              </Button>
            </Box>
          </Modal>

          {/*  this is for Product Images */}
          <div>
            <div className="py-[20px]">
              <h2 className="font-medium text-[1.4rem]">Upload Product Images / Video</h2>
              <p className="text-[#838383] text-[.9rem] ">Minimum of 5 images and maximum of 1 video is allowed to list product</p>
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
              onClick={() => document.getElementById('file-upload')?.click()} // Trigger input on box click
            >
              <FaUpload size={20} color="#888" />
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                placeholder="Click to Upload/browse file"
                className="hidden"
                multiple
                accept="image/png, image/jpeg, image/webp, video/mp4"
              />
              <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
              <p className="text-[#696969] text-[.75rem]">
                Image/Video must not exceed 5mb | Supported format: *jpg, *png, *webp, *mp4
              </p>
            </Box>
            {/* Display Uploaded Files' Names */}
            <div className="pt-[10px]">
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-[10px]">
                  {uploadedFiles.map((fileName: any, index: number) => (
                    <Box
                      key={index}
                      sx={{ padding: '5px', position: 'relative', backgroundColor: '#f7f7f7', borderRadius: '5px' }}
                    >
                      <IconButton
                        type="button"
                        className="flex absolute -right-[18px] -top-[20px] justify-center text-center text-[.8rem]"
                        onClick={() => handleDeleteFile(index)}
                        aria-label={`delete file ${index + 1}`}
                      >
                        <MdOutlineCancel className="z-20" />
                      </IconButton>
                      <Typography variant="body2">
                        {index + 1}: {fileName.name} ({(fileName.size / 1024 / 1024).toFixed(2)}MB)
                      </Typography>
                      {fileName.size > 5 * 1024 * 1024 && (
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

          {/*  this is for Attachment */}
          <div>
            <div className="py-[20px]">
              <h2 className="font-medium text-[1.4rem]">Upload Attachment</h2>
              <p className="text-[#7b7b7b] text-[.9rem] ">
                Attachment could be document about the product, details, or any other relevant information about the
                product
              </p>
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
              onClick={() => document.getElementById('attachment-upload')?.click()} // Trigger input on box click
            >
              <FaUpload size={20} color="#888" />
              <input
                id="attachment-upload"
                type="file"
                onChange={handleAttachmentChange}
                placeholder="Click to Upload/browse file"
                className="hidden"
                multiple
                accept="image/png, image/jpeg, application/pdf"
              />
              <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
              <p className="text-[#696969] text-[.75rem]">
                Attachment must not exceed 5mb | Supported format: *jpeg, *png, *pdf
              </p>
            </Box>

            <div className="pt-[10px]">
              {uploadedAttachment?.length > 0 && (
                <div className="flex flex-wrap gap-[10px]">
                  {uploadedAttachment?.map((fileName: any, index: number) => (
                    <Box
                      key={index}
                      sx={{ padding: '5px', backgroundColor: '#f7f7f7', position: 'relative', borderRadius: '5px' }}
                    >
                      <IconButton
                        type="button"
                        className="flex absolute -right-[18px] -top-[20px] justify-center text-center text-[.8rem]"
                        onClick={() => handleDeleteAttachment(index)}
                        aria-label={`delete attachment ${index + 1}`}
                      >
                        <MdOutlineCancel className="z-20" />
                      </IconButton>
                      <Typography variant="body2">
                        {index + 1}: {fileName.name} ({(fileName.size / 1024 / 1024).toFixed(2)}MB)
                      </Typography>
                      {fileName.size > 5 * 1024 * 1024 && (
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

          <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
            <Button
              disabled={isLoading || activeStep === steps.length - 1}
              variant="contained"
              color="primary"
              className="w-full min-h-[48px] disabled:opacity-100 disabled:text-white"
              type="submit"
            >
              {isLoading ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                  className="text-white"
                />
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

export default SupplierProductDetails;
