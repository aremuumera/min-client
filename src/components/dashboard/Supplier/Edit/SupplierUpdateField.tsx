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
  ListItemText,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel
} from '@/components/ui';
import { Country, State } from 'country-state-city';
import CustomModal from '@/utils/CustomModal';
// import { TextEditor } from '@/components/core/text-editor/text-editor';
import { MdOutlineCancel } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import { useDeleteProductMediaMutation, useUpdateProductMediaMutation, useUpdateProductMutation } from '@/redux/features/supplier-products/products_api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { useGetCategoryQuery, useGetMainCategoryQuery, useGetSubCategoryQuery } from '@/redux/features/categories/cat_api';
import { useAppSelector } from '@/redux';

const SupplierProfileInputEditModal = ({ open, onClose, data, images, attachments, fields = [], onSave }:{
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
  const [profileDescriptionFields, setProfileDescriptionFields] = useState<{header: string; description: string}[]>([{ header: '', description: '' }]);
  const { user, appData} = useAppSelector((state) => state.auth);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string; type: string} | null>(null);
  const [updateType, setUpdateType] = useState<string | null>(null);
  const [categoryTag, setCategoryTag] = useState<string | null>(null);

  const handlePreviewOpen = () => setOpenPreview(true);
  const handlePreviewClose = () => setOpenPreview(false);

  const [updateProductMedia, { isLoading: isUpdatingMedia }] = useUpdateProductMediaMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();
  const  [deleteProductMedia, { isLoading: isDeletingMedia }] = useDeleteProductMediaMutation();

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
  // console.log('selected attachment', selectedAttachmentFiles);

  useEffect(() => {
    if (data?.productDetailDescription) {
      setProfileDescriptionFields(JSON.parse(JSON.stringify(data.productDetailDescription)));
      console.log('object.profileDescriptionFields', profileDescriptionFields);
    } else {
      setProfileDescriptionFields([{ header: '', description: '' }]);
    }
}, [data]);

// useEffect(() => {
//   if (data?.selected_payments) {
//     setFormData(JSON.parse(JSON.stringify(data.selected_payments)));
//   } else {
//     setFormData({});
//   }
// }, [data]);

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
  const handleAddDescriptionField = () => {
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

        // Ensure multiple selection fields are always stored as arrays
        // if (field.multipleFields) {
        //   value = Array.isArray(value) ? value : value ? [value] : [];
        // } else {
        //   value = value || field.value || ''; // Fallback to default value
        // }

        if (field.id === 'productCategories') {
          return { 
            ...acc, 
            main: field.value.main || '',
            product: field.value.product || '',
            sub: field.value.sub || '' ,
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
      // setCategoryTag(initialData.categoryTag || '');  
       console.log('initialData', initialData);
      // If the location field is present, fetch states for the selected country
      if (initialData.location) {
        const country = CountryData.find((c) => c.name === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data, CountryData]);

console.log('categorytag:',  formData?.categoryTag)

  
  // Handle field changes
  // const handleChange = (id, value) => {
  //   setFormData((prev) => ({ ...prev, [id]: value }));

  //       // Handle category tag updates
  //     if (id === 'main') {
  //       const selectedMain = mainCategoryData?.find(c => c.name === value);
  //       setCategoryTag(selectedMain?.tag || '');
  //       // Reset child categories
  //       handleChange('product', '');
  //       handleChange('sub', '');
  //     } 
  //     else if (id === 'product') {
  //       const selectedProduct = productCategoryData?.children?.find(c => c.name === value);
  //       setCategoryTag(selectedProduct?.tag || '');
  //       // Reset sub-category
  //       handleChange('sub', '');
  //     }
  //     else if (id === 'sub') {
  //       const selectedSub = subCategoryData?.children?.find(c => c.name === value);
  //       setCategoryTag(selectedSub?.tag || '');
  //     }

  //   // If the location field changes, fetch states for the selected country
  //   if (id === 'location') {
  //     const country = CountryData.find((c) => c.name === value);
  //     if (country) {
  //       const states = State.getStatesOfCountry(country.isoCode);
  //       setStateData(states);
  //     }
  //   }
  // };

  const handleChange = (id: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [id]: value };
      
      // Update categoryTag based on the current selection level
      if (id === 'main' && value) {
        const selectedMain = mainCategoryData?.find((c: any) => c.name === value);
        newData.categoryTag = selectedMain?.tag || '';
        // Reset child categories
        newData.product = '';
        newData.sub = '';
      } 
      else if (id === 'product' && value) {
        const selectedProduct = productCategoryData?.children?.find((c: any) => c.name === value);
        newData.categoryTag = selectedProduct?.tag || '';
        // Reset sub-category
        newData.sub = '';
      }
      else if (id === 'sub' && value) {
        const selectedSub = subCategoryData?.children?.find((c: any) => c.name === value);
        newData.categoryTag = selectedSub?.tag || '';
      }
      
      return newData;
    });
  
    // Handle location changes (for states)
    if (id === 'location') {
      const country = CountryData.find((c) => c.name === value);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        setStateData(states);
      }
    }
  };

    console.log('formData', formData);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const supplierId = user?.id;
        const productId = data?.id;
  
        if (!supplierId || !productId) {
          throw new Error('Missing required IDs');
        }

        let finalCategoryTag = '';
        if (formData?.main) {
          finalCategoryTag = formData?.main;
        } else if (formData?.product) {
          finalCategoryTag = formData?.product;
        } else if (formData?.sub) {
          finalCategoryTag = formData?.sub;
        }
    

          const payload = {
            // ...formData,
            productName: formData?.productName,
            // productCategory: formData?.productCategory,
            // productSubCategory: formData?.productSubCategory,
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
         
          console.log('payload', payload);
          await updateProduct({
            supplierId,
            productId,
            productData: payload
          }).unwrap();
  
          toast.success('Profile updated successfully',
           {
            position: 'top-right',
            duration: 3000,
            style: {
              background: '#4CAF50',
              color: '#fff',
            }
           }
          );
        
        onClose();
      } catch (error: any) {
        console.error('Update failed:', error);
        toast.error(error?.data?.message || 'Update failed', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#F44336',
            color: '#fff',
          }
        });
      }
    };
  

    const openDeleteConfirmation = (id: string, type: string) => {
      setItemToDelete({
        id,
        type
      });
      setDeleteModalOpen(true);
    };
  
    const closeDeleteConfirmation = () => {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    };
  
    
    // console.log('itemToDelete', itemToDelete);

    const handleDeleteMedia = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        if (!itemToDelete) return;
        // Call your deleteProductMedia API with the item ID
        await deleteProductMedia({
          supplierId: data?.supplierId,
          productId: data?.id,
          mediaType: itemToDelete?.type === 'image' ? 'images' : 'attachments',
          publicId: itemToDelete?.id,
        }).unwrap();
  
        // Close the modal
        closeDeleteConfirmation();
        // Show success message
        toast.success(`${itemToDelete?.type === 'image' ? 'image' : 'attachment'} deleted successfully`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#4CAF50',
            color: '#fff',
          }
        });
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error?.data?.message || 'Delete failed', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#F44336',
            color: '#fff',
          }
        });
      }
    };

