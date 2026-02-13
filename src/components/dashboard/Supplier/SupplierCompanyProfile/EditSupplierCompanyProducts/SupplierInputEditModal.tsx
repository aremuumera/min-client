import React, { useState, useEffect } from 'react';
import { TextField } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Checkbox } from '@/components/ui/checkbox';
import { Country, State } from 'country-state-city';
import CustomModal from '@/utils/CustomModal';
// import { TextEditor } from '@/components/core/text-editor/text-editor';
import { MdOutlineCancel } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import { 
  useUpdateStoreProfileMutation,
  useUpdateStoreMediaMutation 
} from '@/redux/features/supplier-profile/supplier_profile_api';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useAppSelector } from '@/redux';

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
        const country = CountryData.find((c) => c.name === initialData.location);
        if (country) {
          const states = State.getStatesOfCountry(country.isoCode);
          setStateData(states);
        }
      }
    }
  }, [fields, data, CountryData]);

  // Handle field changes
  const handleChange = (id: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));

    // If the location field changes, fetch states for the selected country
    if (id === 'location') {
      const country = CountryData.find((c: any) => c.name === value);
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
          style: {
            background: '#4CAF50',
            color: '#fff',
          }
         });
      } else {
        // Handle normal profile data
        const payload = {
          // ...formData,
          businessType: formData.businessType,
          businessCategory: formData.businessCategory,
          companyDescription: formData.companyDescription,
          
          // Contact info
          companyEmail: formData.email,
          companyPhone: formData.phoneNumber,
          
          // Social media
          facebook: formData.facebook,
          instagram: formData.instagram,
          linkedIn: formData.linkedin,
          xSocial: formData.XTwitter,

          // latitude: formData.latitude,
          // longitude: formData.longitude,
          
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
          style: {
            background: '#4CAF50',
            color: '#fff',
          }
         }
        );
      }

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

console.log('formData:', formData);

  // Helper function to render options based on the category
  const renderOptions = (options: any[], selectCategoryName: string, field: any) => {
    switch (selectCategoryName) {
      case 'location':
        return CountryData?.map((country: any) => (
          <option key={country.isoCode} value={country.name}>
            {country.name}
          </option>
        ));
      case 'state':
        return stateData?.map((state: any) => (
          <option key={state.name} value={state.name}>
            {state.name}
          </option>
        ));
      case 'PaymentTerms':
        return options.map((option: any) => {
          // const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <option key={option.code} value={option.code}>
               {/* {isSelected ? '[x] ' : '[ ] '} */}
              {`${option.code} - ${option.name}`}
            </option>
          );
        });
      case 'shippingTerms':
        return options.map((option: any) => {
          // const isSelected = Array.isArray(formData[field.id]) && formData[field.id].includes(option.code);
          return (
            <option key={option.code} value={option.code}>
               {/* {isSelected ? '[x] ' : '[ ] '} */}
              {`${option.code} - ${option.name}`}
            </option>
          );
        });
      default:
        return options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ));
    }
  };

  // Helper function to render the selected value(s) in the Select component
  const renderSelectedValue = (selected: any, options = [], multipleFields: boolean) => {
    if (multipleFields) {
      // Ensure selected is always treated as an array for multiple selections
      return Array.isArray(selected)
        ? selected.map((value: any) => {
            const option: any = options.find((opt: any) => opt.value === value);
            return option ? option.label || option.value : value;
          }).join(', ')
        : '';
    }

    // Handle single selection case
    const option: any = options.find((opt: any) => opt.value === selected);
    return option ? option.label || option.value : selected;
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
          return false;
        }
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
          setErrors((prevErrors: any) => ({
            ...prevErrors,
            productImages: "Supported formats: PNG, JPEG, WEBP",
          }));
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
          className="!w-full">
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

                  <Select
                    className="w-full"
                    {...({
                        multiple: field?.multipleFields,
                        value: field?.multipleFields ? formData[field?.id] || [] : formData[field?.id] || '',
                        onChange: (e: any) => handleChange(field?.id, e.target.value),
                        renderValue: (selected: any) => renderSelectedValue(selected, field?.options, field?.multipleFields),
                    } as any)}
                  >
                    {renderOptions(field.options, field.selectCategoryName, field)}
                  </Select>
            
               {field.type === 'file' && (
                  <> 
                  <label className="w-full block">
                    <Button variant="outlined" className="w-full">
                      Upload {field.label}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleFileChange(field.id, e.target.files)}
                        />
                    </Button>
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
                        <Box key={index} style={{ marginTop: '24px' }}>
                        
                          {index !== 0 && (
                            <button
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
                    <Box style={{ paddingTop: '24px' }} className="py-[20px] !bg-black flex gap-8 w-full">
                      <Button variant="contained" style={{ marginBottom: '10px' }} fullWidth onClick={handlePreviewOpen} color="primary">
                        Preview
                      </Button>
                      <Button fullWidth style={{ marginTop: '16px' }} onClick={handleAddDescriptionField} variant="outlined" color="primary">
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
                        <Button variant="contained" style={{ marginTop: '26px' }} onClick={handlePreviewClose} color="secondary">
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
                  {isUpdatingProfile || isUpdatingMedia ?  (
                      <span>Loading...</span>
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