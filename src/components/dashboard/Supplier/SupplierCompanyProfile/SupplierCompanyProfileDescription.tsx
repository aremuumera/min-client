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

import { z } from 'zod';
import { MultiCheckboxSelect, SearchableSelect } from '@/components/ui';

const steps = ['Company Description', 'Contact Info', 'Location', 'Confirm details'];

const stepSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyDescription: z.string().min(1, 'Company description is required'),
  businessCategory: z.string().min(1, 'Business category is required'),
  totalEmployees: z.string().min(1, 'Total employees is required'),
  yearEstablished: z.string().min(1, 'Year of established is required').refine(val => !isNaN(Number(val)), 'Must be a valid year'),
  yearExperience: z.string().min(1, 'Year of experience is required'),
  businessType: z.string().min(1, 'Business type is required'),
  totalRevenue: z.string().min(1, 'Total revenue is required'),
  selectedPayments: z.array(z.string()).min(1, 'Terms of payment is required'),
  selectedShippings: z.array(z.string()).min(1, 'Shipping options is required'),
});

const descriptionFieldSchema = z.object({
  header: z.string().min(1, 'Header is required'),
  description: z.string().min(1, 'Description is required'),
});

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

  const handleDescriptionChange = (index: number, field: 'header' | 'description', value: string) => {
    dispatch(updateProfileDescriptionField({ index, field, value }));
    // Clear field-specific error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${field}${index}`];
      return newErrors;
    });
  };

  const handleAddDescriptionField = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addProfileDescriptionField());
  };
  const handelClearDescriptionField = (index: number) => {
    dispatch(removeProfileDescriptionField(index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: any } }) => {
    const { name, value } = e.target;
    dispatch(updateProfileDetailsFormData({ [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const validateForm = () => {
    try {
      stepSchema.parse(profileDetailsFormData);

      // Validate additional description fields
      const fieldErrors: Record<string, string> = {};
      profileDescriptionFields.forEach((field, index) => {
        const result = descriptionFieldSchema.safeParse(field);
        if (!result.success) {
          result.error.issues.forEach((issue: any) => {
            fieldErrors[`${issue.path[0]}${index}`] = issue.message;
          });
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        toast.error('Please fill in all description fields correctly');
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

        const firstError = Object.values(newErrors)[0] as string;
        toast.error(firstError);
      }
      return false;
    }
  };


  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length === 1) {
      const file = files[0]; // Get the first file
      const isValidFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size must not exceed 5MB');
          return false;
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          toast.error('Unsupported file format');
          return false;
        }
        return true;
      };

      if (!isValidFile(file)) {
        return; // Stop execution if the file is invalid
      }

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
      toast.error('Only 1 image is required');
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
          toast.error('File size must not exceed 5MB');
          return false;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          toast.error('Unsupported file format');
          return false;
        }
        return true;
      };

      if (!isValidFile(file)) {
        return; // Stop execution if the file is invalid
      }

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
                  value={profileDetailsFormData?.companyName || ''}
                  onChange={handleInputChange}
                  error={!!errors.companyName}
                  helperText={errors.companyName || "This will be display name on your company profile"}
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Total Employees"
                  fullWidth
                  margin="normal"
                  placeholder="e.g. 12, 15 - 200"
                  name="totalEmployees"
                  value={profileDetailsFormData?.totalEmployees || ''}
                  onChange={handleInputChange}
                  error={!!errors.totalEmployees}
                  helperText={errors.totalEmployees}
                />
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
                  value={profileDetailsFormData?.yearEstablished || ''}
                  onChange={handleInputChange}
                  error={!!errors.yearEstablished}
                  helperText={errors.yearEstablished}
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Year of experience"
                  fullWidth
                  margin="normal"
                  placeholder="eg... 15+ "
                  name="yearExperience"
                  value={profileDetailsFormData?.yearExperience || ''}
                  onChange={handleInputChange}
                  error={!!errors.yearExperience}
                  helperText={errors.yearExperience}
                />
              </div>
            </div>

            {/* section 3 */}
            <div className="flex flex-col pt-[15px] md:flex-row gap-[15px] items-center justify-center">
              {/* business category section */}
              <div className="w-full">
                <SearchableSelect
                  label="Business Category"
                  name="businessCategory"
                  options={businessData.businessCategory.map(c => ({ value: c, label: c }))}
                  value={profileDetailsFormData.businessCategory || ''}
                  onChange={(e: any) => handleInputChange({ target: { name: 'businessCategory', value: e.target.value } })}
                  placeholder="Select category"
                  errorMessage={errors.businessCategory}
                  fullWidth
                />
              </div>

              {/* business type section */}
              <div className="w-full">
                <SearchableSelect
                  label="Business Type"
                  name="businessType"
                  options={businessData.businessType.map(t => ({ value: t, label: t }))}
                  value={profileDetailsFormData.businessType || ''}
                  onChange={(e: any) => handleInputChange({ target: { name: 'businessType', value: e.target.value } })}
                  placeholder="Select type"
                  errorMessage={errors.businessType}
                  fullWidth
                />
              </div>
            </div>

            {/* section 4 */}
            <div className="flex flex-col pt-[30px] md:flex-row gap-[15px] items-start">
              <div className="w-full">
                <MultiCheckboxSelect
                  label="Terms of Payment"
                  options={paymentTerms.map(t => ({ value: t.code, label: `${t.code} - ${t.name}` }))}
                  value={profileDetailsFormData.selectedPayments || []}
                  onChange={(val) => handleInputChange({ target: { name: 'selectedPayments', value: val } })}
                  placeholder="Select payment terms"
                  errorMessage={errors.selectedPayments}
                  fullWidth
                />
              </div>

              <div className="w-full">
                <MultiCheckboxSelect
                  label="Shipping Options"
                  options={shippingTerms.map(t => ({ value: t.code, label: `${t.code} - ${t.name}` }))}
                  value={profileDetailsFormData.selectedShippings || []}
                  onChange={(val) => handleInputChange({ target: { name: 'selectedShippings', value: val } })}
                  placeholder="Select shipping options"
                  errorMessage={errors.selectedShippings}
                  fullWidth
                />
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
                  value={profileDetailsFormData?.totalRevenue || ''}
                  onChange={handleInputChange}
                  error={!!errors.totalRevenue}
                  helperText={errors.totalRevenue}
                />
              </div>
              <div className="w-full">
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
                  helperText={errors.companyDescription || "Describe your company"}
                />
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
                    {supplierProfileLogo && !Array.isArray(supplierProfileLogo) && (
                      <div className="flex flex-wrap gap-[10px] ">
                        <Box
                          className="relative p-1 bg-[#f7f7f7] rounded-[5px]"
                        >
                          <IconButton
                            className="flex absolute -right-[18px] -top-[20px] justify-center text-center text-[.8rem]"
                            onClick={() => handleLogoDeleteFile()}
                            aria-label="delete logo"
                          >
                            <MdOutlineCancel className="z-20 text-red-500" />
                          </IconButton>
                          <Typography variant="body2" className="px-2">
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
                    {supplierProfileBanner && !Array.isArray(supplierProfileBanner) && (
                      <div className="flex flex-wrap gap-[10px]">
                        <Box className="relative p-1 bg-[#f7f7f7] rounded-[5px]">
                          <IconButton
                            className="flex absolute -right-[18px] -top-[20px] justify-center text-center text-[.8rem]"
                            onClick={() => handleDeleteBannerFile()}
                            aria-label="delete banner"
                          >
                            <MdOutlineCancel className="z-20 text-red-500" />
                          </IconButton>
                          <Typography variant="body2" className="px-2">
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
