"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import {
    useUpdateInspectorProfileMutation,
    useGetMyCompanyDetailsQuery,
    useUpdateInspectorMediaMutation,
    useCreateInspectorCompanyMutation
} from "@/redux/features/inspector/inspector_api";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    Grid,
    Stack,
    Divider,
    IconButton,
    CircularProgress,
    MenuItem
} from "@/components/ui";
import {
    Upload,
    Building2,
    ShieldCheck,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    Globe,
    Tag,
    Check,
    ChevronRight,
    ChevronLeft,
    Twitter,
    Linkedin,
    Facebook,
    Instagram
} from "lucide-react";
import { toast } from "sonner";
import { paths } from "@/config/paths";
import StateSelector from "@/utils/state-selector-modal";
import CountrySelectionModal from "@/utils/country-selection-modal";
import z from "zod";


const MINING_SPECIALTIES = [
    "Lithium",
    "Gold",
    "Iron Ore",
    "Rare Earths",
    "Base Metals",
    "Copper",
    "Cobalt",
    "Laboratory Analysis",
    "Site Inspections",
    "Mineral Logistics",
    "Quality Control",
    "Certification Services",
    "ESG Auditing",
    "Mine Safety Inspection"
];

const profileSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyCategory: z.string().min(1, "Please select a company category"),
    contactEmail: z.string().email("Please enter a valid email address"),
    contactPhone: z.string().min(1, "Contact phone is required"),
    address: z.string().min(1, "Physical address is required"),
    certificationNumber: z.string().min(1, "Certification number is required"),
    yearsOfExperience: z.string().regex(/^\d+$/, "Years of experience must be a number"),
    specialties: z.array(z.string()).min(1, "Please select at least one specialty"),
    coverageCountries: z.array(z.string()).min(1, "Please select at least one coverage country"),
});

const COMPANY_CATEGORIES = [
    { value: "INDIVIDUAL", label: "Individual Inspector" },
    { value: "COMPANY", label: "Inspection Company" },
    { value: "AGENCY", label: "Inspection Agency" },
    { value: "LABORATORY", label: "Testing Laboratory" },
    { value: "CERTIFICATION", label: "Certification Body" }
];

