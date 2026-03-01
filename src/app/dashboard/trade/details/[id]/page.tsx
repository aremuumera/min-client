"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useGetTradeInquiryQuery,
    useAcknowledgeInquiryMutation,
    useRejectInquiryMutation
} from '@/redux/features/trade/trade_api';
import { useSelector } from 'react-redux';
import {
    Clock,
    Box,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Info,
    MapPin,
    Zap,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    FileCheck,
    Truck,
    CreditCard,
    FileText,
    Image,
    Paperclip,
    ExternalLink,
    Eye,
    Calendar,
    Package
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/core/toaster';
import { cn } from '@/utils/helper';
import { Divider } from '@/components/ui/divider';
import { Typography } from '@/components/ui/typography';
import { customerTradeChatService } from '@/components/dashboard/chat/trade_chat_service';

// --- Components ---

const StepperItem = ({
    icon: Icon,
    title,
    description,
    status // 'active' | 'completed' | 'pending' | 'error'
}: {
    icon: any;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'pending' | 'error'
}) => {
    const configs = {
        active: { circle: 'bg-green-600 ring-4 ring-green-100', icon: 'text-white', text: 'text-gray-900', sub: 'text-green-600 font-bold' },
        completed: { circle: 'bg-green-100', icon: 'text-green-600', text: 'text-gray-500', sub: 'text-gray-400' },
        pending: { circle: 'bg-gray-100', icon: 'text-gray-400', text: 'text-gray-400', sub: 'text-gray-300' },
        error: { circle: 'bg-red-100', icon: 'text-red-600', text: 'text-red-900', sub: 'text-red-500' },
    };

    const config = configs[status];

    return (
        <div className="flex flex-col items-center text-center space-y-3 flex-1 relative min-w-[120px]">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10", config.circle)}>
                <Icon size={20} className={config.icon} />
            </div>
            <div className="space-y-1">
                <p className={cn("text-[11px] uppercase tracking-widest font-black", config.text)}>{title}</p>
                <p className={cn("text-[9px] font-medium leading-tight", config.sub)}>{description}</p>
            </div>
        </div>
    );
};

const TradeStepper = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
        {
            id: 'inquiry',
            title: 'Inquiry',
            icon: Clock,
            desc: 'Under Review',
            matches: ['pending', 'claimed']
        },
        {
            id: 'matching',
            title: 'Sourcing',
            icon: ShieldCheck,
            desc: 'Supplier Matched',
            matches: ['supplier_matched', 'acknowledged']
        },
        {
            id: 'verification',
            title: 'Verification',
            icon: FileCheck,
            desc: 'Compliance & Docs',
            matches: ['disclaimer_sent', 'disclaimer_signed', 'inspector_assigned', 'inspection_in_progress']
        },
        {
            id: 'logistics',
            title: 'Logistics',
            icon: Truck,
            desc: 'Inspection & Load',
            matches: ['inspection_complete', 'payment_pending']
        },
        {
            id: 'closing',
            title: 'Execution',
            icon: CreditCard,
            desc: 'Finalized',
            matches: ['completed']
        },
    ];

    const getStatus = (stepIndex: number) => {
        const currentStepIndex = steps.findIndex(s => s.matches.includes(currentStatus));
        if (currentStatus === 'rejected') return 'error'; // Special case
        if (stepIndex < currentStepIndex) return 'completed';
        if (stepIndex === currentStepIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="relative flex items-start justify-between py-10 px-4 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group">
            {/* Connecting Lines */}
            <div className="absolute top-[64px] left-[10%] right-[10%] h-[2px] bg-gray-50 -translate-y-1/2" />
            <div
                className="absolute top-[64px] left-[10%] h-[2px] bg-green-500 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                style={{ width: `${Math.max(0, steps.findIndex(s => s.matches.includes(currentStatus)) * 20)}%` }}
            />

            {steps.map((step, index) => (
                <StepperItem
                    key={step.id}
                    icon={step.icon}
                    title={step.title}
                    description={index === steps.findIndex(s => s.matches.includes(currentStatus)) ? (currentStatus.replace(/_/g, ' ')) : step.desc}
                    status={getStatus(index)}
                />
            ))}
        </div>
    );
};

