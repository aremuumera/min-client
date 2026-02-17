'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Bell, Heart, MessageSquare, Briefcase, UserPlus, CreditCard, ShoppingBag, LogIn } from 'lucide-react';
import { dayjs } from '@/lib/dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';
import { Skeleton } from '@/components/ui/skeleton';

export const ActivityTimeline = () => {
    const { data, isLoading } = useGetActivitiesQuery({ limit: 5 });
    const activities = data?.data || [];

    const getIcon = (type: string) => {
        switch (type) {
            case 'USER_LOGGED_IN': return <LogIn className="w-3.5 h-3.5" />;
            case 'TEAM_MEMBER_INVITED': return <UserPlus className="w-3.5 h-3.5" />;
            case 'INVOICE_CREATED':
            case 'INVOICE_APPROVED':
            case 'INVOICE_SUBMITTED_FOR_APPROVAL':
                return <CreditCard className="w-3.5 h-3.5" />;
            case 'PRODUCT_CREATED': return <ShoppingBag className="w-3.5 h-3.5" />;
            default: return <Bell className="w-3.5 h-3.5" />;
        }
    };

    const getDescription = (activity: any) => {
        const metadata = activity.metadata || {};
        switch (activity.actionType) {
            case 'USER_SIGNED_UP': return 'joined the platform';
            case 'USER_LOGGED_IN': return 'logged in';
            case 'TEAM_MEMBER_INVITED': return `invited ${metadata.email || 'a new member'}`;
            case 'TEAM_MEMBER_UPDATED': return 'updated a team member';
            case 'INVOICE_CREATED': return `created invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_SUBMITTED_FOR_APPROVAL': return `submitted invoice ${metadata.invoiceNumber || ''} for approval`;
            case 'INVOICE_APPROVED': return `approved invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_REJECTED': return `rejected invoice ${metadata.invoiceNumber || ''}`;
            case 'INVOICE_CANCELLED': return `cancelled invoice ${metadata.invoiceNumber || ''}`;
            case 'PRODUCT_CREATED': return `published ${metadata.productName || 'a new product'}`;
            default: return 'performed an action';
        }
    };

    return (
        <Box className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
                <Typography variant="h6" className="font-bold text-gray-900">
                    Business Activity
                </Typography>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
                        <Bell className="w-10 h-10 text-gray-100 mb-2" />
                        <Typography variant="body2" className="text-gray-400">
                            No recent activity found for your business.
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {activities.map((item: any) => (
                            <div key={item.id} className="relative pl-8 group">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full border border-white bg-green-50 text-green-600 flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                                    {getIcon(item.actionType)}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                                        System <span className="font-normal text-gray-600"> {getDescription(item)}</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                                        {dayjs(item.created_at).fromNow()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!isLoading && activities.length > 0 && (
                <button className="mt-6 text-[11px] font-bold text-gray-400 hover:text-green-600 transition-colors uppercase tracking-widest text-center">
                    Full Audit Log
                </button>
            )}
        </Box>
    );
};
