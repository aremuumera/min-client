'use client';

import React, { useState } from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { dayjs } from '@/lib/dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell, Heart, MessageSquare, Briefcase, UserPlus, CreditCard,
    ShoppingBag, LogIn, CheckCircle, XCircle, FileText, Send
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

export default function ActivityLogPage() {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading } = useGetActivitiesQuery({ limit, page, orderBy: 'created_at', order: 'DESC' });
    const activities = data?.data || [];
    const meta = data?.meta || { total: 0, lastPage: 1 };

    const getIcon = (type: string) => {
        switch (type) {
            case 'USER_LOGGED_IN':
            case 'USER_SIGNED_UP': return <LogIn className="w-4 h-4" />;
            case 'TEAM_MEMBER_INVITED':
            case 'TEAM_MEMBER_UPDATED': return <UserPlus className="w-4 h-4" />;
            case 'INVOICE_CREATED':
            case 'INVOICE_APPROVED':
            case 'INVOICE_REJECTED':
            case 'INVOICE_CANCELLED':
            case 'INVOICE_SUBMITTED_FOR_APPROVAL':
                return <CreditCard className="w-4 h-4" />;
            case 'PRODUCT_CREATED': return <ShoppingBag className="w-4 h-4" />;
            case 'INQUIRY_CREATED':
            case 'INQUIRY_UPDATED':
            case 'INQUIRY_ACKNOWLEDGED':
            case 'INQUIRY_REJECTED': return <MessageSquare className="w-4 h-4" />;
            case 'OFFER_ACCEPTED_BY_ADMIN': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'OFFER_REJECTED_BY_ADMIN': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'DOCUMENT_UPLOADED': return <FileText className="w-4 h-4" />;
            case 'INSPECTOR_ASSIGNED': return <Briefcase className="w-4 h-4" />;
            case 'INSPECTION_STATUS_UPDATED': return <Send className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const getDescription = (activity: any) => {
        const metadata = activity.metadata || {};
        switch (activity.action_type) {
            case 'USER_SIGNED_UP': return 'joined the platform';
            case 'USER_LOGGED_IN': return 'logged in';
            case 'TEAM_MEMBER_INVITED': return `invited ${metadata.email || 'a new member'}`;
            case 'TEAM_MEMBER_UPDATED': return `updated a team member (${metadata.email || 'details'})`;
            case 'INVOICE_CREATED': return `created invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_SUBMITTED_FOR_APPROVAL': return `submitted invoice ${metadata.invoiceNumber || ''} for approval`;
            case 'INVOICE_APPROVED': return `approved invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_REJECTED': return `rejected invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_CANCELLED': return `cancelled invoice ${metadata.invoiceNumber || ''}`;
            case 'PRODUCT_CREATED': return `published ${metadata.productName || 'a new product'}`;
            case 'INQUIRY_CREATED': return `started a new inquiry`;
            case 'INQUIRY_UPDATED': return `updated an inquiry (Status: ${metadata.newStatus || 'changed'})`;
            case 'INQUIRY_ACKNOWLEDGED': return `acknowledged an inquiry`;
            case 'INQUIRY_REJECTED': return `rejected an inquiry`;
            case 'OFFER_ACCEPTED_BY_ADMIN': return `accepted an offer`;
            case 'OFFER_REJECTED_BY_ADMIN': return `rejected an offer`;
            case 'DOCUMENT_UPLOADED': return `uploaded document "${metadata.documentTitle || 'File'}"`;
            case 'INSPECTOR_ASSIGNED': return `assigned an inspector`;
            case 'INSPECTION_STATUS_UPDATED': return `updated inspection status to ${metadata.newStatus || 'a new status'}`;
            default: return 'performed an action';
        }
    };

    const getActorName = (activity: any) => {
        if (activity.metadata?.email) {
            return activity.metadata.email.split('@')[0];
        }
        return "You / Team Member";
    }

    return (
        <div className="space-y-6">
            <Typography variant="h4" className="font-bold text-gray-900">
                Full Audit Log
            </Typography>

            <Box className="bg-white border border-[#e5e7eb] rounded-xl p-6">
                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                                <div className="space-y-3 grow pt-1">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <Typography variant="h6" className="text-gray-900 mb-1">
                            No Activity History
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 max-w-sm">
                            There are no recent activities logged for this business account.
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-5 before:w-[2px] before:bg-gray-100 pl-5">
                        {activities.map((item: any) => (
                            <div key={item.id} className="relative pl-8 py-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors -ml-5 group">
                                <div className="absolute left-0 top-6 w-10 h-10 rounded-full border border-white bg-green-50 text-green-600 flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110 group-hover:bg-green-100">
                                    {getIcon(item.action_type)}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                                    <div>
                                        <Typography variant="body1" className="font-semibold text-gray-900">
                                            {getActorName(item)} <span className="font-normal text-gray-600"> {getDescription(item)}</span>
                                        </Typography>

                                        <Typography variant="body3" className="text-gray-500 mt-1 capitalize">
                                            {item.action_type.replace(/_/g, ' ').toLowerCase()}
                                        </Typography>
                                    </div>

                                    <Typography variant="body3" className="text-gray-400 font-medium shrink-0">
                                        {dayjs(item.created_at).format('MMM D, YYYY [at] h:mm A')}
                                    </Typography>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {meta.total > limit && (
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                        <Pagination
                            page={page}
                            count={meta.lastPage}
                            onChange={setPage}
                        />
                    </div>
                )}
            </Box>
        </div>
    );
}
