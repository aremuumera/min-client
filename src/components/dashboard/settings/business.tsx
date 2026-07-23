import * as React from 'react';
import {
    useGetVerificationDetailsQuery,
    useGetVerificationStatusQuery,
    useSubmitStep1Mutation,
    useSubmitStep2Mutation,
    useSubmitStep3Mutation,
    useSubmitStep4Mutation,
    useAddDirectorMutation
} from '@/redux/features/business_verification_feature/bv_v1_api';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import { LucideIcon } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const metadata = {
    title: `Business | Settings | Dashboard | ${config.site.name}`
};

// Icon Components (using lucide-react as replacement for MUI icons)
import {
    Building2,
    CheckCircle,
    FileText,
    Edit,
    ExternalLink,
    Users,
    ShieldCheck,
    Wallet,
    AlertCircle,
    Clock,
    XCircle,
    Plus,
    Loader2,
    UploadCloud
} from 'lucide-react';
import { config } from '@/lib/config';
import { cn } from '@/utils/helper';
import { paths } from '@/config/paths';
import { useRouter } from 'next/navigation';

// Type Definitions
type VerificationStatus = 'completed' | 'pending' | 'needs_correction' | 'not_submitted';
type OverallStatus = 'approved' | 'pending' | 'rejected';

interface VerificationSectionProps {
    title: string;
    stepNumber?: number;
    status?: VerificationStatus;
    icon: LucideIcon;
    children: React.ReactNode;
    onEdit?: () => void;
}

interface InfoRowProps {
    label: string;
    value?: string | number;
    fullWidth?: boolean;
}

interface DocumentViewProps {
    label: string;
    url?: string;
    onUpload?: () => void;
}

interface BusinessProfileData {
    status?: VerificationStatus;
    business_name?: string;
    business_email?: string;
    business_phone?: string;
    business_type?: string;
    business_address?: string;
    city?: string;
    state?: string;
    lga?: string;
}

interface BusinessRegistrationData {
    status?: VerificationStatus;
    registration_number?: string;
    registration_date?: string;
    company_type?: string;
    registration_certificate_url?: string;
}

interface TaxComplianceData {
    status?: VerificationStatus;
    tax_id_number?: string;
    tax_certificate_url?: string;
}

interface BusinessAuthorizationData {
    status?: VerificationStatus;
    authorized_representative_name?: string;
    authorized_representative_position?: string;
    other_address_proof_type?: string;
    utility_bill_url?: string;
    bank_statement_url?: string;
    authorization_letter_url?: string;
}

interface Director {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    nationality?: string;
    bvn?: string;
    identity_type?: string;
    identity_number?: string;
    shareholding_percentage?: string | number;
    address?: string;
    identity_document_url?: string;
    business_address_proof_url?: string;
}

interface DirectorsShareholdersData {
    status?: VerificationStatus;
}

interface VerificationData {
    business_profile?: BusinessProfileData;
    business_registration?: BusinessRegistrationData;
    tax_compliance?: TaxComplianceData;
    business_authorization?: BusinessAuthorizationData;
    directors_shareholders?: DirectorsShareholdersData;
    directors?: Director[];
    submitted_at?: string;
    reviewed_at?: string;
    verified_at?: string;
    verification_expires_at?: string;
    rejected_reason?: string;
}

interface StatusData {
    overall_status?: OverallStatus;
}

interface AuthState {
    user?: {
        id?: string;
    };
    isTeamMember: boolean;
    ownerUserId?: string;
}

interface RootState {
    auth: AuthState;
}

interface BusinessProfileSectionProps {
    data?: BusinessProfileData;
    onEdit?: () => void;
}

interface BusinessRegistrationSectionProps {
    data?: BusinessRegistrationData;
    onEdit?: () => void;
}

interface TaxComplianceSectionProps {
    data?: TaxComplianceData;
    onEdit?: () => void;
}

interface BusinessAuthorizationSectionProps {
    data?: BusinessAuthorizationData;
    onEdit?: () => void;
}

interface DirectorsSectionProps {
    data?: DirectorsShareholdersData;
    directors?: Director[];
    onEdit?: () => void;
}

