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
    X
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

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { label: string; className: string; icon: any; color: string }> = {
        pending: { label: 'New Request', className: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: Clock, color: 'amber' },
        claimed: { label: 'Admin Processing', className: 'bg-blue-100/50 text-blue-700 border-blue-200', icon: RefreshCw, color: 'blue' },
        acknowledged: { label: 'Accepted', className: 'bg-green-100/50 text-green-700 border-green-200', icon: CheckCircle2, color: 'green' },
        rejected: { label: 'Rejected', className: 'bg-red-100/50 text-red-700 border-red-200', icon: AlertCircle, color: 'red' },
        supplier_matched: { label: 'Verified', className: 'bg-indigo-100/50 text-indigo-700 border-indigo-200', icon: Box, color: 'indigo' },
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

const RejectModal = ({ isOpen, onClose, onConfirm, loading }: { isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) => {
    const [reason, setReason] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] w-full max-w-md p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Reject Inquiry</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reason for Rejection</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Out of stock, price mismatch, or logistical constraints..."
                        className="w-full h-32 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="outlined" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
                    <Button
                        disabled={!reason || loading}
                        onClick={() => onConfirm(reason)}
                        className="flex-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                        {loading ? 'Processing...' : 'Confirm Rejection'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function ReceivedTradeInquiries() {
    const { data, isLoading, refetch } = useGetReceivedInquiriesQuery();
    const [acknowledge] = useAcknowledgeInquiryMutation();
    const [reject] = useRejectInquiryMutation();

    const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);

    const inquiries = data?.data || [];

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

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Received Inquiries</h1>
                    <p className="text-gray-500 mt-2 font-medium">Review and respond to mineral procurement requests from prospective buyers.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by reference..."
                            className="bg-gray-100/50 border-none pl-12 pr-6 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 outline-none w-full md:w-72 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Inquiry Table Area */}
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <TableContainer className="max-h-[calc(100vh-300px)]">
                    <Table>
                        <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-8">Reference</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4">Inquiry For</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 hidden md:table-cell">Buyer Information</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 hidden md:table-cell">Quantity</TableHead>
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
                            ) : inquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                <Info size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-bold text-gray-900">No Orders Received</h3>
                                                <p className="text-gray-400 text-sm">You haven't received any trade inquiries from buyers yet.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inquiries.map((inquiry: any) => (
                                    <TableRow key={inquiry.external_id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="py-5 px-8">
                                            <CopyableId id={inquiry.external_id} />
                                        </TableCell>
                                        <TableCell className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 capitalize">{inquiry.mineral_tag}</span>
                                                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{inquiry.delivery_location}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-4 hidden md:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{inquiry.buyer_name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{inquiry.buyer_company || 'Independent Buyer'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Box size={14} className="text-gray-300" />
                                                <span className="font-bold text-gray-700">{inquiry.quantity}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-4">
                                            <StatusBadge status={inquiry.status} />
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
                                                <MenuItem as={Link} href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.external_id}/${inquiry.product_id}`} className="gap-2">
                                                    <MessageSquare size={16} className="text-green-500" />
                                                    <span className="font-bold">Open Chat Room</span>
                                                </MenuItem>

                                                {inquiry.status === 'pending' && (
                                                    <MenuItem onClick={() => handleAcknowledge(inquiry.external_id)} className="gap-2 text-green-600">
                                                        <ThumbsUp size={16} />
                                                        <span className="font-bold">Acknowledge</span>
                                                    </MenuItem>
                                                )}

                                                {inquiry.status === 'pending' && (
                                                    <MenuItem onClick={() => { setSelectedInquiry(inquiry); setIsRejectModalOpen(true); }} className="gap-2 text-red-600">
                                                        <ThumbsDown size={16} />
                                                        <span className="font-bold">Reject Inquiry</span>
                                                    </MenuItem>
                                                )}

                                                <div className="h-px bg-gray-50 my-1" />

                                                <MenuItem as={Link} href={`/dashboard/trade/details/${inquiry.external_id}`} className="gap-2">
                                                    <Eye size={16} className="text-blue-500" />
                                                    <span className="font-bold">View Progress</span>
                                                </MenuItem>
                                            </Menu>
                                        </TableCell>
                                    </TableRow>
                                ))
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
