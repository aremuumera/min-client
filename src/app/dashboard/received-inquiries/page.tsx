"use client";

import React from 'react';
import {
    useGetReceivedInquiriesQuery,
    useGetReceivedInquiriesSummaryQuery,
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
import { CopyableId, DropdownSelect, PageHeader, PaginationBar, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { receivedInquiriesHelp } from '@/lib/help/trades';

function useDebounced<T>(value: T, ms = 300): T {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
        pending: { label: 'New Request', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
        acknowledged: { label: 'Acknowledged', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        inspection_completed: { label: 'Inspection Completed', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        inspection_result_released: { label: 'Inspection Verified', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
        re_inspection_requested: { label: 'Re-Inspection Requested', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: RefreshCw },
        contract_negotiation: { label: 'Contract Negotiation', className: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
        under_inspection: { label: 'Under Inspection', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
        completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
        rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
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

    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(20);
    const debouncedSearch = useDebounced(searchTerm.trim());
    React.useEffect(() => setPage(1), [debouncedSearch, selectedState, selectedStatus]);

    const { data, isLoading, refetch } = useGetReceivedInquiriesQuery({
        state: selectedState || undefined,
        status: selectedStatus || undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
    }, {
        refetchOnMountOrArgChange: true
    });
    const { data: summary } = useGetReceivedInquiriesSummaryQuery(undefined, { refetchOnMountOrArgChange: true });
    const { confirm, dialog } = useConfirm();

    const [acknowledge] = useAcknowledgeInquiryMutation();
    const [reject] = useRejectInquiryMutation();

    const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);

    const inquiries = data?.data || [];

    // Calculate Analytics status totals
    const count = (...statuses: string[]) => statuses.reduce((sum, st) => sum + (summary?.data?.[st] ?? 0), 0);
    const totalCount = summary?.data?.total ?? 0;
    const ackCount = count('ACKNOWLEDGED');
    const inspectionCount = count('INSPECTION_COMPLETED', 'UNDER_INSPECTION', 'INSPECTION_PENDING', 'RE_INSPECTION_REQUESTED', 'CONTRACT_NEGOTIATION', 'INSPECTION_RESULT_RELEASED');
    const pendingCount = count('PENDING', 'CLAIMED');

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
        new Set(inquiries.map((inq: any) => inq.delivery_state).filter(Boolean))
    ) as string[];

    const standardStates = [
        "Abuja", "Lagos", "Kano", "Rivers", "Oyo", "Kaduna", "Enugu", "Plateau", "Kwara", "Nasarawa",
        "Edo", "Delta", "Ogun", "Gombe", "Kogi", "Bauchi", "Sokoto", "Zamfara", "Kebbi", "Jigawa",
        "Yobe", "Borno", "Adamawa", "Taraba", "Benue", "Niger", "Cross River", "Akwa Ibom", "Bayelsa",
        "Abia", "Anambra", "Ebonyi", "Imo", "Ekiti", "Ondo", "Osun"
    ];

    const allStateOptions = Array.from(new Set([...uniqueStatesFromData, ...standardStates]));

    const handleAcknowledge = async (id: string) => {
        const ok = await confirm({
            title: 'Acknowledge this inquiry?',
            description: "The trade opens and the quantity is held on your listing's batches. If there isn't enough stock, you'll see what is available.",
            confirmLabel: 'Acknowledge',
        });
        if (!ok) return;
        try {
            setActionLoading(true);
            await acknowledge(id).unwrap();
            toast.success('Inquiry acknowledged successfully');
            refetch();
        } catch (err) {
            toast.error(toApiError(err).message || 'Failed to acknowledge inquiry');
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
            toast.error(toApiError(err).message || 'Failed to reject inquiry');
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
            <PageHeader title="Received Inquiries" help={receivedInquiriesHelp} description="Review and respond to mineral procurement requests from prospective buyers." />

            {/* Analytics Style Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsCards.map((card, index) => {
                    const isSelected = selectedStatus === card.statusKey || (!selectedStatus && !card.statusKey);
                    return (
                        <div
                            key={index}
                            onClick={() => setSelectedStatus(card.statusKey)}
                            className={`cursor-pointer rounded-xl border p-5 transition-all ${isSelected
                                    ? 'bg-green-50/90 border-green-500'
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
                    <DropdownSelect
                        aria-label="State"
                        value={selectedState}
                        onValueChange={setSelectedState}
                        placeholder="All States"
                        searchable
                        options={allStateOptions.map((st) => ({ value: st, label: st }))}
                        className="w-full"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 w-full md:w-52">
                    <Filter size={16} className="text-gray-400 shrink-0 hidden sm:inline-block" />
                    <DropdownSelect
                        aria-label="Status"
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                        placeholder="All Statuses"
                        options={[
                            { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
                            { value: 'INSPECTION_COMPLETED', label: 'Inspection Completed' },
                            { value: 'PENDING', label: 'New Request' },
                            { value: 'REJECTED', label: 'Rejected' },
                        ]}
                        className="w-full"
                    />
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
                                                <CopyableId value={inquiry.external_id} />
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

            <PaginationBar
                meta={data?.meta}
                page={page}
                onPage={setPage}
                limit={limit}
                onLimit={(n) => {
                    setLimit(n);
                    setPage(1);
                }}
            />

            {dialog}
            <RejectModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onConfirm={handleReject}
                loading={actionLoading}
            />
        </div>
    );
}
