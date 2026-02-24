'use client';

import React from 'react';
import {
    X,
    Download,
    Calendar,
    MapPin,
    Package,
    Droplets,
    Zap,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortlistRfqOfferMutation } from '@/redux/features/trade/trade_api';
import { useAlert } from '@/providers';
import { Loader2 } from 'lucide-react';

interface OfferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: any;
}

const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ isOpen, onClose, offer }) => {
    const [shortlistOffer, { isLoading }] = useShortlistRfqOfferMutation();
    const { showAlert } = useAlert();
    const [selectedMedia, setSelectedMedia] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null);

    if (!isOpen || !offer) return null;

    const isShortlisted = offer.is_shortlisted;

    const handleShortlist = async () => {
        try {
            await shortlistOffer({
                offerId: offer.external_id || offer.id,
                is_shortlisted: !isShortlisted
            }).unwrap();
            showAlert(isShortlisted ? 'Removed from shortlist' : 'Offer shortlisted successfully', 'success');
        } catch (err: any) {
            showAlert(err?.data?.message || 'Failed to update shortlist status', 'error');
        }
    };

    const renderAttachment = (att: any, index: number) => {
        const isImage = att.type === 'image' || att.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        const isVideo = att.type === 'video' || att.url.match(/\.(mp4|mov|avi)$/i);
        const isPdf = att.type === 'document' || att.url.match(/\.(pdf)$/i);

        const openMedia = (e: React.MouseEvent) => {
            e.preventDefault();
            if (isImage) {
                setSelectedMedia({ url: att.url, type: 'image' });
            } else if (isVideo) {
                setSelectedMedia({ url: att.url, type: 'video' });
            } else {
                window.open(att.url, '_blank');
            }
        };

        return (
            <div key={index} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-primary-300 cursor-pointer" onClick={openMedia}>
                {isImage ? (
                    <img src={att.url} alt={`Attachment ${index}`} className="w-full h-32 object-cover" />
                ) : isVideo ? (
                    <video src={att.url} className="w-full h-32 object-cover pointer-events-none" autoPlay muted loop playsInline />
                ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                        <FileText className="text-gray-400" size={32} />
                    </div>
                )}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all pointer-events-none">
                        <Video className="text-white opacity-80 z-10" size={32} />
                    </div>
                )}
                <div className="p-2 flex justify-between items-center bg-white border-t border-gray-100 absolute bottom-0 w-full z-20">
                    <span className="text-[10px] font-medium text-gray-500 truncate max-w-[100px]">
                        {isImage ? 'Image' : isVideo ? 'Video' : 'Document'}
                    </span>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                        <Download size={14} className="text-primary-600" />
                    </a>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Offer Detail</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Reference: {offer.external_id?.substring(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                    {/* Supplier Section */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-bold text-xl uppercase">
                            {offer.supplier?.company_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                {offer.supplier?.company_name || 'Supplier'}
                                <CheckCircle2 className="text-green-500" size={18} />
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {offer.delivery_country}, {offer.delivery_state}</span>
                                <span>•</span>
                                <span>Member since 2023</span>
                            </div>
                        </div>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Offered Quantity</span>
                            <span className="text-lg font-bold text-gray-900">{offer.quantity} <small className="text-xs text-gray-500 font-normal">{offer.measure_type}</small></span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Unit Price</span>
                            <span className="text-lg font-bold text-primary-600">{offer.currency === 'USD' ? '$' : '₦'}{Number(offer.unit_price).toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Total Value</span>
                            <span className="text-lg font-bold text-gray-900">{offer.currency === 'USD' ? '$' : '₦'}{(offer.quantity * offer.unit_price).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Specs Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Technical Specifications</h4>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 bg-white p-5 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Zap size={15} /> Purity Grade</span>
                                <span className="text-sm font-bold text-gray-900">{offer.purity_grade || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Droplets size={15} /> Moisture Max</span>
                                <span className="text-sm font-bold text-gray-900">{offer.moisture_max ? `${offer.moisture_max}%` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Package size={15} /> Packaging</span>
                                <span className="text-sm font-bold text-gray-900">{offer.packaging || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={15} /> Timeline</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">{offer.timeline_type}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {offer.description && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Additional Description</h4>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl italic">
                                "{offer.description}"
                            </p>
                        </div>
                    )}

                    {/* Attachments Section */}
                    {offer.attachments?.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Attachments & Media</h4>
                            <div className="grid grid-cols-4 gap-4">
                                {offer.attachments.map((att: any, i: number) => renderAttachment(att, i))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex gap-4">
                    <Button
                        onClick={handleShortlist}
                        variant={isShortlisted ? "contained" : "outlined"}
                        className={`flex-1 h-12 text-base font-bold rounded-xl transition-all border ${isShortlisted ? 'bg-yellow-500 hover:bg-yellow-600 active:scale-95 border-yellow-600' : 'hover:bg-primary-50 border-gray-300'}`}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isShortlisted ? 'Un-shortlist Offer' : 'Shortlist Offer'}
                    </Button>
                    <Button
                        className="flex-1 h-12 text-base font-bold bg-gray-900 hover:bg-black text-white rounded-xl active:scale-95 transition-all"
                        onClick={onClose}
                    >
                        Close Details
                    </Button>
                </div>
            </div>

            {/* Media Expand Modal */}
            {selectedMedia && (
                <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedMedia(null)}>
                    <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors" onClick={() => setSelectedMedia(null)}>
                        <X size={24} />
                    </button>
                    <div className="max-w-5xl max-h-[90vh] w-full flex justify-center object-contain" onClick={(e) => e.stopPropagation()}>
                        {selectedMedia.type === 'image' ? (
                            <img src={selectedMedia.url} alt="Expanded Media" className="max-w-full max-h-[90vh] object-contain rounded-lg border border-gray-700" />
                        ) : (
                            <video src={selectedMedia.url} className="max-w-full max-h-[90vh] rounded-lg border border-gray-700" controls autoPlay playsInline />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfferDetailModal;
