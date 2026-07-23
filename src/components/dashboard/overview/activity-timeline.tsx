'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Bell, MessageSquare, Briefcase, UserPlus, CreditCard, ShoppingBag, LogIn, CheckCircle, XCircle, FileText, Send } from 'lucide-react';
import { dayjs } from '@/lib/dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';
import { useAppSelector } from '@/redux/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export const ActivityTimeline = () => {
    const { data, isLoading } = useGetActivitiesQuery({ limit: 5 });
    const activities = data?.data || [];
    const router = useRouter();

    const parseMetadata = (rawMeta: any) => {
        if (!rawMeta) return {};
        if (typeof rawMeta === 'string') {
            try {
                return JSON.parse(rawMeta);
            } catch {
                return { details: rawMeta };
            }
        }
        return rawMeta;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'USER_LOGGED_IN':
            case 'USER_SIGNED_UP': return <LogIn className="w-3.5 h-3.5 text-emerald-600" />;
            case 'TEAM_MEMBER_INVITED':
            case 'TEAM_MEMBER_UPDATED': return <UserPlus className="w-3.5 h-3.5 text-blue-600" />;
            case 'INVOICE_CREATED':
            case 'INVOICE_APPROVED':
            case 'INVOICE_REJECTED':
            case 'INVOICE_CANCELLED':
            case 'INVOICE_SUBMITTED_FOR_APPROVAL':
                return <CreditCard className="w-3.5 h-3.5 text-purple-600" />;
            case 'PRODUCT_CREATED':
            case 'PRODUCT_UPDATED':
            case 'PRODUCT_DELETED':
                return <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
            case 'RFQ_CREATED':
            case 'RFQ_UPDATED':
            case 'RFQ_DELETED':
            case 'OFFER_SUBMITTED':
            case 'OFFER_SHORTLISTED':
                return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
            case 'INQUIRY_CREATED':
            case 'INQUIRY_UPDATED':
            case 'INQUIRY_ACKNOWLEDGED':
            case 'INQUIRY_REJECTED': return <MessageSquare className="w-3.5 h-3.5 text-teal-600" />;
            case 'OFFER_ACCEPTED_BY_ADMIN': return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
            case 'OFFER_REJECTED_BY_ADMIN': return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
            case 'DOCUMENT_UPLOADED':
            case 'DOCUMENT_SIGNED':
            case 'DOCUMENT_FLAGGED':
            case 'DOCUMENT_APPROVED':
            case 'DOCUMENT_REJECTED':
                return <FileText className="w-3.5 h-3.5 text-cyan-600" />;
            case 'INSPECTOR_ASSIGNED': return <Briefcase className="w-3.5 h-3.5 text-orange-600" />;
            case 'INSPECTION_STATUS_UPDATED': return <Send className="w-3.5 h-3.5 text-sky-600" />;
            default: return <Bell className="w-3.5 h-3.5 text-gray-600" />;
        }
    };

    const getDescription = (activity: any) => {
        const metadata = parseMetadata(activity.metadata);
        switch (activity.action_type) {
            case 'USER_SIGNED_UP': return 'joined the platform';
            case 'USER_LOGGED_IN': return 'logged in';
            case 'TEAM_MEMBER_INVITED': return `invited ${metadata.email || 'a new member'}`;
            case 'TEAM_MEMBER_UPDATED': return `updated a team member (${metadata.email || 'details'})`;
            case 'INVOICE_CREATED': return `created invoice ${metadata.invoiceNumber ? `#${metadata.invoiceNumber}` : ''}`;
            case 'INVOICE_SUBMITTED_FOR_APPROVAL': return `submitted invoice ${metadata.invoiceNumber ? `#${metadata.invoiceNumber}` : ''} for approval`;
            case 'INVOICE_APPROVED': return `approved invoice ${metadata.invoiceNumber ? `#${metadata.invoiceNumber}` : ''}`;
            case 'INVOICE_REJECTED': return `rejected invoice ${metadata.invoiceNumber ? `#${metadata.invoiceNumber}` : ''}`;
            case 'INVOICE_CANCELLED': return `cancelled invoice ${metadata.invoiceNumber ? `#${metadata.invoiceNumber}` : ''}`;
            case 'PRODUCT_CREATED': return `published ${metadata.productName || 'a new product'}`;
            case 'PRODUCT_UPDATED': return `updated product "${metadata.productName || 'details'}"`;
            case 'PRODUCT_DELETED': return `deleted a product`;
            case 'RFQ_CREATED': return `created RFQ "${metadata.productName || ''}"`;
            case 'RFQ_UPDATED': return `updated RFQ "${metadata.productName || ''}"`;
            case 'RFQ_DELETED': return `deleted an RFQ`;
            case 'OFFER_SUBMITTED': return `submitted an offer`;
            case 'OFFER_SHORTLISTED': return `shortlisted an offer`;
            case 'INQUIRY_CREATED': return `started a new inquiry`;
            case 'INQUIRY_UPDATED': return `updated an inquiry (Status: ${metadata.newStatus || 'changed'})`;
            case 'INQUIRY_ACKNOWLEDGED': return `acknowledged an inquiry`;
            case 'INQUIRY_REJECTED': return `rejected an inquiry`;
            case 'OFFER_ACCEPTED_BY_ADMIN': return `accepted an offer`;
            case 'OFFER_REJECTED_BY_ADMIN': return `rejected an offer`;
            case 'DOCUMENT_UPLOADED': return `uploaded document "${metadata.documentTitle || metadata.title || 'File'}"`;
            case 'DOCUMENT_SIGNED': return `signed document "${metadata.documentTitle || metadata.title || 'File'}"`;
            case 'DOCUMENT_FLAGGED': return `flagged document "${metadata.documentTitle || metadata.title || 'File'}"`;
            case 'DOCUMENT_APPROVED': return `approved document "${metadata.documentTitle || metadata.title || 'File'}"`;
            case 'DOCUMENT_REJECTED': return `rejected document "${metadata.documentTitle || metadata.title || 'File'}"`;
            case 'INSPECTOR_ASSIGNED': return `assigned an inspector`;
            case 'INSPECTION_STATUS_UPDATED': return `updated inspection status to ${metadata.newStatus || 'a new status'}`;
            default: return 'performed an action';
        }
    };

    const { user } = useAppSelector((state) => state.auth);

    const getActorName = (activity: any) => {
        const metadata = parseMetadata(activity.metadata);
        const actorId = activity.userId || activity.user_id;

        if (user && actorId && (actorId === user.id || actorId === user.external_id)) {
            return "You";
        }
        if (metadata.actorName || metadata.name) {
            return metadata.actorName || metadata.name;
        }
        if (metadata.actorEmail || metadata.email) {
            const email = metadata.actorEmail || metadata.email;
            return email.split('@')[0];
        }
        return "Team Member";
    };

    return (
        <Box className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <Typography variant="h6" className="font-bold text-gray-900">
                    Business Activity
                </Typography>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="grow relative overflow-hidden">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                                <div className="space-y-2 grow">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Bell className="w-10 h-10 text-gray-300 mb-2" />
                        <Typography variant="body2" className="text-gray-400">
                            No recent activity found for your business.
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {activities.map((item: any) => (
                            <div key={item.id} className="relative pl-7 group">
                                <div className="absolute left-0 top-0.5 w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center z-10">
                                    {getIcon(item.action_type)}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-semibold text-gray-900 leading-snug">
                                        {getActorName(item)} <span className="font-normal text-gray-600"> {getDescription(item)}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                                        {dayjs(item.created_at || item.createdAt).fromNow()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!isLoading && activities.length > 0 && (
                <button
                    onClick={() => router.push('/dashboard/activity')}
                    className="mt-6 text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest text-center w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                    Full Audit Log
                </button>
            )}
        </Box>
    );
};