export default function TradeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tradeId = params?.id as string;

    const { user } = useSelector((state: any) => state.auth);
    const { data: inquiryResult, isLoading, refetch } = useGetTradeInquiryQuery(tradeId);
    const [acknowledge] = useAcknowledgeInquiryMutation();
    const [reject] = useRejectInquiryMutation();

    const inquiry = inquiryResult?.data;
    const isSupplier = user?.role === 'supplier';
    const isBuyer = user?.role === 'buyer' || user?.id === inquiry?.user_id;

    const handleAcknowledge = async () => {
        try {
            await acknowledge(tradeId).unwrap();

            // Initialize Firestore room for Hub-and-Spoke ONLY AFTER Acknowledgment
            if (inquiry) {
                try {
                    await customerTradeChatService.createTradeRoom(inquiry.id, {
                        inquiry_id: inquiry.id,
                        entity_type: inquiry.entity_type,
                        status: 'acknowledged',
                        buyer_id: inquiry.user_id,
                        buyer_name: inquiry.buyer_name || 'Buyer',
                        mineral_tag: inquiry.mineral_tag,
                        quantity: String(inquiry.quantity),
                        measure_type: inquiry.measure_type,
                        supplier_id: user?.id, // Authenticated user is the supplier acknowledging
                    });

                    // Copy the initial buyer inquiry message to the admin_buyer spoke thread
                    await customerTradeChatService.sendMessage(
                        tradeId,            // The main room ID (from params)
                        inquiry.id,         // The specific inquiry ID
                        'admin_buyer',      // The thread spoke
                        inquiry.user_id,    // The sender
                        'buyer',            // The role
                        inquiry.buyer_name || 'Buyer',
                        inquiry.buyer?.company_name || 'Independent',
                        `Initial Inquiry Requirements:\n\nQuantity: ${inquiry.quantity} ${inquiry.measure_type?.replace(/_/g, ' ')}\nLocation: ${inquiry.delivery_location}, ${inquiry.delivery_state}\nGrade: ${inquiry.preferred_grade || 'Standard'}\nNotes: ${inquiry.description || 'None'}`
                    );
                } catch (fsErr) {
                    console.error('Firestore Init Error:', fsErr);
                }
            }

            toast.success('Inquiry acknowledged successfully');
            refetch();
        } catch (err) {
            toast.error('Failed to acknowledge');
        }
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold">Loading Trade Intelligence...</div>;
    if (!inquiry) return <div className="p-20 text-center text-red-500 font-bold">Trade reference not found.</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                            <span>Reference</span>
                            <ChevronRight size={10} />
                            <span className="text-gray-900">#{inquiry.external_id?.toUpperCase()}</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trade Orchestration</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.external_id}/${inquiry.product_id}`}
                        className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                    >
                        <MessageSquare size={18} />
                        Open Trade Room
                    </Link>
                </div>
            </div>

            {/* Stepper */}
            <TradeStepper currentStatus={inquiry.status} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Key Information */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Primary Specs Card */}
                    <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Inquiry Specifications</h3>
                            <div className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">
                                {inquiry.entity_type} Transaction
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mineral</p>
                                <p className="text-lg font-black text-gray-900 capitalize">{inquiry.item_name || inquiry.mineral_tag?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</p>
                                <p className="text-lg font-black text-gray-900">{inquiry.quantity} <span className="text-xs text-gray-400 uppercase">{inquiry.measure_type?.replace(/_/g, ' ')}</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</p>
                                <p className={cn("text-lg font-black", inquiry.priority === 'urgent' ? 'text-red-500' : 'text-gray-900')}>{inquiry.priority?.toUpperCase() || 'STANDARD'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terms</p>
                                <p className="text-lg font-black text-gray-900">LC / TT</p>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 flex-none shadow-sm">
                                <MapPin size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination Basis (CIF)</p>
                                <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                    {inquiry.delivery_address}, {inquiry.delivery_location}, {inquiry.delivery_state}, {inquiry.delivery_country}
                                </p>
                            </div>
                        </div>

                        {inquiry.description && (
                            <div className="pt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Buyer's Requirements</p>
                                <p className="text-sm text-gray-600 leading-loose italic font-medium">"{inquiry.description}"</p>
                            </div>
                        )}
                    </div>

                    {/* Supplier's Context / Notes (If Offer Context) */}
                    {inquiry.entity_type === 'rfq' && inquiry.found_offer?.description && (
                        <div className="bg-emerald-50/50 border border-emerald-100/50 p-10 rounded-[40px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <MessageSquare size={80} className="text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                <MessageSquare size={20} />
                                Supplier Feedback
                            </h3>
                            <p className="text-sm text-emerald-800 leading-relaxed font-medium italic relative z-10 whitespace-pre-wrap">
                                "{inquiry.found_offer.description}"
                            </p>
                        </div>
                    )}

                    {/* Supplier Counter-Specs (If Offer Context) */}
                    {inquiry.entity_type === 'rfq' && inquiry.found_offer && (
                        <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Supplier's Counter-Specs</h3>
                                <div className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">
                                    Supplier Terms
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offered Qty</p>
                                    <p className="text-lg font-black text-gray-900">
                                        {Number(inquiry.found_offer.quantity).toLocaleString()}
                                        <span className="text-xs text-gray-400 font-bold ml-1 uppercase">{inquiry.found_offer.measure_type}</span>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purity/Grade</p>
                                    <p className="text-lg font-black text-gray-900">{inquiry.found_offer.purity_grade || 'Standard'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Moisture</p>
                                    <p className="text-lg font-black text-emerald-600">{inquiry.found_offer.moisture_max ? `${inquiry.found_offer.moisture_max}%` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Packaging</p>
                                    <p className="text-sm font-bold text-gray-900">{inquiry.found_offer.packaging || 'Standard Bulk'}</p>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-red-500 shadow-sm flex-none">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Loading Point / Origin</p>
                                        <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                            {inquiry.found_offer.delivery_address || inquiry.found_offer.delivery_location || 'TBD'}
                                            <span className="text-gray-500 font-medium ml-2">({inquiry.found_offer.delivery_state || 'N/A'}, {inquiry.found_offer.delivery_country || 'N/A'})</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={18} className="text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Lead Time</p>
                                            <p className="text-sm font-bold text-gray-900 capitalize">{inquiry.found_offer.timeline_type?.replace(/_/g, ' ') || 'Immediate'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Zap size={18} className="text-emerald-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Frequency</p>
                                            <p className="text-sm font-bold text-gray-900">{inquiry.found_offer.recurring_frequency || 'Single Order'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Media & Documents (Unified Hub) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Media & Document Hub</h3>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Buyer RFQ Media */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <Paperclip size={14} className="text-gray-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Buyer RFQ Reference</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {(() => {
                                        const rfqAttachments = inquiry.rfq?.attachments || inquiry.rfq?.documents || [];
                                        const attachments = Array.isArray(rfqAttachments) ? rfqAttachments : (typeof rfqAttachments === 'string' ? JSON.parse(rfqAttachments) : []);
                                        if (attachments.length === 0) return <p className="text-[11px] text-gray-400 font-medium px-2">No attachments provided with RFQ.</p>;

                                        return attachments.map((file: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{file.name || `RFQ Doc ${idx + 1}`}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Buyer Reference</p>
                                                    </div>
                                                </div>
                                                <Eye size={16} className="text-gray-300 group-hover:text-blue-500" />
                                            </a>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Supplier Offer Media */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <ShieldCheck size={14} className="text-emerald-400" />
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Supplier Verifications</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {(() => {
                                        const rawAttachments = inquiry.found_offer?.attachments || [];
                                        const attachments = Array.isArray(rawAttachments) ? rawAttachments : (typeof rawAttachments === 'string' ? JSON.parse(rawAttachments) : []);
                                        if (attachments.length === 0) return <p className="text-[11px] text-gray-400 font-medium px-2">No supporting documents uploaded by supplier.</p>;

                                        return attachments.map((file: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-emerald-500 transition-colors">
                                                        {file.type === 'image' || file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? <Image size={18} /> : <FileText size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{file.name || `Offer Media ${idx + 1}`}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Supplier Attachment</p>
                                                    </div>
                                                </div>
                                                <Eye size={16} className="text-gray-300 group-hover:text-emerald-500" />
                                            </a>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Formal Trade Documents (Hub) */}
                        {inquiry.documents && inquiry.documents.length > 0 && (
                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 px-2 mb-4">
                                    <FileCheck size={14} className="text-blue-500" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Formal Trade Document Hub</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {inquiry.documents.map((doc: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={doc.document_url || doc.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/20 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-colors">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{doc.document_name || doc.name || `Trade Doc ${idx + 1}`}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.document_type?.replace(/_/g, ' ') || 'Official Document'}</p>
                                                </div>
                                            </div>
                                            <Eye size={16} className="text-gray-300 group-hover:text-blue-500" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logistics Detail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Truck size={20} />
                                </div>
                                <h4 className="font-bold text-gray-900">Supply Timeline</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Schedule Type</span>
                                    <span className="text-xs font-bold text-gray-900 capitalize">{inquiry.timeline_type?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Frequency</span>
                                    <span className="text-xs font-bold text-gray-900">{inquiry.recurring_frequency || 'Single Shipment'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 space-y-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <h4 className="font-bold text-gray-900">Security & Inspection</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Inspection Required</span>
                                    <span className="text-xs font-bold text-gray-900">{inquiry.inspection_intent ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Matched Supplier</span>
                                    <span className="text-xs font-bold text-green-600">Verified Partner</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Context */}
                <div className="space-y-10">
                    {/* Contextual Action Card */}
                    {isSupplier && inquiry.status === 'pending' && (
                        <div className="bg-neutral-900 rounded-[40px] p-10 text-white space-y-8 shadow-2xl shadow-neutral-200">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">Action Required</h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">As the matched supplier, please acknowledge this inquiry to begin the formal trade process.</p>
                            </div>
                            <div className="space-y-3">
                                <Button
                                    onClick={handleAcknowledge}
                                    className="w-full bg-white text-neutral-900 hover:bg-neutral-200 rounded-2xl py-7 font-black flex items-center justify-center gap-2"
                                >
                                    <ThumbsUp size={18} />
                                    Acknowledge Trade
                                </Button>
                                <Button
                                    variant="outlined"
                                    className="w-full border-neutral-700 text-white hover:bg-neutral-800 rounded-2xl py-7 font-bold flex items-center justify-center gap-2"
                                >
                                    <ThumbsDown size={18} />
                                    Review / Decline
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="bg-gray-50 rounded-[40px] p-10 space-y-8 border border-gray-100">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-gray-400" />
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trade Lifecycle</h4>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-none" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{format(new Date(inquiry.createdAt), 'MMM d, yyyy')}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Inquiry submitted by Buyer</p>
                                    </div>
                                </div>
                                {inquiry.status !== 'pending' && (
                                    <div className="flex gap-4 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-none" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{format(new Date(), 'MMM d, yyyy')}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">Status updated to {inquiry.status}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200" />

                        <div className="space-y-4">
                            <p className="text-[10px] font-medium text-gray-400 leading-relaxed uppercase tracking-tight">Need technical assistance with this trade? Contact our 24/7 Desk at <span className="text-gray-900 font-bold">+1 (0) Trade Desk</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
