"use client";

import React from 'react';
import {
    X,
    CheckCircle2,
    Scale,
    Truck,
    ShieldCheck,
    Zap,
    AlertCircle,
    Package,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortlistOfferMutation } from '@/redux/features/trade/trade_api';
import { toast } from '@/components/core/toaster';
import { formatNumberWithCommas } from '@/lib/number-format';

interface OfferComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    offers: any[];
    rfq: any;
}

const OfferComparisonModal = ({ isOpen, onClose, offers, rfq }: OfferComparisonModalProps) => {
    const [shortlist, { isLoading: isShortlisting }] = useShortlistOfferMutation();

    if (!isOpen) return null;

    const handleShortlist = async (inquiryId: string, company: string) => {
        try {
            await shortlist({ inquiryId, is_shortlisted: true }).unwrap();
            toast.success(`${company} shortlisted successfully`);
        } catch (err) {
            toast.error('Failed to shortlist offer');
        }
    };

    const specs = [
        { label: 'Purity / Grade', key: 'purity_grade' },
        { label: 'Max Moisture', key: 'moisture_max', suffix: '%' },
        { label: 'Quantity', key: 'quantity', secondaryKey: 'measure_type', isNumber: true },
        { label: 'Packaging', key: 'packaging' },
        { label: 'Sampling Protocol', key: 'sampling_method' },
        { label: 'Offer Price', key: 'unit_price', isNumber: true, isPrice: true },
        { label: 'Total Value', key: 'total_value', isNumber: true, isPrice: true },
        { label: 'Attachments', key: 'attachments', isAttachments: true },
    ];

    return (
        <div className="fixed inset-0 z-11000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">

                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Scale size={24} className="text-green-600" />
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Side-by-Side Comparison</h2>
                        </div>
                        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest ml-9">RFQ: {rfq?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="flex-1 overflow-x-auto p-8 custom-scrollbar">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr>
                                    <th className="py-6 px-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] w-1/4">Feature</th>
                                    {offers.map(offer => (
                                        <th key={offer.id} className="py-6 px-6 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                                                    {offer.supplier?.logo ? (
                                                        <img src={offer.supplier.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <Package size={18} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black text-gray-900 uppercase">{offer.supplier?.company}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{offer.supplier?.name}</p>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {specs.map((spec, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/30 transition-colors">
                                        <td className="py-6 px-4 text-xs font-bold text-gray-600 uppercase tracking-widest">{spec.label}</td>
                                        {offers.map(offer => (
                                            <td key={offer.id} className="py-6 px-6">
                                                <div className="flex items-center gap-2">
                                                    {spec.isAttachments ? (
                                                        <div className="flex flex-wrap gap-2 max-w-[200px]">
                                                            {offer.attachments?.map((att: any, idx: number) => {
                                                                const isVideo = att.url?.toLowerCase().endsWith('.mp4') || att.type?.startsWith('video/');
                                                                return (
                                                                    <div key={idx} className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden relative group/att">
                                                                        {isVideo ? (
                                                                            <video src={att.url} className="w-full h-full object-cover" muted />
                                                                        ) : (
                                                                            <img src={att.url} alt="" className="w-full h-full object-cover" />
                                                                        )}
                                                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <Zap size={10} className="text-white" />
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                            {(!offer.attachments || offer.attachments.length === 0) && <span className="text-xs text-gray-400">None</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {spec.isPrice && (offer.currency === 'USD' ? '$' : '₦')}
                                                            {spec.isNumber ? formatNumberWithCommas(offer[spec.key]) : (offer[spec.key] || '-')}
                                                            {offer[spec.key] && spec.suffix}
                                                            {spec.secondaryKey && ` ${offer[spec.secondaryKey]}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {/* Status Row */}
                                <tr className="bg-gray-50/30">
                                    <td className="py-6 px-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Inquiry Status</td>
                                    {offers.map(offer => (
                                        <td key={offer.id} className="py-6 px-6">
                                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                {offer.status}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-12 bg-blue-50/50 border border-blue-100 p-8 rounded-[32px] flex gap-6">
                        <ShieldCheck size={32} className="text-blue-600 shrink-0" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Admin Brokered Comparison</h4>
                            <p className="text-xs text-blue-800/70 leading-relaxed max-w-3xl">
                                These offers are verified through the Min-meg orchestrator. Shortlisting an offer will notify the Admin to open a dedicated negotiation spoke with that supplier. You retain full control over final acceptance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-end items-center gap-4">
                    <Button onClick={onClose} variant="outlined" className="px-8 py-6 rounded-2xl font-bold border-gray-200 hover:bg-gray-100 text-gray-600">
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {offers.map(offer => (
                            <Button
                                key={offer.id}
                                onClick={() => handleShortlist(offer.id, offer.supplier?.company)}
                                disabled={isShortlisting || offer.is_shortlisted}
                                className={`${offer.is_shortlisted ? 'bg-green-600' : 'bg-neutral-900'} text-white font-bold px-6 py-4 rounded-2xl group hover:bg-neutral-800 transition-all flex items-center gap-2 text-xs`}
                            >
                                {offer.is_shortlisted ? <CheckCircle2 size={14} /> : null}
                                {offer.is_shortlisted ? 'Shortlisted' : `Shortlist ${offer.supplier?.company.split(' ')[0]}`}
                                {!offer.is_shortlisted && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferComparisonModal;
