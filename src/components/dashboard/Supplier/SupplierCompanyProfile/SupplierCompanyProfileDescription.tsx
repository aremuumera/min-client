import React, { useEffect, useState } from 'react';
import {
  addProfileDescriptionField,
  deleteSupplierProfileBanner,
  deleteSupplierProfileLogo,
  removeProfileDescriptionField,
  setSupplierProfileBanner,
  setSupplierProfileLogo,
  updateProfileDescriptionField,
  updateProfileDetailsFormData,
} from '@/redux/features/supplier-profile/supplier_profile_slice';
import {
  deleteFileByNameFromIndexedDB,
  deleteSingleFileByNameFromIndexedDB,
  getAllFilesFromIndexedDBForServer,
  logAllDataFromIndexedDB,
  storeFileInIndexedDB,
  storeSingleFileInIndexedDB,
} from '@/utils/indexDb';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel as InputLabel,
  IconButton,
  Input,
  ListItemText,
  MenuItem,
  Modal,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@/components/ui';
import { FaUpload } from 'react-icons/fa6';
import { MdOutlineCancel } from 'react-icons/md';
import { PiWarningLight } from 'react-icons/pi';
import { toast } from 'sonner';

import { Option } from '@/components/core/option';
import { TextEditor } from '@/components/core/text-editor/text-editor';
import { useAppDispatch, useAppSelector, useAppStore } from '@/redux';

import { paymentTerms, shippingTerms } from '../CreateProducts/paymentTerms';

const steps = ['Company Description', 'Contact Info', 'Location', 'Confirm details'];

interface ProfileDescriptionField {
  header: string;
  description: string;
}

interface SupplierProfileDescriptionProps {
  handleNext: () => void;
  setActiveStep: (step: number) => void;
  activeStep: number;
  handleBack: () => void;
}

