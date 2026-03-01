"use client";

import React from 'react';
import { useGetMyRfqOffersQuery } from '@/redux/features/trade/trade_api';
import {
    Clock,
    Box,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Search,
    Info,
    Copy,
    Check,
    MapPin,
    Zap,
    MoreVertical,
    Eye,
    MessageSquare,
    DollarSign,
    Trophy,
    FileText,
    Image,
    Package,
    Truck,
    Calendar,
    ChevronRight,
    Paperclip
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableContainer,
} from '@/components/ui/table';
import { Drawer } from '@/components/ui/drawer';
import { Menu, MenuItem } from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Typography } from '@/components/ui/typography';

const CopyableId = ({ id }: { id: string }) => {
    const [copied, setCopied] = React.useState(false);
    const fullId = id?.toUpperCase() || '';
    const shortId = fullId.length > 12 ? `${fullId.substring(0, 8)}...` : fullId;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(fullId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group/id relative flex items-center gap-2 w-fit">
            <span
                className="font-mono text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md cursor-help"
                title={fullId}
            >
                #{shortId}
            </span>
            <button
                onClick={handleCopy}
                className=" p-1 hover:bg-gray-100 rounded-md transition-all text-gray-400 hover:text-green-600"
                title="Copy reference ID"
            >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            </button>
        </div>
    );
};

