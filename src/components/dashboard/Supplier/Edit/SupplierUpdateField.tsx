import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  Box,
  Typography,
  Checkbox,
  Modal,

  IconButton,
  CircularProgress,
  Portal
} from '@/components/ui';
import { ChevronDown, Search, X } from 'lucide-react';
import { Country, State } from 'country-state-city';
import CustomModal from '@/utils/CustomModal';
// import { TextEditor } from '@/components/core/text-editor/text-editor';
import { MdOutlineCancel } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import { useDeleteProductMediaMutation, useUpdateProductMediaMutation, useUpdateProductMutation } from '@/redux/features/supplier-products/products_api';
import { toast } from '@/components/core/toaster';
import { useSelector } from 'react-redux';
import { useGetCategoryQuery, useGetMainCategoryQuery, useGetSubCategoryQuery } from '@/redux/features/categories/cat_api';
import { useAppSelector } from '@/redux';

// From-scratch custom select components for the edit modal
import { SearchableSelectLocal } from '@/components/ui/searchable-select-local';
import { MultiCheckboxSelectLocal } from '@/components/ui/multi-checkbox-select-local';


const SupplierProductInputEditModal = ({ open, onClose, data, images, attachments, fields = [], onSave }: {
  open: boolean;
  onClose: () => void;
  data: any;
  images: any[];
  attachments: any[];
  fields: any[];
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState<any>({});
  const [CountryData, setCountryData] = useState<any[]>([]);
  const [stateData, setStateData] = useState<any[]>([]);
  const [selectedProductImageFiles, setSelectedProductImageFiles] = useState<File[]>([]);
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openPreview, setOpenPreview] = useState(false);
  const [profileDescriptionFields, setProfileDescriptionFields] = useState<{ header: string; description: string }[]>([{ header: '', description: '' }]);
  const { user, appData, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: string } | null>(null);

  const handlePreviewOpen = () => setOpenPreview(true);
  const handlePreviewClose = () => setOpenPreview(false);

  const [updateProductMedia, { isLoading: isUpdatingMedia }] = useUpdateProductMediaMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();
  const [deleteProductMedia, { isLoading: isDeletingMedia }] = useDeleteProductMediaMutation();

  const { data: mainCategoryData } = useGetMainCategoryQuery();

  // Fetch product categories only when we have a selected main category
  const { data: productCategoryData } = useGetCategoryQuery(
    mainCategoryData?.find((c: any) => c.name === formData.main)?.tag,
    { skip: !formData.main }
  );

  // Fetch subcategories only when we have a selected product category
  const { data: subCategoryData } = useGetSubCategoryQuery(
    productCategoryData?.children?.find((c: any) => c.name === formData.product)?.original_id,
    { skip: !formData.product }
  );

  console.log('yo me', images);

  useEffect(() => {
    if (data?.productDetailDescription) {
      setProfileDescriptionFields(JSON.parse(JSON.stringify(data.productDetailDescription)));
    } else {
      setProfileDescriptionFields([{ header: '', description: '' }]);
    }
  }, [data]);

  useEffect(() => {
    if (fields && fields.length > 0) {
      const initialData: any = {};
      fields.forEach((field) => {
        if (field.type === 'categoryGroup' && typeof field.value === 'object') {
          initialData.main = field.value.main || '';
          initialData.product = field.value.product || '';
          initialData.sub = field.value.sub || '';
          initialData.categoryTag = field.value.catTag || '';
        } else if (field.value !== undefined && field.value !== null) {
          initialData[field.id] = field.value;
        }
      });
      setFormData(initialData);

      // If the location field is present, fetch states for the selected country
      if (initialData.location) {
        const country = Country.getAllCountries().find((c) => c.name === initialData.location || c.isoCode === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data]);

  // Validate each description field
  const validateEachDescriptionField = (index: number, field: string, value: string) => {
    const fieldKey = `${field}${index}`;
    setErrors((prevErrors) => {
      const newErrors: any = { ...prevErrors };
      if (!value?.trim()) {
        newErrors[fieldKey] = `${field === 'header' ? 'Header' : 'Description'} is required`;
      } else {
        delete newErrors[fieldKey];
      }
      return newErrors;
    });
  };

  // Handle changes in description fields
  const handleDescriptionChange = (index: number, field: string, value: string) => {
    setProfileDescriptionFields((prevFields) => {
      const updatedFields: any = [...prevFields];
      updatedFields[index][field] = value;
      return updatedFields;
    });
    validateEachDescriptionField(index, field, value);
  };

  // Add a new description field
  const handleAddDescriptionField = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileDescriptionFields((prevFields) => [...prevFields, { header: '', description: '' }]);
  };

  // Remove a description field
  const handleClearDescriptionField = (index: number) => {
    setProfileDescriptionFields((prevFields) => {
      const updatedFields = [...prevFields];
      updatedFields.splice(index, 1);
      return updatedFields;
    });
  };

  // Fetch countries when the modal opens
  useEffect(() => {
    const countries = Country.getAllCountries();
    setCountryData(countries || []);
  }, []);


  // Populate form data when the modal opens or when `fields` change
  useEffect(() => {
    if (fields.length) {
      const initialData = fields.reduce((acc, field) => {
        let value = data?.[field.id]; // Get existing stored value

        if (field.id === 'productCategories') {
          return {
            ...acc,
            main: field.value.main || '',
            product: field.value.product || '',
            sub: field.value.sub || '',
            categoryTag: field.value.catTag
          };
        }

        // Special handling for PaymentTerms
        if (field.id === 'PaymentTerms' && data?.selected_payments) {
          value = data.selected_payments;
        } else if (field.id === 'shippingTerms' && data?.selected_shipping) {
          value = data.selected_shipping;
        }
        // Ensure multiple selection fields are always stored as arrays
        else if (field.multipleFields) {
          value = Array.isArray(value) ? value : value ? [value] : [];
        } else {
          value = value || field.value || ''; // Fallback to default value
        }

        return { ...acc, [field.id]: value };
      }, {});

      setFormData(initialData);

      // If the location field is present, fetch states for the selected country
      if (initialData.location) {
        const country = CountryData.find((c) => c.name === initialData.location || c.isoCode === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data, CountryData]);


  const handleChange = (id: string, value: any) => {
    // Handle both direct value and event object
    const actualValue = value?.target ? value.target.value : value;

    setFormData((prev: any) => {
      const newData = { ...prev, [id]: actualValue };

      // Update categoryTag based on the current selection level
      if (id === 'main' && actualValue) {
        const selectedMain = mainCategoryData?.find((c: any) => c.name === actualValue);
        newData.categoryTag = selectedMain?.tag || '';
        // Reset child categories
        newData.product = '';
        newData.sub = '';
      }
      else if (id === 'product' && actualValue) {
        const selectedProduct = productCategoryData?.children?.find((c: any) => c.name === actualValue);
        newData.categoryTag = selectedProduct?.tag || '';
        // Reset sub-category
        newData.sub = '';
      }
      else if (id === 'sub' && actualValue) {
        const selectedSub = subCategoryData?.children?.find((c: any) => c.name === actualValue);
        newData.categoryTag = selectedSub?.tag || '';
      }

      return newData;
    });

    // Handle location changes (for states)
    if (id === 'location') {
      const country = CountryData.find((c) => c.name === actualValue || c.isoCode === actualValue);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        setStateData(states);
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supplierId = isTeamMember ? ownerUserId : user?.id;
      const productId = data?.id;
      if (!supplierId || !productId) {
        throw new Error('Missing required IDs');
      }

      const payload = {
        productName: formData?.productName,
        productHeaderDescription: formData?.productHeaderDescription,
        prevPrice: formData?.prevPrice,
        realPrice: formData?.realPrice,
        quantity: formData?.quantity,
        color: formData?.color,
        composition: formData?.composition,
        deliveryPeriod: formData?.deliveryPeriod,
        selectedCountryName: formData?.location,
        selectedState: formData?.state,
        streetNo: formData?.streetNo,
        zipCode: formData?.zipCode,
        fullAdress: formData?.fullAdress,
        latitude: formData?.latitude,
        longitude: formData?.longitude,
        hardness: formData?.hardness,
        density: formData?.density,
        selectedShipping: formData?.shippingTerms,
        selectedPayments: formData?.PaymentTerms,
        paymentsTermsDescribed: formData?.paymentTermsDescribed,
        shippingTermsDescribed: formData?.shippingTermsDescribed,
        measure: formData?.measure,
        productDetailDescription: JSON.stringify(profileDescriptionFields),
        productMainCategory: formData?.main,
        productCategory: formData?.product,
        productSubCategory: formData?.sub,
        categoryTag: formData?.categoryTag
      };

      await updateProduct({
        supplierId,
        productId,
        productData: payload
      }).unwrap();

      toast.success('Product updated successfully', {
        position: 'top-right',
        duration: 3000,
      });

      onClose();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error?.data?.message || 'Update failed', {
        position: 'top-right',
        duration: 3000,
      });
    }
  };


  const openDeleteConfirmation = (id: string, type: string) => {
    setItemToDelete({ id, type });
    setDeleteModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };


  const handleDeleteMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!itemToDelete) return;
      await deleteProductMedia({
        supplierId: data?.supplierId,
        productId: data?.id,
        mediaType: itemToDelete?.type === 'image' ? 'images' : 'attachments',
        publicId: itemToDelete?.id,
      }).unwrap();

      closeDeleteConfirmation();
      toast.success(`${itemToDelete?.type === 'image' ? 'image' : 'attachment'} deleted successfully`, {
        position: 'top-right',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error?.data?.message || 'Delete failed', {
        position: 'top-right',
        duration: 3000,
      });
    }
  };

  const handleUpdateProductMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const isImageField = fields.some(field => field.id === 'productImage');
      const isAttachmentField = fields.some(field => field.id === 'productAttachment');

      if (isImageField) {
        const totalImages = images.length + selectedProductImageFiles.length;

        if (totalImages < 5) {
          toast.error(`You need at least 5 product images. Please add more images.`, {
            position: 'top-right',
            duration: 3000,
          });
          return;
        }

        if (totalImages > 7) {
          toast.error('You can have a maximum of 7 product images. Please remove some images.', {
            position: 'top-right',
            duration: 3000,
          });
          return;
        }
      }

      if (isAttachmentField) {
        const totalAttachments = attachments.length + selectedAttachmentFiles?.length;

        if (totalAttachments < 1) {
          toast.error(`You need at least 1 product attachment. Please add more files.`, {
            position: 'top-right',
            duration: 3000,
          });
          return;
        }

        if (totalAttachments > 7) {
          toast.error('You can have a maximum of 7 product attachments. Please remove some files.', {
            position: 'top-right',
            duration: 3000,
          });
          return;
        }
      }

      const mediaFormData = new FormData();

      if (isImageField && selectedProductImageFiles.length > 0) {
        selectedProductImageFiles.forEach(file => {
          mediaFormData.append('productImages', file);
        });
      }

      if (isAttachmentField && selectedAttachmentFiles.length > 0) {
        selectedAttachmentFiles.forEach(file => {
          mediaFormData.append('productAttachments', file);
        });
      }

      let mediaType;
      if (isImageField) mediaType = 'images';
      if (isAttachmentField) mediaType = 'attachments';

      if (selectedProductImageFiles.length > 0 || selectedAttachmentFiles.length > 0) {
        await updateProductMedia({
          supplierId: data?.supplierId,
          productId: data?.id,
          productData: mediaFormData,
          mediaType: mediaType,
        }).unwrap();

        toast.success(`Product ${mediaType} updated successfully`, {
          position: 'top-right',
          duration: 3000,
        });

        setSelectedProductImageFiles([]);
        setSelectedAttachmentFiles([]);
      } else {
        toast.info('No changes detected', {
          position: 'top-right',
          duration: 3000,
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Update-failed:', error);
      toast.error(`${error?.data?.message || 'Update failed'}`, {
        position: 'top-right',
        duration: 3000,
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isMediaUpdate = fields.some(field =>
      field.type === 'file' ||
      field.id === 'productImage' ||
      field.id === 'productAttachment'
    );

    if (isMediaUpdate) {
      handleUpdateProductMedia(e);
    } else {
      handleSubmit(e);
    }
  };

  // Helper function to prepare options for Select component
  const renderOptions = (options: any[], selectCategoryName: string) => {
    switch (selectCategoryName) {
      case 'location':
        return CountryData?.map((country: any) => ({
          value: country.name,
          label: country.name,
          isoCode: country.isoCode
        })) || [];
      case 'state':
        return stateData?.map((state: any) => ({
          value: state.name,
          label: state.name,
          isoCode: state.isoCode
        })) || [];
      default:
        return (options || []).map((option) => ({
          value: option,
          label: option
        }));
    }
  };



  const handleFileChange = (id: string, files: FileList | null) => {
    if (!files) return;
    const isValidFile = (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must not exceed 5MB', { position: 'top-right', duration: 3000 });
        return false;
      }

      if (id === 'productImage') {
        if (!['image/png', 'image/jpeg', 'image/webp', 'video/mp4'].includes(file.type)) {
          toast.error('Supported formats: PNG, JPEG, WEBP, MP4', { position: 'top-right', duration: 3000 });
          return false;
        }
        return true;
      }

      if (id === 'productAttachment') {
        if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4'].includes(file.type)) {
          toast.error('Supported formats: PDF, DOC, DOCX, MP4', { position: 'top-right', duration: 3000 });
          return false;
        }
        return true;
      }

      return true;
    };
    const validFiles = Array.from(files).filter(isValidFile);

    if (validFiles.length > 0) {
      if (id === 'productImage') {
        setSelectedProductImageFiles((prevFiles) => {
          const newFiles = validFiles.filter((file) => !prevFiles.some((f) => f.name === file.name));
          return [...prevFiles, ...newFiles];
        });
      } else if (id === 'productAttachment') {
        setSelectedAttachmentFiles((prevFiles) => {
          const newFiles = validFiles.filter((file) => !prevFiles.some((f) => f.name === file.name));
          return [...prevFiles, ...newFiles];
        });
      }
    }
  };

  const removeFile = (id: string, index: number) => {
    if (id === 'productImage') {
      setSelectedProductImageFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    } else if (id === 'productAttachment') {
      setSelectedAttachmentFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      <CustomModal open={open} onClose={onClose} title={`Edit ${fields[0]?.label || ''} Details`}>
        <div className="w-full">
          <form
            onSubmit={handleFormSubmit}
            className="w-full!">
            {fields.map((field) => (
              <Box key={field.id} className="mb-4">
                {field.type === 'text' && (
                  <TextField
                    fullWidth
                    label={field.label}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  />
                )}

                {field.type === 'textarea' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label={field.label}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  />
                )}

                {field.type === 'select' && (
                  !field.multipleFields ? (
                    <SearchableSelectLocal
                      label={field?.label}
                      value={formData[field?.id] || ''}
                      onChange={(val: any) => handleChange(field?.id, val)}
                      options={renderOptions(field.options, field.selectCategoryName)}
                      placeholder={`Select ${field?.label}`}
                      searchPlaceholder={`Search ${field?.label}...`}
                    />
                  ) : (
                    <MultiCheckboxSelectLocal
                      label={field?.label}
                      options={
                        field.options?.map((opt: any) => ({
                          value: opt.code || opt,
                          label: opt.name ? `${opt.code} - ${opt.name}` : opt,
                        })) || []
                      }
                      value={formData[field?.id] || []}
                      onChange={(value: any) => handleChange(field?.id, value)}
                      placeholder={`Select ${field?.label}`}
                      searchPlaceholder={`Search ${field?.label}...`}
                    />
                  )
                )}

                {field.type === 'file' && (
                  <>
                    {field.id === 'productImage' ? (
                      <>
                        <Typography variant="body1" className="text-center" gutterBottom>
                          Update your images by removing the old ones or add new ones <br />
                        </Typography>

                        <p className="">
                          <b>Note:</b> At least 5 images are allowed including the old ones and new ones
                        </p>
                        <Box className="relative w-full mt-4">
                          <Box
                            className="flex relative space-x-2 gap-2 items-center overflow-x-auto pb-4 scrollbar-hide">
                            {images?.length > 0 && images?.map((img: any, i: any) => (
                              <Box
                                key={i}
                                className="relative w-28 h-28 rounded shrink-0 border border-neutral-200 p-1 mt-4 overflow-hidden">
                                {img.url.toLowerCase().endsWith('.mp4') || img.url.toLowerCase().endsWith('.webm') ? (
                                  <video
                                    src={img.url}
                                    className="w-full h-full object-cover rounded"
                                    muted
                                  />
                                ) : (
                                  <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover rounded"
                                  />
                                )}
                                <button
                                  className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md flex items-center justify-center w-6 h-6 hover:bg-neutral-100 transition-colors"
                                  onClick={() => openDeleteConfirmation(img?.publicId, 'image')}
                                  type="button"
                                >
                                  <MdOutlineCancel color="red" size={16} />
                                </button>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Typography variant="body1" className="text-center" gutterBottom>
                          Update your attachment by removing the old ones or add new ones <br />
                        </Typography>

                        <p className="" >
                          <b >Note:</b> Add at least 1 attachment (PDF, DOC, DOCX) to support your product.
                        </p>
                        <Box className="relative w-full mt-4">
                          <Box
                            className="flex relative space-x-2 gap-2 items-center overflow-x-auto pb-4 scrollbar-hide">
                            {attachments?.length > 0 && attachments?.map((img: any, i: any) => (
                              <Box
                                key={i}
                                className="relative w-28 h-28 rounded shrink-0 border border-neutral-200 p-1 flex items-center justify-center bg-neutral-50 mt-4 overflow-hidden">
                                {img.url.toLowerCase().endsWith('.pdf') ? (
                                  <div
                                    className="cursor-pointer flex flex-col items-center justify-center gap-1"
                                    onClick={() => window.open(img.url, '_blank', 'noopener,noreferrer')}
                                  >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" />
                                      <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" />
                                    </svg>
                                    <span className="text-[10px] text-red-600 font-medium font-bold">PDF</span>
                                  </div>
                                ) : img.url.toLowerCase().endsWith('.mp4') || img.url.toLowerCase().endsWith('.webm') ? (
                                  <video src={img.url} className='w-full h-full object-cover rounded' muted />
                                ) : (
                                  <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover rounded"
                                  />
                                )}

                                <button
                                  className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md flex items-center justify-center w-6 h-6 hover:bg-neutral-100 transition-colors"
                                  onClick={() => openDeleteConfirmation(img?.publicId, 'attachment')}
                                  type="button"
                                >
                                  <MdOutlineCancel color="red" size={16} />
                                </button>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth
                      type="button"
                      onClick={() => document.getElementById(`file-input-${field.id}`)?.click()}
                    >
                      Upload {field.label}
                    </Button>
                    <input
                      id={`file-input-${field.id}`}
                      type="file"
                      hidden
                      multiple
                      onChange={(e) => handleFileChange(field.id, e.target.files)}
                    />

                    {field.id === 'productImage' && selectedProductImageFiles.length > 0 && (
                      <Box className="mt-4 space-y-2">
                        {selectedProductImageFiles.map((file, index) => (
                          <Box
                            key={index}
                            className="flex items-center justify-between border rounded-lg p-2 relative bg-gray-50"
                          >
                            <Box className="w-10 h-10 rounded overflow-hidden shrink-0 border bg-white flex items-center justify-center">
                              {file.type.startsWith('video/') ? (
                                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
                              ) : (
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" className="ml-2 truncate flex-1 text-xs">
                              {file.name}
                            </Typography>
                            <Button
                              onClick={() => removeFile(field.id, index)}
                              className="p-1 "
                            >
                              <MdOutlineCancel color="red"
                                size={18} />
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {field.id === 'productAttachment' && selectedAttachmentFiles.length > 0 && (
                      <div className="mt-4">
                        {selectedAttachmentFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md p-2 mb-1 relative"
                            style={{ border: '1px solid #ccc' }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {file.name}
                            </Typography>
                            <IconButton
                              style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: 'white',
                                borderRadius: '50%',
                                boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                              }}
                              aria-label="Remove file"
                              onClick={() => removeFile(field.id, index)}
                            >
                              <MdOutlineCancel color="red" />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {field.type === 'headerDescription' && (
                  <>
                    <div className="space-y-2 relative! overflow-y-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Typography variant="h6" gutterBottom>
                          You currently have {profileDescriptionFields?.length} description fields.
                        </Typography>
                      </motion.div>
                      {profileDescriptionFields?.map((field, index) => (
                        <Box sx={{ mt: 3 }} key={index}>
                          {index !== 0 && (
                            <IconButton
                              style={{
                                position: 'absolute',
                                right: 0,
                                zIndex: 20,
                              }}
                              aria-label="Clear description field"
                              onClick={() => handleClearDescriptionField(index)}
                            >
                              <MdOutlineCancel />
                            </IconButton>
                          )}
                          <div>
                            <TextField
                              label={`${index === 0 ? '' : `${index + 1}:`} Header`}
                              fullWidth
                              name="header"
                              value={field.header}
                              onChange={(e) => handleDescriptionChange(index, 'header', e.target.value)}
                              margin="normal"
                              placeholder="Enter header"
                            />
                            <Box sx={{ mt: '8px' }}>
                              <Typography>{`${index === 0 ? '' : `${index + 1}:`} Description`}</Typography>
                              <TextField
                                name="description"
                                fullWidth
                                placeholder="Describe your product here..."
                                value={field.description}
                                margin="normal"
                                rows={6}
                                multiline
                                onChange={(e) => handleDescriptionChange(index, 'description', e.target.value)}
                              />
                            </Box>
                          </div>
                        </Box>
                      ))}
                    </div>

                    <div className="pt-6 py-5 flex gap-8 w-full">
                      <Button variant="contained" className="mb-2" fullWidth onClick={handlePreviewOpen} color="primary" type="button">
                        Preview
                      </Button>
                      <Button fullWidth className="mt-4" onClick={handleAddDescriptionField} variant="outlined" color="primary" type="button">
                        Add Description Field
                      </Button>
                    </div>

                    <Modal open={openPreview} onClose={handlePreviewClose}>
                      <div className="max-w-md mx-auto p-8 bg-white rounded-lg" style={{ marginTop: '10%' }}>
                        <Typography variant="h6" gutterBottom>
                          Preview Description
                        </Typography>
                        <div>
                          {profileDescriptionFields?.map((field, index) => (
                            <div key={index} className="mt-6">
                              <Typography variant="h6">{field.header}</Typography>
                              <Typography className="pt-2" variant="body1">
                                {field.description}
                              </Typography>
                            </div>
                          ))}
                        </div>
                        <Button variant="contained" className="mt-6" onClick={handlePreviewClose} color="secondary" type="button">
                          Close Preview
                        </Button>
                      </div>
                    </Modal>
                  </>
                )}
                {field.type === 'categoryGroup' && (
                  <Box className="mb-6">
                    <Select
                      fullWidth
                      className="mb-4"
                      value={formData.main || ''}
                      onChange={(e: any) => {
                        handleChange('main', e.target.value);
                      }}
                      label="Main Category"
                    >
                      {mainCategoryData?.map((category: any) => (
                        <MenuItem key={category.original_id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>

                    {formData.main && (
                      <Select
                        fullWidth
                        className="mb-4"
                        value={formData.product || ''}
                        onChange={(e: any) => {
                          handleChange('product', e.target.value);
                        }}
                        label="Product Category"
                        disabled={!productCategoryData?.children?.length}
                      >
                        {productCategoryData?.children?.map((category: any) => (
                          <MenuItem key={category.id} value={category.name}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}

                    {formData.product && (
                      <Select
                        fullWidth
                        className="mb-4"
                        value={formData.sub || ''}
                        onChange={(e: any) => handleChange('sub', e.target.value)}
                        label="Sub Category"
                        disabled={!subCategoryData?.children?.length}
                      >
                        {subCategoryData?.children?.map((category: any) => (
                          <MenuItem key={category.id} value={category.name}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Box>
                )}
              </Box>
            ))}

            <div className="mt-6 flex gap-5 justify-between">
              <Button onClick={onClose} fullWidth variant="outlined" type="button">
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={isUpdatingMedia || isUpdatingProduct}
              >
                {isUpdatingMedia || isUpdatingProduct ? (
                  <CircularProgress size={24} color="inherit" className="text-white" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CustomModal>

      <Modal
        open={deleteModalOpen}
        onClose={closeDeleteConfirmation}
        aria-labelledby="delete-confirmation-modal"
      >
        <form onSubmit={handleDeleteMedia}>
          <div
            className="absolute top-1/2 left-1/2 w-[400px] bg-white shadow-xl p-8 rounded-lg"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Delete Confirmation
            </Typography>
            <Typography variant="body1" className="mt-4">
              Are you sure you want to delete this {itemToDelete?.type === 'image' ? 'image' : 'attachment'}?
              This action cannot be undone.
            </Typography>

            <div className="mt-8 flex justify-end gap-4">
              <Button type='button' onClick={closeDeleteConfirmation} variant="outlined">
                Cancel
              </Button>
              <Button variant="contained" color="error" type="submit" disabled={isDeletingMedia}>
                {isDeletingMedia ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupplierProductInputEditModal;