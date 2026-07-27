"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useGetTradeInquiryQuery,
    useAcknowledgeInquiryMutation
} from '@/redux/features/trade/trade_api';
import { useSelector } from 'react-redux';
import {
    MapPin,
    MessageSquare,
    ThumbsUp,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    FileCheck,
    FileText,
    Eye,
    Package,
    Tag,
    UserCheck,
    Building2,
    Layers,
    ExternalLink,
    Box
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/core/toaster';
import { cn } from '@/utils/helper';
import { paths } from '@/config/paths';
import { TradeStageTracker } from '@/components/dashboard/trade-stage-tracker';

export default function TradeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tradeId = params?.id as string;

    const { user } = useSelector((state: any) => state.auth);
    const { data: inquiryResult, isLoading, refetch } = useGetTradeInquiryQuery(tradeId);
    const [acknowledge] = useAcknowledgeInquiryMutation();

    const inquiry = inquiryResult?.data;
    const isSupplier = user?.role === 'supplier';
    const isBuyer = user?.role === 'buyer' || user?.id === inquiry?.user_id;

    const handleAcknowledge = async () => {
        try {
            await acknowledge(tradeId).unwrap();
            toast.success('Inquiry acknowledged successfully');
            refetch();
        } catch (err) {
            toast.error('Failed to acknowledge inquiry');
        }
    };

    if (isLoading) return <div className="p-20 text-center text-gray-400 font-bold">Loading Trade Details...</div>;
    if (!inquiry) return <div className="p-20 text-center text-red-500 font-bold">Trade reference not found.</div>;

    const product = inquiry.product;
    const targetProductId = product?.id || inquiry.product_id;
    const rawSlug = product?.product_name || inquiry.item_name || 'details';
    const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'details';
    const productDetailsUrl = targetProductId ? paths.marketplace.productDetails(targetProductId, cleanSlug) : '#';

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-white min-h-screen">
            {/* Header / Top Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                        title="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            <span>Trade Reference</span>
                            <ChevronRight size={10} />
                            <span className="text-emerald-700 font-mono">#{inquiry.external_id?.toUpperCase()}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Trade Details</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {targetProductId && (
                        <Link
                            href={productDetailsUrl}
                            target="_blank"
                            className="bg-white border border-gray-300 text-gray-800 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm"
                        >
                            <ExternalLink size={16} className="text-emerald-600" />
                            View Product Page
                        </Link>
                    )}
                    <Link
                        href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.firebase_room_id}/${inquiry.external_id}`}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors text-sm"
                    >
                        <MessageSquare size={16} />
                        Open Trade Room
                    </Link>
                </div>
            </div>

            {/* Trade Progress Stepper */}
            <TradeStageTracker inquiryId={inquiry.id} currentStatus={inquiry.status} />

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (2 Cols): Inquiry Specs vs Product Information */}
                <div className="lg:col-span-2 space-y-8">

                    {/* SECTION 1: BUYER INQUIRY SPECIFICATIONS */}
                    <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                                    <Package size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Buyer Inquiry Specifications</h2>
                                    <p className="text-xs text-gray-500 font-medium">Requirements submitted by buyer for this trade</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                                {inquiry.status}
                            </span>
                        </div>

                        {/* Primary Inquiry Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-white rounded-xl border border-gray-200">
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">Target Mineral</span>
                                <span className="text-sm font-black text-gray-900 capitalize block truncate">
                                    {inquiry.item_name || inquiry.mineral_tag?.replace(/_/g, ' ')}
                                </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-gray-200">
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">Required Quantity</span>
                                <span className="text-sm font-black text-gray-900 block">
                                    {inquiry.quantity} <span className="text-xs text-gray-400 font-bold">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                                </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-gray-200">
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">Grade / Purity</span>
                                <span className="text-sm font-black text-gray-900 block">
                                    {inquiry.purity_grade || inquiry.preferred_grade || 'Standard'}
                                </span>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-gray-200">
                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5">Order Urgency</span>
                                <span className={cn("text-sm font-black block uppercase", inquiry.priority === 'urgent' ? 'text-red-600' : 'text-gray-900')}>
                                    {inquiry.priority || 'Standard'}
                                </span>
                            </div>
                        </div>

                        {/* Inquiry Logistics & Address */}
                        <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">Delivery Destination & Address</span>
                                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">
                                        {inquiry.delivery_address ? `${inquiry.delivery_address}, ` : ''}
                                        {inquiry.delivery_location}, {inquiry.delivery_state}, {inquiry.delivery_country}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
                                <div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Supply Timeline</span>
                                    <span className="font-bold text-gray-800 capitalize">{inquiry.timeline_type?.replace(/_/g, ' ') || 'Immediate'}</span>
                                </div>
                                {inquiry.moisture_max && (
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Max Moisture</span>
                                        <span className="font-bold text-gray-800">{inquiry.moisture_max}%</span>
                                    </div>
                                )}
                                {inquiry.packaging && (
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Packaging Requested</span>
                                        <span className="font-bold text-gray-800">{inquiry.packaging}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Buyer Specific Notes */}
                        {inquiry.description && (
                            <div className="p-4 bg-white rounded-xl border border-gray-200">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">Buyer Notes & Instructions</span>
                                <p className="text-xs sm:text-sm text-gray-700 italic font-medium leading-relaxed">
                                    "{inquiry.description}"
                                </p>
                            </div>
                        )}
                    </section>


                    {/* SECTION 2: TARGET PRODUCT INFORMATION */}
                    {product ? (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Target Product Information</h2>
                                        <p className="text-xs text-gray-500 font-medium">Marketplace listing details and product specifications</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={productDetailsUrl}
                                        target="_blank"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
                                    >
                                        <ExternalLink size={14} />
                                        View Product Details Page
                                    </Link>
                                </div>
                            </div>

                            {/* Product Header Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    <Tag size={14} />
                                    {product.product_main_category || 'Minerals'} &gt; {product.product_category || 'Mineral Ore'} &gt; {product.product_sub_category || product.category_tag}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 leading-snug">
                                    {product.product_name}
                                </h3>
                                {product.productHeaderDescription && (
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-l-2 border-slate-300 pl-3">
                                        {product.productHeaderDescription}
                                    </p>
                                )}
                            </div>

                            {/* Product Financials */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Marketplace Selling Price</span>
                                    <span className="text-base font-black text-emerald-900">
                                        {product.unitCurrency === 'USD' ? '$' : '₦'}{Number(product.display_price || product.real_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        <span className="text-xs font-normal text-gray-500 ml-1">/ {product.measure || inquiry.measure_type}</span>
                                    </span>
                                </div>
                                {product.prev_price && (
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Prev List Price</span>
                                        <span className="text-base font-black text-red-600 line-through">
                                            {product.unitCurrency === 'USD' ? '$' : '₦'}{Number(product.prev_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">Available Supply</span>
                                    <span className="text-base font-black text-gray-900">
                                        {Number(product.quantity || 0).toLocaleString()} <span className="text-xs font-medium text-gray-500">{product.measure}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Product Technical Specs Grid */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Technical & Material Specs</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    {product.purity_grade && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Certified Grade</span>
                                            <span className="font-bold text-gray-900">{product.purity_grade}</span>
                                        </div>
                                    )}
                                    {product.composition && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 col-span-2">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Chemical Composition</span>
                                            <span className="font-bold text-gray-900">{product.composition}</span>
                                        </div>
                                    )}
                                    {product.color && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Color / Form</span>
                                            <span className="font-bold text-gray-900">{product.color}</span>
                                        </div>
                                    )}
                                    {product.hardness && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Hardness</span>
                                            <span className="font-bold text-gray-900">{product.hardness}</span>
                                        </div>
                                    )}
                                    {product.selected_country_name && (
                                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Origin</span>
                                            <span className="font-bold text-gray-900">{product.selected_state ? `${product.selected_state}, ` : ''}{product.selected_country_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    ) : (
                        <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-500">
                            Custom RFQ Inquiry (Direct Buyer Specification Posting)
                        </div>
                    )}

                    {/* Media & Attachments Section */}
                    {inquiry.documents && inquiry.documents.length > 0 && (
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <FileCheck size={18} className="text-emerald-600" />
                                <h3 className="text-base font-bold text-gray-900">Trade Documents</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {inquiry.documents.map((doc: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={doc.document_url || doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between group text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <FileText size={16} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
                                            <span className="font-bold text-gray-900 truncate">{doc.document_name || doc.name || `Document #${idx + 1}`}</span>
                                        </div>
                                        <Eye size={14} className="text-gray-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Right Column: Counterparties & Action Sidebar */}
                <div className="space-y-6">

                    {/* Supplier Action Panel */}
                    {isSupplier && (inquiry.status === 'PENDING' || inquiry.status === 'pending') && (
                        <div className="rounded-2xl border border-gray-900 bg-gray-900 p-6 text-white space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-extrabold">Supplier Action Required</h3>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Please acknowledge this trade inquiry to open negotiations and proceed with Min-meg Trade Desk.
                                </p>
                            </div>
                            <Button
                                onClick={handleAcknowledge}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
                            >
                                <ThumbsUp size={16} />
                                Acknowledge Inquiry
                            </Button>
                        </div>
                    )}

                    {/* Verified Parties Box (Privacy Safe) */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-gray-100 pb-2">
                            Assigned Trade Desk
                        </span>

                        <div className="space-y-3">
                            {/* Min-meg Trade Desk */}
                            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                                <div className="p-2 bg-emerald-600 text-white rounded-lg font-bold text-xs">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="text-xs">
                                    <span className="font-extrabold text-emerald-900 block">Min-meg Trade Desk</span>
                                    <span className="text-[10px] font-medium text-emerald-700">Official Trade Coordinator</span>
                                </div>
                            </div>

                            {/* Supplier Identity (Render if matched) */}
                            {(inquiry.matched_supplier_id || inquiry.supplier || product?.supplierId) ? (
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                                    <div className="p-2 bg-gray-200 text-gray-600 rounded-lg">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Matched Supplier</span>
                                        <span className="font-bold text-gray-900 block">
                                            {isBuyer
                                                ? 'Min-meg Verified Supplier'
                                                : (inquiry.supplier?.company_name || 'Verified Supplier')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-gray-50/50 border border-dashed border-gray-200 flex items-center gap-3 opacity-70">
                                    <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Matched Supplier</span>
                                        <span className="text-xs font-bold text-gray-500 italic">Matching in Progress</span>
                                    </div>
                                </div>
                            )}

                            {/* Inspector Identity (ONLY show if Min-meg Admin has assigned an inspector) */}
                            {(inquiry.matched_inspector_id || inquiry.inspector) && (
                                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center gap-3">
                                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                                        <UserCheck size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <span className="text-[9px] font-bold text-purple-700 uppercase block">Appointed Inspector</span>
                                        <span className="font-bold text-purple-950 block">
                                            {isBuyer
                                                ? 'Min-meg Appointed Inspector'
                                                : (inquiry.inspector?.company_name || 'Assigned Inspector')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links & Product Navigation */}
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-3 text-xs">
                        <span className="font-bold text-gray-900 block">Product & Trade Navigation</span>
                        <p className="text-gray-500 leading-relaxed">
                            View the original product listing on the marketplace or open the active trade chat room.
                        </p>
                        <div className="space-y-2 pt-1">
                            {targetProductId && (
                                <Link
                                    href={productDetailsUrl}
                                    target="_blank"
                                    className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors block text-center"
                                >
                                    <Box size={14} />
                                    View Full Product Page
                                </Link>
                            )}
                            <Link
                                href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.firebase_room_id}/${inquiry.external_id}`}
                                className="w-full bg-white border border-gray-300 text-gray-900 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors block text-center"
                            >
                                <MessageSquare size={14} className="text-emerald-600" />
                                Go to Trade Room
                            </Link>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
