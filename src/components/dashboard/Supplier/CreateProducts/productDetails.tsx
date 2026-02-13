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
  useAppStore,
} from '@/redux/hooks';
import {
  deleteFileByNameFromIndexedDB,
  getAllFilesFromIndexedDBForServer,
  logAllDataFromIndexedDB,
  storeFileInIndexedDB,
} from '@/utils/indexDb';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormHelperText,
  InputLabel,
} from '@/components/ui/form-control';
import { IconButton } from '@/components/ui/icon-button';
import { CircularProgress } from '@/components/ui/progress';
import { Input, TextField } from '@/components/ui/input';
import { MenuItem } from '@/components/ui/menu';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Typography } from '@/components/ui/typography';
import { FaUpload } from 'react-icons/fa6';
import { MdOutlineCancel } from 'react-icons/md';
import { PiWarningLight } from 'react-icons/pi';

import { Option } from '@/components/core/option';
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { toast } from '@/components/core/toaster';
import { Moq } from '@/components/marketplace/layout/sidebar';

interface SupplierProductDetailsProps {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}

const steps = ['Create Product', 'Product Location', 'Payment terms', 'Confirm Product Information'];
let DB_VERSION = 1;

const SupplierProductDetails: React.FC<SupplierProductDetailsProps> = ({
  handleNext,
  setActiveStep,
  activeStep,
  handleBack,
}) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
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
  const { user } = useAppSelector((state: any) => state.auth);

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
    setSelectedCategories((prev) => {
      const newState = { ...prev };

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

      // Update the form data
      // Prepare the form data update
      const formDataUpdate: any = {
        productMainCategory: newState.mainCategory.name,
        productCategory: newState.productCategory.name,
        categoryTag: finalCategoryTag,
      };

      // Only include productSubCategory if it exists
      if (newState.subCategory.name || newState.subCategory.id !== '') {
        formDataUpdate.productSubCategory = newState.subCategory.name;
      }

      // Update the form data
      dispatch(updateProductDetailsFormData(formDataUpdate));
      return newState;
    });
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
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'File size must not exceed 5MB',
          }));
          toast.error(`${file.name} exceeds 5MB limit and won't be uploaded`, {
            position: 'top-right',
            style: {
              background: '#f44336',
              color: '#fff',
            },
          });
          return false;
        }
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'Supported formats: PNG, JPEG, WEBP',
          }));
          toast.error(`${file.name} has unsupported format`, {
            duration: 3000,
          });
          return false;
        }
        return true;
      });

      if (validFiles.length + uploadedFiles.length < 5) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productImages: 'Minimum of 5 images is required',
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));
      }
      const currentImages = store.getState().product.uploadedFiles;
      storeFileInIndexedDB(validFiles, 'ProductImages')
        .then((result) => {
          console.log('products Images storage:', result);
          dispatch(setUploadedFiles([...currentImages, ...result]));
        })
        .catch((error) => {
          console.error('Error storing product files:', error);
        });
    }
  };
  // this is the delete section for file and attachment
  const handleDeleteFile = (index: number) => {
    const fileName = uploadedFiles[index]?.name;
    if (fileName) {
      dispatch(deleteUploadedFile(fileName));
      deleteFileByNameFromIndexedDB('ProductImages', fileName)
        .then((result) => {
          console.log(`ProductImages for ${fileName} deleted`, result);
          setUploadedFileForServer((prevFiles) => prevFiles.filter((_, i) => i !== index));
        })
        .catch((error) => {
          console.error(`Error deleting ProductImages for ${fileName}`, error);
        });
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const fileNames = fileArray.map((file) => file.name);

      const validFiles = fileArray.filter((file) => {
        if (file.size > 20 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            attachment: 'File size must not exceed 5MB',
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

      if (validFiles.length + uploadedFiles.length < 5) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productImages: 'Minimum of 5 images is required',
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));
      }

      const currentImages = store.getState().product.uploadedAttachment;
      storeFileInIndexedDB(validFiles, 'ProductAttachment')
        .then((result) => {
          console.log('products Attachment storage:', result);
          dispatch(setUploadedAttachment([...currentImages, ...result]));
        })
        .catch((error) => {
          console.error('Error storing product files:', error);
        });
      setErrors((prevErrors) => ({ ...prevErrors, attachment: '' }));
    }
  };

  //  the delete attachment
  const handleDeleteAttachment = (index: number) => {
    const fileName = uploadedAttachment[index]?.name;
    if (fileName) {
      dispatch(deleteUploadedAttachment(fileName));
      deleteFileByNameFromIndexedDB('ProductAttachment', fileName)
        .then((result) => {
          console.log(`ProductAttachment for ${fileName} deleted`, result);
          setUploadedAttachmentForServer((prevFiles) => prevFiles.filter((_, i) => i !== index));
        })
        .catch((error) => {
          console.error(`Error deleting ProductAttachment for ${fileName}`, error);
        });
    }
  };

  const maxCharacters = 500;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | { name?: string; value: unknown }>) => {
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
    dispatch(updateProductDetailsFormData({ [name]: value }));

    validateForm();
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!productDetailsFormData?.productName?.trim()) {
      newErrors.productName = 'Product name is required';
    }

    // Category validation
    const mainCategory = mainCatData?.find((cat: any) => cat.original_id === selectedCategories.mainCategory.id);

    // Validate main category is selected
    if (!selectedCategories.mainCategory.id) {
      newErrors.productMainCategory = 'Main category is required';
    }
    // Validate if product category is required (when main category has submenu)
    else if (mainCategory?.submenu && !selectedCategories.productCategory.id) {
      newErrors.productCategory = 'Product category is required';
    }
    // Validate if subcategory is required (when product category has submenu)
    else if (
      selectedCategories.productCategory.id &&
      (productCatData as any)?.children?.find((cat: any) => cat.original_id === selectedCategories.productCategory.id)?.submenu &&
      !selectedCategories.subCategory.id
    ) {
      newErrors.productSubCategory = 'Sub category is required';
    }
    if (!productDetailsFormData?.realPrice?.trim() || isNaN(productDetailsFormData?.realPrice)) {
      newErrors.realPrice = 'Real price is required and must be a number';
    }

    // if (!productDetailsFormData?.prevPrice || isNaN(productDetailsFormData?.prevPrice)) {
    //   newErrors.prevPrice = 'Previous price must be a number';
    // }

    // if (!productDetailsFormData?.composition?.trim()) {
    //   newErrors.composition = 'Composition is required';
    // }

    // if (!productDetailsFormData?.density || !/^\d+(\.\d+)?\s?g\/cm³$/.test(productDetailsFormData?.density)) {
    //   newErrors.density = 'Density must be in the format "2.68 g/cm³"';
    // }

    if (!productDetailsFormData?.deliveryPeriod?.trim()) {
      newErrors.deliveryPeriod = 'Delivery period is required';
    }

    if (!productDetailsFormData?.measure) {
      newErrors.measure = 'Measure unit is required';
    }

    if (!productDetailsFormData?.quantity?.trim()) {
      newErrors.quantity = 'Quantity value is required';
    }

    if (
      !productDetailsFormData?.productHeaderDescription?.trim() &&
      productDetailsFormData?.productHeaderDescription > maxCharacters
    ) {
      newErrors.productHeaderDescription = 'Product Header Description is required';
    }

    // if (!productDetailsFormData?.color?.trim()) {
    //   newErrors.color = 'Color is required';
    // }

    // if (!productDetailsFormData?.hardness?.trim()) {
    //   newErrors.hardness = 'Hardness is required';
    // }

    // if (uploadedFiles.length < 5) {
    //   newErrors.productImages = 'Minimum of 5 images is required';
    // }

    descriptionFields.forEach((field: any, index: number) => {
      if (!field.header?.trim()) {
        newErrors[`descriptionHeader${index}`] = 'Header is required';
      }
      if (!field.description?.trim()) {
        newErrors[`descriptionContent${index}`] = 'Description is required';
      }
    });

    setErrors(newErrors as Record<string, string>);

    return Object.keys(newErrors).length === 0;
  };

  const validateFilesBeforeSubmit = () => {
    let isValid = true;
    const newErrors: any = {};

    // Validate product images
    if (uploadedFiles.length < 5) {
      newErrors.productImages = 'Minimum of 5 images is required';
      isValid = false;
      toast.error('Minimum of 5 product images is required', {
        position: 'top-right',
        style: {
          background: '#f44336',
          color: '#fff',
        },
        duration: 3000,
      });
    }

    // Check individual image sizes
    uploadedFiles.forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        newErrors.productImages = 'One or more images exceed 5MB limit';
        isValid = false;
        toast.error(`${file.name} exceeds 5MB limit`, {
          position: 'top-right',
          style: {
            background: '#f44336',
            color: '#fff',
          },
          duration: 3000,
        });
      }
    });

    // Validate attachments
    uploadedAttachment.forEach((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        newErrors.attachments = 'One or more attachments exceed 20MB limit';
        isValid = false;
        toast.error(`${file.name} exceeds 20MB limit`, {
          position: 'top-right',
          duration: 3000,
        });
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
      if (!validateForm()) {
        console.error('Form validation failed');
        return;
      }

      if (!validateFilesBeforeSubmit()) {
        console.error('File validation failed');
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

      // Retrieve files from IndexedDB and append to FormData
      const [imageFiles, attachmentFiles] = await Promise.all([
        getAllFilesFromIndexedDBForServer('ProductImages'),
        getAllFilesFromIndexedDBForServer('ProductAttachment'),
      ]);

      setUploadedFileForServer(imageFiles as any);
      setUploadedAttachmentForServer(attachmentFiles as any);

      // Log FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      // Send the data to API
      const response = await validateProductStep({
        supplierId: user?.id,
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
      toast.error(`${(error as any)?.data?.message || 'Failed to submit product details. Please try again.'}`, {
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
                name="productName"
                label="Product name"
                fullWidth
                margin="normal"
                placeholder="Enter product name"
                value={productDetailsFormData?.productName}
                onChange={handleInputChange}
                error={!!errors.productName}
                helperText={errors.productName}
              />
              <TextField
                label="Del Period"
                fullWidth
                margin="normal"
                name="deliveryPeriod"
                placeholder="e.g. 2 months, 3weeks, 4months"
                value={productDetailsFormData?.deliveryPeriod}
                onChange={handleInputChange}
                error={!!errors.deliveryPeriod}
                helperText={errors.deliveryPeriod}
              />
            </div>

            {/*  price section */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <FormControl fullWidth error={!!errors.unitCurrency}>
                <InputLabel>Unit Currency</InputLabel>
                <Select
                  value={productDetailsFormData?.unitCurrency}
                  onChange={handleInputChange}
                  label="Unit Currency"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 250, // Adjust this value for height
                      },
                    },
                  }}
                >
                  {/* <MenuItem value=""> */}
                  <option>Select Unit Price</option>
                  {/* </MenuItem> */}
                  <MenuItem value="NGN">NGN</MenuItem>
                  {/* <MenuItem value="USD">USD</MenuItem> */}
                </Select>
              </FormControl>

              <TextField
                name="realPrice"
                label="Real price"
                fullWidth
                margin="normal"
                placeholder="Enter amount"
                value={productDetailsFormData?.realPrice}
                onChange={handleInputChange}
                error={!!errors.realPrice}
                helperText={errors.realPrice}
              />
              <div className="w-full">
                <TextField
                  name="prevPrice"
                  label="Prev price"
                  fullWidth
                  margin="normal"
                  placeholder="Enter amount"
                  value={productDetailsFormData?.prevPrice}
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
                label="Composition"
                fullWidth
                margin="normal"
                placeholder="Enter composition"
                value={productDetailsFormData?.composition}
                onChange={handleInputChange}
                error={!!errors.composition}
                helperText={errors.composition}
              />
              {/* <div className="w-full"> */}
              <TextField
                name="density"
                label="Density"
                fullWidth
                margin="normal"
                placeholder="Enter density"
                value={productDetailsFormData?.density}
                onChange={handleInputChange}
                error={!!errors.density}
                helperText={errors.density}
              />
              {/* <p className="text-[#696969] text-[.75rem]">(Optional)</p> */}
              {/* </div> */}
            </div>

            {/* color and hardness section */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <TextField
                label="Hardness (Optional)"
                fullWidth
                name="hardness"
                margin="normal"
                placeholder="Enter Hardness"
                value={productDetailsFormData?.hardness}
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
                  value={productDetailsFormData?.color}
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
              <FormControl fullWidth error={!!errors.productMainCategory}>
                <InputLabel>Main Product Category</InputLabel>
                <Select
                  value={selectedCategories.mainCategory.id}
                  onChange={(e) => {
                    const selected = (mainCatData as any[]).find((cat: any) => cat.original_id === e.target.value);
                    handleCategoryChanges('mainCategory', e.target.value as string, selected?.name, selected?.tag);
                  }}
                  label="Main Product Category"
                  disabled={isMainCatLoading}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 250, // Adjust this value for height
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select a main category</em>
                  </MenuItem>
                  {mainCatData?.map((category: any) => (
                    <MenuItem key={category.original_id} value={category.original_id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Only show Product Category select if the selected main category has submenu: true */}
              {selectedCategories.mainCategory.id &&
                mainCatData?.find((cat: any) => cat.original_id === selectedCategories.mainCategory.id)?.submenu && (
                  <FormControl fullWidth error={!!errors.productCategory}>
                    <InputLabel>Product Category</InputLabel>
                    <Select
                      value={selectedCategories.productCategory.id}
                      onChange={(e) => {
                        const selected = (productCatData as any)?.children?.find((cat: any) => cat.original_id === e.target.value);
                        handleCategoryChanges('productCategory', e.target.value as string, selected?.name, selected?.tag);
                      }}
                      label="Product Category"
                      disabled={isProductCatLoading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 250,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {productCatData?.children?.map((category: any) => (
                        <MenuItem key={category.original_id} value={category.original_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
            </div>

            {/* Sub Category Selection */}
            <div className="flex flex-col md:flex-row gap-[15px] pt-6 items-center justify-center">
              {/* Only show Sub Category select if the selected product category has submenu: true */}
              {selectedCategories.productCategory.id &&
                productCatData?.children?.find((cat: any) => cat.original_id === selectedCategories.productCategory.id)
                  ?.submenu && (
                  <FormControl fullWidth error={!!errors.productSubCategory}>
                    <InputLabel>Product Sub Category</InputLabel>
                    <Select
                      value={selectedCategories.subCategory.id}
                      onChange={(e) => {
                        const selected = (subCatData as any)?.children?.find((cat: any) => cat.original_id === e.target.value);
                        handleCategoryChanges('subCategory', e.target.value as string, selected?.name, selected?.tag);
                      }}
                      label="Product Sub Category"
                      disabled={isSubCatLoading}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 250, // Adjust this value for height
                          },
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a sub-category</em>
                      </MenuItem>
                      {subCatData?.children?.map((category: any) => (
                        <MenuItem key={category.original_id} value={category.original_id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

              {/* ... other form fields ... */}
            </div>

            {/* Measure */}
            <div className="flex flex-col pt-[10px] md:flex-row gap-[15px] items-center justify-center">
              <FormControl fullWidth error={!!errors.measure}>
                <InputLabel>Measure</InputLabel>
                <Select
                  name="measure"
                  value={productDetailsFormData?.measure || ''}
                  onChange={handleInputChange}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 250, // Adjust this value for height
                      },
                    },
                  }}
                >
                  <Option value="">Select a measure unit</Option>
                  {Moq.map((unit: any) => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
                {errors.measure && <FormHelperText>{errors.measure}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth>
                {/* <InputLabel>M.O.Q / Available Quantity</InputLabel> */}
                <TextField
                  label="M.O.Q / Available Quantity"
                  fullWidth
                  margin="normal"
                  name="quantity"
                  placeholder="Enter your M.O.Q value and select the measure unit"
                  value={productDetailsFormData?.quantity}
                  onChange={handleInputChange}
                  error={!!errors.quantity}
                  helperText={errors.quantity}
                />
              </FormControl>
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
                value={productDetailsFormData?.productHeaderDescription}
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
              <h2 className="font-[500]  pb-3 text-[1rem]">Product Detail Description</h2>
              <div className="space-y-2 !relative">
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
                      <Box sx={{ mt: '8px', '& .tiptap-container': { height: '200px' } }}>
                        {/* <TextEditor
                          name="description"
                          placeholder="Describe your product here..."
                          value={field.description}
                           onUpdate={({ editor }) => handleDescriptionChange(index, "description", editor.getText())}
                        /> */}
                        <TextField
                          label="Product Header Description"
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
              <Button variant="contained" fullWidth onClick={handlePreviewOpen} color="primary">
                Preview
              </Button>
              <Button fullWidth onClick={handleAddDescriptionField} variant="outlined" sx={{}} color="primary">
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
                <Button variant="contained" sx={{ mt: '26px' }} onClick={handlePreviewClose} color="secondary">
                  Close Preview
                </Button>
              </Box>
            </Modal>

            {/*  this is for Product Images */}
            <div>
              <div className="py-[20px]">
                <h2 className="font-[500] text-[1.4rem]">Upload Product Images</h2>
                <p className="text-[#838383] text-[.9rem] ">Minimum of 5 images is required to list products</p>
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
                  accept="image/png, image/jpeg, image/webp"
                />
                <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
                <p className="text-[#696969] text-[.75rem]">
                  Image must not exceed 5mb | Supported format: *jpg, *png, *webp
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
                <h2 className="font-[500] text-[1.4rem]">Upload Attachment</h2>
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

              {/* Display Uploaded Files' Names */}
              <div className="pt-[10px]">
                {uploadedAttachment?.length > 0 && (
                  <div className="flex flex-wrap gap-[10px]">
                    {uploadedAttachment?.map((fileName: any, index: number) => (
                      <Box
                        key={index}
                        sx={{ padding: '5px', backgroundColor: '#f7f7f7', position: 'relative', borderRadius: '5px' }}
                      >
                        <IconButton
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
                className="w-full min-h-[48px]"
                type="submit"
                sx={{
                  '&.Mui-disabled': {
                    background: (theme: any) => theme.palette.primary.main,
                    opacity: 1,
                    color: '#fff',
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                    className="text-white" // Makes spinner visible on primary button
                  />
                ) : activeStep === steps.length - 1 ? (
                  'Finish'
                ) : (
                  'Save and Continue'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierProductDetails;
