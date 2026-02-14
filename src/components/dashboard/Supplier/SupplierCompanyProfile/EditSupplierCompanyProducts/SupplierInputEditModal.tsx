import React, { useState, useEffect } from 'react';
import { TextField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useUpdateStoreProfileMutation,
  useUpdateStoreMediaMutation
} from '@/redux/features/supplier-profile/supplier_profile_api';
import { SearchableSelectLocal } from '@/components/ui/searchable-select-local';
import { MultiCheckboxSelectLocal } from '@/components/ui/multi-checkbox-select-local';
import { useSelector } from 'react-redux';
import { toast } from '@/components/core/toaster';
import { useAppSelector } from '@/redux';
import CustomModal from '@/utils/CustomModal';
import { motion } from 'framer-motion';
import { Country, State } from 'country-state-city';
import { MdOutlineCancel } from 'react-icons/md';
import { Loader2 } from 'lucide-react';


const SupplierProfileInputEditModal = ({ open, onClose, data, fields, onSave }: any) => {
  const [formData, setFormData] = useState<any>({});
  const [CountryData, setCountryData] = useState<any[]>([]);
  const [stateData, setStateData] = useState<any[]>([]);
  const [selectedFileLogo, setSelectedFileLogo] = useState<any>(null);
  const [selectedFileBanner, setSelectedFileBanner] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [openPreview, setOpenPreview] = useState(false);
  const [profileDescriptionFields, setProfileDescriptionFields] = useState<any[]>([{ header: '', description: '' }]);
  const { user } = useAppSelector((state) => state.auth);
  const { appData } = useAppSelector((state) => state?.auth);


  const [updateStoreProfile, { isLoading: isUpdatingProfile }] = useUpdateStoreProfileMutation();
  const [updateStoreMedia, { isLoading: isUpdatingMedia }] = useUpdateStoreMediaMutation();


  const handlePreviewOpen = () => setOpenPreview(true);
  const handlePreviewClose = () => setOpenPreview(false);

  // Populate profileDescriptionFields when the modal opens or when `data` changes
  useEffect(() => {
    if (data?.profileDetailDescription) {
      // If profileDetailDescription exists in data, use it to populate profileDescriptionFields
      setProfileDescriptionFields(JSON.parse(JSON.stringify(data?.profileDetailDescription)));

      console.log('object.profileDescriptionFields', data?.profileDetailDescription);
    } else {
      // Otherwise, initialize with a default empty field
      setProfileDescriptionFields([{ header: '', description: '' }]);
    }
  }, [data]);

  // Validate each description field

  const validateEachDescriptionField = (index: number, field: string, value: string) => {
    const fieldKey = `${field}${index}`;
    setErrors((prevErrors: any) => {
      const newErrors = { ...prevErrors };
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
      const updatedFields = [...prevFields];
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
      const initialData = fields.reduce((acc: any, field: any) => {
        let value = data?.[field.id]; // Get existing stored value

        // Ensure multiple selection fields are always stored as arrays
        if (field.multipleFields) {
          value = Array.isArray(value) ? value : value ? [value] : [];
        } else {
          value = value || field.value || ''; // Fallback to default value
        }

        return { ...acc, [field.id]: value };
      }, {});

      setFormData(initialData);

      // If the location field is present, fetch states for the selected country
      if (initialData.location) {
        const country = CountryData.find((c) => c.isoCode === initialData.location || c.name === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data, CountryData]);

  // Handle field changes
  const handleChange = (id: string, value: any) => {
    // If we're coming from Custom Select, value might be in e.target.value or just value
    const actualValue = value?.target ? value.target.value : value;
    setFormData((prev: any) => ({ ...prev, [id]: actualValue }));

    // If the location field changes, fetch states for the selected country
    if (id === 'location') {
      const country = CountryData.find((c: any) => c.isoCode === actualValue || c.name === actualValue);
      if (country) {
        const states = State.getStatesOfCountry(country.isoCode);
        setStateData(states);
      }
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const supplierId = appData?.supPro;
      const profileId = user?.id;

      if (!supplierId || !profileId) {
        toast.error('Missing required IDs for update', {
          position: 'top-right',
          duration: 3000,
        });
        throw new Error('Missing required IDs');
      }

      // Determine which API to use based on field type
      const isMediaField = fields.some((field: any) =>
        field?.type === 'file' ||
        field?.id === 'companyLogo' ||
        field?.id === 'companyBanner'
      );

      if (isMediaField) {
        // Handle logo/banner upload
        const formData = new FormData();

        if (selectedFileLogo) {
          formData.append('logo', selectedFileLogo);
        }

        if (selectedFileBanner) {
          formData.append('banner', selectedFileBanner);
        }

        await updateStoreMedia({
          supplierId,
          profileId,
          bannerData: formData
        }).unwrap();

        toast.success('Media updated successfully', {
          position: 'top-right',
          duration: 3000,
        });
      } else {
        // Handle normal profile data
        const payload = {
          // Merge with existing data to ensure no fields are lost
          businessType: formData.businessType,
          businessCategory: formData.businessCategory,
          companyDescription: formData.companyDescription,

          // Contact info
          companyEmail: formData.email,
          companyPhone: formData.phoneNumber,

          // Social media
          // Social media (Sanitize empty strings to null to avoid backend validation errors)
          facebook: formData.facebook || null,
          instagram: formData.instagram || null,
          linkedIn: formData.linkedin || null,
          xSocial: formData.XTwitter || null,

          // Location
          fullAddress: formData.fullAddress,
          selectedCountry: formData.location,
          selectedState: formData.state,
          streetNo: formData.streetNo,
          zip_code: formData.zipCode,
          latitude: formData.latitude,
          longitude: formData.longitude,

          // Business info
          totalEmployees: formData.totalEmployees,
          yearEstablished: formData.yearsOfEstablish,
          yearExperience: formData.yearsOfExperience,
          totalRevenue: formData.totalRevenue,

          // Special fields
          selectedPayments: formData.PaymentTerms,
          selectedShippings: formData.shippingTerms,
          profileDetailDescription: JSON.stringify(profileDescriptionFields)
        };

        await updateStoreProfile({
          supplierId,
          profileId,
          profileData: payload
        }).unwrap();

        toast.success('Profile updated successfully',
          {
            position: 'top-right',
            duration: 3000,
          }
        );
      }

      onClose();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error?.data?.message || 'Update failed', {
        position: 'top-right',
        duration: 3000,
      });
    }
  };

  console.log('formData:', formData);

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



  const handleFileChange = async (id: string, value: any) => {
    const files = value;

    if (files.length > 0 && files.length === 1) {
      const file = files[0]; // Get the first file
      const isValidFile = (file: any) => {
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prevErrors: any) => ({
            ...prevErrors,
            productImages: "File size must not exceed 5MB",
          }));
          toast.error('File size must not exceed 5MB', {
            position: 'top-right',
            duration: 3000,
          });
          return false;
        }
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
          setErrors((prevErrors: any) => ({
            ...prevErrors,
            productImages: "Supported formats: PNG, JPEG, WEBP",
          }));
          toast.error('Supported formats: PNG, JPEG, WEBP', {
            position: 'top-right',
            duration: 3000,
          });
          return false;
        }
        return true;
      };

      if (!isValidFile(file)) {
        return; // Stop execution if the file is invalid
      }
      // Clear errors if the file is valid
      setErrors((prevErrors: any) => ({ ...prevErrors, productImages: "" }));
      if (id === 'companyLogo') {
        setSelectedFileLogo(file);
      } else if (id === 'companyBanner') {
        setSelectedFileBanner(file);
      }

    }
  };

  return (
    <div>
      <CustomModal open={open} onClose={onClose} title={`Edit ${fields[0]?.label || ''} Details`}>
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="w-full!">
            {fields?.length > 0 && fields.map((field: any) => (
              <Box key={field.id} style={{ marginBottom: '16px' }}>
                {field?.type === 'text' && (
                  <TextField
                    fullWidth
                    label={field?.label}
                    value={formData[field?.id] || ''}
                    onChange={(e) => handleChange(field?.id, e.target.value)}
                  />
                )}

                {field?.type === 'textBig' && (
                  <TextField
                    fullWidth
                    label={field?.label}
                    value={formData[field?.id] || ''}
                    rows={10}
                    multiline
                    onChange={(e) => handleChange(field?.id, e.target.value)}
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
                    <label className="w-full block">
                      <Button
                        variant="outlined"
                        className="w-full"
                        type="button"
                        onClick={() => document.getElementById(`file-input-${field.id}`)?.click()}
                      >
                        Upload {field.label}
                      </Button>
                      <input
                        id={`file-input-${field.id}`}
                        type="file"
                        hidden
                        onChange={(e) => handleFileChange(field.id, e.target.files)}
                      />
                    </label>

                    {field.id === 'companyLogo' && selectedFileLogo && (
                      <Typography className="mt-1" variant="body2">
                        Selected file: {selectedFileLogo.name}
                      </Typography>
                    )}
                    {field.id === 'companyBanner' && selectedFileBanner && (
                      <Typography className="mt-1" variant="body2">
                        Selected file: {selectedFileBanner.name}
                      </Typography>
                    )}

                    {errors.productImages && (
                      <Typography className="mt-1" variant="body2" color="error">
                        {errors.productImages}
                      </Typography>
                    )}
                  </>
                )}

                {field?.type === 'headerDescription' && (
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
                        <Box key={index} style={{ marginTop: '24px' }}>

                          {index !== 0 && (
                            <button
                              type="button"
                              style={{
                                position: 'absolute',
                                right: 0,
                                zIndex: 20,
                              }}
                              onClick={() => handleClearDescriptionField(index)}
                            >
                              <MdOutlineCancel />
                            </button>
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
                            <Box style={{ marginTop: '8px' }}>
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
                    <Box style={{ paddingTop: '24px' }} className="py-[10px] flex items-center justify-between gap-8 w-full">
                      <Button variant="contained" fullWidth onClick={handlePreviewOpen} color="primary" type='button' className='mt-4'>
                        Preview
                      </Button>
                      <Button fullWidth onClick={handleAddDescriptionField} variant="outlined" color="primary" type='button' className=''>
                        Add Description Field
                      </Button>
                    </Box>

                    {/* Preview Modal */}
                    <CustomModal open={openPreview} onClose={handlePreviewClose} title="Preview Description">
                      <Box sx={{ maxWidth: 500, margin: 'auto', padding: 4, backgroundColor: '#fff', borderRadius: 2 }}>
                        <div>
                          {profileDescriptionFields?.map((field, index) => (
                            <Box key={index} style={{ marginTop: '24px' }}>
                              <Typography variant="h6">{field.header}</Typography>
                              <Typography style={{ paddingTop: '8px' }} variant="body1">
                                {field.description}
                              </Typography>
                            </Box>
                          ))}
                        </div>
                        <Button variant="contained" style={{ marginTop: '26px' }} onClick={handlePreviewClose} color="secondary" type='button'>
                          Close Preview
                        </Button>
                      </Box>
                    </CustomModal>
                  </>
                )}
              </Box>
            ))}

            <Box style={{ marginTop: '24px', display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
              <Button type='button' onClick={onClose} fullWidth variant="outlined">
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isUpdatingProfile || isUpdatingMedia}
                //  onClick={handleSubmit} 
                fullWidth variant="contained" color="primary">
                {isUpdatingProfile || isUpdatingMedia ? (
                  <Loader2 className="animate-spin text-white" size={24} />
                ) : (
                  "Save"
                )}
              </Button>
            </Box>
          </form>
        </div>
      </CustomModal>
    </div>
  );
};



export default SupplierProfileInputEditModal;