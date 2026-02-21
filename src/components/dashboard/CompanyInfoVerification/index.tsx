import React, { useEffect, useState } from 'react';
import {
  useAddDirectorMutation,
  useDeleteDirectorMutation,
  useGetDirectorsQuery,
  useGetVerificationDetailsQuery,
  useGetVerificationStatusQuery,
  useSubmitStep1Mutation,
  useSubmitStep2Mutation,
  useSubmitStep3Mutation,
  useSubmitStep4Mutation,
  useSubmitStep5Mutation,
  useUpdateBusinessCategoryMutation,
  useUpdateDirectorMutation,
} from '@/redux/features/business_verification_feature/bv_v1_api';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { MdAccountBalance as AccountBalance } from 'react-icons/md';
import { MdArrowBack as ArrowBack } from 'react-icons/md';
import { MdArrowForward as ArrowForward } from 'react-icons/md';
import { MdBusiness as Business } from 'react-icons/md';
// import { MdCheckCircle as CheckCircle } from 'react-icons/md';
import { MdClose as Close } from 'react-icons/md';
import { MdCloudUpload as CloudUpload } from 'react-icons/md';
import { MdDescription as Description } from 'react-icons/md';
import { MdHandshake as Handshake } from 'react-icons/md';
import { MdPeople as People } from 'react-icons/md';
import { MdPlayArrow as PlayArrow } from 'react-icons/md';
import { MdSearch as Search } from 'react-icons/md';
import { MdStorefront as Storefront } from 'react-icons/md';
import { MdTrendingUp as TrendingUp } from 'react-icons/md';
import { MdVerifiedUser as VerifiedUser } from 'react-icons/md';
import { Alert } from '@/components/ui/alert';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { CircularProgress } from '@/components/ui/progress';
import { Container } from '@/components/ui/container';
import { Dialog } from '@/components/ui/modal';
import { DialogActions } from '@/components/ui/modal';
import { DialogContent } from '@/components/ui/modal';
import { DialogTitle } from '@/components/ui/modal';
import { Divider } from '@/components/ui/divider';
import { FormControl } from '@/components/ui/form-control';
import { FormHelperText } from '@/components/ui/input';
import { Grid } from '@/components/ui/grid';
import { IconButton } from '@/components/ui/icon-button';
import { InputAdornment } from '@/components/ui/input';
import { InputLabel } from '@/components/ui/form-control';
import { List } from '@/components/ui/list';
import { MenuItem } from '@/components/ui/menu';
import { Paper } from '@/components/ui/paper';
import { Select } from '@/components/ui/select';
import { Step } from '@/components/ui/stepper';
import { StepLabel } from '@/components/ui/stepper';
import { Stepper } from '@/components/ui/stepper';
import { TextField } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/utils/helper';
import { Country, State } from 'country-state-city';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/redux/hooks';
import { useRouter } from 'next/navigation';
import { paths } from '@/config/paths';
import { CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { z } from 'zod';

import { useAlert } from '@/providers';

import nigerianLgas from '@/utils/location-lga.json'; // Adjust path as needed

// Import your JSON files
import nigerianStates from '@/utils/location-state.json'; // Adjust path as needed

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const businessLines = [
  'Investments',
  'Inheritance',
  'Sales of Assets',
  'Employment Income',
  'Technology & IT',
  'Retail & E-commerce',
  'Manufacturing',
  'Agriculture & Food',
  ' Mining & Minerals',
  'Gemstones & Jewelry',
  'Construction & Real Estate',
  'Financial Services',
  'Healthcare & Pharmaceuticals',
  'Education & Training',
  'Transportation & Logistics',
  'Hospitality & Tourism',
  'Professional Services',
  'Media & Entertainment',
  'Energy & Utilities',
  'Other',
];

// Zod Schemas
const businessCategorySchema = z.object({
  business_category: z.string().min(1, 'Business category is required'),
});

// const step1Schema = z.object({
//   company_name: z.string().min(1, 'Company name is required'),
//   business_email: z.string().email('Invalid email address'),
//   phone_number: z.string().min(1, 'Phone number is required'),
//   business_description: z.string().optional(),
//   country: z.string().min(1, 'Country is required'),
//   state: z.string().min(1, 'State is required'),
//   lga: z.string().optional(),
//   full_address: z.string().optional(),
//   zip_code: z.string().optional(),
// });

// Update your step1Schema to include the new fields
const step1Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  phone_dial_code: z.string().optional(),
  business_description: z.string().min(1, 'Business description is required'),
  country: z.string().min(1, 'Country is required'),
  country_name: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  state_name: z.string().optional(),
  lga: z.string().optional(),
  full_address: z.string().optional(),
  zip_code: z.string().optional(),
});

const step2Schema = z.object({
  business_type: z.string().min(1, 'Business type is required'),
  registration_number: z.string().optional(),
  registration_date: z.preprocess(
    (val) => {
      if (!val) return undefined;
      // Handle Date object or string
      if (val instanceof Date) return val;
      if (typeof val === 'string' || typeof val === 'number') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },
    z
      .date({
        message: 'Registration date is required or invalid',
      })
      .max(new Date(), { message: 'Registration date cannot be in the future' })
      .optional()
  ),
  nature_of_business: z.string().min(1, 'Nature of business is required'),
});

const step2FilesSchema = z.object({
  cac_certificate: z.instanceof(File, { message: 'CAC certificate is required' }).nullable(),
  certificate_of_incorporation: z.instanceof(File).nullable().optional(),
  memorandum_and_articles: z.instanceof(File).nullable().optional(),
  form_2_co7: z.instanceof(File).nullable().optional(),
});

const step3Schema = z.object({
  tin_number: z.string().optional(),
  vat_number: z.string().optional(),
});

const step3FilesSchema = z.object({
  vat_registration_certificate: z.instanceof(File).nullable().optional(),
  scuml_certificate: z.instanceof(File).nullable().optional(),
});

const step4Schema = z.object({
  address_proof_type: z.string().min(1, 'Address proof type is required'),
  // other_address_proof_type: z.string().optional(),
  line_of_business: z.string().min(1, 'Line of business is required'),
});

const step4FilesSchema = z.object({
  business_address_proof: z.instanceof(File, { message: 'Business address proof is required' }).nullable(),
  board_resolution: z.instanceof(File).nullable().optional(),
  authorized_signatories: z.instanceof(File).nullable().optional(),
  trade_license: z.instanceof(File, { message: 'Trade license is required' }).nullable(),
  other_regulatory_permits: z.array(z.instanceof(File)).optional(),
  accreditation_docs: z.instanceof(File).nullable().optional(),
  insurance_info: z.instanceof(File).nullable().optional(),
});

const directorSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  date_of_birth: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date({ message: "Date of birth is required" })),
  gender: z.string().min(1, 'Gender is required'),
  identity_type: z.string().min(1, 'Identity type is required'),
  identity_number: z.string().min(1, 'Identity number is required'),
  address_proof_type: z.string().min(1, 'Address proof type is required'),
});

const directorFilesSchema = z.object({
  identity_document: z.instanceof(File, { message: 'Identity document is required' }).nullable(),
  address_proof_document: z.instanceof(File, { message: 'Address proof document is required' }).nullable(),
});

import { useUserLocation } from '@/utils/locateUser';

const SearchableSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  placeholder = 'Search...',
  renderOption = (option: any) => option.label || option.name || option,
  startAdornment,
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const filteredOptions = options.filter((option: any) =>
    (option.label || option.name || option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <FormControl fullWidth required={required} disabled={disabled} error={error}>
      <Select
        value={value}
        onChange={onChange}
        label={label}
        open={open}
        onOpen={() => {
          setOpen(true);
          setSearchTerm(''); // Reset search when opening
        }}
        onClose={() => {
          setOpen(false);
          setSearchTerm(''); // Reset search when closing
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
          // This ensures the search stays at top
          disableAutoFocusItem: true,
        }}
        renderValue={(selected) => {
          if (!selected) return '';
          const option = options.find((opt: any) => opt.value === selected || opt.isoCode === selected);
          if (option) return option.label || option.name;
          return selected;
        }}
      >
        {/* This is the trick: We use a Box with sticky positioning */}
        <Box className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-1.5" data-no-select>
          <TextField
            fullWidth
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            inputSize="sm"
            autoFocus
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
            startAdornment={
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            }
            endAdornment={
              searchTerm && (
                <InputAdornment position="end">
                  <IconButton aria-label="Close" size="sm" onClick={() => setSearchTerm('')}>
                    <Close size={18} />
                  </IconButton>
                </InputAdornment>
              )
            }
          />
        </Box>

        {/* Always show "Select..." option first */}
        <MenuItem
          value=""
        >
          <em>Select {label}</em>
        </MenuItem>

        {filteredOptions.length === 0 ? (
          <MenuItem
            disabled
          >
            <Typography variant="body2">No options found for "{searchTerm}"</Typography>
          </MenuItem>
        ) : (
          filteredOptions.map((option: any, index: number) => (
            <MenuItem
              key={option.value || option.isoCode || index}
              value={option.value || option.isoCode || option}
            >
              <Box className="flex items-center w-full">
                {startAdornment && startAdornment(option)}
                <Box className="flex-1">{renderOption(option)}</Box>
                {option.flag && (
                  <Typography variant="caption">{option.flag}</Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

// Business Category Modal
const BusinessCategoryModal = ({ open, setShowCategoryModal, onComplete }: any) => {
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  const userId = effectiveUserId;
  const [updateCategory, { isLoading, error }] = useUpdateBusinessCategoryMutation();
  const { data: statusData, refetch } = useGetVerificationStatusQuery(userId, { skip: !userId });
  const verificationStatus = (statusData as any)?.data?.verificationStatus;
  const { showAlert } = useAlert();

  const role = user?.role;

  const cat = role === 'inspector'
    ? [
      {
        name: 'Inspection Agency / Company',
        sub: 'inspection_agency',
        label: 'Inspection Agency / Company',
        des: 'We are a registered company providing professional inspection services',
      },
      {
        name: 'Independent Inspector',
        sub: 'independent_inspector',
        label: 'Independent Inspector',
        des: 'I am a licensed professional inspector working independently',
      },
    ]
    : [
      {
        name: 'Miner',
        sub: 'miner',
        label: 'Miner',
        des: 'I am a licensed miner and I have the license/permit',
      },
      {
        name: 'Trader',
        sub: 'trader_dealer',
        label: 'Trader / Dealer',
        des: 'I have a licensed registered business and I have license/permit',
      },
    ];

  const handleSubmit = async () => {
    try {
      setErrors({});

      await updateCategory({
        userId,
        data: { business_category: category },
      }).unwrap();

      setShowCategoryModal(false);
      onComplete();
      showAlert('Business category saved successfully', 'success');
      refetch();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        console.error('Failed to save category:', err);
        showAlert(err?.data?.message || 'Failed to save category', 'error');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setShowCategoryModal(false)}
      className="max-w-screen-sm w-full"
      // disableEscapeKeyDown
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <DialogTitle showCloseButton={false}>
        <Box className="flex items-center gap-2">
          <Business color="primary" />
          <Typography variant="h5">Verify Your Business Account</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box className="py-6">
          <Typography variant="body1" gutterBottom className="mb-3">
            Welcome! Let's start by understanding your business better. Please select the category that best describes
            your business.
          </Typography>

          <FormControl fullWidth error={!!errors.business_category}>
            <Select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              label="Business Category *"
              renderValue={(value) => {
                const item = cat.find((el) => el.name === value);
                return item ? item.label : 'Select Category';
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 150,
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                Select Category
              </MenuItem>
              {cat.map((category, i) => (
                <MenuItem key={i} value={category?.name} className="block  border-b border-neutral-100">
                  <Typography variant="subtitle1" className="font-semibold">
                    {category.label}
                  </Typography>
                  <Typography variant="body2" className="text-neutral-500 block font-normal">
                    {category.des}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
            {errors.business_category && <FormHelperText>{errors.business_category}</FormHelperText>}
          </FormControl>

          {error && (
            <Alert severity="error" className="mt-2 text-sm">
              {(error as any)?.data?.message || 'Failed to save category'}
            </Alert>
          )}

          <Alert severity="info" className="my-6">
            This verification process will help you unlock full business features and build trust with your customers.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions className="px-3 pb-3">
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!category || isLoading}
          fullWidth
          size="lg"
          endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
        >
          Continue to Verification
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// File Upload Component with View Option
// File Upload Component with View Option
const FileUploadField = ({
  label,
  name,
  file,
  fileUrl,
  onChange,
  accept = 'image/*,.pdf',
  required = false,
  disabled = false,
  error = '',
}: any) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(name, e.target.files[0]);
    }
  };

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>

      {fileUrl && !file ? (
        <Box className="flex gap-1 items-center">
          <Chip label="Document Uploaded" color="success" size="sm" icon={<CheckCircle />} className="flex-1" />
          <Button variant="outlined" size="sm" onClick={() => window.open(fileUrl, '_blank')} type="button">
            View
          </Button>
          {!disabled && (
            <>
              <input
                type="file"
                hidden
                accept={accept}
                ref={replaceInputRef}
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                size="sm"
                startIcon={<CloudUpload />}
                onClick={() => replaceInputRef.current?.click()}
                type="button"
              >
                Replace
              </Button>
            </>
          )}
        </Box>
      ) : (
        <>
          <input
            type="file"
            hidden
            accept={accept}
            ref={inputRef}
            onChange={handleFileChange}
            disabled={disabled}
          />
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            fullWidth
            className="justify-start py-1.5 text-left overflow-hidden whitespace-nowrap text-ellipsis flex"
            disabled={disabled}
            color={error ? 'error' : 'primary'}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {file ? file.name : 'Choose File'}
          </Button>
          {file && <Chip label={file.name} onDelete={() => onChange(name, null)} size="sm" className="mt-1" />}
        </>
      )}
      {error && (
        <Typography variant="caption" color="error" className="mt-1 block">
          {error}
        </Typography>
      )}
    </Box>
  );
};

const BusinessProfileStep = ({ userId, onNext, onBack, verificationData }: any) => {
  const [formData, setFormData] = useState({
    company_name: '',
    business_email: '',
    phone_number: '',
    business_description: '',
    country: '',
    state: '',
    lga: '',
    full_address: '',
    zip_code: '',
    country_name: '',
    phone_dial_code: '',
  });

  const [states, setStates] = useState<any[]>([]);
  const [lgas, setLgas] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const { showAlert } = useAlert();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStep1, { isLoading, error }] = useSubmitStep1Mutation();

  // Use your location hook
  const location = useUserLocation();

  // Get all countries from country-state-city package - MEMOIZED to prevent infinite loops
  const allCountries = React.useMemo(() => Country.getAllCountries().map((country) => ({
    ...country,
    label: country.name,
    value: country.isoCode,
  })), []);

  // Initialize with detected location
  useEffect(() => {
    const { country: detectedCountryName, countryCode: detectedCountryCode } = location;

    // Only auto-detect if we don't have a country in form OR saved in verification data
    if (detectedCountryName && !formData.country && !verificationData?.country) {
      // Find country in our list
      const detectedCountry = allCountries.find(
        (c) =>
          c.name.toLowerCase() === detectedCountryName.toLowerCase() ||
          (detectedCountryCode && c.isoCode.toLowerCase() === detectedCountryCode.toLowerCase())
      );

      if (detectedCountry) {
        setFormData((prev) => {
          // Avoid update if already set to same value
          if (prev.country === detectedCountry.isoCode) return prev;

          return {
            ...prev,
            country: detectedCountry.isoCode,
            country_name: detectedCountry.name,
            phone_dial_code: detectedCountry.phonecode,
          };
        });
        setSelectedCountry(detectedCountry);

        // If in Nigeria, try to match state
        if (detectedCountry.isoCode === 'NG' && location.state) {
          const locationState = location.state;
          const nigerianState = (nigerianStates as any[]).find((s: any) => s.label.toLowerCase() === locationState?.toLowerCase());
          if (nigerianState) {
            setFormData((prev) => {
              if (prev.state === nigerianState.value) return prev;
              return {
                ...prev,
                state: nigerianState.value,
              };
            });
            setSelectedState(nigerianState);
            // Load LGAs for Nigerian state
            const stateLgas = (nigerianLgas as any)[nigerianState.value] || [];
            if (JSON.stringify(lgas) !== JSON.stringify(stateLgas)) {
              setLgas(stateLgas);
            }
          }
        }
      }
    }
  }, [location, formData.country, verificationData?.country, allCountries]);

  // Prefill data if exists - Refined to prevent infinite loops
  useEffect(() => {
    if (verificationData) {
      const countryCode = verificationData.country || '';
      const stateValue = verificationData.state || '';

      const newData = {
        company_name: verificationData.company_name || '',
        business_email: verificationData.business_email || '',
        phone_number: verificationData.phone_number || '',
        business_description: verificationData.business_description || '',
        country: countryCode,
        state: stateValue,
        lga: verificationData.lga || '',
        full_address: verificationData.full_address || '',
        zip_code: verificationData.zip_code || '',
        country_name: verificationData.country_name || '',
        phone_dial_code: verificationData.phone_dial_code || '',
      };

      // Only update if data actually changed
      setFormData((prev) => {
        const hasChanged = Object.keys(newData).some(
          (key) => (newData as any)[key] !== (prev as any)[key]
        );
        if (!hasChanged) return prev;
        return { ...prev, ...newData };
      });

      // Set selected country
      const country = allCountries.find((c) => c.isoCode === countryCode);
      if (country) {
        setSelectedCountry(country);

        // Load states for this country
        if (country.isoCode === 'NG') {
          setStates(nigerianStates);
        } else {
          const countryStates = State.getStatesOfCountry(country.isoCode);
          setStates(
            countryStates.map((state) => ({
              ...state,
              label: state.name,
              value: state.isoCode,
            }))
          );
        }

        // Set selected state and load LGAs for Nigeria
        if (country.isoCode === 'NG' && stateValue) {
          const state = nigerianStates.find((s: any) => s.value === stateValue);
          if (state) {
            setSelectedState(state);
            setLgas((nigerianLgas as any)[state.value] || []);
          }
        }
      }
    }
  }, [verificationData, allCountries, nigerianStates, nigerianLgas]);

  const handleCountryChange = (e: any) => {
    const countryCode = e.target.value;
    if (countryCode === undefined) return;
    const country = allCountries.find((c) => c.isoCode === countryCode);
    const countryName = country ? country.name : '';
    const phoneDialCode = country ? country.phonecode : '';

    setFormData((prev) => ({
      ...prev,
      country: countryCode,
      country_name: countryName,
      phone_dial_code: phoneDialCode,
      state: '',
      lga: '',
    }));

    setSelectedCountry(country);
    setSelectedState(null);
    setLgas([]);

    // Load states based on country
    if (countryCode === 'NG') {
      setStates(nigerianStates);
    } else if (countryCode) {
      const countryStates = State.getStatesOfCountry(countryCode);
      setStates(
        countryStates.map((state) => ({
          ...state,
          label: state.name,
          value: state.isoCode,
        }))
      );
    } else {
      setStates([]);
    }

    if (errors.country) {
      setErrors({ ...errors, country: '' });
    }
  };

  const handleStateChange = (e: any) => {
    const stateValue = e.target.value;
    if (stateValue === undefined) return;

    setFormData((prev) => ({
      ...prev,
      state: stateValue,
      lga: '',
    }));

    // For Nigeria, load LGAs
    if (selectedCountry?.isoCode === 'NG' && stateValue) {
      const state = nigerianStates.find((s: any) => s.value === stateValue);
      setSelectedState(state);
      setLgas((nigerianLgas as any)[stateValue] || []);
    }

    if (errors.state) {
      setErrors({ ...errors, state: '' });
    }
  };

  const handleLGAChange = (e: any) => {
    const lgaValue = e.target.value;
    if (lgaValue === undefined) return;
    setFormData((prev) => ({
      ...prev,
      lga: lgaValue,
    }));
    if (errors.lga) {
      setErrors({ ...errors, lga: '' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.country === 'NG' && !formData.lga) {
      showAlert('LGA is required for Nigerian businesses.', 'error');
      return;
    }

    try {
      // Get country name for submission
      const countryData = selectedCountry || allCountries.find((c) => c.isoCode === formData.country);
      const countryName = countryData?.name || '';

      // Get state name for submission
      let stateName = '';
      if (selectedCountry?.isoCode === 'NG') {
        const stateData = nigerianStates.find((s: any) => s.value === formData.state);
        stateName = stateData?.label || '';
      } else if (formData.state) {
        const stateData = states.find((s) => s.value === formData.state);
        stateName = stateData?.name || '';
      }

      const dataToSubmit = {
        ...formData,
        country_name: countryName,
        state_name: stateName,
        // Include dial code if needed
        phone_dial_code: countryData?.phonecode || '+234', // Default to Nigeria
      };

      const validated = step1Schema.parse(dataToSubmit);
      setErrors({});

      await submitStep1({
        userId,
        data: validated,
      }).unwrap();
      onNext();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          fieldErrors[error.path[0] as string] = error.message;
          showAlert(`${error.message}`, 'error');
        });
        setErrors(fieldErrors);
      } else {
        console.error('Failed to submit step 1:', err);
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, message]) => {
            showAlert(`${field}: ${message}`, 'error');
          });
        } else {
          showAlert(err?.data?.message || err?.message || 'Failed to submit business profile. Please try again.', 'error');
        }
      }
    }
  };

  // Check if step is editable
  const stepStatus = verificationData?.step_1_status;
  const isEditable = !stepStatus || stepStatus === 'pending' || stepStatus === 'needs_correction';
  const isCompleted = stepStatus === 'completed';
  const needsCorrection = stepStatus === 'needs_correction';

  return (
    <form onSubmit={handleSubmit}>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="h5" gutterBottom>
          Business Profile
        </Typography>
        {isCompleted && <Chip label="Completed" color="success" size="sm" icon={<CheckCircle />} />}
        {needsCorrection && <Chip label="Needs Correction" color="error" size="sm" />}
        {!stepStatus && <Chip label="Not Submitted" color="default" size="sm" />}
      </Box>

      <Typography variant="body2" color="text.secondary" className="mb-3">
        Provide your basic business information
      </Typography>

      {needsCorrection && verificationData?.required_corrections?.step_1_message && (
        <Alert severity="warning" className="mb-3">
          <strong>Correction Required:</strong> {verificationData.required_corrections.step_1_message}
        </Alert>
      )}

      {isCompleted && (
        <Alert severity="info" className="mb-3">
          This step has been submitted and is under review. You can view your submitted information below.
        </Alert>
      )}

      {/* Show detected location info */}
      {location.country && !formData.country && (
        <Alert severity="info" className="mb-3">
          We detected your location: {location.country}
          {location.state ? `, ${location.state}` : ''}
          {location.country !== 'Nigeria' && (
            <Typography variant="body2" className="mt-1">
              Note: LGA (Local Government Area) is only required for Nigerian businesses.
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.company_name}
            helperText={errors.company_name}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="email"
            label="Business Email"
            name="business_email"
            value={formData.business_email}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.business_email}
            helperText={errors.business_email}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box className="flex gap-1">
            <FormControl className="w-2/5" disabled={!isEditable}>
              <Select value={selectedCountry?.phonecode || '+234'} label="Code" disabled>
                <MenuItem value={selectedCountry?.phonecode || '+234'}>{selectedCountry?.phonecode || '+234'}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              required
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={!isEditable}
              error={!!errors.phone_number}
              helperText={errors.phone_number}
              readOnly={!isEditable}
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Business Description"
            name="business_description"
            value={formData.business_description}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.business_description}
            helperText={errors.business_description}
            readOnly={!isEditable}
          />
        </Grid>

        {/* Country Select */}
        <Grid item xs={12} sm={6}>
          <SearchableSelect
            label="Country"
            value={formData.country}
            onChange={handleCountryChange}
            options={allCountries}
            required
            disabled={!isEditable}
            error={!!errors.country}
            helperText={errors.country}
            placeholder="Search for country..."
            renderOption={(option: any) => `${option.name} (${option.phonecode})`}
          />
        </Grid>

        {/* State Select */}
        <Grid item xs={12} sm={6}>
          <SearchableSelect
            label="State/Province"
            value={formData.state}
            onChange={handleStateChange}
            options={states}
            required
            disabled={!isEditable || !formData.country}
            error={!!errors.state}
            helperText={errors.state}
            placeholder="Search for state..."
          />
          {!formData.country && (
            <Typography variant="caption" color="text.secondary">
              Select country first
            </Typography>
          )}
        </Grid>

        {/* LGA Select - Only for Nigeria */}
        {selectedCountry?.isoCode === 'NG' && (
          <Grid item xs={12} sm={6}>
            <SearchableSelect
              label="Local Government Area (LGA)"
              value={formData.lga}
              onChange={handleLGAChange}
              options={lgas}
              disabled={!isEditable || !formData.state}
              error={!!errors.lga}
              helperText={errors.lga}
              placeholder="Search for LGA..."
            />
            {!formData.state && (
              <Typography variant="caption" color="text.secondary">
                Select state first
              </Typography>
            )}
          </Grid>
        )}

        <Grid item xs={12} sm={formData.country === 'NG' ? 6 : 12}>
          <TextField
            fullWidth
            label="Zip Code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.zip_code}
            helperText={errors.zip_code}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Full Address"
            name="full_address"
            value={formData.full_address}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.full_address}
            helperText={errors.full_address}
            readOnly={!isEditable}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" className="mt-2">
          {(error as any).data?.message || 'Failed to save business profile'}
        </Alert>
      )}

      <Box className="mt-3 flex justify-between">
        <div></div>
        {isEditable ? (
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
          >
            {needsCorrection ? 'Resubmit' : 'Save & Continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onNext} endIcon={<ArrowForward />}>
            Next Step
          </Button>
        )}
      </Box>
    </form>
  );
};

// Step 2: Business Registration
const BusinessRegistrationStep = ({ userId, onNext, onBack, verificationData }: any) => {
  const [formData, setFormData] = useState({
    business_type: '',
    registration_number: '',
    registration_date: '',
    nature_of_business: '',
  });
  const { showAlert } = useAlert();

  const [files, setFiles] = useState<Record<string, File | null>>({
    cac_certificate: null,
    certificate_of_incorporation: null,
    memorandum_and_articles: null,
    form_2_co7: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitStep2, { isLoading, error }] = useSubmitStep2Mutation();

  // Prefill data if exists - Refined to prevent infinite loops
  useEffect(() => {
    if (verificationData) {
      const newData = {
        business_type: verificationData?.business_type || '',
        registration_number: verificationData?.registration_number || '',
        registration_date: verificationData?.registration_date ? verificationData.registration_date.split('T')[0] : '',
        nature_of_business: verificationData?.nature_of_business || '',
      };

      setFormData((prev) => {
        const hasChanged = Object.keys(newData).some(
          (key) => (newData as any)[key] !== (prev as any)[key]
        );
        if (!hasChanged) return prev;
        return { ...prev, ...newData };
      });
    }
  }, [verificationData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
      showAlert(`${errors[e.target.name]}`, 'error');
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFiles({ ...files, [name]: file });
    if (fileErrors[name]) {
      setFileErrors({ ...fileErrors, [name]: '' });
    }
  };
  console.log('Submitting Step 2 with data:', formData);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // che
    try {
      const validated = step2Schema.parse(formData);

      // Validate files
      const filesToValidate = {
        cac_certificate:
          files.cac_certificate || (verificationData?.cac_certificate_url ? new File([], 'existing') : null),
        certificate_of_incorporation: files.certificate_of_incorporation,
        memorandum_and_articles: files.memorandum_and_articles,
        form_2_co7: files.form_2_co7,
      };

      const validatedFiles = step2FilesSchema.parse(filesToValidate);
      setErrors({});
      setFileErrors({});

      const formDataToSend = new FormData();

      Object.keys(validated).forEach((key) => {
        formDataToSend.append(key, (validated as any)[key]);
      });

      Object.keys(files).forEach((key) => {
        if (files[key]) {
          formDataToSend.append(key, files[key] as File);
        }
      });
      console.log('Submitting Step 2 with data:', formDataToSend, formData);

      await submitStep2({ userId, formData: formDataToSend }).unwrap();
      onNext();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const fieldFileErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          const fieldName = error.path[0] as string;
          if (
            ['cac_certificate', 'certificate_of_incorporation', 'memorandum_and_articles', 'form_2_co7'].includes(
              fieldName
            )
          ) {
            fieldFileErrors[fieldName] = error.message;
          } else {
            fieldErrors[fieldName] = error.message;
          }
        });
        console.error('Validation errors:', fieldErrors, fieldFileErrors);
        setErrors(fieldErrors);
        setFileErrors(fieldFileErrors);
        showAlert(`${Object.values(fieldErrors).concat(Object.values(fieldFileErrors)).join(', ')}`, 'error');
      } else {
        console.error('Failed to submit step 2:', err);
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, message]) => {
            showAlert(`${field}: ${message}`, 'error');
          });
        } else {
          showAlert(err?.data?.message || err?.message || 'Failed to submit business registration. Please try again.', 'error');
        }
      }
    }
  };

  const stepStatus = verificationData?.step_2_status;
  const isEditable = !stepStatus || stepStatus === 'pending' || stepStatus === 'needs_correction';
  const isCompleted = stepStatus === 'completed';
  const needsCorrection = stepStatus === 'needs_correction';

  return (
    <form onSubmit={handleSubmit}>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="h5" gutterBottom>
          Business Registration
        </Typography>
        {isCompleted && <Chip label="Completed" color="success" size="sm" icon={<CheckCircle />} />}
        {needsCorrection && <Chip label="Needs Correction" color="error" size="sm" />}
        {!stepStatus && <Chip label="Not Submitted" color="default" size="sm" />}
      </Box>

      <Typography variant="body2" color="text.secondary" className="mb-3">
        Provide your business registration documents
      </Typography>

      {needsCorrection && verificationData?.required_corrections?.step_2_message && (
        <Alert severity="warning" className="mb-3">
          <strong>Correction Required:</strong> {verificationData.required_corrections.step_2_message}
        </Alert>
      )}

      {isCompleted && (
        <Alert severity="info" className="mb-3">
          This step has been submitted and is under review.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required disabled={!isEditable} error={!!errors.business_type}>
            <Select name="business_type" value={formData.business_type} onChange={handleChange} label="Business Type">
              <MenuItem value="registered_company">Registered Company</MenuItem>
              <MenuItem value="business">Business</MenuItem>
            </Select>
            {errors.business_type && <FormHelperText>{errors.business_type}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Registration Number"
            name="registration_number"
            value={formData.registration_number}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.registration_number}
            helperText={errors.registration_number}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Registration Date"
            name="registration_date"
            value={formData.registration_date}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.registration_date}
            helperText={errors.registration_date}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Nature of Business"
            name="nature_of_business"
            value={formData.nature_of_business}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.nature_of_business}
            helperText={errors.nature_of_business}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider className="my-2" />
          <Typography variant="h6" gutterBottom>
            Upload Documents
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="CAC Certificate"
            name="cac_certificate"
            file={files.cac_certificate}
            fileUrl={verificationData?.cac_certificate_url}
            onChange={handleFileChange}
            required
            disabled={!isEditable}
            error={fileErrors.cac_certificate}
          />
        </Grid>

        {formData.business_type === 'registered_company' && (
          <>
            <Grid item xs={12} sm={6}>
              <FileUploadField
                label="Certificate of Incorporation"
                name="certificate_of_incorporation"
                file={files.certificate_of_incorporation}
                fileUrl={verificationData?.certificate_of_incorporation_url}
                onChange={handleFileChange}
                disabled={!isEditable}
                error={fileErrors.certificate_of_incorporation}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FileUploadField
                label="Memorandum & Articles"
                name="memorandum_and_articles"
                file={files.memorandum_and_articles}
                fileUrl={verificationData?.memorandum_and_articles_url}
                onChange={handleFileChange}
                accept=".pdf"
                disabled={!isEditable}
                error={fileErrors.memorandum_and_articles}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FileUploadField
                label="Form 2/CO7"
                name="form_2_co7"
                file={files.form_2_co7}
                fileUrl={verificationData?.form_2_co7_url}
                onChange={handleFileChange}
                disabled={!isEditable}
                error={fileErrors.form_2_co7}
              />
            </Grid>
          </>
        )}
      </Grid>

      {error && (
        <Alert severity="error" className="mt-2">
          {(error as any).data?.message || 'Failed to save registration documents'}
        </Alert>
      )}

      <Box className="mt-3 flex justify-between">
        <Button onClick={onBack} startIcon={<ArrowBack />}>
          Back
        </Button>
        {isEditable ? (
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
          >
            {needsCorrection ? 'Resubmit' : 'Save & Continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onNext} endIcon={<ArrowForward />}>
            Next Step
          </Button>
        )}
      </Box>
    </form>
  );
};

