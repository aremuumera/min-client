"use client";

import React, { useState } from 'react';
import {
    X,
    Maximize2,
    Download,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    FileText,
    Play,
    CheckCircle2,
    Zap,
    Scale,
    Package,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortlistOfferMutation } from '@/redux/features/trade/trade_api';
import { toast } from '@/components/core/toaster';
import { formatNumberWithCommas } from '@/lib/number-format';

interface OfferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: any;
    rfq: any;
}

const OfferDetailModal = ({ isOpen, onClose, offer, rfq }: OfferDetailModalProps) => {
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [shortlist, { isLoading: isShortlisting }] = useShortlistOfferMutation();

    if (!isOpen || !offer) return null;

    const attachments = offer.attachments || [];
    const activeMedia = attachments[activeMediaIndex];

    const isImage = (url: string) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
    const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);
    const isPDF = (url: string) => /\.pdf$/i.test(url);

    const handleShortlist = async () => {
        try {
            await shortlist({ inquiryId: offer.id, is_shortlisted: true }).unwrap();
            toast.success(`${offer.supplier?.company} shortlisted successfully`);
        } catch (err) {
            toast.error('Failed to shortlist offer');
        }
    };

    return (
        <div className="fixed inset-0 z-12000 flex items-center justify-center p-4 lg:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white rounded-[48px] w-full max-w-7xl h-full max-h-[92vh] overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-white/20">

                {/* Media Gallery Section */}
                <div className="lg:w-3/5 bg-neutral-950 relative flex flex-col">
                    {/* Hero Display */}
                    <div className="flex-1 relative overflow-hidden group/hero">
                        {attachments.length > 0 ? (
                            <div className={`w-full h-full flex items-center justify-center transition-transform duration-500 ease-out ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                                onClick={() => setIsZoomed(!isZoomed)}>
                                {isVideo(activeMedia?.url) ? (
                                    <video src={activeMedia.url} className="max-w-full max-h-full" autoPlay muted loop controls />
                                ) : isPDF(activeMedia?.url) ? (
                                    <div className="flex flex-col items-center gap-6 text-white/40">
                                        <FileText size={120} strokeWidth={1} />
                                        <p className="text-xl font-bold uppercase tracking-widest">PDF Document</p>
                                        <a href={activeMedia.url} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-all border border-white/10 uppercase tracking-widest text-xs">
                                            Open in New Tab
                                        </a>
                                    </div>
                                ) : (
                                    <img src={activeMedia?.url} alt="" className="max-w-full max-h-full object-contain" />
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-4">
                                <Package size={80} strokeWidth={1} />
                                <p className="font-bold uppercase tracking-widest text-sm text-white/30">No Media Assets Provided</p>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="absolute top-8 left-8 flex gap-3 opacity-0 group-hover/hero:opacity-100 transition-opacity">
                            <button className="w-12 h-12 bg-black/40 hover:bg-black/60 rounded-2xl backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10">
                                <Maximize2 size={18} />
                            </button>
                            <a href={activeMedia?.url} download className="w-12 h-12 bg-black/40 hover:bg-black/60 rounded-2xl backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/10">
                                <Download size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {attachments.length > 1 && (
                        <div className="h-28 bg-black/20 border-t border-white/5 p-4 flex gap-3 overflow-x-auto overflow-y-hidden custom-scrollbar-horizontal scroll-smooth">
                            {attachments.map((att: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveMediaIndex(idx); setIsZoomed(false); }}
                                    className={`relative w-24 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeMediaIndex === idx ? 'border-green-500 scale-105 shadow-lg shadow-green-500/20' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                                >
                                    {isVideo(att.url) ? (
                                        <div className="w-full h-full relative">
                                            <video src={att.url} className="w-full h-full object-cover" muted />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play size={20} className="fill-white text-white" />
                                            </div>
                                        </div>
                                    ) : isPDF(att.url) ? (
                                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white/40">
                                            <FileText size={24} />
                                        </div>
                                    ) : (
                                        <img src={att.url} alt="" className="w-full h-full object-cover" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden p-8 lg:p-12">
                    <div className="flex justify-between items-start mb-10">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                    {offer.supplier?.logo ? (
                                        <img src={offer.supplier.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <Package size={24} className="text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">{offer.supplier?.company}</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">{offer.supplier?.name}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-3xl transition-all">
                            <X size={28} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-green-50 p-6 rounded-[32px] border border-green-100 space-y-1">
                                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">Offer Price</p>
                                <p className="text-xl font-black text-green-900 leading-none">
                                    {offer.currency === 'USD' ? '$' : '₦'}
                                    {formatNumberWithCommas(offer.unit_price)}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 space-y-1">
                                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Purity/Grade</p>
                                <p className="text-xl font-black text-blue-900 leading-none">{offer.purity_grade || 'High'}</p>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100 space-y-1">
                                <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Quantity</p>
                                <p className="text-xl font-black text-purple-900 leading-none">{formatNumberWithCommas(offer.quantity)} <span className="text-xs uppercase opacity-40">{offer.measure_type}</span></p>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100 space-y-1">
                                <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Moisture</p>
                                <p className="text-xl font-black text-orange-900 leading-none">{offer.moisture_max}% <span className="text-xs uppercase opacity-40">Max</span></p>
                            </div>
                        </div>

                        {/* Full Specs List */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.25em]">Detailed Specifications</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {[
                                    { label: 'Packaging Type', value: offer.packaging },
                                    { label: 'Sampling Protocol', value: offer.sampling_method },
                                    { label: 'Delivery Terms', value: offer.delivery_location || 'Port Access' },
                                    { label: 'Payment Terms', value: 'Trade Assurance' },
                                    { label: 'Mineral Source', value: offer.mineral_tag?.replace(/_/g, ' ') },
                                    { label: 'Inspection Policy', value: rfq?.is_inspection_required ? 'Required (Accepted)' : 'Not Required' },
                                ].map((spec, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{spec.label}</span>
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{spec.value || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Admin Trust Message */}
                        <div className="bg-gray-50 border border-gray-100 p-8 rounded-[40px] flex gap-6 mt-8">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                                <ShieldCheck size={28} className="text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Verified Supplier Network</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    This offer has been vetted by the Min-meg quality assurance team. By shortlisting, you authorize our trade desk to initiate direct communication and logistics verification for this specific batch.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-10 pt-10 border-t border-gray-50 flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={handleShortlist}
                            disabled={isShortlisting || offer.is_shortlisted}
                            className={`flex-1 ${offer.is_shortlisted ? 'bg-green-600' : 'bg-neutral-900'} text-white font-black py-8 rounded-[28px] text-lg uppercase tracking-widest shadow-xl shadow-black/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden group`}
                        >
                            {offer.is_shortlisted ? <CheckCircle2 size={24} /> : <Zap size={24} className="group-hover:text-yellow-400 group-hover:scale-110 transition-all" />}
                            {offer.is_shortlisted ? 'Shortlisted' : 'Shortlist & Open Spoke'}
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform ml-2" />
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            className="bg-white border-2 border-gray-100 text-gray-400 font-bold py-8 px-12 rounded-[28px] uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            Close Preview
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferDetailModal;