// console.log(' images.length', images?.length, selectedProductImageFiles?.length);
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
          style: { background: '#F44336', color: '#fff' }
        });
        return;
      }
      
      if (totalImages > 7) {
        toast.error('You can have a maximum of 7 product images. Please remove some images.', {
          position: 'top-right',
          duration: 3000,
          style: { background: '#F44336', color: '#fff' }
        });
        return;
      }
    }

    if (isAttachmentField) {
      const totalAttachments = attachments.length + selectedAttachmentFiles?.length;
      
      if (totalAttachments < 3) {
        toast.error(`You need at least 5 product attachments. Please add more files.`, {
          position: 'top-right',
          duration: 3000,
          style: { background: '#F44336', color: '#fff' }
        });
        return;
      }
      
      if (totalAttachments > 7) {
        toast.error('You can have a maximum of 7 product attachments. Please remove some files.', {
          position: 'top-right',
          duration: 3000,
          style: { background: '#F44336', color: '#fff' }
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
    if (itemToDelete?.type) mediaType = itemToDelete.type === 'image' ? 'images' : 'attachments';

    if (selectedProductImageFiles.length > 0 || selectedAttachmentFiles.length > 0 || itemToDelete) {
      await updateProductMedia({
        supplierId: data?.supplierId,
        productId: data?.id,
        productData: mediaFormData,
        mediaType: mediaType,
        ...(itemToDelete && { publicId: itemToDelete.id }) 
      }).unwrap();
      
      toast.success(`Product ${mediaType} updated successfully`, {
        position: 'top-right',
        duration: 3000,
        style: { background: '#4CAF50', color: '#fff' }
      });

      setSelectedProductImageFiles([]);
      setSelectedAttachmentFiles([]);
    } else {
      toast.info('No changes detected', {
        position: 'top-right',
        duration: 3000,
        style: { background: '#2196F3', color: '#fff' }
      });
    }

    onClose();
  } catch (error: any) {
    console.error('Update-failed:', error);
    toast.error(`${error?.data?.message || 'Delete failed'}`, {
      position: 'top-right',
      duration: 3000,
      style: { background: '#F44336', color: '#fff' }
    });
  }
};

const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Determine which handler to use based on the field type
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

  // Helper function to render options based on the category
  const renderOptions = (options: any[], selectCategoryName: string, field: any) => {
    switch (selectCategoryName) {
      case 'location':
        return CountryData?.map((country) => (
          <MenuItem key={country.isoCode} value={country.name}>
            {country.name}
          </MenuItem>
        ));
      case 'state':
        return stateData?.map((state) => (
          <MenuItem key={state.name} value={state.name}>
            {state.name}
          </MenuItem>
        ));
      case 'PaymentTerms':
        return options.map((option) => {
          const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <MenuItem key={option.code} value={option.code}>
              <Checkbox checked={isSelected} />
              <ListItemText primary={`${option.code} - ${option.name}`} />
            </MenuItem>
          );
        });
      case 'shippingTerms':
        return options.map((option) => {
          const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <MenuItem key={option.code} value={option.code}>
              <Checkbox checked={isSelected} />
              <ListItemText primary={`${option.code} - ${option.name}`} />
            </MenuItem>
          );
        });
      default:
        return options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ));
    }
  };

  // Helper function to render the selected value(s) in the Select component
  const renderSelectedValue = (selected: any, options: any[] = [], multipleFields: boolean) => {
    if (multipleFields) {
      // Ensure selected is always treated as an array for multiple selections
      return Array.isArray(selected)
        ? selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return option ? option.label || option.value : value;
          }).join(', ')
        : '';
    }
    // Handle single selection case
    const option = options.find((opt) => opt.value === selected);
    return option ? option.label || option.value : selected;
  };

  const handleFileChange = (id: string, files: FileList | null) => {
    if (!files) return;
    const isValidFile = (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, productImages: 'File size must not exceed 5MB' }));
        return false;
      }

      if (id === 'productImage') {
        if (!['image/png', 'image/jpeg',].includes(file.type)) {
          setErrors((prev) => ({ ...prev, productImages: 'Supported formats: PNG, JPEG' }));
          return false;
        }
        return true;
    }else if (id === 'productAttachment') {
        if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) {
          setErrors((prev) => ({ ...prev, productImages: 'Supported formats:PNG, JPEG, PDF' }));
          return false;
        }
      return true;
    };
  }
    const validFiles = Array.from(files).filter(isValidFile);

    if (validFiles.length > 0) {
      setErrors((prev) => ({ ...prev, productImages: '' }));

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
          className="!w-full">
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
                  <Select
                    fullWidth
                    value={formData[field.id] || ''}
                    onChange={(e: any) => handleChange(field.id, e.target.value)}
                  >
                    {renderOptions(field.options, field.selectCategoryName, field)}
                  </Select>
                )}

                {field.type === 'file' && (
                  <> 
                  {field.id === 'productImage' ? (
                    <>
                          <Typography variant="body1" textAlign={'center'} gutterBottom>
                            Update your images by removing the old ones or add new ones <br /> 
                          </Typography>

                          <Typography variant="body1" className="pt-6" textAlign={'center'} gutterBottom>
                          <b >Note:</b> At least 5 images are allowed including the old ones and new ones
                          </Typography>
                         <Box className="relative space-x-2 mt-12">
                         
                          <Box                            
                           className="!flex relative space-x-2 gap-2 items-center">
                            {images?.length > 0 && images?.map((img, i) => (
                              <Box 
                              key={i} 
                              style={{ width: '100px',  height: '100px' }}
                              className="relative w-40 h-32 o rounded flex-shrink-0">
                                <img src={img.url} alt="" style={{ width: '100px',  height: '80px' }} className='' />
                                <button
                                  style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    background: '#000',
                                    borderRadius: '50%',
                                    boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px'
                                  }}
                                  onClick={() => openDeleteConfirmation(img?.publicId, 'image')}
                                  type="button"
                                >
                                  <MdOutlineCancel color="white" size={16} />
                                </button>
                              </Box>
                            ))}
                            <div >
                            </div>
                          </Box>
                         </Box>
                    </>
                 ) : (
                  <>
                    <Typography variant="p" textAlign={'center'} gutterBottom>
                        Update your attachment by removing the old ones or add new ones <br /> 
                    </Typography>

                    <Typography variant="body1" className="pt-6" textAlign={'center'} gutterBottom>
                        <b >Note:</b> At least 5 images are allowed including the old ones and new ones
                     </Typography>
                     <Box                            
                           className="!flex relative space-x-2 pt-6 gap-2 items-center">
                            {attachments?.length > 0 && attachments?.map((img, i) => (
                              <Box 
                              key={i} 
                              style={{ width: '100px',  height: '100px' }}
                              className="relative w-40 h-32 o rounded flex-shrink-0">
                                {/* Show PDF icon for PDF files, image thumbnail for images */}
                                    {img.url.endsWith('.pdf') ? (
                                      <Button 
                                       type="button"
                                       className="text-center bg-[#d2d1d1] pb-6 w-40 h-32 o rounded flex-shrink-0"
                                       onClick={() => {
                                        console.log('Original URL:', img.url);
                                        const pdfUrl = img.url.replace('/image/upload/', '/raw/upload/');
                                        console.log('Converted URL:', pdfUrl);
                                        
                                        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
                                      }}
                                       >
                                       
                                         <svg 
                                            width="40" 
                                            height="40" 
                                            viewBox="0 0 24 21" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path 
                                              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
                                              stroke="#FF0000" 
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            />
                                            <path 
                                              d="M14 2V8H20" 
                                              stroke="#FF0000" 
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            />
                                            <path 
                                              d="M16 13H8" 
                                              stroke="#FF0000" 
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            />
                                            <path 
                                              d="M16 17H8" 
                                              stroke="#FF0000" 
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            />
                                            <path 
                                              d="M10 9H9H8" 
                                              stroke="#FF0000" 
                                              strokeWidth="2" 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          <Typography variant="caption" display="block" sx={{ color: '#FF0000' }}>
                                            PDF File
                                          </Typography>
                                      </Button>
                                    ) : (
                                      <img 
                                        src={img.url} 
                                        alt="" 
                                        style={{ 
                                          width: '100%', 
                                          height: '80px',
                                          objectFit: 'contain' 
                                        }} 
                                      />
                                    )}
          
                                {/* <img src={img.url} alt="" style={{ width: '100px',  height: '80px' }}  /> */}
                                <IconButton
                                  style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    background: '#000',
                                    borderRadius: '50%',
                                    boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                                    // padding: '2px',
                                  }}
                                  aria-label="Delete attachment"
                                  onClick={() => openDeleteConfirmation(img?.publicId, 'attachment')}
                                >
                                  <MdOutlineCancel color="white" fontSize="medium" />
                                </IconButton>
                              </Box>
                            ))}
                            <div>
                            </div>
                     </Box>
                  </>
                 ) }
                  <Button variant="outlined" fullWidth>
                    Upload {field.label}
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={(e) => handleFileChange(field.id, e.target.files)}
                      />
                  </Button>

                    {/* Display selected files for productImage field */} 
                  {field.id === 'productImage' && selectedProductImageFiles.length > 0 && (
                     <>
                        <Box className="mt-2">
                          {selectedProductImageFiles.map((file, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                padding: '8px',
                                marginBottom: '5px',
                                position: 'relative',
                              }}
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
                            </Box>
                          ))}
                        </Box>
                     </>
                    )}

                    {/* productAttachment field  */}
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

                    {errors.productImages && (
                      <Typography mt={1} variant="body2" color="error">
                        {errors.productImages}
                      </Typography>
                    )}
                  </>
                )}

                {/* heacder description field */}
                {field.type === 'headerDescription' && (
                  <>
                    <div className="space-y-2 !relative overflow-y-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                        <Box sx={{mt: 3}} key={index}>
                        
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
                              error={!!errors[`header${index}`]}
                              helperText={errors[`header${index}`]}
                            />
                            <Box sx={{ mt: '8px', '& .tiptap-container': { height: '200px' } }}>
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
                                error={!!errors[`description${index}`]}
                                helperText={errors[`description${index}`]}
                              />
                            </Box>
                          </div>
                        </Box>
                      ))}
                    </div>

                    {/* Preview Modal Button */}
                    <div className="pt-6 py-5 flex gap-8 w-full">
                      <Button variant="contained" className="mb-2" fullWidth onClick={handlePreviewOpen} color="primary">
                        Preview
                      </Button>
                      <Button fullWidth className="mt-4" onClick={handleAddDescriptionField} variant="outlined" color="primary">
                        Add Description Field
                      </Button>
                    </div>

                    {/* Preview Modal */}
                    <Modal open={openPreview} onClose={handlePreviewClose}>
                      <div className="max-w-md mx-auto p-8 bg-white rounded-lg">
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
                        <Button variant="contained" className="mt-6" onClick={handlePreviewClose} color="secondary">
                          Close Preview
                        </Button>
                      </div>
                    </Modal>
                  </>
                )}

         
                  <Box key={field.id} className="mb-4">
                    {field.type === 'categoryGroup' && (
                      <Box className="mb-6">
                        <FormControl fullWidth className="mb-4">
                          <InputLabel>Main Category</InputLabel>
                          <Select
                            value={formData.main || ''}
                            onChange={(e) => {
                              handleChange('main', e.target.value);
                              // Reset child categories when main category changes
                              handleChange('product', '');
                              handleChange('sub', '');
                            }}
                            label="Main Category"
                            MenuProps={{
                              PaperProps: {
                                style: {
                                  maxHeight: 250, // Adjust this value for height
                                },
                              },
                            }}
                          >
                            {mainCategoryData?.map((category: any) => (
                              <MenuItem key={category.original_id} value={category.name}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {formData.main && (
                          <FormControl fullWidth className="mb-4">
                            <InputLabel>Product Category</InputLabel>
                            <Select
                              value={formData.product || ''}
                              onChange={(e) => {
                                handleChange('product', e.target.value);
                                // Reset sub-category when product category changes
                                handleChange('sub', '');
                              }}
                              label="Product Category"
                              disabled={!productCategoryData?.children?.length}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 250, // Adjust this value for height
                                  },
                                },
                              }}
                            >
                              {productCategoryData?.children?.map((category: any) => (
                                <MenuItem key={category.id} value={category.name}>
                                  {category.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {formData.product && (
                          <FormControl fullWidth className="mb-4">
                            <InputLabel>Sub Category</InputLabel>
                            <Select
                              value={formData.sub || ''}
                              onChange={(e) => handleChange('sub', e.target.value)}
                              label="Sub Category"
                              disabled={!subCategoryData?.children?.length}
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 250, // Adjust this value for height
                                  },
                                },
                              }}
                            >
                              {subCategoryData?.children?.map((category: any) => (
                                <MenuItem key={category.id} value={category.name}>
                                  {category.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                    )}
                    
                    
                  </Box>
    

              </Box>
            ))}
            
            <div className="mt-6 flex gap-5 justify-between">
              <Button onClick={onClose} fullWidth variant="outlined">
                Cancel
              </Button>
              <Button 
               fullWidth
               type="submit"
                variant="contained" 
                color="primary"
                disabled={isUpdatingMedia || isUpdatingProduct}
                >
                   {isUpdatingMedia || isUpdatingProduct ?  (
                      <CircularProgress
                          size={24} 
                          color="inherit" 
                          className="text-white"
                      />
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
        <form
          onSubmit={handleDeleteMedia}
        >
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
                  <Button 
                  type='button'
                  onClick={closeDeleteConfirmation} variant="outlined">
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    type="submit"
                    disabled={isDeletingMedia}
                  >
                    {isDeletingMedia ? 'Deleting...' : 'Delete'}
                  </Button>
              </div>
            </div>
        </form>

       
      </Modal>
    </div>
  );
};

export default SupplierProfileInputEditModal;