// Step 3: Tax Compliance
const TaxComplianceStep = ({ userId, onNext, onBack, verificationData }: any) => {
  const [formData, setFormData] = useState({
    tin_number: '',
    vat_number: '',
  });
  const { showAlert } = useAlert();

  const [files, setFiles] = useState<Record<string, File | null>>({
    vat_registration_certificate: null,
    scuml_certificate: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitStep3, { isLoading, error }] = useSubmitStep3Mutation();

  // Prefill data if exists - Refined to prevent infinite loops
  useEffect(() => {
    if (verificationData) {
      const newData = {
        tin_number: verificationData.tin_number || '',
        vat_number: verificationData.vat_number || '',
      };

      setFormData((prev) => {
        const hasChanged = Object.keys(newData).some(
          (key) => (newData as any)[key] !== (prev as any)[key]
        );
        if (!hasChanged) return prev;
        return { ...prev, ...newData };
      });
    }
  }, [verificationData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFiles({ ...files, [name]: file });
    if (fileErrors[name]) {
      setFileErrors({ ...fileErrors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.tin_number) {
      showAlert('Please provide at least TIN Number', 'error');
      return;
    }
    try {
      const validated = step3Schema.parse(formData);
      const validatedFiles = step3FilesSchema.parse(files);
      setErrors({});
      setFileErrors({});

      const formDataToSend = new FormData();

      Object.keys(validated).forEach((key) => {
        formDataToSend.append(key, (validated as any)[key]);
      });

      Object.keys(files).forEach((key) => {
        if (files[key]) {
          formDataToSend.append(key, files[key] as File);
        }
      });

      await submitStep3({ userId, formData: formDataToSend }).unwrap();
      onNext();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const fieldFileErrors: Record<string, string> = {};

        err.issues.forEach((error) => {
          const fieldName = error.path[0] as string;
          if (
            ['cac_certificate', 'certificate_of_incorporation', 'memorandum_and_articles', 'form_2_co7'].includes(
              fieldName
            )
          ) {
            fieldFileErrors[fieldName] = error.message;
          } else {
            fieldErrors[fieldName] = error.message;
          }
        });

        setErrors(fieldErrors);
        setFileErrors(fieldFileErrors);

        // Show all errors in toast
        const allErrors = [...Object.values(fieldErrors), ...Object.values(fieldFileErrors)];
        if (allErrors.length > 0) {
          allErrors.forEach((errorMsg) => showAlert(errorMsg, 'error'));
        }
      } else {
        console.error('Failed to submit step 2:', err);

        // Handle API errors
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, message]) => {
            showAlert(`${field}: ${message}`, 'error');
          });
        } else {
          showAlert(
            err?.data?.message || err?.message || 'Failed to submit tax compliance information. Please try again.',
            'error'
          );
        }
      }
    }
  };

  const stepStatus = verificationData?.step_3_status;
  const isEditable = !stepStatus || stepStatus === 'pending' || stepStatus === 'needs_correction';
  const isCompleted = stepStatus === 'completed';
  const isPending = stepStatus === 'pending';
  const needsCorrection = stepStatus === 'needs_correction';

  return (
    <form onSubmit={handleSubmit}>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="h5" gutterBottom>
          Tax Compliance
        </Typography>
        {isCompleted && <Chip label="Completed" color="success" size="sm" icon={<CheckCircle />} />}
        {needsCorrection && <Chip label="Needs Correction" color="error" size="sm" />}
        {isPending && <Chip label="Under Review" color="error" size="sm" />}
        {/* {stepStatus && <Chip label="Not Submitted" color="default" size="sm" />} */}
      </Box>

      <Typography variant="body2" color="text.secondary" className="mb-3">
        Provide your tax information and certificates
      </Typography>

      {needsCorrection && verificationData?.required_corrections?.step_3_message && (
        <Alert severity="warning" className="mb-3">
          <strong>Correction Required:</strong> {verificationData.required_corrections.step_3_message}
        </Alert>
      )}

      {isCompleted && (
        <Alert severity="info" className="mb-3">
          This step has been submitted and is under review.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="TIN Number"
            name="tin_number"
            value={formData.tin_number}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.tin_number}
            helperText={errors.tin_number}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="VAT Number"
            name="vat_number"
            value={formData.vat_number}
            onChange={handleChange}
            disabled={!isEditable}
            error={!!errors.vat_number}
            helperText={errors.vat_number}
            readOnly={!isEditable}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider className="my-2" />
          <Typography variant="h6" gutterBottom>
            Upload Certificates
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="VAT Registration Certificate"
            name="vat_registration_certificate"
            file={files.vat_registration_certificate}
            fileUrl={verificationData?.vat_registration_certificate_url}
            onChange={handleFileChange}
            disabled={!isEditable}
            error={fileErrors.vat_registration_certificate}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="SCUML Certificate"
            name="scuml_certificate"
            file={files.scuml_certificate}
            fileUrl={verificationData?.scuml_certificate_url}
            onChange={handleFileChange}
            disabled={!isEditable}
            error={fileErrors.scuml_certificate}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" className="mt-2">
          {(error as any).data?.message || 'Failed to save tax compliance information'}
        </Alert>
      )}

      <Box className="mt-3 flex justify-between">
        <Button onClick={onBack} startIcon={<ArrowBack />}>
          Back
        </Button>
        {isEditable ? (
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
          >
            {needsCorrection ? 'Resubmit' : 'Save & Continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onNext} endIcon={<ArrowForward />}>
            Next Step
          </Button>
        )}
      </Box>
    </form>
  );
};