const SupplierCompanyProfileDescription: React.FC<SupplierProfileDescriptionProps> = ({
  handleNext,
  setActiveStep,
  activeStep,
  handleBack,
}) => {
  const { profileDetailsFormData, profileDescriptionFields, supplierProfileLogo, supplierProfileBanner } =
    useAppSelector((state) => state.supplierProfile);
  const store = useAppStore();
  const [openPreview, setOpenPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supplierLG, setSupplierLG] = useState<any[]>([]);
  const [supplierBG, setSupplierBG] = useState<any[]>([]);

  const dispatch = useAppDispatch();
  // Preview modal toggle
  const handlePreviewOpen = () => setOpenPreview(true);
  const handlePreviewClose = () => setOpenPreview(false);

  const validateEachDescriptionField = (index: number, field: 'header' | 'description', value: string) => {
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

  const handleDescriptionChange = (index: number, field: 'header' | 'description', value: string) => {
    dispatch(updateProfileDescriptionField({ index, field, value }));
    validateEachDescriptionField(index, field, value);
  };

  const handleAddDescriptionField = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addProfileDescriptionField());
  };
  const handelClearDescriptionField = (index: number) => {
    dispatch(removeProfileDescriptionField(index));
  };

  // const handleFileChange = (event) => {
  //   const files = event.target.files;
  //   if (files.length > 0) {
  //     console.log('Selected files:', files);
  //   }
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // setSelectedPayments(value);
    dispatch(updateProfileDetailsFormData({ [name]: value }));
    validateForm();
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const handlePaymentChange = (e: any) => {
    const { name, value } = e.target;
    dispatch(updateProfileDetailsFormData({ selectedPayments: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const handleShippingChange = (e: any) => {
    const { name, value } = e.target;
    // setSelectedShippingOptions(value);
    dispatch(updateProfileDetailsFormData({ selectedShippings: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};
    if (!profileDetailsFormData.companyName) newErrors.companyName = 'Company name is required.';
    if (!profileDetailsFormData.companyDescription) newErrors.companyDescription = 'Company description is required.';
    if (!profileDetailsFormData.businessCategory) newErrors.businessCategory = 'Business category is required.';
    if (!profileDetailsFormData.yearEstablished || isNaN(Number(profileDetailsFormData.yearEstablished)))
      newErrors.yearEstablished = 'Valid year is required.';
    if (!profileDetailsFormData.yearExperience || isNaN(Number(profileDetailsFormData.yearExperience)))
      newErrors.yearExperience = 'Valid experience is required.';
    if (!profileDetailsFormData.totalEmployees) newErrors.totalEmployees = 'Total employees is required.';
    if (!profileDetailsFormData.businessType) newErrors.businessType = 'Business type is required.';
    if (!profileDetailsFormData.selectedPayments || profileDetailsFormData.selectedPayments.length === 0)
      newErrors.selectedPayments = 'Terms of payment is required.';
    if (!profileDetailsFormData.selectedShippings || profileDetailsFormData.selectedShippings.length === 0)
      newErrors.selectedShippings = 'Shipping options is required.';
    if (!profileDetailsFormData.totalRevenue) newErrors.totalRevenue = 'Total revenue is required.';
    if (!profileDetailsFormData.companyDescription) newErrors.companyDescription = 'Company description is required.';

    setErrors(newErrors);
    console.log('Validation errors:', newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0] as string;
      toast.error(firstError, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#f44336',
          color: '#fff',
        },
      });
    }

    return Object.keys(newErrors).length === 0;
  };


  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length === 1) {
      const file = files[0]; // Get the first file
      const isValidFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'File size must not exceed 5MB',
          }));
          toast.error('File size must not exceed 5MB', {
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
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'Supported formats: PNG, JPEG, WEBP',
          }));
          toast.error('Unsupported file format', {
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
      };

      if (!isValidFile(file)) {
        return; // Stop execution if the file is invalid
      }

      // Clear errors if the file is valid
      setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));

      // Get current file from the store
      const currentFile = store.getState().supplierProfile.supplierProfileLogo as any;

      // Delete the previous file from IndexedDB if it exists
      if (currentFile) {
        try {
          await deleteSingleFileByNameFromIndexedDB('supplierProfileLogo', currentFile.name);
          console.log(`Previous file ${currentFile.name} deleted`);
        } catch (error) {
          console.error(`Error deleting previous file: ${currentFile.name}`, error);
        }
      }

      // Store the new file in IndexedDB
      try {
        const result = await storeSingleFileInIndexedDB(file, 'supplierProfileLogo');
        console.log('New file stored:', result);
        dispatch(setSupplierProfileLogo(result as any)); // Update Redux with the new file
      } catch (error) {
        console.error('Error storing new file:', error);
      }
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        productImages: 'Only 1 image is required',
      }));
    }
  };

  const handleLogoDeleteFile = async () => {
    const currentFile = (store.getState() as any).supplierProfile.supplierProfileLogo;

    if (currentFile && !Array.isArray(currentFile)) {
      try {
        await deleteSingleFileByNameFromIndexedDB('supplierProfileLogo', (currentFile as any).name);
        console.log(`File ${(currentFile as any).name} deleted`);
        dispatch(setSupplierProfileLogo([])); // Clear the file in Redux
      } catch (error) {
        console.error(`Error deleting file: ${(currentFile as any).name}`, error);
      }
    }
  };

  const handleBannerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length === 1) {
      const file = files[0]; // Get the first file
      const isValidFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'File size must not exceed 5MB',
          }));
          toast.error('File size must not exceed 5MB', {
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
          setErrors((prevErrors) => ({
            ...prevErrors,
            productImages: 'Supported formats: PNG, JPEG, WEBP',
          }));
          toast.error('Unsupported file format', {
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
      };

      if (!isValidFile(file)) {
        return; // Stop execution if the file is invalid
      }

      // Clear errors if the file is valid
      setErrors((prevErrors) => ({ ...prevErrors, productImages: '' }));

      // Get current file from the store
      const currentFile = store.getState().supplierProfile.supplierProfileBanner as any;

      // Delete the previous file from IndexedDB if it exists
      if (currentFile) {
        try {
          await deleteSingleFileByNameFromIndexedDB('supplierProfileBanner', currentFile.name);
          console.log(`Previous file ${currentFile.name} deleted`);
        } catch (error) {
          console.error(`Error deleting previous file: ${currentFile.name}`, error);
        }
      }

      // Store the new file in IndexedDB
      try {
        const result = await storeSingleFileInIndexedDB(file, 'supplierProfileBanner');
        // console.log("New file stored:", result);
        dispatch(setSupplierProfileBanner(result as any)); // Update Redux with the new file
      } catch (error) {
        console.error('Error storing new file:', error);
      }
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        productImages: 'Only 1 image is required',
      }));
      toast.error('Only 1 image is required');
    }
  };

  const handleDeleteBannerFile = async () => {
    const currentFile = (store.getState() as any).supplierProfile.supplierProfileBanner;
    if (currentFile && !Array.isArray(currentFile)) {
      try {
        await deleteSingleFileByNameFromIndexedDB('supplierProfileLogo', (currentFile as any).name);
        console.log(`File ${(currentFile as any).name} deleted`);
        dispatch(setSupplierProfileBanner([])); // Clear the file in Redux
      } catch (error) {
        console.error(`Error deleting file: ${(currentFile as any).name}`, error);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      handleNext();
    }
    // Retrieve files from IndexedDB
    const [logoFiles, bannerFiles] = await Promise.all([
      getAllFilesFromIndexedDBForServer('supplierProfileLogo'),
      getAllFilesFromIndexedDBForServer('supplierProfileBanner'),
    ]);

    setSupplierLG((prevFiles) => [...prevFiles, ...logoFiles]);
    setSupplierBG((prevFiles) => [...prevFiles, ...bannerFiles]);
  };

  return (
    <div>
      <div className="lg:px-6 py-2">
        <form onSubmit={handleSubmit}>
          <div>
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <TextField
                  label="Company Name"
                  fullWidth
                  margin="normal"
                  placeholder="eg...  Mineral ltd."
                  name="companyName"
                  value={profileDetailsFormData?.companyName}
                  onChange={handleInputChange}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                />
                <p className="text-[#696969] text-[.75rem]">This will be display name on your company profile</p>
              </div>
              <div className="w-full">
                <TextField
                  label="Total Employees"
                  fullWidth
                  margin="normal"
                  placeholder="e.g. 12, 15 - 200"
                  name="totalEmployees"
                  value={profileDetailsFormData?.totalEmployees}
                  onChange={handleInputChange}
                  error={!!errors.totalEmployees}
                  helperText={errors.totalEmployees}
                />
                <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p>
              </div>
            </div>

            {/* section 2 */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <TextField
                  label="Year of established"
                  fullWidth
                  margin="normal"
                  placeholder="eg... 2025"
                  name="yearEstablished"
                  value={profileDetailsFormData?.yearEstablished}
                  onChange={handleInputChange}
                  error={!!errors.yearEstablished}
                  helperText={errors.yearEstablished}
                />
                <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p>
              </div>
              <div className="w-full">
                <TextField
                  label="Year of experience"
                  fullWidth
                  margin="normal"
                  placeholder="eg... 15+ "
                  name="yearExperience"
                  value={profileDetailsFormData?.yearExperience}
                  onChange={handleInputChange}
                  error={!!errors.yearExperience}
                  helperText={errors.yearExperience}
                />
                <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p>
              </div>
            </div>

            {/* section 3 */}
            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              {/* business category section */}
              <div className="w-full">
                <FormControl fullWidth error={!!errors.businessCategory}>
                  <InputLabel id="businessCategory-label">Business category</InputLabel>
                  <Select
                    name="businessCategory"
                    value={profileDetailsFormData.businessCategory || ''}
                    label="Business category"
                    onChange={handleInputChange}
                    className="w-full"
                  >
                    {businessData.businessCategory.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.businessCategory && <FormHelperText>{errors.businessCategory}</FormHelperText>}
                </FormControl>
                <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p>
              </div>

              {/* business type section */}
              <div className="w-full">
                <FormControl fullWidth error={!!errors.businessType}>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    name="businessType"
                    value={profileDetailsFormData.businessType || ''}
                    label="Business type"
                    onChange={handleInputChange}
                    className="w-full"
                  >
                    {businessData.businessType.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.businessType && <FormHelperText>{errors.businessType}</FormHelperText>}
                </FormControl>
                <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p>
              </div>
            </div>

            {/* section 4 */}
            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <FormControl fullWidth error={!!errors.selectedPayments}>
                  <Typography variant="body2" className="mb-2 font-medium">Terms of Payment</Typography>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                    {paymentTerms.map((term) => (
                      <div key={term.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${term.code}`}
                          checked={(profileDetailsFormData.selectedPayments || []).indexOf(term.code) > -1}
                          onChange={() => {
                            const current = profileDetailsFormData.selectedPayments || [];
                            const next = current.includes(term.code)
                              ? current.filter((c: string) => c !== term.code)
                              : [...current, term.code];
                            handlePaymentChange({ target: { value: next } } as any);
                          }}
                        />
                        <label htmlFor={`payment-${term.code}`} className="text-sm cursor-pointer">{term.code}</label>
                      </div>
                    ))}
                  </div>
                  {errors.selectedPayments && <FormHelperText>{errors.selectedPayments}</FormHelperText>}
                </FormControl>
                {/* <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p> */}
              </div>

              <div className="w-full">
                <FormControl fullWidth error={!!errors.selectedShippings}>
                  <Typography variant="body2" className="mb-2 font-medium">Shipping Options</Typography>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                    {shippingTerms.map((term) => (
                      <div key={term.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`shipping-${term.code}`}
                          checked={(profileDetailsFormData.selectedShippings || []).indexOf(term.code) > -1}
                          onChange={() => {
                            const current = profileDetailsFormData.selectedShippings || [];
                            const next = current.includes(term.code)
                              ? current.filter((c: string) => c !== term.code)
                              : [...current, term.code];
                            handleShippingChange({ target: { value: next } } as any);
                          }}
                        />
                        <label htmlFor={`shipping-${term.code}`} className="text-sm cursor-pointer">{term.code}</label>
                      </div>
                    ))}
                  </div>
                  {errors.selectedShippings && <FormHelperText>{errors.selectedShippings}</FormHelperText>}
                </FormControl>
                {/* <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p> */}
              </div>
            </div>

            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <TextField
                  label="Total Revenue"
                  fullWidth
                  margin="normal"
                  placeholder="e.g... 2.5m, 2.5b, 10.2m"
                  name="totalRevenue"
                  value={profileDetailsFormData?.totalRevenue}
                  onChange={handleInputChange}
                  error={!!errors.totalRevenue}
                  helperText={errors.totalRevenue}
                />
                {/* <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p> */}
              </div>
              <div className="w-full">
                {/* <FormControl fullWidth>
                          <InputLabel>ExportMarket</InputLabel>
                          <Select 
                          defaultValue="" 
                          // name="state"
                          value={profileDetailsFormData?.selectedShippings}
                          onChange={handleShippingChange}
                          renderValue={(selected) => selected.join(", ")}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 250, // Adjust this value for height
                              },
                            },
                          }}
                          >
                          <Option value="">Select a category</Option>
                            {shippingTerms.map((term) => (
                              <MenuItem key={term.code} value={term.code}>
                                <Checkbox checked={selectedShippings.indexOf(term.code) > -1} />
                                <ListItemText primary={`${term.code} - ${term.name}`} />
                              </MenuItem>
                            ))}
                            <Option value="es">Spain</Option>
                          </Select>
                        </FormControl> */}
                {/* <p className="text-[#696969] text-[.75rem]">Choose the category of your business</p> */}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-[15px] items-center justify-center">
              <div className="w-full">
                <TextField
                  label="Company Description"
                  fullWidth
                  rows={4}
                  multiline
                  placeholder="Describe your company here..."
                  margin="normal"
                  name="companyDescription"
                  value={profileDetailsFormData.companyDescription}
                  onChange={handleInputChange}
                  error={!!errors.companyDescription}
                  helperText={errors.companyDescription}
                />
                <p className="text-[#696969] text-[.75rem]">Describe your company</p>
              </div>
            </div>

            <div className="pt-[20px]">
              <div className="space-y-2 !relative">
                {profileDescriptionFields?.map((field, index) => (
                  <div key={index}>
                    {index === 0 ? (
                      ''
                    ) : (
                      <Button
                        type="button"
                        className="flex absolute right-0 justify-center text-center text-[1.4rem]"
                        onClick={() => handelClearDescriptionField(index)}
                      >
                        <MdOutlineCancel className="z-20" />
                      </Button>
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
                      <Box className="mt-8">
                        <TextEditor
                          content={field?.description ? field?.description : ''}
                          placeholder="Describe your product here..."
                          onUpdate={({ editor }) => handleDescriptionChange(index, 'description', editor.getText())}
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
              <Button fullWidth onClick={handleAddDescriptionField} variant="outlined" className="mt-4" color="primary" type="button">
                Add More Description Field
              </Button>
            </div>

            <Modal open={openPreview} onClose={handlePreviewClose}>
              <Box className="mx-auto max-w-[500px] p-8 bg-white rounded-lg">
                <Typography variant="body1" className="pt-4">
                  Preview Description
                </Typography>
                <div>
                  {profileDescriptionFields?.map((field, index) => (
                    <Box key={index} className="mt-6">
                      <Typography variant="h6">{field.header}</Typography>
                      <Typography className="pt-[8px]" variant="body1">
                        {field.description}
                      </Typography>
                    </Box>
                  ))}
                </div>
                <Button variant="contained" className="mt-6" onClick={handlePreviewClose} color="secondary" type="button">
                  Close Preview
                </Button>
              </Box>
            </Modal>

            <div>
              <div className="w-full flex justify-between items-center gap-5">
                {/* First Image Upload */}
                <div className="w-full">
                  <div className="py-[20px]">
                    <h2 className="font-[500] text-[1rem]">Company logo</h2>
                    <p className="text-[#b6b6b6] text-[.9rem]">File should maintain minimum of 40 * 40</p>
                  </div>
                  <Box
                    className="flex flex-col gap-[8px] justify-center items-center w-full h-[150px] border-[1.5px] border-dashed border-[#d9d9d9] rounded-[8px] cursor-pointer bg-white hover:bg-[#f7f7f7]"
                    onClick={() => (document.getElementById('logo-upload') as HTMLInputElement).click()} // Trigger input on box click
                  >
                    <FaUpload size={20} color="#888" />
                    <Input
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoFileChange}
                      placeholder="Click to Upload/browse fill"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                    />
                    <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
                  </Box>
                  {/* Display Uploaded File Name */}
                  <div className="pt-[10px]">
                    {supplierProfileLogo && (
                      <div className="flex flex-wrap gap-[10px]">
                        <Box
                          className="relative p-1 bg-[#f7f7f7] rounded-[5px]"
                        >
                          <Button
                            className="flex absolute -right-[18px] -top-[20px] justify-center text-center text-[.8rem]"
                            onClick={() => handleLogoDeleteFile()} // Delete the current file
                          >
                            <MdOutlineCancel className="z-20" />
                          </Button>
                          <Typography variant="body2">
                            {(supplierProfileLogo as any)?.name}
                          </Typography>
                        </Box>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2nd Image Upload */}
                <div className="w-full">
                  <div className="py-[20px]">
                    <h2 className="font-[500] text-[1rem]">Company banner logo</h2>
                    <p className="text-[#b6b6b6] text-[.9rem] ">File should maintain minimum of 300 * 400 size</p>
                  </div>
                  <Box
                    className="flex flex-col gap-[8px] justify-center items-center w-full h-[150px] border-[1.5px] border-dashed border-[#d9d9d9] rounded-[8px] cursor-pointer bg-white hover:bg-[#f7f7f7]"
                    onClick={() => (document.getElementById('banner-upload') as HTMLInputElement).click()} // Trigger input on box click
                  >
                    <FaUpload size={20} color="#888" />
                    <Input
                      id="banner-upload"
                      type="file"
                      onChange={handleBannerFileChange}
                      placeholder="Click to Upload/browse fill"
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp, "
                      sx={{ display: 'none' }}
                    // multiple
                    />
                    <h2 className="text-[#b6b6b6] pt-[10px] text-[.95rem]">Click to upload/browse file</h2>
                  </Box>

                  <div className="pt-[10px]">
                    {supplierProfileBanner && (
                      <div className="flex flex-wrap gap-[10px]">
                        <Box className="relative p-1 bg-[#f7f7f7] rounded-[5px]">
                          <Typography variant="body2">
                            {supplierProfileBanner && !Array.isArray(supplierProfileBanner)
                              ? (supplierProfileBanner as any).name
                              : ''}
                          </Typography>
                        </Box>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex pt-[30px] gap-[20px] justify-between mt-4">
              <Button
                disabled={activeStep === steps.length - 1}
                variant="contained"
                color="primary"
                className="w-full"
                type="submit"
              >
                {activeStep === steps.length - 1 ? 'Finish' : 'Save and Continue'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierCompanyProfileDescription;

const businessData = {
  businessCategory: [
    'Mineral Producers',
    'Mining Equipment & Machinery',
    'Chemical Suppliers for Mining',
    'Technology Providers',
    'Engineering & Consulting Services',
    'Logistics & Transportation',
    'Recycling & Waste Management',
    'Sustainability & ESG Solutions',
    'Mining Software & IT Services',
    'Others',
  ],
  businessType: [
    'Supplier',
    'Buyer',
    'Marketer',
    'Distributor',
    'Service Provider',
    'Consultant',
    'Manufacturer',
    'Trader',
    'Retailer',
    'Exporter',
    'Importer',
    'Mining Engineer',
    'Geologist',
    'Environmental Consultant',
    'Geophysicist',
    'Mineral Processing Engineer',
    'Metallurgist',
    'Mining Equipment Manufacturer',
    'Mining Software Developer',
    'Mining Technology Provider',
    'Mining Services Provider',
    'Mining Contractor',
    'Mining Consultant',
    'Mining Researcher',
    'Mining Analyst',
  ],
};
