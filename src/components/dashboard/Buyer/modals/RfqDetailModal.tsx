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
    FileText,
    Image as ImageIcon,
    Video,
    Tag,
    Clock,
    Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface RfqDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    rfq: any;
}

const RfqDetailModal: React.FC<RfqDetailModalProps> = ({ isOpen, onClose, rfq }) => {
    const [selectedMedia, setSelectedMedia] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null);

    if (!isOpen || !rfq) return null;

    const renderAttachment = (att: any, index: number) => {
        const url = typeof att === 'string' ? att : att.url;
        const type = typeof att === 'string' ? 'unknown' : att.type;

        const isImage = type === 'image' || url.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        const isVideo = type === 'video' || url.match(/\.(mp4|mov|avi)$/i);

        const openMedia = (e: React.MouseEvent) => {
            e.preventDefault();
            if (isImage) {
                setSelectedMedia({ url, type: 'image' });
            } else if (isVideo) {
                setSelectedMedia({ url, type: 'video' });
            } else {
                window.open(url, '_blank');
            }
        };

        return (
            <div key={index} className="group relative bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-primary-300 cursor-pointer" onClick={openMedia}>
                {isImage ? (
                    <img src={url} alt={`Attachment ${index}`} className="w-full h-32 object-cover" />
                ) : isVideo ? (
                    <video src={url} className="w-full h-32 object-cover pointer-events-none" autoPlay muted loop playsInline />
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
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
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
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Tag className="text-primary-500" size={20} />
                            RFQ Details
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                <Hash size={12} /> {rfq.rfqId?.substring(0, 8).toUpperCase()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {format(new Date(rfq.createdAt), 'MMM dd, yyyy')}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

                    {/* Main Title Banner */}
                    <div className="bg-linear-to-r from-primary-50 to-white p-5 rounded-2xl border border-primary-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                                {rfq.rfqProductMainCategory} &gt; {rfq.rfqProductCategory}
                            </span>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">{rfq.rfqProductName}</h3>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${rfq.status === 'active' || rfq.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                {rfq.status?.toUpperCase() || 'DRAFT'}
                            </p>
                        </div>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Required Quantity</span>
                            <span className="text-xl font-bold text-gray-900">{rfq.quantityRequired} <small className="text-sm text-gray-500 font-normal">{rfq.quantityMeasure || 'Units'}</small></span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Delivery Period</span>
                            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Calendar size={14} className="text-primary-500" /> {rfq.deliveryPeriod || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center flex flex-col items-center justify-center">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Views</span>
                            <span className="text-xl font-bold text-primary-600">{rfq.viewCount || 0}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {rfq.rfqDescription && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Description / Requirements</h4>
                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl italic border border-gray-200">
                                "{rfq.rfqDescription}"
                            </p>
                        </div>
                    )}

                    {/* Specs Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Technical Specifications</h4>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 bg-white p-5 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Zap size={15} /> Purity Grade</span>
                                <span className="text-sm font-bold text-gray-900">{rfq.purity_grade || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Droplets size={15} /> Moisture Max</span>
                                <span className="text-sm font-bold text-gray-900">{rfq.moisture_max ? `${rfq.moisture_max}%` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><Package size={15} /> Packaging</span>
                                <span className="text-sm font-bold text-gray-900">{rfq.packaging || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-500 flex items-center gap-2"><FileText size={15} /> Sampling</span>
                                <span className="text-sm font-bold text-gray-900 capitalize">{rfq.sampling_method || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Trade Preferences */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Trade Preferences</h4>
                        <div className="flex gap-2 flex-wrap">
                            {rfq.inquiry_type && (
                                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 uppercase">
                                    {rfq.inquiry_type}
                                </span>
                            )}
                            {rfq.urgency_level && (
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase ${rfq.urgency_level === 'urgent' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                    {rfq.urgency_level} Priority
                                </span>
                            )}
                            {rfq.is_inspection_required && (
                                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
                                    Inspection Required
                                </span>
                            )}
                            {rfq.is_shipment_included && (
                                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                                    Shipment Included
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {rfq.attachments?.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Attachments & Media ({rfq.attachments.length})</h4>
                            <div className="grid grid-cols-4 gap-4">
                                {rfq.attachments.map((att: any, i: number) => renderAttachment(att, i))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex justify-end">
                    <Button
                        className="px-8 bg-gray-900 hover:bg-black text-white rounded-xl active:scale-95 transition-all"
                        onClick={onClose}
                    >
                        Close
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

export default RfqDetailModal;
