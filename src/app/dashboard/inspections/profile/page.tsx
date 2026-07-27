"use client";

import React, { useState, useEffect } from "react";
import {
    useGetMyCompanyDetailsQuery,
    useUpdateInspectorProfileMutation,
    useUpdateInspectorMediaMutation
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
    Skeleton
} from "@/components/ui";
import {
    Upload,
    Settings,
    ShieldCheck,
    DollarSign,
    Activity,
    Globe,
    ExternalLink,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    Building2,
    X,
    Check,
    Edit2,
    ChevronDown,
    Twitter,
    Linkedin,
    Facebook,
    Instagram,
    Eye
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { paths } from "@/config/paths";
import { getErrorMessage } from "@/utils/helper";
import InspectorProfilePreview from "@/components/dashboard/inspections/profile-preview";
import EditCoverageSpecialtiesModal from "@/components/dashboard/inspections/EditCoverageSpecialtiesModal";

export default function InspectorProfilePage() {
    const { data: companyRes, isLoading, refetch } = useGetMyCompanyDetailsQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateInspectorProfileMutation();
    const [updateMedia, { isLoading: isUploadingMedia }] = useUpdateInspectorMediaMutation();

    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState<'manage' | 'preview'>('manage');
    const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
    const [files, setFiles] = useState<{ logo?: File; banner?: File }>({});
    const [formData, setFormData] = useState<any>({});

    const company = companyRes?.data;

    useEffect(() => {
        if (company) {
            setFormData({
                companyName: company.companyName || "",
                description: company.description || "",
                contactEmail: company.contactEmail || "",
                contactPhone: company.contactPhone || "",
                address: company.address || "",
                logo: company.logo || "",
                banner: company.banner || "",
                socialHandles: company.socialHandles || {
                    twitter: "",
                    linkedin: "",
                    facebook: "",
                    instagram: ""
                }
            });
        }
    }, [company]);

    if (isLoading) {
        return (
            <Box className="space-y-6 max-w-6xl pb-20">
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 md:col-span-2 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </Box>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (platform: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            socialHandles: {
                ...(prev.socialHandles || {}),
                [platform]: value
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
                setFormData((prev: any) => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            // 1. Update text profile content
            const { logo, banner, ...profileData } = formData;

            await updateProfile({
                companyId: company.id,
                ...profileData,
                socialHandles: formData.socialHandles
            }).unwrap();

            // 2. Handle Media Upload if files selected
            if (files.logo || files.banner) {
                const mediaData = new FormData();
                if (files.logo) mediaData.append("logo", files.logo);
                if (files.banner) mediaData.append("banner", files.banner);

                await updateMedia({
                    companyId: company.id,
                    formData: mediaData
                }).unwrap();
            }

            toast.success("Profile updated successfully");
            setIsEditMode(false);
            setFiles({});
            refetch();
        } catch (error: any) {
            toast.error(getErrorMessage(error, "Failed to update profile"));
        }
    };

    return (
        <div className="space-y-8 max-w-7xl pb-20 mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-end px-4">
                <div>
                    <Typography variant="h4" className="font-bold tracking-tight text-neutral-900">
                        {viewMode === 'preview' ? "Public Profile Preview" : "Professional Profile"}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-500">
                        {viewMode === 'preview'
                            ? "This is how clients and administrators view your inspector profile."
                            : "Manage your mining inspection credentials and operational parameters."}
                    </Typography>
                </div>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant={viewMode === 'preview' ? "contained" : "outlined"}
                        onClick={() => setViewMode(prev => prev === 'preview' ? 'manage' : 'preview')}
                        className={viewMode === 'preview'
                            ? "bg-neutral-900 text-white rounded-xl px-6 font-semibold shadow-none"
                            : "border-neutral-200 hover:border-neutral-800 text-neutral-800 rounded-xl px-6 font-semibold transition-all"}
                        startIcon={<Eye className="w-4 h-4" />}
                    >
                        {viewMode === 'preview' ? "Edit Profile" : "Preview Profile"}
                    </Button>
                    {viewMode === 'manage' && (!isEditMode ? (
                        <Button
                            variant="outlined"
                            onClick={() => setIsEditMode(true)}
                            className="border-neutral-200 hover:border-neutral-800 text-neutral-800 rounded-xl px-6 font-semibold transition-all"
                            startIcon={<Edit2 className="w-4 h-4" />}
                        >
                            Edit Branding
                        </Button>
                    ) : (
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="text"
                                onClick={() => setIsEditMode(false)}
                                className="text-neutral-500 font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={isUpdating || isUploadingMedia}
                                className="bg-neutral-900 hover:bg-black text-white rounded-xl px-8 font-semibold shadow-none"
                                startIcon={isUpdating || isUploadingMedia ? null : <Check className="w-4 h-4" />}
                            >
                                {isUpdating || isUploadingMedia ? "Saving..." : "Save Changes"}
                            </Button>
                        </Stack>
                    ))}
                </Stack>
            </div>

            {viewMode === 'preview' ? (
                <InspectorProfilePreview profile={company} isLoading={isLoading} onExitPreview={() => setViewMode('manage')} />
            ) : (
                <>

            {/* Profile Hero (Mirroring Admin Header) */}
            <Card className="border-neutral-200 overflow-hidden rounded-2xl bg-white shadow-none mx-4">
                <div className="relative h-64 bg-neutral-100 group">
                    {formData.banner ? (
                        <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 flex items-center justify-center p-6">
                            <img src="/assets/MINMEG 4.png" alt="Minmeg Default Banner" className="h-16 md:h-20 object-contain opacity-85" />
                        </div>
                    )}

                    {isEditMode && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 transition-all">
                            <label className="cursor-pointer bg-white text-neutral-900 px-6 py-3 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-3 hover:bg-neutral-100 hover:scale-105 transition-all">
                                <Upload className="w-5 h-5 text-green-600" />
                                {files.banner || formData.banner ? "Change Profile Banner" : "Upload Profile Banner"}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                            </label>
                            <span className="text-xs text-white/90 font-medium">JPEG or PNG, Max 2MB</span>
                        </div>
                    )}

                    <div className="absolute -bottom-16 left-10 group/logo">
                        <div className="w-32 h-32 rounded-2xl border border-white bg-white shadow-lg overflow-hidden flex items-center justify-center relative p-2">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white flex items-center justify-center p-2">
                                    <img src="/assets/MINMEG 4.png" alt="Minmeg Logo" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {isEditMode && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-all p-1 text-center">
                                    <label className="cursor-pointer flex flex-col items-center justify-center gap-1 w-full h-full">
                                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                            <Upload className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-[10px] text-white font-bold tracking-tight leading-tight">Change Logo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-10 px-10">
                    {isEditMode && (
                        <div className="mb-8 max-w-lg">
                            <TextField
                                inputSize="sm"
                                label="Company Name"
                                name="companyName"
                                value={formData.companyName || ''}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* LEFT SIDEBAR: Professional Identity & Contact */}
                        <div className="lg:col-span-1 space-y-8 border-r border-neutral-100 pr-8">
                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Identity</Typography>
                                {isEditMode ? (
                                    <Stack spacing={2.5}>
                                        <InfoItem
                                            icon={<Building2 className="w-4 h-4 text-blue-600" />}
                                            label="Category"
                                            value={company?.companyCategory || "Not Set"}
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Certification Number"
                                            name="certificationNumber"
                                            value={formData.certificationNumber || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Years of Experience"
                                            name="yearsOfExperience"
                                            type="number"
                                            value={formData.yearsOfExperience || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                        />
                                    </Stack>
                                ) : (
                                    <Stack spacing={3}>
                                        <InfoItem
                                            icon={<Building2 className="w-4 h-4 text-blue-600" />}
                                            label="Category"
                                            value={company?.companyCategory || "Not Set"}
                                        />
                                        <InfoItem
                                            icon={<ShieldCheck className="w-4 h-4 text-green-600" />}
                                            label="Certification"
                                            value={formData.certificationNumber || company?.certificationNumber || "Pending"}
                                        />
                                        <InfoItem
                                            icon={<Briefcase className="w-4 h-4 text-purple-600" />}
                                            label="Experience"
                                            value={`${formData.yearsOfExperience || company?.yearsOfExperience || 0} Years`}
                                        />
                                    </Stack>
                                )}
                            </div>

                            <Divider className="border-neutral-50" />

                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Contact Details</Typography>
                                {isEditMode ? (
                                    <Stack spacing={2.5}>
                                        <TextField
                                            inputSize="sm"
                                            label="Direct Email"
                                            name="contactEmail"
                                            value={formData.contactEmail || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Office Line"
                                            name="contactPhone"
                                            value={formData.contactPhone || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Headquarters Address"
                                            name="address"
                                            value={formData.address || ''}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            fullWidth
                                        />
                                    </Stack>
                                ) : (
                                    <Stack spacing={3}>
                                        <InfoItem
                                            icon={<Mail className="w-4 h-4 text-neutral-400" />}
                                            label="Direct Email"
                                            value={formData.contactEmail}
                                        />
                                        <InfoItem
                                            icon={<Phone className="w-4 h-4 text-neutral-400" />}
                                            label="Office Line"
                                            value={formData.contactPhone}
                                        />
                                        <InfoItem
                                            icon={<MapPin className="w-4 h-4 text-neutral-400" />}
                                            label="Headquarters"
                                            value={formData.address}
                                        />
                                    </Stack>
                                )}
                            </div>

                            <Divider className="border-neutral-50" />

                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Social Media</Typography>
                                {isEditMode ? (
                                    <Stack spacing={2}>
                                        <TextField
                                            inputSize="sm"
                                            label="Twitter / X"
                                            placeholder="twitter.com/yourhandle"
                                            value={formData.socialHandles?.twitter || ''}
                                            onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="LinkedIn"
                                            placeholder="linkedin.com/company/yourpage"
                                            value={formData.socialHandles?.linkedin || ''}
                                            onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Facebook"
                                            placeholder="facebook.com/yourpage"
                                            value={formData.socialHandles?.facebook || ''}
                                            onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            inputSize="sm"
                                            label="Instagram"
                                            placeholder="instagram.com/yourhandle"
                                            value={formData.socialHandles?.instagram || ''}
                                            onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                            fullWidth
                                        />
                                    </Stack>
                                ) : (
                                    <div className="flex gap-3">
                                        {formData.socialHandles?.twitter && (
                                            <Button size="sm" className="bg-neutral-50 text-neutral-600 hover:bg-neutral-100" onClick={() => window.open(`https://${formData.socialHandles.twitter.replace('https://', '')}`, '_blank')}>
                                                <Twitter className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {formData.socialHandles?.linkedin && (
                                            <Button size="sm" className="bg-neutral-50 text-blue-600 hover:bg-blue-50" onClick={() => window.open(`https://${formData.socialHandles.linkedin.replace('https://', '')}`, '_blank')}>
                                                <Linkedin className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {formData.socialHandles?.facebook && (
                                            <Button size="sm" className="bg-neutral-50 text-blue-700 hover:bg-blue-50" onClick={() => window.open(`https://${formData.socialHandles.facebook.replace('https://', '')}`, '_blank')}>
                                                <Facebook className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {formData.socialHandles?.instagram && (
                                            <Button size="sm" className="bg-neutral-50 text-pink-600 hover:bg-pink-50" onClick={() => window.open(`https://${formData.socialHandles.instagram.replace('https://', '')}`, '_blank')}>
                                                <Instagram className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {!formData.socialHandles?.twitter && !formData.socialHandles?.linkedin && !formData.socialHandles?.facebook && !formData.socialHandles?.instagram && (
                                            <Typography variant="caption" className="text-neutral-400 italic">No social handles linked.</Typography>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-4">
                                <Typography variant="overline" className="text-white/50 font-bold tracking-widest uppercase block">Performance</Typography>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Typography variant="h4" className="font-bold text-white!">{company?.statistics?.successRate || 0}%</Typography>
                                        <Typography variant="caption" className="text-white/70 block">Success</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="h4" className="font-bold text-white!">{company?.statistics?.averageGrade || 0.0}</Typography>
                                        <Typography variant="caption" className="text-white/70 block">Rating</Typography>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MAIN CONTENT GRID: Services, Pricing, Capacity */}
                        <div className="lg:col-span-3 space-y-12">
                            {/* Bio Section */}
                            <section>
                                <Typography variant="h6" className="font-bold mb-4">About the Company</Typography>
                                {isEditMode ? (
                                    <TextField
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        multiline
                                        rows={4}
                                        fullWidth
                                        className="bg-neutral-50/50 rounded-xl"
                                        placeholder="Describe your capabilities..."
                                    />
                                ) : (
                                    <Typography variant="body1" className="text-neutral-600 leading-relaxed">
                                        {formData.description || "Enter a brief description of your company to build trust with clients."}
                                    </Typography>
                                )}
                            </section>

                            {/* Services & Testing Capabilities Section */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Typography variant="h6" className="font-bold flex items-center gap-2 text-neutral-900">
                                            <Activity className="w-5 h-5 text-blue-600" />
                                            Services & Testing Capabilities
                                        </Typography>
                                        <Typography variant="body2" className="text-neutral-500 mt-1">
                                            Testing procedures (such as chemical assay, sampling, quality testing, and weight verification) grouped by mineral category.
                                        </Typography>
                                    </div>
                                    <Link href={paths.dashboard.inspections.services.matrix}>
                                        <Button size="sm" variant="text" className="text-blue-600 font-bold hover:bg-blue-50 whitespace-nowrap">Edit Services →</Button>
                                    </Link>
                                </div>

                                <div className="space-y-3">
                                    {company?.capabilities?.length > 0 ? (
                                        Object.entries(
                                            company.capabilities.reduce((acc: Record<string, any[]>, cap: any) => {
                                                const tag = cap.mineral_tag ? cap.mineral_tag.toLowerCase() : 'general';
                                                if (!acc[tag]) acc[tag] = [];
                                                acc[tag].push(cap);
                                                return acc;
                                            }, {})
                                        ).map(([mineralTag, caps]: [string, any]) => (
                                            <MineralCapabilityAccordion key={mineralTag} mineral={mineralTag} capabilities={caps} />
                                        ))
                                    ) : (
                                        <div className="p-8 border-2 border-dashed border-neutral-100 rounded-2xl text-center text-neutral-400">
                                            No inspection services selected yet. Click "Edit Services" to select the minerals and tests you provide.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Inspection Fees & Rates Section */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Typography variant="h6" className="font-bold flex items-center gap-2 text-neutral-900">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                            Inspection Fees & Rates
                                        </Typography>
                                        <Typography variant="body2" className="text-neutral-500 mt-1">
                                            Inspection rates (e.g. Per Metric Ton, Per Site Visit, or Flat Fee) grouped by mineral category.
                                        </Typography>
                                    </div>
                                    <Link href={paths.dashboard.inspections.services.pricing}>
                                        <Button size="sm" variant="text" className="text-green-600 font-bold hover:bg-green-50 whitespace-nowrap">Edit Pricing →</Button>
                                    </Link>
                                </div>
                                <div className="space-y-3">
                                    {company?.pricingEngine?.length > 0 ? (
                                        Object.entries(
                                            company.pricingEngine.reduce((acc: Record<string, any[]>, rule: any) => {
                                                const tag = rule.mineral_tag ? rule.mineral_tag.toLowerCase() : 'general';
                                                if (!acc[tag]) acc[tag] = [];
                                                acc[tag].push(rule);
                                                return acc;
                                            }, {})
                                        ).map(([mineralTag, rules]: [string, any]) => (
                                            <MineralPricingAccordion
                                                key={mineralTag}
                                                mineral={mineralTag}
                                                pricingRules={rules}
                                                addons={company?.pricingAddons?.filter((a: any) => a.mineral_tag?.toLowerCase() === mineralTag.toLowerCase()) || []}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-8 border-2 border-dashed border-neutral-100 rounded-2xl text-center text-neutral-400">
                                            No pricing rules configured yet. Click "Edit Pricing" to set your base rates.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Geographic Coverage & Specialties Section */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Typography variant="h6" className="font-bold flex items-center gap-2 text-neutral-900">
                                            <Globe className="w-5 h-5 text-purple-600" />
                                            Geographic Coverage & Specialties
                                        </Typography>
                                        <Typography variant="body2" className="text-neutral-500 mt-1">
                                            Regions where field inspectors operate and your company&apos;s mineral domain specialties.
                                        </Typography>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="text"
                                        onClick={() => setIsCoverageModalOpen(true)}
                                        className="text-purple-600 font-bold hover:bg-purple-50 whitespace-nowrap cursor-pointer"
                                    >
                                        Edit Coverage & Specialties →
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Coverage Countries & States */}
                                    <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3">
                                        <Typography variant="subtitle2" className="font-bold text-neutral-800 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-purple-600" />
                                            Coverage Regions
                                        </Typography>
                                        <div className="space-y-2">
                                            <div>
                                                <span className="text-xs text-neutral-400 font-medium block mb-1">Countries:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {company?.coverageCountries?.length > 0 ? (
                                                        company.coverageCountries.map((country: string) => (
                                                            <span key={country} className="bg-purple-50 text-purple-700 border border-purple-100 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                                                {country}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">No coverage countries set</span>
                                                    )}
                                                </div>
                                            </div>
                                            {company?.coverageStates?.length > 0 && (
                                                <div className="pt-2">
                                                    <span className="text-xs text-neutral-400 font-medium block mb-1">States / Provinces:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {company.coverageStates.map((state: string) => (
                                                            <span key={state} className="bg-neutral-100 text-neutral-700 text-xs px-2.5 py-0.5 rounded-md font-medium">
                                                                {state}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Specialties */}
                                    <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3">
                                        <Typography variant="subtitle2" className="font-bold text-neutral-800 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-blue-600" />
                                            Mining Specialties
                                        </Typography>
                                        <div className="flex flex-wrap gap-1.5">
                                            {company?.specialties?.length > 0 ? (
                                                company.specialties.map((spec: string) => (
                                                    <span key={spec} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                                        {spec}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic">No specialties selected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Work Capacity & Availability Section */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Typography variant="h6" className="font-bold flex items-center gap-2 text-neutral-900">
                                            <Settings className="w-5 h-5 text-orange-600" />
                                            Work Capacity & Availability
                                        </Typography>
                                        <Typography variant="body2" className="text-neutral-500 mt-1">
                                            Specify how many inspection jobs your team can handle daily or weekly, and how many days of advance notice you require before booking.
                                        </Typography>
                                    </div>
                                    <Link href={paths.dashboard.inspections.services.limits}>
                                        <Button size="sm" variant="text" className="text-orange-600 font-bold hover:bg-orange-50 whitespace-nowrap">Edit Capacity →</Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <LimitCard
                                        label="Daily Capacity"
                                        value={company?.operationalLimits?.max_inspections_daily || 0}
                                        unit="Jobs"
                                    />
                                    <LimitCard
                                        label="Weekly Capacity"
                                        value={company?.operationalLimits?.max_inspections_weekly || 0}
                                        unit="Jobs"
                                    />
                                    <LimitCard
                                        label="Min Lead Time"
                                        value={company?.operationalLimits?.lead_time_days || 0}
                                        unit="Days"
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </Card>
            </>
            )}
            <EditCoverageSpecialtiesModal
                isOpen={isCoverageModalOpen}
                onClose={() => setIsCoverageModalOpen(false)}
                company={company}
                onSuccess={refetch}
            />
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1">{icon}</div>
            <div>
                <Typography variant="caption" className="text-neutral-400 font-bold uppercase tracking-wider block leading-none mb-1">{label}</Typography>
                <Typography variant="body2" className="text-neutral-800 font-semibold leading-relaxed">{value || "Not Specified"}</Typography>
            </div>
        </div>
    );
}

function LimitCard({ label, value, unit }: { label: string, value: any, unit: string }) {
    return (
        <div className="p-6 rounded-2xl border border-neutral-100 bg-white shadow-sm space-y-2">
            <Typography variant="caption" className="text-neutral-400 font-bold uppercase tracking-widest">{label}</Typography>
            <div className="flex items-baseline gap-2">
                <Typography variant="h4" className="font-bold text-neutral-900">{value}</Typography>
                <Typography variant="caption" className="text-neutral-500 font-medium">{unit}</Typography>
            </div>
        </div>
    );
}

function HubLink({ icon, title, subtitle, href }: any) {
    return (
        <Link href={href}>
            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center group-hover:border-green-200 group-hover:bg-green-50 transition-all">
                        {icon}
                    </div>
                    <div>
                        <Typography variant="body2" className="font-semibold text-neutral-800">{title}</Typography>
                        <Typography variant="caption" className="text-neutral-400 block">{subtitle}</Typography>
                    </div>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-green-500 transition-all" />
            </div>
        </Link>
    );
}

function MineralCapabilityAccordion({ mineral, capabilities }: { mineral: string; capabilities: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between bg-neutral-50/60 hover:bg-neutral-100/80 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {mineral.substring(0, 2)}
                    </div>
                    <div>
                        <Typography variant="body1" className="font-bold text-neutral-900 capitalize">
                            {mineral.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="caption" className="text-neutral-500 font-medium">
                            {capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'} configured
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                        {capabilities.length} Services
                    </span>
                    <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-white border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {capabilities.map((cap: any) => (
                        <div key={cap.id} className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/40 flex items-start gap-3">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <Typography variant="body2" className="font-semibold text-neutral-800 truncate">
                                    {cap.definition?.display_name || cap.mineral_tag}
                                </Typography>
                                <Typography variant="caption" className="text-neutral-400 block">
                                    {cap.definition?.category || "Specialized Services"}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MineralPricingAccordion({ mineral, pricingRules, addons = [] }: { mineral: string; pricingRules: any[]; addons?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between bg-neutral-50/60 hover:bg-neutral-100/80 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {mineral.substring(0, 2)}
                    </div>
                    <div>
                        <Typography variant="body1" className="font-bold text-neutral-900 capitalize">
                            {mineral.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="caption" className="text-neutral-500 font-medium">
                            {pricingRules.length} {pricingRules.length === 1 ? 'rate' : 'rates'}{addons.length > 0 ? `, ${addons.length} ${addons.length === 1 ? 'addon' : 'addons'}` : ''}
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-100">
                        {pricingRules.length} Rates
                    </span>
                    {addons.length > 0 && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                            +{addons.length} Addons
                        </span>
                    )}
                    <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-white border-t border-neutral-100 space-y-3">
                    {pricingRules.map((rule: any) => {
                        const baseFeeVal = parseFloat(rule.base_fee) || 0;
                        const commRate = parseFloat(rule.payout_p_commission) || 0;
                        const calcType = rule.calculation_type || 'percentage';
                        const fixedFee = rule.fixed_fee_amount || 0;
                        const platformFee = rule.platform_fee_amount !== undefined ? rule.platform_fee_amount : baseFeeVal * (commRate / 100);
                        const netPayout = rule.net_payout_amount !== undefined ? rule.net_payout_amount : baseFeeVal - platformFee;

                        return (
                            <div key={rule.id} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Typography variant="body2" className="font-bold text-neutral-800 uppercase text-xs tracking-wider">
                                            {rule.pricing_method ? rule.pricing_method.replace(/_/g, ' ') : 'Standard Rate'}
                                        </Typography>
                                        {rule.input_logic_json?.custom_method_name && (
                                            <span className="text-xs text-neutral-400 font-medium">({rule.input_logic_json.custom_method_name})</span>
                                        )}
                                    </div>
                                    <Typography variant="body1" className="font-extrabold text-neutral-900">
                                        ₦{baseFeeVal.toLocaleString()}
                                    </Typography>
                                </div>

                                {/* Financial Payout Breakdown */}
                                <div className="flex items-center gap-2 flex-wrap text-xs pt-1.5 border-t border-neutral-100/80">
                                    <span className="bg-white text-neutral-600 px-2.5 py-0.5 rounded border border-neutral-200 font-medium">
                                        Base: ₦{baseFeeVal.toLocaleString()}
                                    </span>
                                    {calcType === 'fixed' ? (
                                        <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                                            Platform Fee: Fixed ₦{fixedFee.toLocaleString()}
                                        </span>
                                    ) : calcType === 'percentage_plus_fixed' ? (
                                        <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                                            Platform Fee: {commRate}% + ₦{fixedFee.toLocaleString()} (₦{platformFee.toLocaleString()})
                                        </span>
                                    ) : (
                                        <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                                            Platform Fee: {commRate}% (₦{platformFee.toLocaleString()})
                                        </span>
                                    )}
                                    <span className="bg-green-50 text-green-800 px-2.5 py-0.5 rounded border border-green-200 font-bold">
                                        Net Earnings Payout: ₦{netPayout.toLocaleString()} ({baseFeeVal > 0 ? ((netPayout / baseFeeVal) * 100).toFixed(0) : 100}%)
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Configured Fee Addons for this mineral */}
                    {addons.length > 0 && (
                        <div className="pt-2 border-t border-neutral-100 space-y-2">
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Fee Addons & Surcharges ({addons.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {addons.map((addon: any) => {
                                    const priceVal = parseFloat(addon.addon_price) || 0;
                                    const defName = addon.definition?.fee_name || 'Additional Service';
                                    return (
                                        <div key={addon.id} className="p-2.5 rounded-lg border border-neutral-100 bg-white flex items-center justify-between text-xs">
                                            <span className="font-semibold text-neutral-700">{defName}</span>
                                            <span className="font-bold text-green-700">+₦{priceVal.toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
