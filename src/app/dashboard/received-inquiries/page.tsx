"use client";

import React from 'react';
import {
    useGetReceivedInquiriesQuery,
    useAcknowledgeInquiryMutation,
    useRejectInquiryMutation
} from '@/redux/features/trade/trade_api';
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
    ThumbsUp,
    ThumbsDown,
    X,
    Filter,
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
import { Menu, MenuItem } from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/core/toaster';

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
        pending: { label: 'New Request', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        claimed: { label: 'In Review', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
        acknowledged: { label: 'Acknowledged', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        inspection_completed: { label: 'Inspection Completed', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        inspection_result_released: { label: 'Inspection Verified', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        re_inspection_requested: { label: 'Re-Inspection Requested', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
        contract_negotiation: { label: 'Contract Negotiation', className: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
        under_inspection: { label: 'Under Inspection', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
        completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
        rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
        supplier_matched: { label: 'Verified', className: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Box },
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

const RejectModal = ({ isOpen, onClose, onConfirm, loading }: { isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) => {
    const [reason, setReason] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 border border-gray-200 space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Reject Inquiry</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason for Rejection</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Out of stock, price mismatch, or logistical constraints..."
                        className="w-full h-28 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none font-medium"
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="outlined" onClick={onClose} className="flex-1 rounded-lg text-xs font-bold py-2.5 border-gray-200">Cancel</Button>
                    <Button
                        disabled={!reason || loading}
                        onClick={() => onConfirm(reason)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold py-2.5"
                    >
                        {loading ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function ReceivedTradeInquiries() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedState, setSelectedState] = React.useState('');
    const [selectedStatus, setSelectedStatus] = React.useState('');

    const { data, isLoading, refetch } = useGetReceivedInquiriesQuery({
        state: selectedState || undefined,
        status: selectedStatus || undefined,
        search: searchTerm || undefined,
    }, {
        refetchOnMountOrArgChange: true
    });

    const [acknowledge] = useAcknowledgeInquiryMutation();
    const [reject] = useRejectInquiryMutation();

    const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);

    const allInquiries = data?.data || [];

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
            const buyerMatch = (inq.buyer?.company_name || inq.buyer_name || '').toLowerCase().includes(term);
            const locMatch = (inq.delivery_location || '').toLowerCase().includes(term) || (inq.delivery_state || '').toLowerCase().includes(term);
            if (!extMatch && !prodMatch && !buyerMatch && !locMatch) return false;
        }
        return true;
    });

    // Calculate Analytics status totals
    const totalCount = allInquiries.length;
    const ackCount = allInquiries.filter((inq: any) => (inq.status || '').toLowerCase() === 'acknowledged').length;
    const inspectionCount = allInquiries.filter((inq: any) => ['inspection_completed', 'under_inspection', 'inspection_pending'].includes((inq.status || '').toLowerCase())).length;
    const pendingCount = allInquiries.filter((inq: any) => ['pending', 'claimed'].includes((inq.status || '').toLowerCase())).length;

    // Analytics Cards configuration matching Analytics page design
    const analyticsCards = [
        {
            title: "Total Received",
            value: totalCount,
            icon: <Layers size={18} />,
            description: "All incoming buyer leads",
            statusKey: "",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Acknowledged",
            value: ackCount,
            icon: <CheckCircle2 size={18} />,
            description: "Accepted buyer requests",
            statusKey: "ACKNOWLEDGED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "Inspection Stage",
            value: inspectionCount,
            icon: <Clock size={18} />,
            description: "Completed or undergoing inspection",
            statusKey: "INSPECTION_COMPLETED",
            iconBg: "bg-green-100 text-green-700"
        },
        {
            title: "New Requests",
            value: pendingCount,
            icon: <RefreshCw size={18} />,
            description: "Awaiting your acknowledgment",
            statusKey: "PENDING",
            iconBg: "bg-green-100 text-green-700"
        }
    ];

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

    const handleAcknowledge = async (id: string) => {
        try {
            setActionLoading(true);
            await acknowledge(id).unwrap();
            toast.success('Inquiry acknowledged successfully');
            refetch();
        } catch (err) {
            toast.error('Failed to acknowledge inquiry');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!selectedInquiry) return;
        try {
            setActionLoading(true);
            await reject({ id: selectedInquiry.external_id, reason }).unwrap();
            toast.success('Inquiry rejected');
            setIsRejectModalOpen(false);
            refetch();
        } catch (err) {
            toast.error('Failed to reject inquiry');
        } finally {
            setActionLoading(false);
        }
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
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Received Inquiries</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Review and respond to mineral procurement requests from prospective buyers.</p>
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
                        placeholder="Search reference, product, buyer, location..."
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
                        <option value="PENDING">New Request</option>
                        <option value="CLAIMED">In Review</option>
                        <option value="REJECTED">Rejected</option>
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

            {/* Inquiry Table Area - NO SHADOWS */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <TableContainer className="max-h-[calc(100vh-280px)]">
                    <Table>
                        <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-6">Reference</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Inquiry Product</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 hidden md:table-cell">Buyer Information</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Specs & Grade</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 hidden md:table-cell">Quantity</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-500 uppercase tracking-widest text-[10px] py-4 px-4 text-right sticky right-0 bg-gray-50 z-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-gray-100">
                                        <TableCell colSpan={7} className="py-6 px-6">
                                            <div className="h-6 bg-gray-100 rounded-lg w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : inquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                <Info size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-base font-bold text-gray-900">No Orders Received</h3>
                                                <p className="text-gray-500 text-xs font-medium">
                                                    {hasActiveFilters ? "Try adjusting your filters or search term." : "You haven't received any trade inquiries from buyers yet."}
                                                </p>
                                            </div>
                                            {hasActiveFilters && (
                                                <button onClick={handleClearFilters} className="mt-2 text-green-600 hover:text-green-700 font-bold text-xs">
                                                    Clear active filters
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inquiries.map((inquiry: any) => {
                                    const productName = inquiry.product?.product_name || inquiry.item_name || (inquiry.mineral_tag ? inquiry.mineral_tag.replace(/_/g, ' ') : 'Mineral Product');
                                    const buyerTitle = 'Min-meg Verified Buyer';

                                    return (
                                        <TableRow key={inquiry.external_id} className="group hover:bg-gray-50/80 border-b border-gray-100 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <CopyableId id={inquiry.external_id} />
                                            </TableCell>
                                            <TableCell className="py-4 px-4 max-w-[240px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900 text-xs leading-snug line-clamp-2" title={productName}>
                                                        {productName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-semibold truncate">
                                                        Dest: {inquiry.delivery_location || 'N/A'}{inquiry.delivery_state ? `, ${inquiry.delivery_state}` : ''}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 hidden md:table-cell text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-800">{buyerTitle}</span>
                                                    <span className="text-[10px] text-gray-400 font-semibold">Location: {inquiry.delivery_state || 'Nigeria'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-700">Grade: {inquiry.purity_grade || inquiry.preferred_grade || '-'}</span>
                                                    {inquiry.moisture_max !== null && inquiry.moisture_max !== undefined && (
                                                        <span className="text-[10px] text-gray-400 font-medium">Moisture: {inquiry.moisture_max}%</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 hidden md:table-cell text-xs">
                                                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                                    <Box size={13} className="text-gray-400" />
                                                    <span>{inquiry.quantity}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <StatusBadge status={inquiry.status} />
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
                                                    <MenuItem as={Link} href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.firebase_room_id}/${inquiry.external_id}`} className="gap-2">
                                                        <MessageSquare size={15} className="text-green-500" />
                                                        <span className="font-bold text-xs">Open Chat Room</span>
                                                    </MenuItem>

                                                    {(inquiry.status || '').toLowerCase() === 'pending' && (
                                                        <MenuItem onClick={() => handleAcknowledge(inquiry.external_id)} className="gap-2 text-green-600">
                                                            <ThumbsUp size={15} />
                                                            <span className="font-bold text-xs">Acknowledge</span>
                                                        </MenuItem>
                                                    )}

                                                    {(inquiry.status || '').toLowerCase() === 'pending' && (
                                                        <MenuItem onClick={() => { setSelectedInquiry(inquiry); setIsRejectModalOpen(true); }} className="gap-2 text-red-600">
                                                            <ThumbsDown size={15} />
                                                            <span className="font-bold text-xs">Reject Inquiry</span>
                                                        </MenuItem>
                                                    )}

                                                    <div className="h-px bg-gray-100 my-1" />

                                                    <MenuItem as={Link} href={`/dashboard/trade/details/${inquiry.external_id}`} className="gap-2">
                                                        <Eye size={15} className="text-blue-500" />
                                                        <span className="font-bold text-xs">View Progress</span>
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

            <RejectModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleReject}
                loading={actionLoading}
            />
        </div>
    );
}