export default function InspectorProfileSetupPage() {
    const router = useRouter();
    const { user: authUser, appData } = useAppSelector((state) => state.auth);
    const { data: companyRes, isLoading: isLoadingProfile } = useGetMyCompanyDetailsQuery();
    const [createProfile, { isLoading: isCreatingProfile }] = useCreateInspectorCompanyMutation();
    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateInspectorProfileMutation();
    const [updateMedia, { isLoading: isUploadingMedia }] = useUpdateInspectorMediaMutation();

    const isUpdating = isCreatingProfile || isUpdatingProfile || isUploadingMedia;

    const [step, setStep] = useState(1);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [customSpecialty, setCustomSpecialty] = useState("");

    const [files, setFiles] = useState<{ logo?: File; banner?: File }>({});
    const [formData, setFormData] = useState({
        companyName: "",
        companyCategory: "",
        description: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        certificationNumber: "",
        yearsOfExperience: "",
        coverageCountries: [] as string[],
        coverageStates: [] as string[],
        specialties: [] as string[],
        logo: "",
        banner: "",
        socialHandles: {
            twitter: "",
            linkedin: "",
            facebook: "",
            instagram: ""
        }
    });

    React.useEffect(() => {
        if (companyRes?.data) {
            const company = companyRes.data;
            setFormData({
                companyName: company.companyName || authUser?.companyName || authUser?.businessName || appData?.companyName || appData?.businessName || "",
                companyCategory: company.companyCategory || "",
                description: company.description || "",
                contactEmail: company.contactEmail || authUser?.email || "",
                contactPhone: company.contactPhone || authUser?.phoneNumber || authUser?.phone || authUser?.contactPhone || "",
                address: company.address || "",
                certificationNumber: company.certificationNumber || "",
                yearsOfExperience: company.yearsOfExperience?.toString() || "",
                coverageCountries: company.coverageCountries || [],
                coverageStates: company.coverageStates || [],
                specialties: company.specialties || [],
                logo: company.logo || "",
                banner: company.banner || "",
                socialHandles: company.socialHandles || {
                    twitter: "",
                    linkedin: "",
                    facebook: "",
                    instagram: ""
                }
            });
        } else if (authUser) {
            // Initial prefill from auth user if company details not found yet
            setFormData(prev => ({
                ...prev,
                companyName: prev.companyName || authUser?.companyName || authUser?.businessName || appData?.companyName || appData?.businessName || "",
                contactEmail: prev.contactEmail || authUser?.email || "",
                contactPhone: prev.contactPhone || authUser?.phoneNumber || authUser?.phone || authUser?.contactPhone || "",
            }));
        }
    }, [companyRes, authUser, appData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            socialHandles: {
                ...prev.socialHandles,
                [name]: value
            }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            setFiles(prev => ({ ...prev, [field]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleSpecialty = (specialty: string) => {
        setFormData((prev) => {
            const updated = prev.specialties.includes(specialty)
                ? prev.specialties.filter((s) => s !== specialty)
                : [...prev.specialties, specialty];
            return { ...prev, specialties: updated };
        });
    };

    const handleAddCustomSpecialty = () => {
        if (!customSpecialty.trim()) return;
        if (formData.specialties.includes(customSpecialty.trim())) {
            toast.error("Specialty already added");
            return;
        }
        setFormData(prev => ({
            ...prev,
            specialties: [...prev.specialties, customSpecialty.trim()]
        }));
        setCustomSpecialty("");
        toast.success(`"${customSpecialty.trim()}" added to your specialties`);
    };

    const validateStep = (s: number) => {
        try {
            if (s === 1) {
                profileSchema.pick({
                    companyName: true,
                    companyCategory: true,
                    contactEmail: true,
                    contactPhone: true,

                }).parse(formData);
            } else if (s === 2) {
                profileSchema.pick({
                    certificationNumber: true,
                    yearsOfExperience: true,
                    specialties: true,
                    address: true
                }).parse(formData);
            } else if (s === 3) {
                profileSchema.pick({
                    coverageCountries: true
                }).parse(formData);
            }
            return true;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toast.error(error.issues[0].message);
            }
            return false;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((s) => s + 1);
        }
    };
    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
            return;
        }

        try {
            let finalCompanyId = companyRes?.data?.id;

            if (!finalCompanyId) {
                // First-time profile creation (registerInspector sets isProfileCreated: true)
                const res = await createProfile({
                    ...formData,
                    yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
                    description: formData.description,
                    socialHandles: formData.socialHandles
                }).unwrap();
                finalCompanyId = res?.data?.id;
            } else {
                // Update existing profile
                await updateProfile({
                    companyId: finalCompanyId,
                    ...formData,
                    yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
                    description: formData.description,
                    socialHandles: formData.socialHandles,
                    isProfileCreated: true
                }).unwrap();
            }

            // Handle Media Upload if files selected
            if (finalCompanyId && (files.logo || files.banner)) {
                const mediaData = new FormData();
                if (files.logo) mediaData.append("logo", files.logo);
                if (files.banner) mediaData.append("banner", files.banner);

                await updateMedia({
                    companyId: finalCompanyId,
                    formData: mediaData
                }).unwrap();
            }

            toast.success("Profile setup complete!");

            // Clear the local storage cache if any, or just wait a tiny bit
            // and force the browser to reload completely bypassing cache
            setTimeout(() => {
                window.location.href = paths.dashboard.overview;
            }, 500);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to complete setup");
        }
    };

    if (isLoadingProfile) {
        return (
            <Box className="flex items-center justify-center h-[60vh]">
                <CircularProgress size={40} className="text-green-600" />
            </Box>
        );
    }

    return (
        <Box className="max-w-3xl mx-auto py-12 px-4" id="inspector-setup-page">
            <header className="mb-10 text-center">
                <Typography variant="h3" className="font-bold text-neutral-900 mb-2">Complete Your Profile</Typography>
                <Typography variant="body1" className="text-neutral-500">
                    Provide your professional details to start receiving inspection requests.
                </Typography>

                {/* Progress Indicators */}
                <div className="flex justify-center mt-8 gap-4">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1 w-12 rounded-full transition-all ${step >= s ? 'bg-green-600' : 'bg-neutral-200'}`}
                        />
                    ))}
                </div>
            </header>

            <Card className="border-neutral-200 shadow-none rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-8">
                    {step === 1 && (
                        <Stack spacing={6}>
                            <Typography variant="h6" className="font-semibold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-green-600" />
                                Branding & Identity
                            </Typography>

                            <div className="space-y-6">
                                <TextField
                                    label="Company Name"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    placeholder="Enter your registered company name"
                                />

                                <TextField
                                    select
                                    label="Company Category"
                                    name="companyCategory"
                                    value={formData.companyCategory}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                >
                                    {COMPANY_CATEGORIES.map((cat) => (
                                        <MenuItem key={cat.value} value={cat.value} as="option">
                                            {cat.label}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    label="Bio / Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={3}
                                    fullWidth
                                    placeholder="Briefly describe your company's expertise in the mining sector..."
                                />

                                <Grid container spacing={4}>
                                    <Grid item xs={12} md={6}>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Typography variant="caption" className="text-neutral-500 font-medium">Company Logo</Typography>
                                                <Typography variant="caption" className="text-neutral-400">Max 2MB</Typography>
                                            </div>
                                            <div
                                                className="h-32 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center relative overflow-hidden hover:border-green-400 transition-colors group bg-neutral-50/50"
                                            >
                                                {formData.logo ? (
                                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Upload className="w-6 h-6 text-neutral-300 group-hover:text-green-500" />
                                                        <span className="text-[10px] text-neutral-400">Upload Logo</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileChange(e, 'logo')}
                                                />
                                            </div>
                                        </div>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Typography variant="caption" className="text-neutral-500 font-medium">Profile Banner</Typography>
                                                <Typography variant="caption" className="text-neutral-400">Max 2MB</Typography>
                                            </div>
                                            <div
                                                className="h-32 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center relative overflow-hidden hover:border-green-400 transition-colors group bg-neutral-50/50"
                                            >
                                                {formData.banner ? (
                                                    <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Upload className="w-6 h-6 text-neutral-300 group-hover:text-green-500" />
                                                        <span className="text-[10px] text-neutral-400">Upload Banner</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileChange(e, 'banner')}
                                                />
                                            </div>
                                        </div>
                                    </Grid>
                                </Grid>

                                <div className="space-y-2">
                                    <Typography variant="caption" className="text-neutral-500 font-medium">Email & Phone</Typography>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextField
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleInputChange}
                                            fullWidth
                                            placeholder="contact@company.com"
                                            required
                                        />
                                        <TextField
                                            name="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={handleInputChange}
                                            fullWidth
                                            placeholder="+234..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Typography variant="caption" className="text-neutral-500 font-medium tracking-wider uppercase">Social Media Presence</Typography>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="X / Twitter"
                                                name="twitter"
                                                value={formData.socialHandles.twitter}
                                                onChange={handleSocialChange}
                                                fullWidth
                                                placeholder="x.com/username"
                                                InputProps={{
                                                    startAdornment: <Twitter className="w-4 h-4 mr-2 text-neutral-400" />
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="LinkedIn Profile"
                                                name="linkedin"
                                                value={formData.socialHandles.linkedin}
                                                onChange={handleSocialChange}
                                                fullWidth
                                                placeholder="linkedin.com/in/username"
                                                InputProps={{
                                                    startAdornment: <Linkedin className="w-4 h-4 mr-2 text-neutral-400" />
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Facebook Page"
                                                name="facebook"
                                                value={formData.socialHandles.facebook}
                                                onChange={handleSocialChange}
                                                fullWidth
                                                placeholder="facebook.com/username"
                                                InputProps={{
                                                    startAdornment: <Facebook className="w-4 h-4 mr-2 text-neutral-400" />
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label="Instagram Profile"
                                                name="instagram"
                                                value={formData.socialHandles.instagram}
                                                onChange={handleSocialChange}
                                                fullWidth
                                                placeholder="instagram.com/username"
                                                InputProps={{
                                                    startAdornment: <Instagram className="w-4 h-4 mr-2 text-neutral-400" />
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </div>
                            </div>

                            <Button
                                onClick={handleNext}
                                variant="contained"
                                className="bg-green-600 text-white hover:bg-green-700 py-4 rounded-xl flex justify-between px-6 transition-all"
                            >
                                Next Step
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </Stack>
                    )}

                    {step === 2 && (
                        <Stack spacing={6}>
                            <Typography variant="h6" className="font-semibold flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                Expertise & Proof
                            </Typography>

                            <div className="space-y-6">
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={8}>
                                        <TextField
                                            label="Certification Number"
                                            name="certificationNumber"
                                            value={formData.certificationNumber}
                                            onChange={handleInputChange}
                                            fullWidth
                                            required
                                            placeholder="ISO-9001, ASTM, etc."
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label="Exp. (Years)"
                                            name="yearsOfExperience"
                                            type="number"
                                            value={formData.yearsOfExperience}
                                            onChange={handleInputChange}
                                            fullWidth
                                            placeholder="e.g. 10"
                                        />
                                    </Grid>
                                </Grid>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Typography variant="caption" className="text-neutral-500 font-medium uppercase tracking-wider">Mining Specialties</Typography>
                                        <Box className="flex gap-2">
                                            <TextField
                                                placeholder="Add custom specialty..."
                                                value={customSpecialty}
                                                onChange={(e) => setCustomSpecialty(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSpecialty()}
                                                sx={{ '& .MuiInputBase-root': { height: 32, fontSize: '0.75rem' } }}
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleAddCustomSpecialty}
                                                className="bg-green-600 text-white hover:bg-green-700 min-w-0 px-2 h-8"
                                            >
                                                Add
                                            </Button>
                                        </Box>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set([...MINING_SPECIALTIES, ...formData.specialties])).map((spec) => (
                                            <button
                                                key={spec}
                                                onClick={() => toggleSpecialty(spec)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${formData.specialties.includes(spec)
                                                    ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                                    }`}
                                            >
                                                {spec}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <TextField
                                    label="Physical Office Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                            </div>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleBack}
                                    className="p-4 rounded-xl border border-neutral-100 text-white! hover:bg-neutral-50 hover:text-black!"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    variant="contained"
                                    className="bg-green-600 text-white hover:bg-green-700 py-4 rounded-xl flex-1 flex justify-between px-6 transition-all"
                                >
                                    Next Step
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </Stack>
                        </Stack>
                    )}

                    {step === 3 && (
                        <Stack spacing={6}>
                            <Typography variant="h6" className="font-semibold flex items-center gap-2">
                                <Globe className="w-5 h-5 text-green-600" />
                                Coverage Regions
                            </Typography>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Typography variant="body2" className="text-neutral-600">Select the countries and states where you can perform physical inspections.</Typography>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setShowCountryModal(true)}
                                        className="py-6 border-2 border-dashed border-neutral-200 text-neutral-500 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all rounded-xl shadow-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Globe className="w-5 h-5" />
                                            {formData.coverageCountries.length > 0
                                                ? `${formData.coverageCountries.length} Countries Selected`
                                                : "Choose Coverage Countries"}
                                        </span>
                                    </Button>

                                    {formData.coverageCountries.length > 0 && (
                                        <div className="space-y-4 pt-4">
                                            {formData.coverageCountries.map((country) => (
                                                <div key={country} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50/50">
                                                    <Typography variant="subtitle2" className="font-bold mb-3">{country}</Typography>
                                                    <StateSelector
                                                        country={country}
                                                        selectedStates={formData.coverageStates}
                                                        onStateToggle={(state: string) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                coverageStates: prev.coverageStates.includes(state)
                                                                    ? prev.coverageStates.filter(s => s !== state)
                                                                    : [...prev.coverageStates, state]
                                                            }));
                                                        }}
                                                        onToggleAll={(statesInCountry) => {
                                                            setFormData(prev => {
                                                                const allSelected = statesInCountry.every(s => prev.coverageStates.includes(s));
                                                                if (allSelected) {
                                                                    // Deselect all for THIS country
                                                                    return {
                                                                        ...prev,
                                                                        coverageStates: prev.coverageStates.filter(s => !statesInCountry.includes(s))
                                                                    };
                                                                } else {
                                                                    // Select all for THIS country (union)
                                                                    return {
                                                                        ...prev,
                                                                        coverageStates: Array.from(new Set([...prev.coverageStates, ...statesInCountry]))
                                                                    };
                                                                }
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleBack}
                                    className="p-4 rounded-xl border border-neutral-100 text-white! hover:bg-neutral-50 hover:text-black!"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isUpdating}
                                    variant="contained"
                                    className="bg-green-600 text-white hover:bg-green-700 py-4 rounded-xl flex-1 flex justify-between px-6"
                                >
                                    {isUpdating ? "Finalizing..." : "Complete Setup"}
                                    <Check className="w-5 h-5" />
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <CountrySelectionModal
                isOpen={showCountryModal}
                onClose={() => setShowCountryModal(false)}
                selectedCountries={formData.coverageCountries}
                onSelectCountries={(countries: string[]) =>
                    setFormData((prev) => ({ ...prev, coverageCountries: countries }))
                }
            />
        </Box>
    );
}
