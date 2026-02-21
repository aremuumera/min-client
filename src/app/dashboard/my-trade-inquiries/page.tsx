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
    MessageSquare
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
        pending: { label: 'Awaiting Review', className: 'bg-amber-100/50 text-amber-700 border-amber-200', icon: Clock, color: 'amber' },
        claimed: { label: 'Admin Processing', className: 'bg-blue-100/50 text-blue-700 border-blue-200', icon: RefreshCw, color: 'blue' },
        acknowledged: { label: 'Accepted', className: 'bg-green-100/50 text-green-700 border-green-200', icon: CheckCircle2, color: 'green' },
        rejected: { label: 'Rejected', className: 'bg-red-100/50 text-red-700 border-red-200', icon: AlertCircle, color: 'red' },
        supplier_matched: { label: 'Supplier Identified', className: 'bg-indigo-100/50 text-indigo-700 border-indigo-200', icon: Box, color: 'indigo' },
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

const DetailDrawer = ({ isOpen, onClose, inquiry }: { isOpen: boolean; onClose: () => void; inquiry: any }) => {
    if (!inquiry) return null;

    return (
        <Drawer open={isOpen} onClose={onClose} anchor="right" className="w-full sm:w-[500px]">
            <div className="flex flex-col h-full bg-white font-sans">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex flex-col gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Inquiry Details</h2>
                        <StatusBadge status={inquiry.status} />
                    </div>
                    <CopyableId id={inquiry.external_id} />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-transparent p-6 rounded-[24px] border border-gray-100 space-y-1 text-center group hover:border-green-100 transition-colors">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Quantity</p>
                            <p className="text-xl font-bold text-gray-900">
                                {inquiry.quantity} <span className="text-xs text-gray-400 uppercase font-medium">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                            </p>
                        </div>
                        <div className="bg-transparent p-6 rounded-[24px] border border-gray-100 space-y-1 text-center group hover:border-green-100 transition-colors">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mineral Type</p>
                            <p className="text-xl font-bold text-gray-900 capitalize">{inquiry.mineral_tag}</p>
                        </div>
                    </div>

                    {/* Logistics Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Logistics & Handling</h3>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        <div className="space-y-6 bg-white border border-gray-100 p-8 rounded-[32px]">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-50/50 border border-green-100 flex items-center justify-center flex-none">
                                    <Box size={18} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Destination Port/City</p>
                                    <p className="text-sm font-bold text-gray-900">{inquiry.delivery_location}, {inquiry.delivery_state}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center flex-none">
                                    <Clock size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Supply Frequency</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">
                                        {inquiry.timeline_type?.replace(/_/g, ' ')} Supply
                                        {inquiry.recurring_frequency && ` (${inquiry.recurring_frequency}${inquiry.recurring_duration ? ` per ${inquiry.recurring_duration}` : ''})`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                                    <MapPin size={18} className="text-neutral-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Delivery Address</p>
                                    <p className="text-xs font-bold text-gray-900 leading-relaxed">
                                        {inquiry.delivery_address}, {inquiry.delivery_location}, {inquiry.delivery_state}, {inquiry.delivery_country}
                                    </p>
                                </div>
                            </div>

                            {inquiry.payment_plan && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center flex-none">
                                        <AlertCircle size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Payment Terms</p>
                                        <p className="text-sm font-bold text-gray-900 capitalize">{inquiry.payment_plan?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            )}

                            {inquiry.priority && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-center flex-none">
                                        <Zap size={18} className="text-red-600" />
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
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px bg-gray-100 flex-1" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Buyer's Note</h3>
                                <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="bg-gray-50/30 border border-gray-100 p-6 rounded-[24px]">
                                <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                                    "{inquiry.description}"
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Specifications Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-gray-100 flex-1" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex-none px-2">Specifications</h3>
                            <div className="h-px bg-gray-100 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {Object.entries(inquiry).map(([key, value]) => {
                                if (typeof value !== 'string' && typeof value !== 'number') return null;
                                if (['id', 'external_id', 'status', 'mineral_tag', 'quantity', 'measure_type', 'delivery_location', 'delivery_state', 'delivery_country', 'delivery_address', 'timeline_type', 'createdAt', 'updatedAt', 'userId', 'supplierId', 'productId', 'product_id', 'entity_type', 'payment_plan', 'description', 'priority', 'recurring_frequency', 'recurring_duration'].includes(key)) return null;
                                if (!value) return null;
                                return (
                                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/30 transition-all group">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-sm font-bold text-gray-900">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Timeline */}
                    <div className="pt-10 border-t border-gray-50 opacity-60">
                        <div className="flex items-center gap-2">
                            <Info size={14} className="text-gray-400" />
                            <p className="text-[10px] font-bold text-gray-400">Created on {format(new Date(inquiry.createdAt), 'PPPP p')}</p>
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
                            href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.external_id}/${inquiry.id}`}
                            className="flex-3 bg-green-600 text-white rounded-2xl flex items-center justify-center px-10 font-bold hover:bg-green-700 transition-all border border-green-700/10"
                        >
                            Enter Trade Room
                        </Link>
                    </div>
                    {inquiry.product_id && (
                        <Link
                            href={`/dashboard/products/details/${inquiry.product_id}`}
                            className="bg-neutral-900 text-white rounded-2xl flex items-center justify-center py-4 font-bold hover:bg-neutral-800 transition-all text-xs tracking-tight"
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
    const { data, isLoading } = useGetMyTradeInquiriesQuery();
    const [selectedInquiry, setSelectedInquiry] = React.useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    const inquiries = data?.data || [];

    const handleViewDetail = (inquiry: any) => {
        setSelectedInquiry(inquiry);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Trade Inquiries</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage and track your procurement requests in real-time.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by reference..."
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
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4">Product</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 hidden md:table-cell">Quantity</TableHead>
                                <TableHead className="font-bold text-gray-400 uppercase tracking-widest text-[10px] py-6 px-4 hidden md:table-cell text-center">Date</TableHead>
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
                                                <h3 className="text-lg font-bold text-gray-900">No Inquiries Yet</h3>
                                                <p className="text-gray-400 text-sm">Your mineral procurement requests will appear here once submitted.</p>
                                            </div>
                                            <Link href="/dashboard" className="mt-4 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all text-sm">
                                                Explore Marketplace
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inquiries.map((inquiry: any) => (
                                    <TableRow key={inquiry.id} className="group hover:bg-gray-50/50 transition-colors">
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
                                            <div className="flex items-center gap-2">
                                                <Box size={14} className="text-gray-300" />
                                                <span className="font-bold text-gray-700">{inquiry.quantity}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{inquiry.measure_type?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-4 hidden md:table-cell text-center text-[11px] font-medium text-gray-500">
                                            {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
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
                                                // placement="bottom-end"
                                                usePortal={true}
                                            >
                                                <MenuItem as={Link} href={`/dashboard/trade/details/${inquiry.external_id}`} className="gap-2">
                                                    <Eye size={16} className="text-blue-500" />
                                                    <span className="font-bold">View Progress</span>
                                                </MenuItem>
                                                <MenuItem as={Link} href={`/dashboard/chat/${inquiry.entity_type}/${inquiry.external_id}/${inquiry.id}`} className="gap-2">
                                                    <MessageSquare size={16} className="text-green-500" />
                                                    <span className="font-bold">Chat with Admin</span>
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

            <DetailDrawer
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                inquiry={selectedInquiry}
            />
        </div>
    );
}
