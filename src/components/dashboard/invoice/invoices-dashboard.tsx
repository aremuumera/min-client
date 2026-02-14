'use client'

import React, { useState } from 'react';
import { useGetUserInvoiceAgreementsQuery } from '@/redux/features/invoice/invoice_api';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { CircularProgress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { Container } from '@/components/ui/container';
import { Grid } from '@/components/ui/grid';
import { IconButton } from '@/components/ui/icon-button';
import { MenuItem } from '@/components/ui/menu';
import { Paper } from '@/components/ui/paper';
import { Stack } from '@/components/ui/stack';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { TableContainer } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/pagination';
import { TextField } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';
import {
    FileText as DescriptionIcon,
    Clock as PendingIcon,
    CheckCircle as CheckCircleIcon,
    Flask as InspectionIcon,
    TrendUp as TrendingUpIcon,
    XCircle as CancelIcon,
    Eye as VisibilityIcon
} from '@phosphor-icons/react/dist/ssr';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import { dayjs } from '@/lib/dayjs';
import { cn } from '@/utils/helper';

export function InvoicesDashboard() {
    const router = useRouter();
    const { user } = useSelector((state: any) => state.auth);
    const [statusFilter, setStatusFilter] = useState('all');
    const [tradeTypeFilter, setTradeTypeFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const {
        data: invoicesData,
        isLoading,
        error,
    } = useGetUserInvoiceAgreementsQuery({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tradeType: tradeTypeFilter !== 'all' ? tradeTypeFilter : undefined,
    });

    const invoices = invoicesData?.data ?? [];
    const pagination = invoicesData?.pagination;

    // Calculate statistics
    const getStats = () => {
        if (!invoicesData?.data)
            return {
                total: 0,
                pending: 0,
                approved: 0,
                inInspection: 0,
                completed: 0,
                cancelled: 0,
            };

        const invoices = invoicesData.data;
        return {
            total: invoices.length,
            pending: invoices.filter((i: any) => i.status === 'PENDING_APPROVAL').length,
            approved: invoices.filter((i: any) => i.status === 'APPROVED').length,
            inInspection: invoices.filter((i: any) =>
                ['SUBMITTED_FOR_INSPECTION', 'INSPECTION_ASSIGNED', 'INSPECTION_COMPLETED'].includes(i.status)
            ).length,
            completed: invoices.filter((i: any) => i.status === 'COMPLETED').length,
            cancelled: invoices.filter((i: any) => i.status === 'CANCELLED').length,
        };
    };

    const stats = getStats();

    // Filter invoices
    const getFilteredInvoices = () => {
        if (!invoicesData?.data) return [];

        let filtered = invoicesData.data;

        if (statusFilter !== 'all') {
            filtered = filtered.filter((inv: any) => inv.status === statusFilter);
        }

        if (tradeTypeFilter !== 'all') {
            filtered = filtered.filter((inv: any) => inv.tradeType === tradeTypeFilter);
        }

        return filtered;
    };

    const filteredInvoices = getFilteredInvoices();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'default';
            case 'PENDING_APPROVAL':
                return 'warning';
            case 'APPROVED':
                return 'success';
            case 'SUBMITTED_FOR_INSPECTION':
                return 'info';
            case 'INSPECTION_ASSIGNED':
                return 'info';
            case 'INSPECTION_COMPLETED':
                return 'primary';
            case 'COMPLETED':
                return 'success';
            case 'CANCELLED':
                return 'error';
            default:
                return 'default';
        }
    };

    const handleViewInvoice = (invoiceId: string) => {
        router.push(`/dashboard/invoices/${invoiceId}`);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // if (error) {
    //     return (
    //         <Container maxWidth="lg" className="py-8">
    //             <Alert severity="error">Failed to load invoices. Please try again later.</Alert>
    //         </Container>
    //     );
    // }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Trade Agreements & Invoices
                </h1>
                <p className="text-base text-gray-500">
                    Manage your trade agreements and track inspection progress
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: DescriptionIcon, color: 'text-gray-600', bg: 'bg-gray-50' },
                    { label: 'Pending', value: stats.pending, icon: PendingIcon, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                    { label: 'Approved', value: stats.approved, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50/50' },
                    { label: 'Inspection', value: stats.inInspection, icon: InspectionIcon, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Completed', value: stats.completed, icon: TrendingUpIcon, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Cancelled', value: stats.cancelled, icon: CancelIcon, color: 'text-red-600', bg: 'bg-red-50/50' },
                ].map((stat, idx) => (
                    <Card key={idx} outlined className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                                    <stat.icon size={18} />
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card outlined>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="PENDING_APPROVAL">Pending Approval</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="SUBMITTED_FOR_INSPECTION">Submitted for Inspection</option>
                                    <option value="INSPECTION_ASSIGNED">Inspection Assigned</option>
                                    <option value="INSPECTION_COMPLETED">Inspection Completed</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Trade Type</label>
                                <select
                                    value={tradeTypeFilter}
                                    onChange={(e) => setTradeTypeFilter(e.target.value)}
                                    className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                >
                                    <option value="all">All Types</option>
                                    <option value="LOCAL">Local Trade</option>
                                    <option value="INTERNATIONAL">International Trade</option>
                                </select>
                            </div>
                        </div>

                        {/* <div className="md:border-l border-gray-100 md:pl-6 shrink-0">
                            <p className="text-xs text-gray-400 font-medium">
                                Showing <span className="text-gray-900 font-bold">{filteredInvoices.length}</span> of <span className="text-gray-900 font-bold">{stats.total}</span> agreements
                            </p>
                        </div> */}
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card outlined className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Product</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Type</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Quantity</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12 text-right">Total Price</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Status</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12">Created</TableHead>
                                <TableHead className="text-xs font-bold text-gray-400 uppercase tracking-wider h-12 text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-sm italic">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <div className="py-1">
                                                <div className="text-sm font-bold text-gray-900">{invoice.productName}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{invoice.productCategory}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                                                {invoice.tradeType}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 font-medium">
                                            {invoice.quantity} {invoice.unitType}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                {invoice.currency === 'NGN' ? '₦' : invoice.currency === 'USD' ? '$' : '₦'}
                                                {invoice.totalPrice || '0.00'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{invoice.currency}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                invoice.status === 'APPROVED' || invoice.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-100" :
                                                    invoice.status === 'PENDING_APPROVAL' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        invoice.status === 'CANCELLED' ? "bg-red-50 text-red-700 border-red-100" :
                                                            "bg-gray-50 text-gray-700 border-gray-100"
                                            )}>
                                                {invoice.status.replace(/_/g, ' ')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-900 font-medium">{dayjs(invoice.createdAt).format('MMM D, YYYY')}</div>
                                            <div className="text-[10px] text-gray-400 font-medium tracking-tight whitespace-nowrap">{dayjs(invoice.createdAt).fromNow()}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <button
                                                onClick={() => handleViewInvoice(invoice.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all group"
                                                title="View Details"
                                            >
                                                <VisibilityIcon size={18} />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <div className="flex justify-center pt-4">
                <TablePagination
                    component="div"
                    count={pagination?.total ?? 0}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(_: any, newPage: number) => setPage(newPage)}
                    onRowsPerPageChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </div>
        </div>
    );
}
