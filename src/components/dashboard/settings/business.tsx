import * as React from 'react';
import { useGetVerificationDetailsQuery, useGetVerificationStatusQuery } from '@/redux/features/business_verification_feature/bv_v1_api';
import { useSelector } from 'react-redux';
import Head from 'next/head';
import { LucideIcon } from 'lucide-react';

const metadata = {
    title: `Business | Settings | Dashboard | ${config.site.name}`
};

// Icon Components (using lucide-react as replacement for MUI icons)
// Install: npm install lucide-react
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
    XCircle
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
}

interface InfoRowProps {
    label: string;
    value?: string | number;
    fullWidth?: boolean;
}

interface DocumentViewProps {
    label: string;
    url?: string;
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
}

interface BusinessRegistrationSectionProps {
    data?: BusinessRegistrationData;
}

interface TaxComplianceSectionProps {
    data?: TaxComplianceData;
}

interface BusinessAuthorizationSectionProps {
    data?: BusinessAuthorizationData;
}

interface DirectorsSectionProps {
    data?: DirectorsShareholdersData;
    directors?: Director[];
}

// Reusable Section Component
const VerificationSection: React.FC<VerificationSectionProps> = ({ title, stepNumber, status, icon: Icon, children }) => {
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
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
                            <p className="text-sm text-gray-500">Step {stepNumber}</p>
                        )}
                    </div>
                </div>
                {status && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                    </span>
                )}
            </div>
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
};

// Info Row Component
const InfoRow: React.FC<InfoRowProps> = ({ label, value, fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-2' : 'col-span-1'}`}>
        <div className="py-3">
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-base text-gray-900">{value || 'N/A'}</p>
        </div>
    </div>
);

// Document View Component
const DocumentView: React.FC<DocumentViewProps> = ({ label, url }) => {
    if (!url) return null;

    return (
        <div className="py-2">
            <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
            <button
                onClick={() => window.open(url, '_blank')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
                <FileText className="w-4 h-4" />
                View
                <ExternalLink className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 1: Business Profile Section
const BusinessProfileSection: React.FC<BusinessProfileSectionProps | any> = ({ data }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Profile"
            stepNumber={1}
            status={data.step_1_status}
            icon={Building2}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
                <InfoRow label="Business Name" value={data.company_name} />
                <InfoRow label="Business Email" value={data.business_email} />
                <InfoRow label="Business Phone" value={`+${data.phone_dial_code || ''} ${data.phone_number || ''}`} />
                <InfoRow label="Business Category" value={data.business_category} />
                <InfoRow label="Business Address" value={data.full_address} fullWidth />
                <InfoRow label="Country" value={data.country_name} />
                <InfoRow label="State" value={data.state_name || data.state} />
                {data.lga && <InfoRow label="LGA" value={data.lga} />}
                <InfoRow label="Zip Code" value={data.zip_code} />
                <InfoRow label="Business Description" value={data.business_description} fullWidth />
            </div>
        </VerificationSection>
    );
};

// Step 2: Business Registration Section
const BusinessRegistrationSection: React.FC<BusinessRegistrationSectionProps | any> = ({ data }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Registration"
            stepNumber={2}
            status={data.step_2_status}
            icon={FileText}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
                <InfoRow label="Registration Number" value={data.registration_number} />
                <InfoRow label="Registration Date" value={data.registration_date ? new Date(data.registration_date).toLocaleDateString() : 'N/A'} />
                <InfoRow label="Business Type" value={data.business_type?.replace('_', ' ').toUpperCase()} />
                <InfoRow label="Nature of Business" value={data.nature_of_business} fullWidth />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentView
                        label="CAC Certificate"
                        url={data.cac_certificate_url}
                    />
                    <DocumentView
                        label="Certificate of Incorporation"
                        url={data.certificate_of_incorporation_url}
                    />
                    <DocumentView
                        label="Memorandum & Articles"
                        url={data.memorandum_and_articles_url}
                    />
                    <DocumentView
                        label="Form 2/CO7"
                        url={data.form_2_co7_url}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 3: Tax Compliance Section
const TaxComplianceSection: React.FC<TaxComplianceSectionProps | any> = ({ data }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Tax Compliance"
            stepNumber={3}
            status={data.step_3_status}
            icon={Wallet}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
                <InfoRow label="Tax ID Number (TIN)" value={data.tin_number} />
                <InfoRow label="VAT Number" value={data.vat_number} />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DocumentView
                        label="VAT Registration Certificate"
                        url={data.vat_registration_certificate_url}
                    />
                    <DocumentView
                        label="SCUML Certificate"
                        url={data.scuml_certificate_url}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 4: Business Authorization Section
const BusinessAuthorizationSection: React.FC<BusinessAuthorizationSectionProps | any> = ({ data }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Business Authorization"
            stepNumber={4}
            status={data.step_4_status}
            icon={ShieldCheck}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
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
                    />
                    <DocumentView
                        label="Trade License"
                        url={data.trade_license_url}
                    />
                    <DocumentView
                        label="Board Resolution"
                        url={data.board_resolution_url}
                    />
                    <DocumentView
                        label="Authorized Signatories"
                        url={data.authorized_signatories_url}
                    />
                </div>
            </div>
        </VerificationSection>
    );
};

// Step 5: Directors Section
const DirectorsSection: React.FC<DirectorsSectionProps | any> = ({ data, directors }) => {
    if (!data) return null;

    return (
        <VerificationSection
            title="Directors & Shareholders"
            stepNumber={5}
            status={data.step_5_status}
            icon={Users}
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
                    <p className="text-gray-500">No directors information available</p>
                </div>
            )}
        </VerificationSection>
    );
};

// Main Business Component
const Businesss: React.FC = () => {
    const router = useRouter();
    const { user, isTeamMember, ownerUserId } = useSelector((state: RootState) => state.auth);
    const userId = isTeamMember ? ownerUserId : user?.id;

    const { data: detailsData, isLoading: loadingDetails } = useGetVerificationDetailsQuery(userId);
    const { data: statusData, isLoading: loadingStatus } = useGetVerificationStatusQuery(userId);

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

            <div className="container mx-auto py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Business Verification</h1>
                        <p className="text-gray-600">View your submitted business verification details</p>
                    </div>
                    {status && (
                        <div className="flex items-center gap-3">
                            {isEditable && (
                                <button
                                    onClick={() => router.push(paths.dashboard.companyInfoVerification)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Verification
                                </button>
                            )}
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
                    <BusinessProfileSection data={verificationData} />
                    <BusinessRegistrationSection data={verificationData} />
                    <TaxComplianceSection data={verificationData} />
                    <BusinessAuthorizationSection data={verificationData} />
                    <DirectorsSection
                        data={verificationData}
                        directors={verificationData?.directors}
                    />
                </div>

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