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
    ExternalLink,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    Building2,
    X,
    Check,
    Edit2,
    Twitter,
    Linkedin,
    Facebook,
    Instagram
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { paths } from "@/config/paths";

export default function InspectorProfilePage() {
    const { data: companyRes, isLoading, refetch } = useGetMyCompanyDetailsQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateInspectorProfileMutation();
    const [updateMedia, { isLoading: isUploadingMedia }] = useUpdateInspectorMediaMutation();

    const [isEditMode, setIsEditMode] = useState(false);
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
            toast.error(error?.data?.message || "Failed to update profile");
        }
    };

    return (
        <div className="space-y-8 max-w-7xl pb-20 mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-end px-4">
                <div>
                    <Typography variant="h4" className="font-bold tracking-tight text-neutral-900">Professional Profile</Typography>
                    <Typography variant="body2" className="text-neutral-500">
                        Manage your mining inspection credentials and operational parameters.
                    </Typography>
                </div>
                {!isEditMode ? (
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
                )}
            </div>

            {/* Profile Hero (Mirroring Admin Header) */}
            <Card className="border-neutral-200 overflow-hidden rounded-2xl bg-white shadow-none mx-4">
                <div className="relative h-64 bg-neutral-100 group">
                    {formData.banner ? (
                        <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <Activity className="w-16 h-16" />
                        </div>
                    )}

                    {isEditMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer bg-white px-6 py-3 rounded-xl text-sm font-bold border-none shadow-xl flex items-center gap-3 hover:scale-105 transition-transform">
                                <Upload className="w-5 h-5 text-green-600" />
                                Change Profile Banner
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                            </label>
                        </div>
                    )}

                    <div className="absolute -bottom-16 left-10 group/logo">
                        <div className="w-32 h-32 rounded-2xl border border-white bg-white shadow-lg overflow-hidden flex items-center justify-center relative">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ShieldCheck className="w-12 h-12 text-neutral-200" />
                            )}

                            {isEditMode && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                    <label className="cursor-pointer">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <Edit2 className="w-5 h-5 text-neutral-900" />
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-10 px-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* LEFT SIDEBAR: Professional Identity & Contact */}
                        <div className="lg:col-span-1 space-y-8 border-r border-neutral-100 pr-8">
                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Identity</Typography>
                                <Stack spacing={3}>
                                    <InfoItem
                                        icon={<Building2 className="w-4 h-4 text-blue-600" />}
                                        label="Category"
                                        value={company?.companyCategory || "Not Set"}
                                    />
                                    <InfoItem
                                        icon={<ShieldCheck className="w-4 h-4 text-green-600" />}
                                        label="Certification"
                                        value={company?.certificationNumber || "Pending"}
                                    />
                                    <InfoItem
                                        icon={<Briefcase className="w-4 h-4 text-purple-600" />}
                                        label="Experience"
                                        value={`${company?.yearsOfExperience || 0} Years`}
                                    />
                                </Stack>
                            </div>

                            <Divider className="border-neutral-50" />

                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Contact Details</Typography>
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
                            </div>

                            <Divider className="border-neutral-50" />

                            <div>
                                <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase mb-4 block">Social Media</Typography>
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
                            </div>

                            <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-4">
                                <Typography variant="overline" className="text-white/50 font-bold tracking-widest uppercase block">Performance</Typography>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Typography variant="h4" className="font-bold">{company?.statistics?.successRate || 0}%</Typography>
                                        <Typography variant="caption" className="text-white/60">Success</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="h4" className="font-bold">{company?.statistics?.averageGrade || 0.0}</Typography>
                                        <Typography variant="caption" className="text-white/60">Rating</Typography>
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

                            {/* Service Matrix Section */}
                            <section className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <Typography variant="h6" className="font-bold flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        Service Matrix
                                    </Typography>
                                    <Link href={paths.dashboard.inspections.services.matrix}>
                                        <Button size="sm" variant="text" className="text-blue-600 font-bold hover:bg-blue-50">Manage Grid →</Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {company?.capabilities?.length > 0 ? (
                                        company.capabilities.map((cap: any) => (
                                            <div key={cap.id} className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold uppercase">
                                                        {cap.mineral_tag.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <Typography variant="body2" className="font-bold text-neutral-800 capitalize">{cap.mineral_tag}</Typography>
                                                        <Typography variant="caption" className="text-neutral-500">{cap.definition?.display_name || "Specialized Inspection"}</Typography>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold uppercase">Active</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 p-8 border-2 border-dashed border-neutral-100 rounded-2xl text-center text-neutral-400">
                                            No active services defined in the matrix.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Pricing & Fees Section */}
                            <section className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <Typography variant="h6" className="font-bold flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        Pricing Engine
                                    </Typography>
                                    <Link href={paths.dashboard.inspections.services.pricing}>
                                        <Button size="sm" variant="text" className="text-green-600 font-bold hover:bg-green-50">Manage Fees →</Button>
                                    </Link>
                                </div>
                                <div className="bg-neutral-50/50 rounded-2xl border border-neutral-100 overflow-hidden">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-100/50">
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Mineral</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Method</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Base Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {company?.pricingEngine?.length > 0 ? (
                                                company.pricingEngine.map((pricing: any) => (
                                                    <tr key={pricing.id} className="hover:bg-white transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-neutral-800 capitalize">{pricing.mineral_tag}</td>
                                                        <td className="px-6 py-4 text-xs font-medium text-neutral-500 uppercase">{pricing.pricing_method.replace(/_/g, ' ')}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-green-600">₦{parseFloat(pricing.base_fee).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-neutral-400 text-sm">No pricing rules configured.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Operational Limits Section */}
                            <section className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <Typography variant="h6" className="font-bold flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-orange-600" />
                                        Operational Limits
                                    </Typography>
                                    <Link href={paths.dashboard.inspections.services.limits}>
                                        <Button size="sm" variant="text" className="text-orange-600 font-bold hover:bg-orange-50">Manage Capacity →</Button>
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