const StatusBadge = ({ status, isShortlisted }: { status: string; isShortlisted?: boolean }) => {
    // Priority: If shortlisted, show that prominently
    if (isShortlisted && status !== 'accepted' && status !== 'rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border bg-indigo-100/50 text-indigo-700 border-indigo-200">
                <Trophy size={10} />
                Shortlisted
            </span>
        );
    }

    const configs: Record<string, { label: string; className: string; icon: any; color: string }> = {
        pending: { label: 'Pending Review', className: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: Clock, color: 'amber' },
        accepted: { label: 'Accepted', className: 'bg-green-100/50 text-green-700 border-green-200', icon: CheckCircle2, color: 'green' },
        rejected: { label: 'Declined', className: 'bg-red-100/50 text-red-700 border-red-200', icon: AlertCircle, color: 'red' },
        withdrawn: { label: 'Superseded', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: RefreshCw, color: 'gray' },
    };

    const config = configs[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle, color: 'gray' };
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${config.className}`}>
            <Icon size={10} />
            {config.label}
        </span>
    );
};

const DetailDrawer = ({ isOpen, onClose, offer }: { isOpen: boolean; onClose: () => void; offer: any }) => {
    if (!offer) return null;

    const currencySymbol = offer.currency === 'USD' ? '$' : '₦';

    return (
        <Drawer open={isOpen} onClose={onClose} anchor="right" className="w-full sm:w-[500px]">
            <div className="flex flex-col h-full bg-white font-sans">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex flex-col gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Offer Details</h2>
                        <StatusBadge status={offer.status} isShortlisted={offer.is_shortlisted} />
                    </div>
                    <CopyableId id={offer.external_id} />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Supplier Feedback / Notes */}
                    {offer.description && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-gray-100 flex-1" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Supplier Message</h3>
                                <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="bg-emerald-50/30 border border-emerald-100/50 p-6 rounded-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <MessageSquare size={40} className="text-emerald-500" />
                                </div>
                                <p className="text-sm text-emerald-900 leading-relaxed font-medium relative z-10 italic">
                                    "{offer.description}"
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Media Gallery */}
                    {(() => {
                        const rawAttachments = offer.attachments || [];
                        const attachments = Array.isArray(rawAttachments) ? rawAttachments : (typeof rawAttachments === 'string' ? JSON.parse(rawAttachments) : []);
                        if (attachments.length === 0) return null;

                        return (
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px bg-gray-100 flex-1" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Uploaded Media</h3>
                                    <div className="h-px bg-gray-100 flex-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {attachments.map((file: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group relative aspect-video rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex flex-col items-center justify-center hover:border-emerald-300 transition-all shadow-sm"
                                        >
                                            {file.type === 'image' || file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                <img src={file.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            ) : file.type === 'video' || file.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                <div className="flex flex-col items-center text-emerald-600">
                                                    <Zap size={24} />
                                                    <span className="text-[9px] font-bold mt-1 uppercase">Video</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-400 p-2 text-center group-hover:text-emerald-500">
                                                    <FileText size={24} />
                                                    <span className="text-[9px] font-bold mt-1 truncate w-full px-2">{file.name || 'Document'}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-white/90 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-opacity">
                                                    <Eye size={14} />
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        );
                    })()}

                    {/* Technical Specs */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Technical Specifications</h3>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-none">
                                    <Box size={18} className="text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Quantity Allocation</p>
                                    <p className="text-sm font-bold text-gray-900">{offer.quantity} {offer.measure_type}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 p-5 rounded-2xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Purity/Grade</p>
                                    <p className="text-sm font-bold text-gray-900">{offer.purity_grade || 'Standard'}</p>
                                </div>
                                <div className="bg-white border border-gray-100 p-5 rounded-2xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Moisture Max</p>
                                    <p className="text-sm font-bold text-gray-900">{offer.moisture_max ? `${offer.moisture_max}%` : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 p-5 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Package size={16} className="text-amber-500" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Packaging Logistics</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{offer.packaging_details || 'Standard Bulk Cargo'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Logistics & Timeline */}
                    <section className="space-y-6 text-emerald-900">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Logistics & Timeline</h3>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <MapPin size={20} className="text-red-500 flex-none mt-1" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Full Delivery Address</p>
                                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                                        {offer.delivery_address || 'TBD'}
                                        <br />
                                        <span className="text-gray-500 font-medium">{offer.delivery_location}, {offer.delivery_state}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-3">
                                    <Calendar size={18} className="text-blue-500" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Lead Time</p>
                                        <p className="text-sm font-bold text-gray-900">{offer.timeline || 'Immediate'}</p>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-3">
                                    <Truck size={18} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Mode</p>
                                        <p className="text-sm font-bold text-gray-900">Trucking</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Buyer RFQ Attachments (Context for the supplier) */}
                    {(() => {
                        const rfqAttachments = offer.rfq?.attachments || offer.rfq?.documents || [];
                        const attachments = Array.isArray(rfqAttachments) ? rfqAttachments : (typeof rfqAttachments === 'string' ? JSON.parse(rfqAttachments) : []);
                        if (attachments.length === 0) return null;

                        return (
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <Paperclip size={14} className="text-gray-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Buyer RFQ Reference Media</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((file: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center gap-2"
                                        >
                                            <FileText size={12} />
                                            <span className="truncate max-w-[120px]">{file.name || `Attachment ${idx + 1}`}</span>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        );
                    })()}

                    {/* Timeline Footer */}
                    <div className="pt-10 border-t border-gray-50 opacity-60">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-400">Submitted on {format(new Date(offer.createdAt), 'PPPP p')}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 flex flex-col gap-4 bg-white/80 backdrop-blur-sm sticky bottom-0 shrink-0">
                    <div className="flex gap-4">
                        <Button variant="outlined" onClick={onClose} className="flex-1 rounded-2xl py-6 font-bold border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all">
                            Return
                        </Button>
                        <Link
                            href={`/dashboard/chat/rfq/${offer.firebase_room_id}/${offer.rfq_id}`}
                            className="flex-3 bg-green-600 text-white rounded-2xl flex items-center justify-center px-10 font-bold hover:bg-green-700 transition-all border border-green-700/10"
                        >
                            Enter RFQ Room
                        </Link>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default function MySubmittedOffers() {
    const { data, isLoading } = useGetMyRfqOffersQuery(undefined, {
        refetchOnMountOrArgChange: true
    });
    const [selectedOffer, setSelectedOffer] = React.useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const allOffers = data?.data || [];
    const offers = searchTerm.trim()
        ? allOffers.filter((off: any) => {
            const term = searchTerm.toLowerCase();
            return (
                off.external_id?.toLowerCase().includes(term) ||
                off.rfq?.rfqProductName?.toLowerCase().includes(term) ||
                off.delivery_location?.toLowerCase().includes(term)
            );
        })
        : allOffers;

    const handleViewDetail = (offer: any) => {
        setSelectedOffer(offer);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Bids</h1>
                        <span className="bg-green-600/10 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">RFQ Offers</span>
                    </div>
                    <p className="text-gray-500 font-medium">Track all quotes sent to buyers for their RFQs.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find by ref or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-gray-100/50 border-none pl-12 pr-6 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 outline-none w-full md:w-72 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <TableContainer className="max-h-[calc(100vh-300px)]">
                    <Table>
                        <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-8">Reference</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4">RFQ Product</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4">Your Price</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 hidden md:table-cell">Total Value</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 text-right sticky right-0 bg-gray-50/50 backdrop-blur-sm z-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell colSpan={6} className="py-8 px-8">
                                            <div className="h-6 bg-gray-100 rounded-lg w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : offers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                <DollarSign size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-gray-900">No Bids Submitted</h3>
                                                <p className="text-gray-400 text-sm">Once you submit an offer for an RFQ, it will appear here.</p>
                                            </div>
                                            <Link href="/dashboard/products/rfq-products" className="mt-4 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all text-sm">
                                                Browse Live RFQs
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                offers.map((offer: any, index: number) => {
                                    const symbol = offer.currency === 'USD' ? '$' : '₦';
                                    return (
                                        <TableRow key={offer.id || index} className="group hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-5 px-8">
                                                <CopyableId id={offer.external_id} />
                                            </TableCell>
                                            <TableCell className="py-5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 capitalize">{offer.rfq?.rfqProductName}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium font-mono">RFQ REf: {offer.rfq?.rfqId?.substring(0, 8).toUpperCase()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{symbol}{Number(offer.unit_price).toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">/ {offer.measure_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-4 hidden md:table-cell font-bold text-gray-700">
                                                {symbol}{Number(offer.total_value).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="py-5 px-4">
                                                <StatusBadge status={offer.status} isShortlisted={offer.is_shortlisted} />
                                            </TableCell>
                                            <TableCell className="py-5 px-4 text-right sticky right-0 bg-white group-hover:bg-gray-50/50 backdrop-blur-sm z-10">
                                                <Menu
                                                    trigger={
                                                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900">
                                                            <MoreVertical size={20} />
                                                        </button>
                                                    }
                                                    usePortal={true}
                                                >
                                                    <MenuItem onClick={() => handleViewDetail(offer)} className="gap-2 focus:bg-gray-50">
                                                        <Eye size={16} className="text-blue-500" />
                                                        <span className="font-bold">Review Bid</span>
                                                    </MenuItem>
                                                    <MenuItem
                                                        as={Link}
                                                        href={`/dashboard/chat/rfq/${offer.firebase_room_id}/${offer.rfq_id}`}
                                                        className="gap-2 focus:bg-gray-50"
                                                    >
                                                        <MessageSquare size={16} className="text-green-500" />
                                                        <span className="font-bold">RFQ Chat Room</span>
                                                    </MenuItem>
                                                </Menu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

            <DetailDrawer
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                offer={selectedOffer}
            />
        </div>
    );
}
