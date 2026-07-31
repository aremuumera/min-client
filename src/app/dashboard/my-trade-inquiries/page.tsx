"use client";

import React from 'react';
import { useGetMyTradeInquiriesQuery } from '@/redux/features/trade/trade_api';
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
    Filter,
    X,
    Building2,
    Layers
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

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
        pending: { label: 'Awaiting Review', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        claimed: { label: 'In Review', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
        acknowledged: { label: 'Acknowledged', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        inspection_completed: { label: 'Inspection Completed', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        inspection_result_released: { label: 'Inspection Verified', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        re_inspection_requested: { label: 'Re-Inspection Requested', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
        contract_negotiation: { label: 'Contract Negotiation', className: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
        under_inspection: { label: 'Under Inspection', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
        inspection_pending: { label: 'Inspection Scheduled', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Clock },
        completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
        rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
        supplier_matched: { label: 'Supplier Matched', className: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Box },
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

const DetailDrawer = ({ isOpen, onClose, inquiry }: { isOpen: boolean; onClose: () => void; inquiry: any }) => {
    if (!inquiry) return null;

    const productName = inquiry.product?.product_name || inquiry.item_name || (inquiry.mineral_tag ? inquiry.mineral_tag.replace(/_/g, ' ') : 'Mineral Product');
    const supplierName = 'Min-meg Verified Supplier';

    return (
        <Drawer open={isOpen} onClose={onClose} anchor="right" className="w-full sm:w-[500px]">
            <div className="flex flex-col h-full bg-white font-sans">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex flex-col gap-3 bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Inquiry Details</h2>
                        <StatusBadge status={inquiry.status} />
                    </div>
                    <CopyableId id={inquiry.external_id} />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Product & Supplier Info Header */}
                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <Box size={14} className="text-green-600" />
                            Target Product
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{productName}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pt-1">
                            <Building2 size={13} className="text-gray-400" />
                            Supplier: <span className="font-semibold text-gray-700">{supplierName}</span>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-1 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Quantity</p>
                            <p className="text-xl font-bold text-gray-900">
                                {inquiry.quantity} <span className="text-xs text-gray-400 uppercase font-medium">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-1 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Purity Grade</p>
                            <p className="text-xl font-bold text-gray-900">{inquiry.purity_grade || inquiry.preferred_grade || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Logistics Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-200 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Logistics & Location</h3>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="space-y-4 bg-white border border-gray-200 p-5 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-none">
                                    <MapPin size={16} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Delivery State & Country</p>
                                    <p className="text-sm font-bold text-gray-900">{inquiry.delivery_state || 'N/A'}, {inquiry.delivery_country || 'Nigeria'}</p>
                                    <p className="text-xs text-gray-500 font-medium">Location: {inquiry.delivery_location || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-none">
                                    <Clock size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Supply Frequency</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">
                                        {inquiry.timeline_type?.replace(/_/g, ' ') || 'Immediate'} Supply
                                        {inquiry.recurring_frequency && ` (${inquiry.recurring_frequency}${inquiry.recurring_duration ? ` per ${inquiry.recurring_duration}` : ''})`}
                                    </p>
                                </div>
                            </div>

                            {inquiry.delivery_address && (
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-none">
                                        <MapPin size={16} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Full Address</p>
                                        <p className="text-xs font-bold text-gray-900 leading-relaxed">
                                            {inquiry.delivery_address}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {inquiry.priority && (
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center flex-none">
                                        <Zap size={16} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Priority Level</p>
                                        <p className="text-sm font-bold text-red-600 capitalize">{inquiry.priority}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Inquiry Description */}
                    {inquiry.description && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-gray-200 flex-1" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Buyer's Note</h3>
                                <div className="h-px bg-gray-200 flex-1" />
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-xs text-gray-700 leading-relaxed font-medium italic">
                                    "{inquiry.description}"
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Specifications Section */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-200 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Specifications</h3>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {Object.entries(inquiry).map(([key, value]) => {
                                if (typeof value !== 'string' && typeof value !== 'number') return null;
                                if (['id', 'external_id', 'status', 'mineral_tag', 'quantity', 'measure_type', 'delivery_location', 'delivery_state', 'delivery_country', 'delivery_address', 'timeline_type', 'createdAt', 'updatedAt', 'userId', 'supplierId', 'productId', 'product_id', 'entity_type', 'payment_plan', 'description', 'priority', 'recurring_frequency', 'recurring_duration', 'firebase_room_id'].includes(key)) return null;
                                if (!value) return null;
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-bold text-gray-900">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Timeline */}
                    <div className="pt-6 border-t border-gray-100 opacity-60">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-400">Created on {format(new Date(inquiry.createdAt), 'PPPP p')}</p>
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
                            href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.firebase_room_id}/${inquiry.external_id}`}
                            className="flex-1 bg-green-600 text-white rounded-xl flex items-center justify-center px-4 py-3 font-bold hover:bg-green-700 transition-all text-xs"
                        >
                            Enter Trade Room
                        </Link>
                    </div>
                    {inquiry.product_id && (
                        <Link
                            href={`/dashboard/products/details/${inquiry.product_id}`}
                            className="bg-neutral-900 text-white rounded-xl flex items-center justify-center py-3 font-bold hover:bg-neutral-800 transition-all text-xs tracking-tight"
                        >
                            <Box size={14} className="mr-2" />
                            View Source Product in Marketplace
                        </Link>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default function MyTradeInquiries() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedState, setSelectedState] = React.useState('');
    const [selectedStatus, setSelectedStatus] = React.useState('');

    const { data, isLoading } = useGetMyTradeInquiriesQuery({
        state: selectedState || undefined,
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
    }, {
        refetchOnMountOrArgChange: true
    });

    const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    const allInquiries = data?.data || [];

    // Client-side filtering as secondary layer for immediate feedback
    const inquiries = allInquiries.filter((inq: any) => {
        if (selectedState && (inq.delivery_state || '').toLowerCase() !== selectedState.toLowerCase()) {
            return false;
        }
        if (selectedStatus && (inq.status || '').toLowerCase() !== selectedStatus.toLowerCase()) {
            return false;
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const extMatch = (inq.external_id || '').toLowerCase().includes(term);
            const prodMatch = (inq.product?.product_name || inq.item_name || inq.mineral_tag || '').toLowerCase().includes(term);
            const locMatch = (inq.delivery_location || '').toLowerCase().includes(term) || (inq.delivery_state || '').toLowerCase().includes(term);
            if (!extMatch && !prodMatch && !locMatch) return false;
        }
        return true;
    });

    // Calculate Analytics status totals
    const totalCount = allInquiries.length;
    const ackCount = allInquiries.filter((inq: any) => (inq.status || '').toLowerCase() === 'acknowledged').length;
    const inspectionCount = allInquiries.filter((inq: any) => ['inspection_completed', 'under_inspection', 'inspection_pending', 're_inspection_requested', 'contract_negotiation', 'inspection_result_released'].includes((inq.status || '').toLowerCase())).length;
    const pendingCount = allInquiries.filter((inq: any) => ['pending', 'claimed'].includes((inq.status || '').toLowerCase())).length;

    // Analytics Cards configuration - UNIFIED GREEN THEME FOR ALL ICONS
    const analyticsCards = [
        {
            title: "Total Inquiries",
            value: totalCount,
            icon: <Layers size={18} />,
            description: "All procurement requests",
            statusKey: "",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Acknowledged",
            value: ackCount,
            icon: <CheckCircle2 size={18} />,
            description: "Accepted trade requests",
            statusKey: "ACKNOWLEDGED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Inspection Stage",
            value: inspectionCount,
            icon: <Clock size={18} />,
            description: "Completed or in inspection",
            statusKey: "INSPECTION_COMPLETED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Awaiting Review",
            value: pendingCount,
            icon: <RefreshCw size={18} />,
            description: "Pending verification",
            statusKey: "PENDING",
            iconBg: "bg-green-100 text-green-700"
        }
    ];

    // Extract dynamic unique states for dropdown options
    const uniqueStatesFromData = Array.from(
        new Set(allInquiries.map((inq: any) => inq.delivery_state).filter(Boolean))
    ) as string[];

    const standardStates = [
        "Abuja", "Lagos", "Kano", "Rivers", "Oyo", "Kaduna", "Enugu", "Plateau", "Kwara", "Nasarawa",
        "Edo", "Delta", "Ogun", "Gombe", "Kogi", "Bauchi", "Sokoto", "Zamfara", "Kebbi", "Jigawa",
        "Yobe", "Borno", "Adamawa", "Taraba", "Benue", "Niger", "Cross River", "Akwa Ibom", "Bayelsa",
        "Abia", "Anambra", "Ebonyi", "Imo", "Ekiti", "Ondo", "Osun"
    ];

    const allStateOptions = Array.from(new Set([...uniqueStatesFromData, ...standardStates]));

    const handleViewDetail = (inquiry: any) => {
        setSelectedInquiry(inquiry);
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
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Trade Inquiries</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Manage and track your procurement requests in real-time.</p>
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
                        placeholder="Search reference, product, location..."
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
                        <option value="ACKNOWLEDGED">Acknowledged</option>
                        <option value="INSPECTION_COMPLETED">Inspection Completed</option>
                        <option value="PENDING">Awaiting Review</option>
                        <option value="CLAIMED">In Review</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SUPPLIER_MATCHED">Supplier Matched</option>
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

            {/* Inquiry Table Area - Clean Flat Container */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <TableContainer className="max-h-[calc(100vh-280px)]">
                    <Table>
                        <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-6">Reference</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Product & Supplier</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Destination</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Specs & Grade</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 hidden md:table-cell">Quantity & Supply</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 hidden lg:table-cell text-center">Date</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 text-right sticky right-0 bg-gray-50 z-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-gray-100">
                                        <TableCell colSpan={8} className="py-6 px-6">
                                            <div className="h-6 bg-gray-100 rounded-lg w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : inquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                <Info size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-gray-900">No Inquiries Found</h3>
                                                <p className="text-gray-500 text-xs font-medium">
                                                    {hasActiveFilters ? "Try adjusting your filters or search term." : "Your procurement requests will appear here once submitted."}
                                                </p>
                                            </div>
                                            {hasActiveFilters ? (
                                                <button onClick={handleClearFilters} className="mt-2 text-green-600 hover:text-green-700 font-bold text-xs">
                                                    Clear active filters
                                                </button>
                                            ) : (
                                                <Link href="/dashboard" className="mt-3 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all text-xs">
                                                    Explore Marketplace
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inquiries.map((inquiry: any, index: number) => {
                                    const productName = inquiry.product?.product_name || inquiry.item_name || (inquiry.mineral_tag ? inquiry.mineral_tag.replace(/_/g, ' ') : 'Mineral Product');
                                    const supplierName = 'Min-meg Verified Supplier';

                                    return (
                                        <TableRow key={inquiry.id || inquiry.external_id || index} className="group hover:bg-gray-50/80 border-b border-gray-100 transition-colors">
                                            {/* Reference */}
                                            <TableCell className="py-4 px-6">
                                                <CopyableId id={inquiry.external_id} />
                                            </TableCell>

                                            {/* Product & Supplier */}
                                            <TableCell className="py-4 px-4 max-w-[240px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2" title={productName}>
                                                        {productName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-semibold truncate">
                                                        Supplier: {supplierName}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Destination */}
                                            <TableCell className="py-4 px-4 text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-800 capitalize">
                                                        {inquiry.delivery_location || 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-gray-400">
                                                        {[inquiry.delivery_state, inquiry.delivery_country].filter(Boolean).join(', ') || 'Nigeria'}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Specs & Grade */}
                                            <TableCell className="py-4 px-4 text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-700">
                                                        Grade: {inquiry.purity_grade || inquiry.preferred_grade || 'Standard'}
                                                    </span>
                                                    {inquiry.moisture_max !== null && inquiry.moisture_max !== undefined && (
                                                        <span className="text-[10px] font-medium text-gray-400">
                                                            Moisture: {inquiry.moisture_max}%
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Quantity & Supply */}
                                            <TableCell className="py-4 px-4 hidden md:table-cell text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                                        <Box size={13} className="text-gray-400" />
                                                        <span>{inquiry.quantity}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium capitalize">
                                                        {inquiry.timeline_type ? inquiry.timeline_type.replace(/_/g, ' ') : 'Immediate'} supply
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="py-4 px-4 hidden lg:table-cell text-center text-xs font-medium text-gray-500">
                                                {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-4 px-4">
                                                <StatusBadge status={inquiry.status} />
                                            </TableCell>

                                            {/* Actions */}
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
                                                    <MenuItem onClick={() => handleViewDetail(inquiry)} className="gap-2">
                                                        <Eye size={15} className="text-gray-600" />
                                                        <span className="font-bold text-xs">View Details</span>
                                                    </MenuItem>
                                                    <MenuItem as={Link} href={`/dashboard/trade/details/${inquiry.external_id}`} className="gap-2">
                                                        <Eye size={15} className="text-blue-500" />
                                                        <span className="font-bold text-xs">View Progress</span>
                                                    </MenuItem>
                                                    <MenuItem as={Link} href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.firebase_room_id}/${inquiry.external_id}`} className="gap-2">
                                                        <MessageSquare size={15} className="text-green-500" />
                                                        <span className="font-bold text-xs">Chat Room</span>
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
                inquiry={selectedInquiry}
            />
        </div>
    );
}
