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
    Filter,
    X,
    Layers,
    Building2
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
                className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100/70 px-2.5 py-1 rounded-md cursor-help"
                title={fullId}
            >
                #{shortId}
            </span>
            <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded-md transition-all text-gray-400 hover:text-green-600"
                title="Copy reference ID"
            >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            </button>
        </div>
    );
};

const StatusBadge = ({ status, isShortlisted }: { status: string; isShortlisted?: boolean }) => {
    if (isShortlisted && status !== 'accepted' && status !== 'rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                <Trophy size={12} />
                Shortlisted
            </span>
        );
    }

    const configs: Record<string, { label: string; className: string; icon: any }> = {
        pending: { label: 'Pending Review', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        rejected: { label: 'Declined', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
        withdrawn: { label: 'Superseded', className: 'bg-gray-50 text-gray-500 border-gray-200', icon: RefreshCw },
    };

    const key = (status || '').toLowerCase();
    const config = configs[key] || {
        label: status ? status.replace(/_/g, ' ') : 'Unknown',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: Info
    };
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${config.className}`}>
            <Icon size={12} />
            <span className="capitalize">{config.label}</span>
        </span>
    );
};

const DetailDrawer = ({ isOpen, onClose, offer }: { isOpen: boolean; onClose: () => void; offer: any }) => {
    if (!offer) return null;

    const currencySymbol = offer.currency === 'USD' ? '$' : '₦';
    const productName = offer.rfq?.rfqProductName || offer.mineral_tag || 'RFQ Product Bid';

    const rawAttachments = offer.attachments || offer.documents || [];
    let attachments: any[] = [];
    try {
        attachments = typeof rawAttachments === 'string' ? JSON.parse(rawAttachments) : (Array.isArray(rawAttachments) ? rawAttachments : []);
    } catch (e) {
        attachments = [];
    }

    return (
        <Drawer open={isOpen} onClose={onClose} anchor="right" className="w-full sm:w-[540px]">
            <div className="flex flex-col h-full bg-white font-sans">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex flex-col gap-3 bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Bid Details</h2>
                        <StatusBadge status={offer.status} isShortlisted={offer.is_shortlisted} />
                    </div>
                    <CopyableId id={offer.external_id} />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* RFQ Info Header */}
                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <Box size={14} className="text-green-600" />
                            Target RFQ Product
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{productName}</h3>
                        <p className="text-xs text-gray-500 font-medium">RFQ Ref: #{offer.rfq?.rfqId?.substring(0, 8).toUpperCase() || 'N/A'}</p>
                    </div>

                    {/* Key Metrics (Quantity, Unit Price) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-1 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Offered Qty</p>
                            <p className="text-sm font-bold text-gray-900">
                                {offer.quantity} <span className="text-[10px] text-gray-400 font-normal uppercase">{offer.measure_type}</span>
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-1 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unit Price</p>
                            <p className="text-sm font-bold text-gray-900">
                                {currencySymbol}{Number(offer.unit_price).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Technical Specifications Section */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-200 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Technical Specifications</h3>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-white border border-gray-200 p-4 rounded-xl text-xs">
                            <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight block">Purity / Grade</span>
                                <span className="font-bold text-gray-900 block">{offer.purity_grade || 'Not Specified'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight block">Moisture Max %</span>
                                <span className="font-bold text-gray-900 block">{offer.moisture_max ? `${offer.moisture_max}%` : 'N/A'}</span>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-gray-100">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight block">Packaging</span>
                                <span className="font-bold text-gray-900 block">{offer.packaging || 'N/A'}</span>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-gray-100">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight block">Sampling Method</span>
                                <span className="font-bold text-gray-900 block">{offer.sampling_method || 'N/A'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Logistics & Delivery Section */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-200 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Delivery & Logistics</h3>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl text-xs">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-none text-green-600">
                                    <MapPin size={15} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Delivery Location & Address</p>
                                    <p className="font-bold text-gray-900">{offer.delivery_state || 'N/A'}, {offer.delivery_country || 'Nigeria'}</p>
                                    <p className="text-gray-500 font-medium">{offer.delivery_address || offer.delivery_location || 'Location details specified on chat'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-none text-blue-600">
                                    <Clock size={15} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Timeline & Schedule</p>
                                    <p className="font-bold text-gray-900 capitalize">
                                        {offer.lead_time_days ? `${offer.lead_time_days} days lead time` : 'Immediate delivery'}
                                    </p>
                                    {offer.timeline_type === 'recurring' && (
                                        <p className="text-gray-500 font-medium">Recurring: {offer.recurring_frequency || ''} ({offer.recurring_duration || ''})</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Offer Note */}
                    {offer.description && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-gray-200 flex-1" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Supplier Cover Note</h3>
                                <div className="h-px bg-gray-200 flex-1" />
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-xs text-gray-700 leading-relaxed font-medium italic">
                                    "{offer.description}"
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Attachments Section */}
                    {attachments.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-gray-200 flex-1" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Submitted Attachments ({attachments.length})</h3>
                                <div className="h-px bg-gray-200 flex-1" />
                            </div>
                            <div className="space-y-2">
                                {attachments.map((att: any, idx: number) => {
                                    const fileUrl = typeof att === 'string' ? att : (att.url || att.file_url || '');
                                    const fileName = typeof att === 'string' ? `Attachment #${idx + 1}` : (att.name || att.file_name || `Attachment #${idx + 1}`);

                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText size={16} className="text-green-600 shrink-0" />
                                                <span className="font-bold text-gray-800 truncate">{fileName}</span>
                                            </div>
                                            {fileUrl && (
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-[11px] shrink-0"
                                                >
                                                    View File
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Submission Timestamp */}
                    <div className="pt-4 border-t border-gray-100 opacity-60">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-400">Submitted on {format(new Date(offer.createdAt), 'PPPP p')}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 flex flex-col gap-3 bg-white sticky bottom-0 shrink-0">
                    <div className="flex gap-3">
                        <Button variant="outlined" onClick={onClose} className="flex-1 rounded-xl py-3 font-bold border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all text-xs">
                            Return
                        </Button>
                        <Link
                            href={`/dashboard/chat/rfq/${offer.firebase_room_id}/${offer.rfq_id}`}
                            className="flex-1 bg-green-600 text-white rounded-xl flex items-center justify-center px-4 py-3 font-bold hover:bg-green-700 transition-all text-xs"
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
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedState, setSelectedState] = React.useState('');
    const [selectedStatus, setSelectedStatus] = React.useState('');

    const { data, isLoading } = useGetMyRfqOffersQuery(undefined, {
        refetchOnMountOrArgChange: true
    });

    const [selectedOffer, setSelectedOffer] = React.useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    const allOffers = data?.data || [];

    // Filter offers locally
    const offers = allOffers.filter((off: any) => {
        if (selectedState && (off.delivery_state || '').toLowerCase() !== selectedState.toLowerCase()) {
            return false;
        }
        if (selectedStatus) {
            const st = (off.status || '').toLowerCase();
            if (selectedStatus === 'SHORTLISTED' && !off.is_shortlisted) return false;
            if (selectedStatus === 'ACCEPTED' && st !== 'accepted') return false;
            if (selectedStatus === 'PENDING' && (st !== 'pending' || off.is_shortlisted)) return false;
            if (selectedStatus === 'REJECTED' && st !== 'rejected') return false;
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const extMatch = (off.external_id || '').toLowerCase().includes(term);
            const prodMatch = (off.rfq?.rfqProductName || '').toLowerCase().includes(term);
            const locMatch = (off.delivery_location || '').toLowerCase().includes(term) || (off.delivery_state || '').toLowerCase().includes(term);
            if (!extMatch && !prodMatch && !locMatch) return false;
        }
        return true;
    });

    // Calculate Analytics Status Totals
    const totalCount = allOffers.length;
    const shortlistedCount = allOffers.filter((o: any) => o.is_shortlisted).length;
    const acceptedCount = allOffers.filter((o: any) => (o.status || '').toLowerCase() === 'accepted').length;
    const pendingCount = allOffers.filter((o: any) => (o.status || '').toLowerCase() === 'pending' && !o.is_shortlisted).length;

    // Analytics Cards configuration matching Analytics page design (100% UNIFIED GREEN ICON THEME)
    const analyticsCards = [
        {
            title: "Total Submitted Bids",
            value: totalCount,
            icon: <Layers size={18} />,
            description: "All quotes submitted to RFQs",
            statusKey: "",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Shortlisted Bids",
            value: shortlistedCount,
            icon: <Trophy size={18} />,
            description: "Selected by buyers for evaluation",
            statusKey: "SHORTLISTED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Accepted Offers",
            value: acceptedCount,
            icon: <CheckCircle2 size={18} />,
            description: "Successful awarded quotes",
            statusKey: "ACCEPTED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Pending Review",
            value: pendingCount,
            icon: <Clock size={18} />,
            description: "Awaiting buyer feedback",
            statusKey: "PENDING",
            iconBg: "bg-green-100 text-green-700"
        }
    ];

    // Extract dynamic unique states for dropdown options
    const uniqueStatesFromData = Array.from(
        new Set(allOffers.map((off: any) => off.delivery_state).filter(Boolean))
    ) as string[];

    const standardStates = [
        "Abuja", "Lagos", "Kano", "Rivers", "Oyo", "Kaduna", "Enugu", "Plateau", "Kwara", "Nasarawa",
        "Edo", "Delta", "Ogun", "Gombe", "Kogi", "Bauchi", "Sokoto", "Zamfara", "Kebbi", "Jigawa",
        "Yobe", "Borno", "Adamawa", "Taraba", "Benue", "Niger", "Cross River", "Akwa Ibom", "Bayelsa",
        "Abia", "Anambra", "Ebonyi", "Imo", "Ekiti", "Ondo", "Osun"
    ];

    const allStateOptions = Array.from(new Set([...uniqueStatesFromData, ...standardStates]));

    const handleViewDetail = (offer: any) => {
        setSelectedOffer(offer);
        setIsDetailModalOpen(true);
    };

    const hasActiveFilters = Boolean(searchTerm || selectedState || selectedStatus);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedState('');
        setSelectedStatus('');
    };

    return (
        <div className="p-6 lg:p-10 space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Active Bids</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Track all quotes sent to buyers for their RFQs in real-time.</p>
                </div>
            </div>

            {/* Analytics Style Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsCards.map((card, index) => {
                    const isSelected = selectedStatus === card.statusKey || (!selectedStatus && !card.statusKey);
                    return (
                        <div
                            key={index}
                            onClick={() => setSelectedStatus(card.statusKey)}
                            className={`cursor-pointer rounded-xl border p-5 transition-all ${isSelected
                                    ? 'bg-green-50/90 border-green-500 shadow-sm'
                                    : 'bg-green-50/40 border-green-200/60 hover:border-green-300 hover:bg-green-50/70'
                                } group`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                                    {card.icon}
                                </div>
                                {isSelected && (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-600 text-white tracking-wide">
                                        Selected
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xs font-semibold text-gray-500">{card.title}</h3>
                                <div className="text-2xl font-black text-gray-900 tracking-tight">{card.value}</div>
                                <p className="text-[11px] text-gray-400 font-medium">{card.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search reference, RFQ product, location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-200 pl-10 pr-4 py-2.5 rounded-lg text-xs focus:ring-2 focus:ring-green-500 focus:bg-white outline-none w-full font-medium transition-all"
                    />
                </div>

                {/* State Filter */}
                <div className="flex items-center gap-2 w-full md:w-56">
                    <MapPin size={16} className="text-gray-400 shrink-0 hidden sm:inline-block" />
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none w-full cursor-pointer transition-all"
                    >
                        <option value="">All States</option>
                        {allStateOptions.map((st) => (
                            <option key={st} value={st}>
                                {st}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 w-full md:w-52">
                    <Filter size={16} className="text-gray-400 shrink-0 hidden sm:inline-block" />
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none w-full cursor-pointer transition-all"
                    >
                        <option value="">All Statuses</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="REJECTED">Declined</option>
                    </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition-all shrink-0"
                    >
                        <X size={14} />
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table Area - Clean Flat Container (NO SHADOWS) */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <TableContainer className="max-h-[calc(100vh-280px)]">
                    <Table>
                        <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-6">Reference</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">RFQ Product</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Your Price</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 text-right sticky right-0 bg-gray-50 z-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-gray-100">
                                        <TableCell colSpan={5} className="py-6 px-6">
                                            <div className="h-6 bg-gray-100 rounded-lg w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : offers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                <DollarSign size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-gray-900">No Bids Found</h3>
                                                <p className="text-gray-500 text-xs font-medium">
                                                    {hasActiveFilters ? "Try adjusting your filters or search term." : "Once you submit an offer for an RFQ, it will appear here."}
                                                </p>
                                            </div>
                                            {hasActiveFilters ? (
                                                <button onClick={handleClearFilters} className="mt-2 text-green-600 hover:text-green-700 font-bold text-xs">
                                                    Clear active filters
                                                </button>
                                            ) : (
                                                <Link href="/dashboard/products/rfq-products" className="mt-3 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all text-xs">
                                                    Browse Live RFQs
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                offers.map((offer: any, index: number) => {
                                    const symbol = offer.currency === 'USD' ? '$' : '₦';
                                    return (
                                        <TableRow key={offer.id || index} className="group hover:bg-gray-50/80 border-b border-gray-100 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <CopyableId id={offer.external_id} />
                                            </TableCell>
                                            <TableCell className="py-4 px-4 max-w-[240px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2">
                                                        {offer.rfq?.rfqProductName || 'RFQ Product'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-semibold font-mono">
                                                        RFQ Ref: #{offer.rfq?.rfqId?.substring(0, 8).toUpperCase() || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900">{symbol}{Number(offer.unit_price).toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">/ {offer.measure_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <StatusBadge status={offer.status} isShortlisted={offer.is_shortlisted} />
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-right sticky right-0 bg-white group-hover:bg-gray-50/80 z-10">
                                                <Menu
                                                    trigger={
                                                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-900">
                                                            <MoreVertical size={18} />
                                                        </button>
                                                    }
                                                    align="end"
                                                    usePortal={true}
                                                >
                                                    <MenuItem onClick={() => handleViewDetail(offer)} className="gap-2">
                                                        <Eye size={15} className="text-gray-600" />
                                                        <span className="font-bold text-xs">Review Bid</span>
                                                    </MenuItem>
                                                    <MenuItem
                                                        as={Link}
                                                        href={`/dashboard/chat/rfq/${offer.firebase_room_id}/${offer.rfq_id}`}
                                                        className="gap-2"
                                                    >
                                                        <MessageSquare size={15} className="text-green-500" />
                                                        <span className="font-bold text-xs">RFQ Chat Room</span>
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
