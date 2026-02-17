import CustomModal from '@/utils/CustomModal';
import React, { useState, useEffect } from 'react';
import { TextField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { MenuItem } from '@/components/ui/menu';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Checkbox } from '@/components/ui/checkbox';
import { ListItemText } from '@/components/ui/list';
import { IconButton } from '@/components/ui/icon-button';
import { Modal } from '@/components/ui/modal';
import { Loader2 } from 'lucide-react';
import { FormControl, InputLabel } from '@/components/ui/form-control';
import { Country, State } from 'country-state-city';
import { MdOutlineCancel } from 'react-icons/md';
import { useDeleteRfqMediaMutation, useEditRFQMutation, useUpdateRfqMediaMutation } from '@/redux/features/buyer-rfq/rfq-api';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useGetCategoryQuery, useGetMainCategoryQuery, useGetSubCategoryQuery } from '@/redux/features/categories/cat_api';
import { useAppSelector } from '@/redux';
import { SearchableSelectLocal } from '@/components/ui/searchable-select-local';
import { MultiCheckboxSelectLocal } from '@/components/ui/multi-checkbox-select-local';

const RfqInputEditModal = ({ open, onClose, attachments, data, fields = [], onSave }: { open: boolean, onClose: () => void, attachments: any, data: any, fields: any, onSave: (data: any) => void }) => {
  const [formData, setFormData] = useState<any>({});
  const [CountryData, setCountryData] = useState<any>([]);
  const [stateData, setStateData] = useState<any>([]);
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<any>([]);
  const [errors, setErrors] = useState<any>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);

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



  const [editRFQ, { isLoading: isUpdatingMedia }] = useEditRFQMutation();
  const [updateRfqMedia, { isLoading: isUpdatingRfq }] = useUpdateRfqMediaMutation();
  const [deleteRfqMedia, { isLoading: isDeletingMedia }] = useDeleteRfqMediaMutation();



  // Fetch countries when the modal opens
  useEffect(() => {
    const countries = Country.getAllCountries();
    setCountryData(countries || []);
  }, []);

  // Populate form data when the modal opens or when `fields` change
  useEffect(() => {
    if (fields.length) {
      const initialData = fields.reduce((acc: any, field: any) => {
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
            sub: field.value.sub || '',
            categoryTag: field.value.catTag
          };
        }

        if (field.id === 'PaymentTerms' && data?.selected_payments) {
          value = data.selected_payments;
        } else if (field.id === 'shippingTerms' && data?.selected_shipping) {
          value = data.selected_shipping;
        } else {
          value = value || field.value || ''; // Fallback to default value
        }

        return { ...acc, [field.id]: value };
      }, {});

      setFormData(initialData);

      // If the location field is present, fetch states for the selected country
      if (initialData.location) {
        const country = CountryData.find((c: any) => c.name === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data, CountryData]);

  // Handle field changes
  const handleChange = (id: any, value: any) => {
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
      const country = CountryData.find((c: any) => c.name === value);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        setStateData(states);
      }
    }
  };



  // Helper function to render options based on the category
  const renderOptions = (options: any[], selectCategoryName: string, field: any) => {
    switch (selectCategoryName) {
      case 'location':
        return CountryData?.map((country: any) => (
          <MenuItem key={country.isoCode} value={country.name}>
            {country.name}
          </MenuItem>
        ));
      case 'state':
        return stateData?.map((state: any) => (
          <MenuItem key={state.name} value={state.name}>
            {state.name}
          </MenuItem>
        ));
      case 'rfqCategory':
        return options.map((option: any) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ));
      case 'rfqSubCategory':
        return options.map((option: any) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ));
      case 'quantityMeasure':
        return options.map((option: any) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ));
      case 'PaymentTerms':
        return options.map((option: any) => {
          const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <MenuItem key={option.code} value={option.code}>
              <Checkbox checked={isSelected} />
              <ListItemText primary={`${option.code} - ${option.name}`} />
            </MenuItem>
          );
        });
      case 'shippingTerms':
        return options.map((option: any) => {
          const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <MenuItem key={option.code} value={option.code}>
              <Checkbox checked={isSelected} />
              <ListItemText primary={`${option.code} - ${option.name}`} />
            </MenuItem>
          );
        });
      default:
        return options.map((option: any) => (
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
        ? selected.map((value: any) => {
          const option = options.find((opt: any) => opt.value === value);
          return option ? option.label || option.value : value;
        }).join(', ')
        : '';
    }

    // Handle single selection case
    const option = options.find((opt: any) => opt.value === selected);
    return option ? option.label || option.value : selected;
  };

  const handleFileChange = (id: any, files: any) => {
    const isValidFile = (file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev: any) => ({ ...prev, productImages: 'File size must not exceed 5MB' }));
        return false;
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        setErrors((prev: any) => ({ ...prev, productImages: 'Supported formats: PNG, JPEG, WEBP' }));
        return false;
      }
      return true;
    };

    const validFiles = Array.from(files).filter((file: any) => isValidFile(file));

    if (validFiles.length > 0) {
      setErrors((prev: any) => ({ ...prev, productImages: '' }));

      if (id === 'productAttachment') {
        setSelectedAttachmentFiles((prevFiles: any[]) => {
          const newFiles = validFiles.filter((file: any) => !prevFiles.some((f: any) => f.name === file.name));
          return [...prevFiles, ...newFiles];
        });
      }
    }
  };

  const removeFile = (id: any, index: number) => {
    if (id === 'productImage') {
      // setSelectedProductImageFiles((prevFiles: any[]) => prevFiles.filter((_, i) => i !== index));
    } else if (id === 'productAttachment') {
      setSelectedAttachmentFiles((prevFiles: any[]) => prevFiles.filter((_: any, i: number) => i !== index));
    }
  };

  console.log('formData', formData);

  const handleUpdateProductMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const isAttachmentField = fields.some((field: any) => field.id === 'productAttachment');

      if (isAttachmentField) {
        const totalAttachments = attachments.length + selectedAttachmentFiles?.length;

        if (totalAttachments > 5) {
          toast.error(`You need at least 5 product attachments. Please add more files.`, {
            position: 'top-right',
            duration: 3000,
            style: { background: '#F44336', color: '#fff' }
          });
          return;
        }

        if (totalAttachments > 5) {
          toast.error('You can have a maximum of 5 product attachments. Please remove some files.', {
            position: 'top-right',
            duration: 3000,
            style: { background: '#F44336', color: '#fff' }
          });
          return;
        }
      }

      const mediaFormData = new FormData();

      if (isAttachmentField && selectedAttachmentFiles.length > 0) {
        selectedAttachmentFiles.forEach((file: any) => {
          mediaFormData.append('rfqAttachment', file);
        });
      }

      let mediaType;
      if (isAttachmentField) mediaType = 'attachments';
      // if (itemToDelete?.type) mediaType = itemToDelete.type === 'image' ? 'images' : 'attachments';

      const currentUserId = isTeamMember ? ownerUserId : user?.id;

      if (selectedAttachmentFiles.length > 0) {
        await updateRfqMedia({
          buyerId: currentUserId,
          rfqId: data?.rfqId,
          rfqData: mediaFormData,
          ...(itemToDelete && { publicId: itemToDelete.id })
        }).unwrap();

        toast.success(`Rfq attachment updated successfully`, {
          position: 'top-right',
          duration: 3000,
          style: { background: '#4CAF50', color: '#fff' }
        });

        setSelectedAttachmentFiles([]);
        onClose();
      } else {
        toast.info('No changes detected', {
          position: 'top-right',
          duration: 3000,
          style: { background: '#2196F3', color: '#fff' }
        });
      }
      setSelectedAttachmentFiles([]);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    try {
      const buyerId = isTeamMember ? ownerUserId : user?.id;
      const rfqId = data?.rfqId;

      if (!buyerId || !rfqId) {
        throw new Error('Missing required IDs');
      }

      const payload = {
        deliveryPeriod: formData?.deliveryPeriod,
        durationOfSupply: formData?.durationOfSupply,
        productDestination: formData?.location,
        quantityMeasure: formData?.quantityMeasure,
        quantityRequired: formData?.quantity,
        rfqDescription: formData?.rfqDescription,
        rfqProductCategory: formData?.product,
        rfqProductName: formData?.rfqProductName,
        rfqProductSubCategory: formData?.sub,
        selectedPayments: formData?.PaymentTerms,
        selectedShippings: formData?.shippingTerms,
        shippingTermsDescribed: formData?.shippingTermsDescribed,
        paymentTermsDescribed: formData?.paymentTermsDescribed,
        status: formData?.status,
        rfqProductMainCategory: formData?.main,
        category_tag: formData?.categoryTag
      };

      if (formData?.sub && formData.sub.trim() !== '') {
        payload.rfqProductSubCategory = formData.sub;
      }



      console.log('payload', payload);
      await editRFQ({
        buyerId,
        rfqId,
        rfqData: payload
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
      console.error('Update-failed:', error);
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

  const handleFormSubmit = (e: any) => {
    e.preventDefault();

    // Determine which handler to use based on the field type
    const isMediaUpdate = fields.some((field: any) =>
      field.type === 'file' ||
      field.id === 'productAttachment'
    );

    if (isMediaUpdate) {
      handleUpdateProductMedia(e);
    } else {
      handleSubmit(e);
    }
  };


  const openDeleteConfirmation = (id: any, type: any) => {
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

  const handleDeleteMedia = async (e: any) => {
    e.preventDefault();

    try {
      if (!itemToDelete) return;
      // Call your deleteRfqMedia API with the item ID
      await deleteRfqMedia({
        buyerId: isTeamMember ? ownerUserId : user?.id,
        rfqId: data?.rfqId,
        publicId: itemToDelete?.id,
      }).unwrap();

      // Close the modal
      closeDeleteConfirmation();
      // Show success message
      toast.success(`Attachment deleted successfully`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#4CAF50',
          color: '#fff',
        }
      });
    } catch (error: any) {
      console.error('delete-failed', error);
      toast.error(`${error?.data?.message || 'Delete failed'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#F44336',
          color: '#fff',
        }
      });
    }
  };


  return (
    <div>
      <CustomModal open={open} onClose={onClose} title={`Edit ${fields[0]?.label || ''} Details`}>
        <div className="w-full">
          <form
            onSubmit={handleFormSubmit}
            className="w-full!">
            {fields?.length > 0 && fields?.map((field: any) => (
              <Box key={field.id} className="mb-2">
                {field?.type === 'text' && (
                  <TextField
                    fullWidth
                    label={field.label}
                    value={formData[field.id] || ''}
                    onChange={(e: any) => handleChange(field.id, e.target.value)}
                  />
                )}
                {field.type === 'select' && (
                  <>
                    {field.multipleFields ? (
                      <MultiCheckboxSelectLocal
                        label={field.label}
                        value={formData[field.id] || []}
                        onChange={(val: any) => handleChange(field.id, val)}
                        options={field.options.map((opt: any) => ({
                          value: opt.code || opt.value || opt,
                          label: opt.name || opt.label || opt.code || opt
                        }))}
                        placeholder={`Select ${field.label}`}
                      />
                    ) : (
                      <SearchableSelectLocal
                        label={field.label}
                        value={formData[field.id] || ''}
                        onChange={(val: any) => handleChange(field.id, val)}
                        options={field.options.map((opt: any) => ({
                          value: opt.code || opt.value || opt,
                          label: opt.name || opt.label || opt.code || opt
                        }))}
                        placeholder={`Select ${field.label}`}
                      />
                    )}
                  </>
                )}
                {field.type === 'file' && (
                  <>

                    <Box>
                      <p className="text-left text-sm">
                        Update your attachment by removing the old ones or add new ones <br />
                      </p>

                      <p className="pt-3 text-left mb-2 text-sm">
                        <b>Note:</b> Maximum of 5 attachment are allowed including the old ones and new ones
                      </p>
                      <Box
                        style={{ position: 'relative', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}
                        className="flex  relative space-x-2">
                        {attachments?.length > 0 && attachments?.map((img: any, i: number) => (
                          <Box
                            style={{ position: 'relative', width: '100px', height: '100px' }}
                            className="w-40 h-40 rounded shrink-0 my-4"
                            key={i}>
                            <img src={img.url} alt="" style={{ width: '100px', height: '100px' }} />
                            <IconButton
                              type="button"
                              aria-label="Delete attachment"
                              className="absolute -top-2 -right-2 bg-black rounded-full shadow-md"
                              onClick={() => openDeleteConfirmation(img?.publicId, 'attachment')}
                            >
                              <MdOutlineCancel color="white" fontSize="20px" />
                            </IconButton>
                          </Box>
                        ))}
                        <div >
                        </div>
                      </Box>
                    </Box>
                    <label className="w-full relative cursor-pointer inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 border-2 bg-transparent shadow-sm hover:bg-opacity-10 active:bg-opacity-20 border-primary-500 text-primary-500 hover:bg-primary-50 h-10 px-4 text-sm">
                      Upload {field.label}
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={(e) => handleFileChange(field.id, e.target.files)}
                      />
                    </label>

                    {/* productAttachment field  */}
                    {field.id === 'productAttachment' && selectedAttachmentFiles.length > 0 && (
                      <Box className="mt-2">
                        {selectedAttachmentFiles.map((file: any, index: number) => (
                          <Box
                            key={index}
                            style={{
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
                              type="button"
                              aria-label="Delete file"
                              className="absolute -top-2 -right-2 bg-white rounded-full shadow-md"
                              onClick={() => removeFile(field.id, index)}
                            >
                              <MdOutlineCancel color="red" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {errors.productImages && (
                      <Typography className="mt-1" variant="body2" color="error">
                        {errors.productImages}
                      </Typography>
                    )}
                  </>
                )}

                <Box key={field.id} className="mb-2">
                  {field.type === 'categoryGroup' && (
                    <Box className="mb-3">
                      <Box className="mb-2">
                        <SearchableSelectLocal
                          label="Main Category"
                          value={formData.main || ''}
                          onChange={(val: any) => {
                            handleChange('main', val); // val is name here based on original logic
                            // Reset child categories when main category changes
                            handleChange('product', '');
                            handleChange('sub', '');
                          }}
                          options={mainCategoryData?.map((category: any) => ({ value: category.name, label: category.name })) || []}
                          placeholder="Select Main Category"
                        />
                      </Box>

                      {formData.main && (
                        <Box className="mb-2">
                          <SearchableSelectLocal
                            label="Product Category"
                            value={formData.product || ''}
                            onChange={(val: any) => {
                              handleChange('product', val);
                              // Reset sub-category when product category changes
                              handleChange('sub', '');
                            }}
                            options={productCategoryData?.children?.map((category: any) => ({ value: category.name, label: category.name })) || []}
                            placeholder="Select Product Category"
                            disabled={!productCategoryData?.children?.length}
                          />
                        </Box>
                      )}

                      {formData.product && (
                        <Box className="mb-2">
                          <SearchableSelectLocal
                            label="Sub Category"
                            value={formData.sub || ''}
                            onChange={(val: any) => handleChange('sub', val)}
                            options={subCategoryData?.children?.map((category: any) => ({ value: category.name, label: category.name })) || []}
                            placeholder="Select Sub Category"
                            disabled={!subCategoryData?.children?.length}
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Your existing field rendering code for other field types */}

                </Box>

              </Box>
            ))}
            <Box className="mt-3 flex justify-between gap-2 items-center">
              <Button type="button" onClick={onClose} fullWidth variant="outlined">
                Cancel
              </Button>
              <Button
                type='submit'
                fullWidth
                variant="contained"
                color="primary"
                disabled={isUpdatingMedia || isUpdatingRfq}
              >
                {isUpdatingMedia || isUpdatingRfq ? (
                  <Loader2
                    className="animate-spin text-white"
                    size={24}
                  />
                ) : (
                  "Save"
                )}
              </Button>
            </Box>
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
          <Box
            className="bg-white p-8 rounded-lg shadow-xl w-[400px]"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Delete Confirmation
            </Typography>
            <Typography variant="body1" className="mt-4">
              Are you sure you want to delete this {itemToDelete?.type === 'image' ? 'image' : 'attachment'}?
              This action cannot be undone.
            </Typography>

            <Box className="mt-8 flex justify-end gap-2">
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
            </Box>
          </Box>
        </form>
      </Modal>
    </div>
  );
};

export default RfqInputEditModal;