// Step 4: Business Authorization
const BusinessAuthorizationStep = ({ userId, onNext, onBack, verificationData }: any) => {
  const [formData, setFormData] = useState({
    address_proof_type: '',
    other_address_proof_type: '',
    line_of_business: '',
  });
  const { showAlert } = useAlert();

  const [files, setFiles] = useState<Record<string, File | File[] | null>>({
    business_address_proof: null,
    board_resolution: null,
    authorized_signatories: null,
    trade_license: null,
    other_regulatory_permits: [],
    accreditation_docs: null,
    insurance_info: null,
  });
  const { user, isTeamMember, ownerUserId } = useAppSelector((state: any) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  const userRole = user?.role;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submitStep4, { isLoading, error }] = useSubmitStep4Mutation();

  // Prefill data if exists - Refined to prevent infinite loops
  useEffect(() => {
    if (verificationData) {
      const newData = {
        address_proof_type: verificationData.address_proof_type || '',
        other_address_proof_type: verificationData.other_address_proof_type || '',
        line_of_business: verificationData.line_of_business || '',
      };

      setFormData((prev) => {
        const hasChanged = Object.keys(newData).some(
          (key) => (newData as any)[key] !== (prev as any)[key]
        );
        if (!hasChanged) return prev;
        return { ...prev, ...newData };
      });
    }
  }, [verificationData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (name === 'other_regulatory_permits') {
      setFiles((prevFiles) => ({
        ...prevFiles,
        [name]: [...(prevFiles[name] as File[]), file as File],
      }));
    } else {
      setFiles({ ...files, [name]: file });
    }
    if (fileErrors[name]) {
      setFileErrors({ ...fileErrors, [name]: '' });
    }
  };

  const validated = () => {
    try {
      step4Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files.business_address_proof && !verificationData?.business_address_proof_url) {
      showAlert('Business Address Proof is required.', 'error');
      return;
    } else if (!files.trade_license && !verificationData?.trade_license_url) {
      showAlert('Trade License is required.', 'error');
      return;
    } else if (!formData.line_of_business) {
      showAlert('Please provide Line of Business.', 'error');
      return;
    } else if (!formData.address_proof_type) {
      showAlert('Please select Address Proof Type.', 'error');
      return;
    } else {
      setErrors({});
    }
    try {
      const validated = step4Schema.parse(formData);

      // Validate files
      const filesToValidate = {
        business_address_proof:
          files.business_address_proof ||
          (verificationData?.business_address_proof_url ? new File([], 'existing') : null),
        board_resolution: files.board_resolution,
        authorized_signatories: files.authorized_signatories,
        trade_license: files.trade_license || (verificationData?.trade_license_url ? new File([], 'existing') : null),
        other_regulatory_permits: files.other_regulatory_permits,
        accreditation_docs: files.accreditation_docs || (verificationData?.accreditationDocs ? new File([], 'existing') : null),
        insurance_info: files.insurance_info || (verificationData?.insuranceInfo ? new File([], 'existing') : null),
      };

      const validatedFiles = step4FilesSchema.parse(filesToValidate);
      setErrors({});
      setFileErrors({});

      const formDataToSend = new FormData();

      Object.keys(validated).forEach((key) => {
        formDataToSend.append(key, (validated as any)[key]);
      });

      Object.keys(files).forEach((key) => {
        if (key === 'other_regulatory_permits') {
          (files[key] as File[]).forEach((file) => {
            formDataToSend.append(key, file);
          });
        } else if (files[key]) {
          formDataToSend.append(key, files[key] as File);
        }
      });

      await submitStep4({ userId, formData: formDataToSend }).unwrap();
      onNext();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const fieldFileErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          const fieldName = error.path[0] as string;
          if (
            [
              'business_address_proof',
              'board_resolution',
              'authorized_signatories',
              'trade_license',
              'other_regulatory_permits',
              'accreditation_docs',
              'insurance_info',
            ].includes(fieldName)
          ) {
            fieldFileErrors[fieldName] = error.message;
          } else {
            fieldErrors[fieldName] = error.message;
          }
        });
        setErrors(fieldErrors);
        setFileErrors(fieldFileErrors);
        showAlert(`${Object.values(fieldErrors).concat(Object.values(fieldFileErrors)).join(', ')}`, 'error');
      } else {
        console.error('Failed to submit step 4:', err);
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, message]) => {
            showAlert(`${field}: ${message}`, 'error');
          });
        } else {
          showAlert(
            err?.data?.message || err?.message || 'Failed to submit business authorization. Please try again.',
            'error'
          );
        }
      }
    }
  };

  const stepStatus = verificationData?.step_4_status;
  const isEditable = !stepStatus || stepStatus === 'pending' || stepStatus === 'needs_correction';
  const isCompleted = stepStatus === 'completed';
  const needsCorrection = stepStatus === 'needs_correction';

  return (
    <form onSubmit={handleSubmit}>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="h5" gutterBottom>
          Business Authorization
        </Typography>
        {isCompleted && <Chip label="Completed" color="success" size="sm" icon={<CheckCircle />} />}
        {needsCorrection && <Chip label="Needs Correction" color="error" size="sm" />}
        {!stepStatus && <Chip label="Not Submitted" color="default" size="sm" />}
      </Box>

      <Typography variant="body2" color="text.secondary" className="mb-3">
        Upload authorization and proof documents
      </Typography>

      {needsCorrection && verificationData?.required_corrections?.step_4_message && (
        <Alert severity="warning" className="mb-3">
          <strong>Correction Required:</strong> {verificationData.required_corrections.step_4_message}
        </Alert>
      )}

      {isCompleted && (
        <Alert severity="info" className="mb-3">
          This step has been submitted and is under review.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!isEditable} error={!!errors.address_proof_type}>
            <Select
              name="address_proof_type"
              value={formData.address_proof_type}
              onChange={handleChange}
              label="Address Proof Type"
            >
              <MenuItem value="" disabled>
                Select
              </MenuItem>
              <MenuItem value="utility_bill">Utility Bill</MenuItem>
              <MenuItem value="bank_statement">Bank Statement</MenuItem>
              <MenuItem value="tenancy_agreement">Tenancy Agreement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {errors.address_proof_type && <FormHelperText>{errors.address_proof_type}</FormHelperText>}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!isEditable} error={!!errors.line_of_business}>
            <Select
              name="line_of_business"
              value={formData.line_of_business}
              onChange={handleChange}
              label="Line of business"

            >
              <MenuItem value="" disabled>
                Select
              </MenuItem>
              {businessLines.map((line) => (
                <MenuItem key={line} value={line}>
                  {line}
                </MenuItem>
              ))}
            </Select>
            {errors.line_of_business && <FormHelperText>{errors.line_of_business}</FormHelperText>}
          </FormControl>
        </Grid>

        {formData.address_proof_type === 'other' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Specify Other Proof Type"
              name="other_address_proof_type"
              value={formData.other_address_proof_type}
              onChange={handleChange}
              disabled={!isEditable}
              error={!!errors.other_address_proof_type}
              helperText={errors.other_address_proof_type}
              readOnly={!isEditable}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Divider className="my-2" />
          <Typography variant="h6" gutterBottom>
            Upload Documents
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="Business Address Proof"
            name="business_address_proof"
            file={files.business_address_proof}
            fileUrl={verificationData?.business_address_proof_url}
            onChange={handleFileChange}
            required
            disabled={!isEditable}
            error={fileErrors.business_address_proof}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="Evidence Trade License / Permit"
            name="trade_license"
            file={files.trade_license}
            fileUrl={verificationData?.trade_license_url}
            onChange={handleFileChange}
            disabled={!isEditable}
            required
            error={fileErrors.trade_license}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="Board Resolution"
            name="board_resolution"
            file={files.board_resolution}
            fileUrl={verificationData?.board_resolution_url}
            onChange={handleFileChange}
            disabled={!isEditable}
            error={fileErrors.board_resolution}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FileUploadField
            label="Authorized Signatories"
            name="authorized_signatories"
            file={files.authorized_signatories}
            fileUrl={verificationData?.authorized_signatories_url}
            onChange={handleFileChange}
            disabled={!isEditable}
            error={fileErrors.authorized_signatories}
          />
        </Grid>

        {userRole === 'inspector' && (
          <>
            <Grid item xs={12} className="mt-4">
              <Typography variant="subtitle1" fontWeight="600" color="primary">
                Inspector Credentials
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please provide your professional accreditation and insurance details.
              </Typography>
              <Divider className="my-2" />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FileUploadField
                label="Accreditation Documents"
                name="accreditation_docs"
                file={files.accreditation_docs}
                isExisting={!!verificationData?.accreditationDocs}
                existingUrl={verificationData?.accreditationDocs?.url}
                onChange={handleFileChange}
                required={!verificationData?.accreditationDocs}
                error={fileErrors.accreditation_docs}
                disabled={!isEditable}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FileUploadField
                label="Professional Insurance Info"
                name="insurance_info"
                file={files.insurance_info}
                isExisting={!!verificationData?.insuranceInfo}
                existingUrl={verificationData?.insuranceInfo?.url}
                onChange={handleFileChange}
                required={!verificationData?.insuranceInfo}
                error={fileErrors.insurance_info}
                disabled={!isEditable}
              />
            </Grid>
          </>
        )}
      </Grid>

      {error && (
        <Alert severity="error" className="mt-2">
          {(error as any).data?.message || 'Failed to save authorization documents'}
        </Alert>
      )}

      <Box className="mt-3 flex justify-between">
        <Button onClick={onBack} startIcon={<ArrowBack />}>
          Back
        </Button>
        {isEditable ? (
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
          >
            {needsCorrection ? 'Resubmit' : 'Save & Continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onNext} endIcon={<ArrowForward />}>
            Next Step
          </Button>
        )}
      </Box>
    </form>
  );
};

const CompletionStep = () => {
  const { user } = useAppSelector((state: any) => state.auth);
  const userRole = user?.role;

  const contentMap = {
    supplier: {
      nextSteps: [
        {
          icon: <Storefront className="text-[40px]" />,
          title: 'Build Your Profile',
          description: 'Create a compelling supplier profile to showcase your business to potential buyers',
          color: '#10b981',
          status: 'Ready',
        },
        {
          icon: <Handshake className="text-[40px]" />,
          title: 'Start Trading',
          description: 'Connect with verified buyers and sellers in your industry',
          color: '#10b981',
          status: 'Coming Soon',
        },
        {
          icon: <TrendingUp className="text-[40px]" />,
          title: 'Source Products',
          description: 'Access our global marketplace to find quality products and suppliers',
          color: '#10b981',
          status: 'Coming Soon',
        },
      ],
      footerText: "Once your business is verified, you'll unlock full access to create your supplier profile, list products, connect with buyers, and start trading on our platform."
    },
    buyer: {
      nextSteps: [
        {
          icon: <Business className="text-[40px]" />,
          title: 'Build Buyer Profile',
          description: 'Complete your buyer profile to establish trust with premium suppliers',
          color: '#3b82f6',
          status: 'Ready',
        },
        {
          icon: <VerifiedUser className="text-[40px]" />,
          title: 'Source Quality Minerals',
          description: 'Browse through verified listings from licensed miners and traders',
          color: '#3b82f6',
          status: 'Coming Soon',
        },
        {
          icon: <Description className="text-[40px]" />,
          title: 'Request for Quotes',
          description: 'Post RFQs to get customized offers from multiple suppliers',
          color: '#3b82f6',
          status: 'Coming Soon',
        },
      ],
      footerText: "Once your business is verified, you'll be able to connect with verified suppliers, post detailed RFQs, and manage your sourcing process more efficiently."
    },
    inspector: {
      nextSteps: [
        {
          icon: <People className="text-[40px]" />,
          title: 'Build Inspector Profile',
          description: 'Create a professional profile to showcase your inspection expertise',
          color: '#f59e0b',
          status: 'Ready',
        },
        {
          icon: <Handshake className="text-[40px]" />,
          title: 'Manage Assignments',
          description: 'Efficiently track and manage your inspection assignments and reports',
          color: '#f59e0b',
          status: 'Coming Soon',
        },
        {
          icon: <Search className="text-[40px]" />,
          title: 'Conduct Inspections',
          description: 'Access tools and templates for professional mineral inspections',
          color: '#f59e0b',
          status: 'Coming Soon',
        },
      ],
      footerText: "Once your business is verified, you'll unlock full access to create your inspector profile, manage inspection requests, and provide trusted verification services on the platform."
    },
    default: {
      nextSteps: [
        {
          icon: <Building2 className="text-[40px]" />,
          title: 'Complete Profile',
          description: 'Finish setting up your profile to unlock all platform features',
          color: '#6b7280',
          status: 'Ready',
        },
        {
          icon: <Storefront className="text-[40px]" />,
          title: 'Explore Marketplace',
          description: 'Browse our extensive range of mineral products and services',
          color: '#6b7280',
          status: 'Coming Soon',
        },
        {
          icon: <TrendingUp className="text-[40px]" />,
          title: 'Grow Your Business',
          description: 'Connect with global partners and scale your operations',
          color: '#6b7280',
          status: 'Coming Soon',
        },
      ],
      footerText: "Once your business is verified, you'll unlock full access to all features and services tailored to your role on our platform."
    }
  };

  const roleContent = contentMap[userRole as keyof typeof contentMap] || contentMap.default;
  const nextSteps = roleContent.nextSteps;

  return (
    <Box className="text-center py-8">
      {/* Success Icon */}
      <MotionBox
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4 border-4 border-white"
      >
        <CheckCircle className="text-[48px] text-primary-500" />
      </MotionBox>

      {/* Success Message */}
      <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} className="text-gray-900">
          Submitted Successfully!
        </Typography>

        <Typography variant="body1" color="text.secondary" className="mb-6 max-w-3xl mx-auto text-lg">
          Your business verification has been submitted and is now under review. We'll notify you once the verification
          is complete.
        </Typography>

        <Alert severity="info" className="max-w-3xl mx-auto mb-8 bg-primary-50 border-primary-100">
          <Box className="flex flex-col gap-1">
            <Box className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <span className="text-primary-900 font-medium">Status: Under Review</span>
            </Box>
            <Box className="text-primary-700 ml-4 text-left">
              Estimated time: 2-3 business days
            </Box>
          </Box>
        </Alert>
      </MotionBox>

      {/* Divider with Text */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative max-w-3xl mx-auto my-10 before:content-[''] before:absolute before:top-1/2 before:left-0 before:right-0 before:h-px before:bg-gray-100"
      >
        <Box
          className="relative inline-block bg-white px-4 py-1 rounded-full border border-gray-100"
        >
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} className="uppercase tracking-wider">
            What's Next?
          </Typography>
        </Box>
      </MotionBox>

      {/* Next Steps Cards */}
      <Box className="max-w-screen-xl mx-auto mb-8">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Typography variant="h4" gutterBottom fontWeight={600} className="text-gray-900">
            Get Ready to Grow Your Business
          </Typography>
          <Typography variant="body1" color="text.secondary">
            While you wait, here are some things you can look forward to
          </Typography>
        </MotionBox>

        <Grid container spacing={3} className='spacing-3 flex flex-row flex-wrap justify-center'>
          {nextSteps.map((step, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <MotionPaper
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                elevation={0}
                className="p-8 h-full rounded-[24px] bg-primary-50/50 border-0 relative overflow-hidden group hover:bg-primary-50 transition-colors duration-300 shadow-none"
              >
                {/* Icon */}
                <Box
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white group-hover:scale-110 transition-transform duration-300"
                >
                  <Box style={{ color: step.color }}>{step.icon}</Box>
                </Box>

                {/* Content */}
                <Typography variant="h6" fontWeight={700} className="mb-2 text-gray-900 text-left" gutterBottom>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-0 leading-relaxed text-left">
                  {step.description}
                </Typography>
              </MotionPaper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Bottom CTA */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 p-10 sm:p-20 bg-primary rounded-[24px] max-w-screen-xl mx-auto text-white"
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight={600}>
          💡 What Happens Next?
        </Typography>
        <Typography variant="body2" className="opacity-95 text-center">
          {roleContent.footerText} We'll notify you as soon as your verification is approved!
        </Typography>
      </MotionBox>
    </Box>
  );
};

const DirectorsStep = ({ userId, onBack, onSubmit }: any) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // NEW
  const [showViewDialog, setShowViewDialog] = useState(false); // NEW
  const [directorToDelete, setDirectorToDelete] = useState<any>(null); // NEW
  const [viewingDirector, setViewingDirector] = useState<any>(null); // NEW
  const [editingDirector, setEditingDirector] = useState<any>(null);
  const { showAlert } = useAlert();

  const [submitStep5, { isLoading }] = useSubmitStep5Mutation();

  const { data: directorsData, isLoading: loadingDirectors } = useGetDirectorsQuery(userId);
  const { data: statusData, refetch } = useGetVerificationStatusQuery(userId);
  const [addDirector, { isLoading: adding }] = useAddDirectorMutation();
  const [updateDirector, { isLoading: updating }] = useUpdateDirectorMutation();
  const [deleteDirector, { isLoading: isDeletingLoading }] = useDeleteDirectorMutation();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    nationality: 'Nigeria',
    date_of_birth: '',
    gender: '',
    identity_type: '',
    identity_number: '',
    address_proof_type: '',
  });

  const [identityDocument, setIdentityDocument] = useState<File | null>(null);
  const [addressProofDocument, setAddressProofDocument] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      nationality: 'Nigeria',
      date_of_birth: '',
      gender: '',
      identity_type: '',
      identity_number: '',
      address_proof_type: '',
    });
    setIdentityDocument(null);
    setEditingDirector(null);
    setAddressProofDocument(null);
    setErrors({});
    setFileErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const validated = directorSchema.parse(formData);
      const validatedFiles = directorFilesSchema.parse({
        identity_document: identityDocument,
        address_proof_document: addressProofDocument,
      });
      setErrors({});
      setFileErrors({});

      const formDataToSend = new FormData();

      Object.keys(validated).forEach((key) => {
        formDataToSend.append(key, (validated as any)[key]);
      });

      if (identityDocument) {
        formDataToSend.append('identity_document', identityDocument);
      }
      if (addressProofDocument) {
        formDataToSend.append('address_proof_document', addressProofDocument);
      }

      if (editingDirector) {
        await updateDirector({
          userId,
          directorId: editingDirector.id,
          formData: formDataToSend,
        }).unwrap();
      } else {
        await addDirector({ userId, formData: formDataToSend }).unwrap();
      }
      setShowAddDialog(false);
      resetForm();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const fieldFileErrors: Record<string, string> = {};
        err.issues.forEach((error) => {
          const fieldName = error.path[0] as string;
          if (['identity_document', 'address_proof_document'].includes(fieldName)) {
            fieldFileErrors[fieldName] = error.message;
          } else {
            fieldErrors[fieldName] = error.message;
          }
        });
        setErrors(fieldErrors);
        setFileErrors(fieldFileErrors);
      } else {
        console.error('Failed to submit director:', err);
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, message]) => {
            showAlert(`${field}: ${message}`, 'error');
          });
        } else {
          showAlert(err?.data?.message || err?.message || 'Failed to submit director. Please try again.', 'error');
        }
      }
    }
  };

  // Updated delete handler
  const handleDeleteClick = (director: any) => {
    setDirectorToDelete(director);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDirector({ userId, directorId: directorToDelete.id }).unwrap();
      showAlert('Director deleted successfully', 'success');
      setShowDeleteDialog(false);
      setDirectorToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete director:', err);
      showAlert(err?.data?.message || 'Failed to delete director', 'error');
    }
  };

  const handleSubmitDirectors = async () => {
    try {
      await submitStep5({ userId }).unwrap();
      showAlert('Directors information submitted successfully', 'success');
      await refetch();
      onSubmit();
    } catch (err: any) {
      console.error('Failed to submit directors step:', err);
      showAlert(err?.data?.message || 'Failed to submit directors information', 'error');
    }
  };

  // View handler
  const handleViewClick = (director: any) => {
    setViewingDirector(director);
    setShowViewDialog(true);
  };

  if (loadingDirectors) {
    return (
      <Box className="flex items-center justify-center p-4">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Directors Information
      </Typography>
      <Typography variant="body2" color="text.secondary" className="mb-3">
        Add directors and their identification documents
      </Typography>

      {directorsData?.data?.directors?.length > 0 ? (
        <List>
          {directorsData.data.directors.map((director: any) => (
            <Card key={director.id} className="mb-2">
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box
                    className='flex-1'
                  >
                    <Typography variant="h6">
                      {director.first_name} {director.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {director.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {director.phone_number}
                    </Typography>
                    <Box className="mt-1 flex gap-1 flex-wrap">
                      <Chip
                        label={director.status?.toUpperCase()}
                        size="sm"
                        color={
                          director.status === 'verified'
                            ? 'success'
                            : director.status === 'rejected'
                              ? 'error'
                              : 'primary'
                        }
                      />
                      {director.identity_verified && (
                        <Chip label="ID Verified" size="sm" color="success" icon={<CheckCircle />} />
                      )}
                    </Box>
                  </Box>
                  <Box className="flex gap-1">
                    <IconButton aria-label="View Director Details" onClick={() => handleViewClick(director)} title="View Details" className="text-blue-600 hover:bg-blue-50">
                      <Eye size={20} />
                    </IconButton>
                    <IconButton aria-label="Delete Director" onClick={() => handleDeleteClick(director)} title="Delete Director" className="text-red-600 hover:bg-red-50">
                      <Trash2 size={20} />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      ) : (
        <Alert severity="info" className="mb-3">
          No directors added yet. Click the button below to add a director.
        </Alert>
      )}

      <Button variant="outlined" startIcon={<Plus size={20} />} onClick={() => setShowAddDialog(true)} fullWidth>
        Add Director
      </Button>

      {/* View Director Modal */}
      <Dialog
        open={showViewDialog}
        onClose={() => {
          setShowViewDialog(false);
          setViewingDirector(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">Director Details</Typography>
            <IconButton aria-label="Close Director Details" onClick={() => setShowViewDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingDirector && (
            <Box className="pt-2">
              {/* Status Banner */}
              <Alert
                severity={
                  viewingDirector.status === 'verified'
                    ? 'success'
                    : viewingDirector.status === 'rejected'
                      ? 'error'
                      : 'info'
                }
                className="mb-3"
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  Status: {viewingDirector.status?.toUpperCase()}
                </Typography>
                {viewingDirector.rejected_reason && (
                  <Typography variant="body2" className="mt-1">
                    <strong>Reason:</strong> {viewingDirector.rejected_reason}
                  </Typography>
                )}
              </Alert>

              {/* Personal Information */}
              <Typography variant="h6" gutterBottom className="mt-3">
                Personal Information
              </Typography>
              <Divider className="mb-2" />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    First Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.first_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.last_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.phone_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Nationality
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.nationality}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.date_of_birth
                      ? new Date(viewingDirector.date_of_birth).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Gender
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.gender?.charAt(0).toUpperCase() + viewingDirector.gender?.slice(1) || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Identity Information */}
              <Typography variant="h6" gutterBottom className="mt-3">
                Identity Information
              </Typography>
              <Divider className="mb-2" />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Identity Type
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.identity_type?.toUpperCase() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Identity Number
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.identity_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Identity Verified
                  </Typography>
                  <Box className="mt-0.5">
                    <Chip
                      label={viewingDirector.identity_verified ? 'Verified' : 'Not Verified'}
                      size="sm"
                      color={viewingDirector.identity_verified ? 'success' : 'default'}
                      icon={viewingDirector.identity_verified ? <CheckCircle /> : null}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Address Proof Type
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingDirector.address_proof_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Documents */}
              <Typography variant="h6" gutterBottom className="mt-3">
                Documents
              </Typography>
              <Divider className="mb-2" />
              <Grid container spacing={2}>
                {viewingDirector.identity_document_url && (
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Description />}
                      onClick={() => window.open(viewingDirector.identity_document_url, '_blank')}
                    >
                      View Identity Document
                    </Button>
                  </Grid>
                )}
                {viewingDirector.business_address_proof_url && (
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Description />}
                      onClick={() => window.open(viewingDirector.business_address_proof_url, '_blank')}
                    >
                      View Address Proof
                    </Button>
                  </Grid>
                )}
              </Grid>

              {/* Verification Timeline */}
              {(viewingDirector.verified_at || viewingDirector.createdAt) && (
                <>
                  <Typography variant="h6" gutterBottom className="mt-3">
                    Timeline
                  </Typography>
                  <Divider className="mb-2" />
                  <Box>
                    {viewingDirector.createdAt && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Submitted:</strong> {new Date(viewingDirector.createdAt).toLocaleString()}
                      </Typography>
                    )}
                    {viewingDirector.verified_at && (
                      <Typography variant="body2" color="text.secondary" className="mt-1">
                        <strong>Verified:</strong> {new Date(viewingDirector.verified_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-3 pb-3">
          <Button onClick={() => setShowViewDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDirectorToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center gap-2">
            <Box
              className="w-12 h-12 rounded-full flex items-center justify-center bg-error-light"
            >
              <Trash2 className="text-red-600" size={48} />
            </Box>
            <Typography variant="h6">Delete Director?</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {directorToDelete && (
            <Box>
              <Alert severity="warning" className="mb-2">
                This action cannot be undone. All information and documents for this director will be permanently
                deleted.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete{' '}
                <strong>
                  {directorToDelete.first_name} {directorToDelete.last_name}
                </strong>
                ?
              </Typography>
              <Box className="mt-2 p-2 bg-gray-100 rounded-[2px]">
                <Typography variant="body2" color="text.secondary">
                  Email: {directorToDelete.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {directorToDelete.phone_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {directorToDelete.status}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-3 pb-3">
          <Button
            onClick={() => {
              setShowDeleteDialog(false);
              setDirectorToDelete(null);
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" className="bg-red-600 hover:bg-red-700" startIcon={<Trash2 size={20} />}>
            {isDeletingLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Director Modal */}
      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingDirector ? 'Edit Director' : 'Add Director'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} className="mt-2">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  error={!!errors.nationality}
                  helperText={errors.nationality}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Date of Birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}

                  error={!!errors.date_of_birth}
                  helperText={errors.date_of_birth}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.gender}>
                  <Select name="gender" value={formData.gender} onChange={handleChange} label="Gender">
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                  {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.identity_type}>
                  <Select
                    name="identity_type"
                    value={formData.identity_type}
                    onChange={handleChange}
                    label="Identity Type"
                  >
                    <MenuItem value="" disabled>
                      Select
                    </MenuItem>
                    <MenuItem value="nin">NIN</MenuItem>
                    <MenuItem value="passport">Passport</MenuItem>
                    <MenuItem value="drivers_license">Driver's License</MenuItem>
                    <MenuItem value="voters_card">Voter's Card</MenuItem>
                  </Select>
                  {errors.identity_type && <FormHelperText>{errors.identity_type}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Identity Number"
                  name="identity_number"
                  value={formData.identity_number}
                  onChange={handleChange}
                  error={!!errors.identity_number}
                  helperText={errors.identity_number}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!errors.address_proof_type}>
                  <Select
                    name="address_proof_type"
                    value={formData.address_proof_type}
                    onChange={handleChange}
                    label="Address Proof Type"
                  >
                    <MenuItem value="" disabled>
                      Select
                    </MenuItem>
                    <MenuItem value="utility_bill">Utility Bill</MenuItem>
                    <MenuItem value="bank_statement">Bank Statement</MenuItem>
                    <MenuItem value="tenancy_agreement">Tenancy Agreement</MenuItem>
                  </Select>
                  {errors.address_proof_type && <FormHelperText>{errors.address_proof_type}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FileUploadField
                  label="Identity Document"
                  name="identity_document"
                  file={identityDocument}
                  onChange={(name: string, file: File | null) => {
                    setIdentityDocument(file);
                    if (fileErrors.identity_document) {
                      setFileErrors({ ...fileErrors, identity_document: '' });
                    }
                  }}
                  required
                  error={fileErrors.identity_document}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadField
                  label="Address Proof Document"
                  name="address_proof_document"
                  file={addressProofDocument}
                  onChange={(name: string, file: File | null) => {
                    setAddressProofDocument(file);
                    if (fileErrors.address_proof_document) {
                      setFileErrors({ ...fileErrors, address_proof_document: '' });
                    }
                  }}
                  required
                  error={fileErrors.address_proof_document}
                />
              </Grid>
            </Grid>
            <DialogActions className="px-1 mt-4">
              <Button
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={adding || updating}>
                {adding || updating ? <CircularProgress size={20} /> : 'Save Director'}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Box className="mt-3 flex justify-between">
        <Button onClick={onBack} startIcon={<ArrowBack />}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitDirectors}
          disabled={isLoading}
          endIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Submit Verification
        </Button>
      </Box>
    </Box>
  );
};

// Main Business Verification Component
const BusinessVerification = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySelected, setCategorySelected] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const { user, appData, isTeamMember, ownerUserId } = useAppSelector((state: any) => state.auth);
  const effectiveUserId = isTeamMember ? ownerUserId : user?.id;
  const userId = effectiveUserId;
  const userRole = user?.role;
  const isBusinessVerified = appData?.businessVerification?.isVerified;
  const isSupplierProfileCreated = appData?.isProfileCreated;
  const router = useRouter();
  const allRoles = ['buyer', 'supplier', 'buyer_supplier', 'inspector'];
  const finalRelease = isBusinessVerified && allRoles.includes(userRole);
  // || ('admin' && !isSupplierProfileCreated);

  // console.log(
  //   'Final Release Status:',
  //   finalRelease,
  //   userRole,
  //   isBusinessVerified,
  //   userRole === allRoles.includes(userRole),
  //   allRoles.includes(userRole)
  // );

  const { data: statusData, isLoading } = useGetVerificationStatusQuery(userId);
  const { data: detailsData, isLoading: loadingDetails } = useGetVerificationDetailsQuery(userId, { skip: !userId });

  const [modalTriggered, setModalTriggered] = useState(false);

  useEffect(() => {
    // Show category modal only if no business category is set and we haven't triggered it in this session
    const isNotStarted = statusData?.data?.overall_status === 'not_started' && statusData?.data?.verification === null;

    if (isNotStarted && !modalTriggered) {
      setShowCategoryModal(true);
      setCategorySelected(true);
      setModalTriggered(true);
    }
  }, [statusData, modalTriggered]);

  const steps = [
    { label: 'Profile', icon: <Description /> },
    { label: 'Registration', icon: <AccountBalance /> },
    { label: 'Tax Compliance', icon: <VerifiedUser /> },
    { label: 'Authorization', icon: <Description /> },
    { label: 'Directors', icon: <People /> },
  ];

  const handleCategoryComplete = () => {
    setShowCategoryModal(false);
    setCategorySelected(true);
  };

  const handleVerificationSubmitted = () => {
    setSubmittedSuccessfully(true);
  };
  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const getStepContent = (step: number) => {
    const verificationData = detailsData?.data;

    switch (step) {
      case 0:
        return (
          <BusinessProfileStep
            userId={userId}
            onNext={handleNext}
            onBack={handleBack}
            verificationData={verificationData}
          />
        );
      case 1:
        return (
          <BusinessRegistrationStep
            userId={userId}
            onNext={handleNext}
            onBack={handleBack}
            verificationData={verificationData}
          />
        );
      case 2:
        return (
          <TaxComplianceStep
            userId={userId}
            onNext={handleNext}
            onBack={handleBack}
            verificationData={verificationData}
          />
        );
      case 3:
        return (
          <BusinessAuthorizationStep
            userId={userId}
            onNext={handleNext}
            onBack={handleBack}
            verificationData={verificationData}
          />
        );
      case 4:
        return <DirectorsStep userId={userId} onBack={handleBack} onSubmit={handleVerificationSubmitted} />;
      default:
        return null;
    }
  };

  // Get step status for visual indicators - FIXED VERSION
  // Explicit step status mapping
  const getStepStatus = (stepIndex: number) => {
    if (!detailsData?.data) return 'pending';

    const stepField = `step_${stepIndex + 1}_status`;
    return (detailsData.data as any)[stepField] || 'pending';
  };

  const allSteps = steps.map((_, index) => getStepStatus(index)).some((status) => status === 'completed');
  console.log('All Steps Status:', allSteps);

  // Also add this helper to determine if step is completed
  const isStepCompleted = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    return status === 'completed';
  };

  if (isLoading || loadingDetails) {
    return (
      <Box className="flex items-center justify-center min-h-[400px]">
        <CircularProgress />
      </Box>
    );
  }

  const overallStatus = statusData?.data?.overall_status;
  const isVerificationFinal =
    submittedSuccessfully || (overallStatus && ['submitted', 'pending'].includes(overallStatus));
  const isVerificationSuccessful = overallStatus === 'approved' && finalRelease;

  // If verification is final, ALWAYS show completion screen
  if (isVerificationFinal && !showCategoryModal) {
    return (
      <Container maxWidth="lg" className="py-4">
        <CompletionStep />
      </Container>
    );
  }
  // now after verification is successful, show success screen which includes next steps eb.. button for supplier profile creation
  if (finalRelease) {
    return (
      <Container maxWidth="md" className="py-4">
        <Box className="mb-4 flex items-center justify-center">
          <img
            src={'/assets/MINMEG 4.png'}
            alt=""
            className="h-10 md:h-[60px] md:w-[160px]"
          />
        </Box>
        <MotionPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          elevation={0}
          className="rounded-[24px] overflow-hidden bg-success-main"
        >
          {/* Success Header */}
          <Box className="p-6 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="text-[96px] mb-2" />
            </motion.div>

            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Verification Complete! 🎉
            </Typography>

            <Typography variant="h6" className="opacity-95 mt-2">
              Your business has been successfully verified
            </Typography>
          </Box>

          {/* Next Step Card */}
          {!isSupplierProfileCreated && ['supplier', 'buyer_supplier', 'inspector'].includes(userRole) ? (
            <Card className="m-3 rounded-[12px] shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <Box className="flex items-center mb-6">
                  {userRole === 'inspector' ? (
                    <People className="text-[40px] text-primary-main mr-4" />
                  ) : (
                    <Storefront className="text-[40px] text-primary-main mr-4" />
                  )}
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {userRole === 'inspector' ? 'Setup Your Inspector Profile' : 'Create Your Supplier Profile'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {userRole === 'inspector'
                        ? 'Create your professional profile to start receiving inspection assignments'
                        : 'Set up your company profile to start connecting with buyers'}
                    </Typography>
                  </Box>
                </Box>

                <Divider className="my-3" />

                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  {userRole === 'inspector' ? "What you'll provide:" : "What you'll add:"}
                </Typography>

                <Grid container spacing={2} className="mb-6">
                  {userRole === 'inspector' ? (
                    [
                      { icon: <Business />, text: 'Company/Individual Details' },
                      { icon: <Description />, text: 'Service Offerings' },
                      { icon: <Handshake />, text: 'Experience & Regions' },
                      { icon: <TrendingUp />, text: 'Certifications' },
                    ].map((item, i) => (
                      <Grid item xs={12} sm={6} className="mb-6 flex items-center gap-4" key={i}>
                        <Box className="text-primary-main">{item.icon}</Box>
                        <Typography variant="body2">{item.text}</Typography>
                      </Grid>
                    ))
                  ) : (
                    [
                      { icon: <Business />, text: 'Company Overview' },
                      { icon: <Description />, text: 'Products & Services' },
                      { icon: <Handshake />, text: 'Business Capabilities' },
                      { icon: <TrendingUp />, text: 'Market Presence' },
                    ].map((item, i) => (
                      <Grid item xs={12} sm={6} className="mb-6 flex items-center gap-4" key={i}>
                        <Box className="text-primary-main">{item.icon}</Box>
                        <Typography variant="body2">{item.text}</Typography>
                      </Grid>
                    ))
                  )}
                </Grid>

                <Button
                  variant="contained"
                  size="lg"
                  fullWidth
                  endIcon={<ArrowForward />}
                  onClick={() => {
                    if (userRole === 'inspector') {
                      router.push(paths.dashboard.inspections.profile);
                    } else {
                      router.push(`${paths.dashboard.products.companyProfile}`);
                    }
                  }}
                  className="py-1.5 rounded-lg text-lg normal-case"
                >
                  Set Up Profile Now
                </Button>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="block text-center mt-2"
                >
                  Takes about 10 minutes to complete
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="p-8 m-3 text-center bg-white">
                <Typography variant="h5" className="opacity-95 mt-2">
                  You have completed all the necessary steps. You can now explore the platform.
                </Typography>
                <Button
                  variant="contained"
                  size="lg"
                  className="mt-4 py-1.5 rounded-lg normal-case text-lg"
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                >
                  Go to Dashboard
                </Button>
              </Card>
            </>
          )}
        </MotionPaper>
      </Container>
    );
  }

  return (
    <>
      <BusinessCategoryModal
        open={showCategoryModal}
        setShowCategoryModal={setShowCategoryModal}
        onComplete={handleCategoryComplete}
      />

      <Container maxWidth="lg" className="py-4">
        <Paper elevation={2} className="p-4 sm:p-8">
          <Box className="mb-4">
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Business Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Complete all steps to verify your business account
            </Typography>

            {statusData?.data && (
              <Box className="flex gap-4 mt-4 flex-wrap">
                {
                  <>
                    <Chip
                      label={`${statusData.data.overall_status}`?.replace('_', ' ').toUpperCase()}
                      color={
                        statusData.data.overall_status === 'approved'
                          ? 'success'
                          : statusData.data.overall_status === 'rejected'
                            ? 'error'
                            : statusData.data.overall_status === 'needs_correction'
                              ? 'error'
                              : 'primary'
                      }
                      size="sm"
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="block ml-2 pt-2 font-medium text-[#555]"
                    >
                      {statusData.data.overall_status === 'approved' &&
                        'Congratulations! Your business verification is complete.'}
                      {statusData.data.overall_status === 'pending' &&
                        'Your verification is under review. We will notify you once it is complete.'}
                      {statusData.data.overall_status === 'rejected' &&
                        `Reason: ${statusData.data.verification.rejected_reason}`}
                      {statusData.data.overall_status === 'needs_correction' &&
                        ` Reason: ${statusData.data.verification.required_corrections?.message}`}
                    </Typography>
                  </>
                }
              </Box>
            )}
          </Box>

          {/* Desktop Stepper */}
          <Box className="hidden min-[904px]:block">
            <Stepper activeStep={activeStep} orientation="horizontal" className="mb-4">
              {steps.map((step, index) => {
                const stepStatus = getStepStatus(index);
                const isCompleted = stepStatus === 'completed';
                const needsCorrection = stepStatus === 'needs_correction';
                const isPending = stepStatus === 'pending';

                // console.log(
                //   `Step ${index}: status=${stepStatus}, isCompleted=${isCompleted}, needsCorrection=${needsCorrection}, isPending=${isPending}`
                // );

                return (
                  <Step key={step.label} completed={isCompleted}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                            isCompleted ? "bg-success-500 text-white" :
                              index === activeStep ? "bg-primary-500 text-white" :
                                needsCorrection ? "bg-error-500 text-white" :
                                  isPending ? "bg-warning-500 text-white" :
                                    "bg-gray-300 text-gray-600"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="text-[24px]" />
                          ) : needsCorrection ? (
                            <Close className="text-[24px]" />
                          ) : (
                            step.icon
                          )}
                        </Box>
                      )}
                    >
                      <Box>
                        {step.label}
                        {needsCorrection && (
                          <Chip label="Fix Required" size="sm" color="error" className="ml-1 h-5" />
                        )}
                        {isPending && index < activeStep && (
                          <Chip label="Under Review" size="sm" color="warning" className="ml-1 h-5" />
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* Mobile Stepper */}
          <Box className="block min-[904px]:hidden mb-3">
            <Box className="flex items-center gap-2 mb-2">
              <Box
                className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-500 text-white"
              >
                {steps[activeStep]?.icon}
              </Box>
              <Box className="flex-1">
                <Typography variant="caption" color="text.secondary">
                  Step {activeStep + 1} of {steps.length}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {steps[activeStep].label}
                </Typography>
                {getStepStatus(activeStep) === 'completed' && (
                  <Chip label="Completed" size="sm" color="success" className="mt-0.5" />
                )}
                {getStepStatus(activeStep) === 'needs_correction' && (
                  <Chip label="Needs Correction" size="sm" color="error" className="mt-0.5" />
                )}
                {getStepStatus(activeStep) === 'pending' && (
                  <Chip label="Pending Submission" size="sm" color="warning" className="mt-0.5" />
                )}
              </Box>
            </Box>
            <Box className="flex gap-1">
              {steps.map((_, index) => {
                const stepStatus = getStepStatus(index);
                const isCompleted = stepStatus === 'completed';
                const needsCorrection = stepStatus === 'needs_correction';
                const isPending = stepStatus === 'pending';

                return (
                  <Box
                    key={index}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all duration-300",
                      isCompleted ? "bg-success-500" :
                        index === activeStep ? "bg-primary-500" :
                          needsCorrection ? "bg-error-500" :
                            isPending ? "bg-warning-500" :
                              "bg-gray-300"
                    )}
                  />
                );
              })}
            </Box>
          </Box>

          <Box>{getStepContent(activeStep)}</Box>
        </Paper>
      </Container>
    </>
  );
};

export default BusinessVerification;