"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    CheckCircle2,
    Scale,
    ShieldCheck,
    FileText,
    Maximize2,
    Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortlistOfferMutation } from '@/redux/features/trade/trade_api';
import { toast } from '@/components/core/toaster';
import { formatNumberWithCommas } from '@/lib/number-format';

interface OfferComparisonModalProps {
    isOpen?: boolean;
    open?: boolean;
    onClose: () => void;
    offers: any[];
    rfq?: any;
}

const OfferComparisonModal = ({ isOpen: isOpenProp, open: openProp, onClose, offers = [], rfq }: OfferComparisonModalProps) => {
    const isOpen = typeof isOpenProp === 'boolean' ? isOpenProp : Boolean(openProp);
    const [mounted, setMounted] = useState(false);
    const [shortlist, { isLoading: isShortlisting }] = useShortlistOfferMutation();
    const [activeMediaIndices, setActiveMediaIndices] = useState<Record<string, number>>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleMediaClick = (offerId: string, idx: number) => {
        setActiveMediaIndices(prev => ({ ...prev, [offerId]: idx }));
    };

    const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);
    const isPDF = (url: string) => /\.pdf$/i.test(url);

    const resolveSupplierInfo = (_offer: any, index: number) => {
        return { company: `Supplier #${index + 1}`, repName: '' };
    };

    const handleShortlist = async (offer: any, index: number) => {
        const inquiryId = offer.external_id || offer.id;
        const { company } = resolveSupplierInfo(offer, index);
        try {
            await shortlist({ inquiryId, is_shortlisted: !offer.is_shortlisted }).unwrap();
            toast.success(`${company} ${offer.is_shortlisted ? 'un-shortlisted' : 'shortlisted'} successfully`);
        } catch (err) {
            toast.error('Failed to update shortlist status');
        }
    };

    const specs = [
        { label: 'Purity / Grade', key: 'purity_grade' },
        { label: 'Max Moisture', key: 'moisture_max', suffix: '%' },
        { label: 'Offered Quantity', key: 'quantity', secondaryKey: 'measure_type', isNumber: true },
        { label: 'Packaging', key: 'packaging' },
        { label: 'Sampling Protocol', key: 'sampling_method' },
        { label: 'Offer Unit Price', key: 'unit_price', isNumber: true, isPrice: true },
        { label: 'Delivery Location', key: 'delivery_location' },
        { label: 'Timeline & Schedule', key: 'timeline_type', isTimeline: true },
        { label: 'Supplier Cover Note', key: 'description' },
        { label: 'Submitted Attachments', key: 'attachments', isAttachments: true },
    ];

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center sm:p-6 lg:p-8 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-30 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Scale size={24} className="text-green-600 shrink-0" />
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Side-by-Side Offer Comparison</h2>
                        </div>
                        <p className="text-xs text-gray-500 font-medium ml-9">
                            Comparing {offers.length} selected offers {rfq?.rfqProductName || rfq?.name ? `for ${rfq.rfqProductName || rfq.name}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Comparison Table Container */}
                <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-white">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200 border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="py-4 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest w-52 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-xs">
                                        Specification
                                    </th>
                                    {offers.map((offer, i) => {
                                        const { company, repName } = resolveSupplierInfo(offer, i);
                                        const offerKey = offer.external_id || offer.id || `offer-${i}`;
                                        return (
                                            <th key={offerKey} className="py-4 px-6 text-left min-w-[260px]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center shrink-0 text-green-600">
                                                        {offer.supplier?.logo ? (
                                                            <img src={offer.supplier.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            <Package size={18} />
                                                        )}
                                                    </div>
                                                    <div className="space-y-0.5 min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{company}</p>
                                                        {repName && <p className="text-[10px] text-gray-500 font-medium truncate">{repName}</p>}
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {specs.map((spec, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-white group-hover:bg-gray-50/50 z-20 border-r border-gray-200 shadow-xs">
                                            {spec.label}
                                        </td>
                                        {offers.map((offer, i) => {
                                            const offerKey = offer.external_id || offer.id || `offer-${i}`;
                                            const rawAttachments = offer.attachments || [];
                                            const attachments = typeof rawAttachments === 'string' ? JSON.parse(rawAttachments) : (Array.isArray(rawAttachments) ? rawAttachments : []);

                                            return (
                                                <td key={offerKey} className="py-4 px-6 min-w-[260px]">
                                                    <div className="space-y-3">
                                                        {spec.isAttachments ? (
                                                            <div className="space-y-2">
                                                                {attachments && attachments.length > 0 ? (
                                                                    <>
                                                                        {/* Column Hero */}
                                                                        <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative group/hero shadow-xs">
                                                                            {(() => {
                                                                                const activeIdx = activeMediaIndices[offerKey] || 0;
                                                                                const att = attachments[activeIdx] || attachments[0];
                                                                                const fileUrl = typeof att === 'string' ? att : (att.url || att.file_url || '');

                                                                                if (isVideo(fileUrl)) return <video src={fileUrl} className="w-full h-full object-cover" muted autoPlay loop />;
                                                                                if (isPDF(fileUrl)) return (
                                                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                                                                                        <FileText size={32} />
                                                                                        <span className="text-[10px] font-bold uppercase text-gray-500">PDF Document</span>
                                                                                    </div>
                                                                                );
                                                                                return <img src={fileUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover/hero:scale-105" />;
                                                                            })()}
                                                                            <a
                                                                                href={typeof attachments[activeMediaIndices[offerKey] || 0] === 'string' ? attachments[activeMediaIndices[offerKey] || 0] : (attachments[activeMediaIndices[offerKey] || 0]?.url || attachments[activeMediaIndices[offerKey] || 0]?.file_url)}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/hero:opacity-100 transition-opacity flex items-center justify-center"
                                                                            >
                                                                                <Maximize2 size={16} className="text-white" />
                                                                            </a>
                                                                        </div>

                                                                        {/* Media Thumbnails */}
                                                                        {attachments.length > 1 && (
                                                                            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                                                                {attachments.map((att: any, attIdx: number) => {
                                                                                    const fileUrl = typeof att === 'string' ? att : (att.url || att.file_url || '');
                                                                                    return (
                                                                                        <button
                                                                                            key={attIdx}
                                                                                            onClick={() => handleMediaClick(offerKey, attIdx)}
                                                                                            className={`w-9 h-7 rounded-lg border-2 transition-all shrink-0 overflow-hidden ${(activeMediaIndices[offerKey] || 0) === attIdx ? 'border-green-600' : 'border-gray-200 opacity-60'}`}
                                                                                        >
                                                                                            {isPDF(fileUrl) ? (
                                                                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500"><FileText size={10} /></div>
                                                                                            ) : (
                                                                                                <img src={fileUrl} className="w-full h-full object-cover" />
                                                                                            )}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 font-medium italic">No attachments</span>
                                                                )}
                                                            </div>
                                                        ) : spec.isTimeline ? (
                                                            <span className="text-xs font-bold text-gray-900 leading-snug block capitalize">
                                                                {offer.timeline_type === 'recurring'
                                                                    ? `Recurring: ${offer.recurring_frequency || ''} (${offer.recurring_duration || ''})`
                                                                    : (offer.lead_time_days ? `${offer.lead_time_days} days lead time` : 'Immediate delivery')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-900 tracking-tight block">
                                                                {spec.isPrice && (offer.currency === 'USD' ? '$' : '₦')}
                                                                {spec.isNumber && offer[spec.key] !== undefined && offer[spec.key] !== null
                                                                    ? formatNumberWithCommas(offer[spec.key])
                                                                    : (offer[spec.key] || (spec.key === 'delivery_location' ? `${offer.delivery_state || offer.delivery_address || 'N/A'}, ${offer.delivery_country || 'Nigeria'}` : '-'))}
                                                                {offer[spec.key] && spec.suffix}
                                                                {spec.secondaryKey && offer[spec.secondaryKey] ? ` ${offer[spec.secondaryKey]}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}

                                {/* Status Row */}
                                <tr className="bg-gray-50/50">
                                    <td className="py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50/50 z-20 border-r border-gray-200 shadow-xs">
                                        Status
                                    </td>
                                    {offers.map((offer, i) => (
                                        <td key={offer.external_id || offer.id || i} className="py-4 px-6 min-w-[260px]">
                                            <span className={`px-2.5 py-1 border rounded-md text-[11px] font-bold uppercase ${offer.is_shortlisted ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {offer.is_shortlisted ? 'Shortlisted' : (offer.status || 'Pending')}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 bg-green-50 border border-green-200 p-5 rounded-2xl flex gap-4">
                        <ShieldCheck size={24} className="text-green-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-green-900 uppercase tracking-wider">Trade Desk Brokered Comparison</h4>
                            <p className="text-xs text-green-800/80 leading-relaxed font-medium">
                                Shortlisting an offer signals your interest to the Min-meg Trade Desk to prioritize terms with that supplier.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
                    <Button onClick={onClose} variant="outlined" className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold border-gray-200 hover:bg-gray-100 text-gray-700 text-xs">
                        Close
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {offers.map((offer, i) => {
                            const { company } = resolveSupplierInfo(offer, i);
                            return (
                                <Button
                                    key={offer.external_id || offer.id || i}
                                    onClick={() => handleShortlist(offer, i)}
                                    disabled={isShortlisting}
                                    className={`w-full sm:w-auto ${offer.is_shortlisted ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs`}
                                >
                                    {offer.is_shortlisted ? <CheckCircle2 size={14} /> : null}
                                    {offer.is_shortlisted ? 'Shortlisted' : `Shortlist ${company}`}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default OfferComparisonModal;