// Reusable Section Component
const VerificationSection: React.FC<VerificationSectionProps> = ({ title, stepNumber, status, icon: Icon, children, onEdit }) => {
    const getStatusColor = (status?: VerificationStatus): string => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'needs_correction':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status?: VerificationStatus): string => {
        switch (status) {
            case 'completed':
                return 'Verified';
            case 'pending':
                return 'Under Review';
            case 'needs_correction':
                return 'Needs Correction';
            default:
                return 'Not Submitted';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5 md:p-6 mb-4">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="shrink-0">
                        {status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <Icon className="w-6 h-6 text-gray-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        {stepNumber && (
                            <p className="text-xs text-gray-500">Step {stepNumber}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Update button disabled per user directive: form fields cannot be edited once submitted */}
                    {/* {onEdit && (
                        <button
                            onClick={onEdit}
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 rounded-md text-xs font-semibold transition-all cursor-pointer"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Update</span>
                        </button>
                    )} */}
                    {status && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
};

// Info Row Component
const InfoRow: React.FC<InfoRowProps> = ({ label, value, fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1'} py-1.5`}>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
        {value ? (
            <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
        ) : (
            <p className="text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 w-fit">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Not Provided Yet</span>
            </p>
        )}
    </div>
);

// Document View Component
const DocumentView: React.FC<DocumentViewProps> = ({ label, url, onUpload }) => {
    return (
        <div className="py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
            {url ? (
                <button
                    onClick={() => window.open(url, '_blank')}
                    type="button"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                >
                    <FileText className="w-3.5 h-3.5" />
                    View Document
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            ) : (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Not Uploaded
                    </span>
                    {onUpload && (
                        <button
                            onClick={onUpload}
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Upload
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Step 1: Business Profile Section
const BusinessProfileSection: React.FC<BusinessProfileSectionProps | any> = ({ data, onEdit }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Profile"
            stepNumber={1}
            status={data.step_1_status}
            icon={Building2}
            onEdit={onEdit}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Business Name" value={data.company_name} />
                <InfoRow label="Business Email" value={data.business_email} />
                <InfoRow label="Business Phone" value={(data.phone_number || data.phone_dial_code) ? `+${data.phone_dial_code || ''} ${data.phone_number || ''}` : undefined} />
                <InfoRow label="Business Category" value={data.business_category} />
                <InfoRow label="Business Address" value={data.full_address} fullWidth />
                <InfoRow label="Country" value={data.country_name} />
                <InfoRow label="State" value={data.state_name || data.state} />
                <InfoRow label="LGA" value={data.lga} />
                <InfoRow label="Zip Code" value={data.zip_code} />
                <InfoRow label="Business Description" value={data.business_description} fullWidth />
            </div>
        </VerificationSection>
    );
};

// Step 2: Business Registration Section
const BusinessRegistrationSection: React.FC<BusinessRegistrationSectionProps | any> = ({ data, onEdit, onUploadDoc }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Registration"
            stepNumber={2}
            status={data.step_2_status}
            icon={FileText}
            onEdit={onEdit}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Registration Number" value={data.registration_number} />
                <InfoRow label="Registration Date" value={data.registration_date ? new Date(data.registration_date).toLocaleDateString() : undefined} />
                <InfoRow label="Business Type" value={data.business_type?.replace('_', ' ').toUpperCase()} />
                <InfoRow label="Nature of Business" value={data.nature_of_business} fullWidth />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentView
                        label="CAC Certificate"
                        url={data.cac_certificate_url}
                        onUpload={() => onUploadDoc?.({ key: 'cac_certificate', label: 'CAC Certificate', step: 2 })}
                    />
                    <DocumentView
                        label="Certificate of Incorporation"
                        url={data.certificate_of_incorporation_url}
                        onUpload={() => onUploadDoc?.({ key: 'certificate_of_incorporation', label: 'Certificate of Incorporation', step: 2 })}
                    />
                    <DocumentView
                        label="Memorandum & Articles"
                        url={data.memorandum_and_articles_url}
                        onUpload={() => onUploadDoc?.({ key: 'memorandum_and_articles', label: 'Memorandum & Articles', step: 2 })}
                    />
                    <DocumentView
                        label="Form 2/CO7"
                        url={data.form_2_co7_url}
                        onUpload={() => onUploadDoc?.({ key: 'form_2_co7', label: 'Form 2 / CO7', step: 2 })}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 3: Tax Compliance Section
const TaxComplianceSection: React.FC<TaxComplianceSectionProps | any> = ({ data, onEdit, onUploadDoc }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Tax Compliance"
            stepNumber={3}
            status={data.step_3_status}
            icon={Wallet}
            onEdit={onEdit}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Tax ID Number (TIN)" value={data.tin_number} />
                <InfoRow label="VAT Number" value={data.vat_number} />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentView
                        label="VAT Registration Certificate"
                        url={data.vat_registration_certificate_url}
                        onUpload={() => onUploadDoc?.({ key: 'vat_registration_certificate', label: 'VAT Registration Certificate', step: 3 })}
                    />
                    <DocumentView
                        label="SCUML Certificate"
                        url={data.scuml_certificate_url}
                        onUpload={() => onUploadDoc?.({ key: 'scuml_certificate', label: 'SCUML Certificate', step: 3 })}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 4: Business Authorization Section
const BusinessAuthorizationSection: React.FC<BusinessAuthorizationSectionProps | any> = ({ data, onEdit, onUploadDoc }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Authorization"
            stepNumber={4}
            status={data.step_4_status}
            icon={ShieldCheck}
            onEdit={onEdit}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Address Proof Type" value={data.address_proof_type?.replace('_', ' ').toUpperCase()} />
                <InfoRow label="Line of Business" value={data.line_of_business} />
                {data.other_address_proof_type && (
                    <InfoRow label="Other Address Proof Type" value={data.other_address_proof_type} />
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentView
                        label="Business Address Proof"
                        url={data.business_address_proof_url}
                        onUpload={() => onUploadDoc?.({ key: 'business_address_proof', label: 'Business Address Proof', step: 4 })}
                    />
                    <DocumentView
                        label="Trade License"
                        url={data.trade_license_url}
                        onUpload={() => onUploadDoc?.({ key: 'trade_license', label: 'Trade License', step: 4 })}
                    />
                    <DocumentView
                        label="Export License"
                        url={data.export_license_url}
                        onUpload={() => onUploadDoc?.({ key: 'export_license', label: 'Export License', step: 4 })}
                    />
                    <DocumentView
                        label="Mining License"
                        url={data.mining_license_url}
                        onUpload={() => onUploadDoc?.({ key: 'mining_license', label: 'Mining License', step: 4 })}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 5: Directors Section
const DirectorsSection: React.FC<DirectorsSectionProps | any> = ({ data, directors, onEdit }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Directors & Shareholders"
            stepNumber={5}
            status={data.step_5_status}
            icon={Users}
            onEdit={onEdit}
        >
            {directors && directors.length > 0 ? (
                <div className="space-y-6">
                    {directors.map((director: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-base font-semibold text-gray-900">
                                        {director.first_name} {director.last_name}
                                    </h4>
                                    <p className="text-sm text-gray-500">Director {index + 1}</p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs font-medium",
                                    director.status === 'verified' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                )}>
                                    {director.status || 'Pending'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
                                <InfoRow label="Email" value={director.email} />
                                <InfoRow label="Phone" value={director.phone_number} />
                                <InfoRow label="Date of Birth" value={director.date_of_birth ? new Date(director.date_of_birth).toLocaleDateString() : 'N/A'} />
                                <InfoRow label="Nationality" value={director.nationality} />
                                <InfoRow label="Identity Type" value={director.identity_type?.toUpperCase()} />
                                <InfoRow label="Identity Number" value={director.identity_number} />
                                <InfoRow label="Address" value={director.address} fullWidth />
                            </div>

                            {(director.identity_document_url || director.business_address_proof_url) && (
                                <div className="mt-4 pt-4 border-t border-gray-300">
                                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Documents</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {director.identity_document_url && (
                                            <DocumentView
                                                label="Identity Document"
                                                url={director.identity_document_url}
                                            />
                                        )}
                                        {director.business_address_proof_url && (
                                            <DocumentView
                                                label="Address Proof"
                                                url={director.business_address_proof_url}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No directors information available</p>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            type="button"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Director
                        </button>
                    )}
                </div>
            )}
        </VerificationSection>
    );
};

// Document Field Picker Component inside Modal
const DocumentFieldPicker: React.FC<{
    label: string;
    existingUrl?: string;
    onChange: (file: File | null) => void;
}> = ({ label, existingUrl, onChange }) => {
    return (
        <div className="py-1">
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 block">{label}</label>
                {existingUrl && (
                    <a
                        href={existingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-green-700 font-semibold hover:underline inline-flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200"
                    >
                        <FileText className="w-3 h-3 text-green-600" />
                        View Currently Uploaded
                    </a>
                )}
            </div>
            <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
        </div>
    );
};

// Edit Verification Modal Component
interface EditVerificationModalProps {
    open: boolean;
    onClose: () => void;
    step: 1 | 2 | 3 | 4 | 5 | null;
    initialData: any;
    userId?: string;
}

const EditVerificationModal: React.FC<EditVerificationModalProps> = ({
    open,
    onClose,
    step,
    initialData,
    userId,
}) => {
    const [submitStep1, { isLoading: submittingStep1 }] = useSubmitStep1Mutation();
    const [submitStep2, { isLoading: submittingStep2 }] = useSubmitStep2Mutation();
    const [submitStep3, { isLoading: submittingStep3 }] = useSubmitStep3Mutation();
    const [submitStep4, { isLoading: submittingStep4 }] = useSubmitStep4Mutation();
    const [addDirector, { isLoading: submittingDirector }] = useAddDirectorMutation();

    const [formData, setFormData] = React.useState<any>({});
    const [files, setFiles] = React.useState<{ [key: string]: File | null }>({});

    React.useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        }
    }, [initialData, step]);

    if (!open || !step) return null;

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (field: string, file: File | null) => {
        setFiles((prev) => ({ ...prev, [field]: file }));
    };

    const isSubmitting = submittingStep1 || submittingStep2 || submittingStep3 || submittingStep4 || submittingDirector;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (step === 1) {
                await submitStep1({ userId, data: formData }).unwrap();
                toast.success('Business profile updated successfully');
            } else if (step === 2) {
                const fd = new FormData();
                fd.append('registration_number', formData.registration_number || '');
                fd.append('registration_date', formData.registration_date || '');
                fd.append('business_type', formData.business_type || '');
                fd.append('nature_of_business', formData.nature_of_business || '');

                if (files.cac_certificate) fd.append('cac_certificate', files.cac_certificate);
                if (files.certificate_of_incorporation) fd.append('certificate_of_incorporation', files.certificate_of_incorporation);
                if (files.memorandum_and_articles) fd.append('memorandum_and_articles', files.memorandum_and_articles);
                if (files.form_2_co7) fd.append('form_2_co7', files.form_2_co7);

                await submitStep2({ userId, formData: fd }).unwrap();
                toast.success('Business registration updated successfully');
            } else if (step === 3) {
                const fd = new FormData();
                fd.append('tin_number', formData.tin_number || '');
                fd.append('vat_number', formData.vat_number || '');

                if (files.vat_registration_certificate) fd.append('vat_registration_certificate', files.vat_registration_certificate);
                if (files.scuml_certificate) fd.append('scuml_certificate', files.scuml_certificate);

                await submitStep3({ userId, formData: fd }).unwrap();
                toast.success('Tax compliance details updated successfully');
            } else if (step === 4) {
                const fd = new FormData();
                fd.append('address_proof_type', formData.address_proof_type || '');
                fd.append('line_of_business', formData.line_of_business || '');
                if (formData.other_address_proof_type) fd.append('other_address_proof_type', formData.other_address_proof_type);

                if (files.business_address_proof) fd.append('business_address_proof', files.business_address_proof);
                if (files.trade_license) fd.append('trade_license', files.trade_license);
                if (files.export_license) fd.append('export_license', files.export_license);
                if (files.mining_license) fd.append('mining_license', files.mining_license);

                await submitStep4({ userId, formData: fd }).unwrap();
                toast.success('Business authorization updated successfully');
            } else if (step === 5) {
                const fd = new FormData();
                fd.append('first_name', formData.first_name || '');
                fd.append('last_name', formData.last_name || '');
                fd.append('email', formData.email || '');
                fd.append('phone_number', formData.phone_number || '');
                fd.append('date_of_birth', formData.date_of_birth || '');
                fd.append('nationality', formData.nationality || '');
                fd.append('identity_type', formData.identity_type || '');
                fd.append('identity_number', formData.identity_number || '');
                fd.append('address', formData.address || '');

                if (files.identity_document) fd.append('identity_document', files.identity_document);
                if (files.business_address_proof) fd.append('business_address_proof', files.business_address_proof);

                await addDirector({ userId, formData: fd }).unwrap();
                toast.success('Director added successfully');
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update section');
        }
    };

    const stepTitles: { [key: number]: string } = {
        1: 'Update Business Profile (Step 1)',
        2: 'Update Business Registration (Step 2)',
        3: 'Update Tax Compliance (Step 3)',
        4: 'Update Business Authorization (Step 4)',
        5: 'Add Director / Shareholder (Step 5)',
    };

    return (
        <Modal open={open} onClose={onClose} size="lg" className="max-w-lg mx-auto">
            <ModalHeader className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">{stepTitles[step]}</h3>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-3 p-4 max-h-[70vh] overflow-y-auto">
                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        value={formData.company_name || ''}
                                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Email</label>
                                    <input
                                        type="email"
                                        value={formData.business_email || ''}
                                        onChange={(e) => handleInputChange('business_email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Dial Code</label>
                                    <input
                                        type="text"
                                        value={formData.phone_dial_code || '234'}
                                        onChange={(e) => handleInputChange('phone_dial_code', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number || ''}
                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Category</label>
                                    <input
                                        type="text"
                                        value={formData.business_category || ''}
                                        onChange={(e) => handleInputChange('business_category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="e.g. Miner, Exporter, Trader"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country_name || 'Nigeria'}
                                        onChange={(e) => handleInputChange('country_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">State</label>
                                    <input
                                        type="text"
                                        value={formData.state_name || formData.state || ''}
                                        onChange={(e) => handleInputChange('state_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">LGA</label>
                                    <input
                                        type="text"
                                        value={formData.lga || ''}
                                        onChange={(e) => handleInputChange('lga', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Business Address</label>
                                <textarea
                                    value={formData.full_address || ''}
                                    onChange={(e) => handleInputChange('full_address', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-700 block mb-1">Business Description</label>
                                <textarea
                                    value={formData.business_description || ''}
                                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Registration Number (RC/BN)</label>
                                    <input
                                        type="text"
                                        value={formData.registration_number || ''}
                                        onChange={(e) => handleInputChange('registration_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Registration Date</label>
                                    <input
                                        type="date"
                                        value={formData.registration_date ? formData.registration_date.split('T')[0] : ''}
                                        onChange={(e) => handleInputChange('registration_date', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Type</label>
                                    <select
                                        value={formData.business_type || ''}
                                        onChange={(e) => handleInputChange('business_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="registered_company">Registered Company</option>
                                        <option value="sole_proprietorship">Sole Proprietorship</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="cooperative">Cooperative</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Nature of Business</label>
                                    <input
                                        type="text"
                                        value={formData.nature_of_business || ''}
                                        onChange={(e) => handleInputChange('nature_of_business', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Upload Documents (PDF / Image)</h4>
                                <DocumentFieldPicker
                                    label="CAC Certificate"
                                    existingUrl={formData.cac_certificate_url}
                                    onChange={(file) => handleFileChange('cac_certificate', file)}
                                />
                                <DocumentFieldPicker
                                    label="Certificate of Incorporation"
                                    existingUrl={formData.certificate_of_incorporation_url}
                                    onChange={(file) => handleFileChange('certificate_of_incorporation', file)}
                                />
                                <DocumentFieldPicker
                                    label="Memorandum & Articles"
                                    existingUrl={formData.memorandum_and_articles_url}
                                    onChange={(file) => handleFileChange('memorandum_and_articles', file)}
                                />
                                <DocumentFieldPicker
                                    label="Form 2 / CO7"
                                    existingUrl={formData.form_2_co7_url}
                                    onChange={(file) => handleFileChange('form_2_co7', file)}
                                />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Tax ID Number (TIN)</label>
                                    <input
                                        type="text"
                                        value={formData.tin_number || ''}
                                        onChange={(e) => handleInputChange('tin_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">VAT Number</label>
                                    <input
                                        type="text"
                                        value={formData.vat_number || ''}
                                        onChange={(e) => handleInputChange('vat_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Upload Documents (PDF / Image)</h4>
                                <DocumentFieldPicker
                                    label="VAT Registration Certificate"
                                    existingUrl={formData.vat_registration_certificate_url}
                                    onChange={(file) => handleFileChange('vat_registration_certificate', file)}
                                />
                                <DocumentFieldPicker
                                    label="SCUML Certificate"
                                    existingUrl={formData.scuml_certificate_url}
                                    onChange={(file) => handleFileChange('scuml_certificate', file)}
                                />
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Address Proof Type</label>
                                    <select
                                        value={formData.address_proof_type || ''}
                                        onChange={(e) => handleInputChange('address_proof_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="utility_bill">Utility Bill</option>
                                        <option value="bank_statement">Bank Statement</option>
                                        <option value="tenancy_agreement">Tenancy Agreement</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Line of Business</label>
                                    <input
                                        type="text"
                                        value={formData.line_of_business || ''}
                                        onChange={(e) => handleInputChange('line_of_business', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Upload Documents (PDF / Image)</h4>
                                <DocumentFieldPicker
                                    label="Business Address Proof"
                                    existingUrl={formData.business_address_proof_url}
                                    onChange={(file) => handleFileChange('business_address_proof', file)}
                                />
                                <DocumentFieldPicker
                                    label="Trade License"
                                    existingUrl={formData.trade_license_url}
                                    onChange={(file) => handleFileChange('trade_license', file)}
                                />
                                <DocumentFieldPicker
                                    label="Export License"
                                    existingUrl={formData.export_license_url}
                                    onChange={(file) => handleFileChange('export_license', file)}
                                />
                                <DocumentFieldPicker
                                    label="Mining License"
                                    existingUrl={formData.mining_license_url}
                                    onChange={(file) => handleFileChange('mining_license', file)}
                                />
                            </div>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name || ''}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name || ''}
                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number || ''}
                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Nationality</label>
                                    <input
                                        type="text"
                                        value={formData.nationality || 'Nigerian'}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Identity Type</label>
                                    <select
                                        value={formData.identity_type || ''}
                                        onChange={(e) => handleInputChange('identity_type', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                                    >
                                        <option value="">Select ID Type</option>
                                        <option value="national_id">National ID / NIN</option>
                                        <option value="passport">International Passport</option>
                                        <option value="voters_card">Voter's Card</option>
                                        <option value="drivers_license">Driver's License</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Identity Number</label>
                                    <input
                                        type="text"
                                        value={formData.identity_number || ''}
                                        onChange={(e) => handleInputChange('identity_number', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Address</label>
                                    <textarea
                                        value={formData.address || ''}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <DocumentFieldPicker
                                    label="Identity Document File"
                                    existingUrl={formData.identity_document_url}
                                    onChange={(file) => handleFileChange('identity_document', file)}
                                />
                            </div>
                        </>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-5 text-xs font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 text-xs font-semibold"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            'Save & Update'
                        )}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

// Dedicated Single Document Upload Modal
interface UploadTarget {
    key: string;
    label: string;
    step: number;
}

interface UploadDocumentModalProps {
    open: boolean;
    onClose: () => void;
    target: UploadTarget | null;
    initialData?: any;
    userId?: string;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({ open, onClose, target, initialData, userId }) => {
    const [submitStep2, { isLoading: s2 }] = useSubmitStep2Mutation();
    const [submitStep3, { isLoading: s3 }] = useSubmitStep3Mutation();
    const [submitStep4, { isLoading: s4 }] = useSubmitStep4Mutation();

    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setSelectedFile(null);
    }, [target]);

    if (!open || !target) return null;

    const isLoading = s2 || s3 || s4;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        try {
            const formData = new FormData();
            formData.append(target.key, selectedFile);

            if (target.step === 2) {
                if (initialData?.registration_number) formData.append('registration_number', initialData.registration_number);
                if (initialData?.registration_date) formData.append('registration_date', initialData.registration_date);
                if (initialData?.business_type) formData.append('business_type', initialData.business_type);
                if (initialData?.nature_of_business) formData.append('nature_of_business', initialData.nature_of_business);
                await submitStep2({ userId, formData }).unwrap();
            } else if (target.step === 3) {
                if (initialData?.tin_number) formData.append('tin_number', initialData.tin_number);
                if (initialData?.vat_number) formData.append('vat_number', initialData.vat_number);
                await submitStep3({ userId, formData }).unwrap();
            } else if (target.step === 4) {
                if (initialData?.address_proof_type) formData.append('address_proof_type', initialData.address_proof_type);
                if (initialData?.line_of_business) formData.append('line_of_business', initialData.line_of_business);
                await submitStep4({ userId, formData }).unwrap();
            }

            toast.success(`${target.label} uploaded successfully`);
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to upload document');
        }
    };

    return (
        <Modal open={open} onClose={onClose} size="sm" className="max-w-md mx-auto">
            <ModalHeader className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Upload {target.label}</h3>
            </ModalHeader>
            <form onSubmit={handleUpload}>
                <ModalBody className="p-5 space-y-4">
                    <p className="text-xs text-gray-500">
                        Select your document file for <span className="font-semibold text-gray-800">{target.label}</span> (PDF or Images).
                    </p>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50/40 rounded-xl p-6 text-center transition-all bg-gray-50/50 cursor-pointer group"
                    >
                        <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-green-600 mx-auto mb-2 transition-colors" />
                        <p className="text-xs font-semibold text-gray-700 group-hover:text-green-700 mb-1">
                            Click anywhere here to select file or image
                        </p>
                        <p className="text-[11px] text-gray-400">PDF, PNG, JPG, WEBP</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        {selectedFile && (
                            <div className="mt-3 text-xs text-green-800 bg-green-50 p-2.5 rounded-lg border border-green-200 font-medium truncate flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="truncate">{selectedFile.name}</span>
                            </div>
                        )}
                    </div>
                </ModalBody>

                <ModalFooter className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={onClose}
                        disabled={isLoading}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-4 text-xs font-semibold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !selectedFile}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 text-xs font-semibold"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                            </span>
                        ) : (
                            'Upload Document'
                        )}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

// Main Business Component
const Businesss: React.FC = () => {
    const router = useRouter();
    const { user, isTeamMember, ownerUserId } = useSelector((state: RootState) => state.auth);
    const userId = isTeamMember ? ownerUserId : user?.id;

    const { data: detailsData, isLoading: loadingDetails } = useGetVerificationDetailsQuery(userId);
    const { data: statusData, isLoading: loadingStatus } = useGetVerificationStatusQuery(userId);

    const [editStep, setEditStep] = React.useState<1 | 2 | 3 | 4 | 5 | null>(null);
    const [uploadTarget, setUploadTarget] = React.useState<UploadTarget | null>(null);

    if (loadingDetails || loadingStatus) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="text-gray-600 text-sm font-medium">Loading verification details...</p>
                </div>
            </div>
        );
    }

    const verificationData = detailsData?.data as any;
    const status = statusData?.data as any;

    if (!verificationData) {
        return (
            <>
                <Head>
                    <title>{metadata.title}</title>
                </Head>
                <div className="container mx-auto py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Verification</h1>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Not Started</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            Complete your business verification to build trust and unlock all features on the platform.
                        </p>
                        <button
                            onClick={() => router.push(paths.dashboard.companyInfoVerification)}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold"
                        >
                            Start Verification
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const isEditable = status?.overall_status === 'needs_correction' || !status?.overall_status;

    return (
        <>
            <Head>
                <title>{metadata.title}</title>
            </Head>

            <div className="w-full py-2 sm:py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Business Verification</h1>
                        <p className="text-gray-600">View your submitted business verification details</p>
                    </div>
                    {status && (
                        <div className="flex items-center gap-3">
                            {/* Edit Verification button commented out per user directive */}
                            {/* {isEditable && (
                                <button
                                    onClick={() => setEditStep(1)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium cursor-pointer"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Verification
                                </button>
                            )} */}
                            <span className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border",
                                status.overall_status === 'approved' ? "bg-green-50 text-green-700 border-green-200" :
                                    status.overall_status === 'rejected' ? "bg-red-50 text-red-700 border-red-200" :
                                        status.overall_status === 'needs_correction' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                            "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                                {status.overall_status?.replace('_', ' ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Overall Status Alert */}
                {status?.overall_status === 'approved' && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-green-900 mb-1">Verification Approved</h3>
                            <p className="text-green-800 text-sm">
                                Your business verification was successfully approved on{' '}
                                <span className="font-semibold">
                                    {new Date(verificationData?.verified_at || Date.now()).toLocaleDateString()}
                                </span>.
                            </p>
                        </div>
                    </div>
                )}

                {status?.overall_status === 'pending' && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 mb-1">Verification Under Review</h3>
                            <p className="text-amber-800 text-sm">
                                Your verification is currently being reviewed. Submitted on{' '}
                                <span className="font-semibold">
                                    {new Date(verificationData?.submitted_at || Date.now()).toLocaleDateString()}
                                </span>.
                            </p>
                        </div>
                    </div>
                )}

                {status?.overall_status === 'rejected' && verificationData?.rejected_reason && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 mb-1">Verification Rejected</h3>
                            <p className="text-red-800 text-sm">{verificationData?.rejected_reason}</p>
                        </div>
                    </div>
                )}

                {/* Verification Details Sections */}
                <div className="space-y-6">
                    <BusinessProfileSection data={verificationData} onEdit={() => setEditStep(1)} />
                    <BusinessRegistrationSection
                        data={verificationData}
                        onEdit={() => setEditStep(2)}
                        onUploadDoc={(t: UploadTarget) => setUploadTarget(t)}
                    />
                    <TaxComplianceSection
                        data={verificationData}
                        onEdit={() => setEditStep(3)}
                        onUploadDoc={(t: UploadTarget) => setUploadTarget(t)}
                    />
                    <BusinessAuthorizationSection
                        data={verificationData}
                        onEdit={() => setEditStep(4)}
                        onUploadDoc={(t: UploadTarget) => setUploadTarget(t)}
                    />
                    <DirectorsSection
                        data={verificationData}
                        directors={verificationData?.directors}
                        onEdit={() => setEditStep(5)}
                        onUploadDoc={(t: UploadTarget) => setUploadTarget(t)}
                    />
                </div>

                {/* Inline Edit Verification Modal */}
                <EditVerificationModal
                    open={editStep !== null}
                    step={editStep}
                    onClose={() => setEditStep(null)}
                    initialData={verificationData}
                    userId={userId}
                />

                {/* Single Document Upload Modal */}
                <UploadDocumentModal
                    open={uploadTarget !== null}
                    target={uploadTarget}
                    initialData={verificationData}
                    onClose={() => setUploadTarget(null)}
                    userId={userId}
                />

                {/* Verification Timeline */}
                {(verificationData?.submitted_at || verificationData?.verified_at) && (
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            Verification Timeline
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {verificationData?.submitted_at && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted</p>
                                    <p className="text-sm text-gray-700 font-medium">
                                        {new Date(verificationData?.submitted_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {verificationData?.reviewed_at && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reviewed</p>
                                    <p className="text-sm text-gray-700 font-medium">
                                        {new Date(verificationData?.reviewed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {verificationData?.verified_at && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified</p>
                                    <p className="text-sm text-gray-700 font-medium">
                                        {new Date(verificationData?.verified_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {verificationData?.verification_expires_at && (
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expires</p>
                                    <p className="text-sm text-gray-700 font-medium">
                                        {new Date(verificationData?.verification_expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Businesss;