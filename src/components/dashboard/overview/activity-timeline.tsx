'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Bell } from 'lucide-react';
import { dayjs } from '@/lib/dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
    getActivityIcon,
    getActivityDescription,
    isAccountActivity,
} from '@/utils/activity-helpers';

export const ActivityTimeline = () => {
    // business events only (spec §9): sign-ins and notification settings stay in the full log
    const { data, isLoading } = useGetActivitiesQuery({ limit: 15 });
    type Entry = { action_type?: string; actionType?: string; action?: string };
    const activities = (data?.data || []).filter((item: Entry) => !isAccountActivity(item.action_type || item.actionType || item.action || '')).slice(0, 5);
    const router = useRouter();

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
                        {activities.map((item: any) => {
                            const currentActionType = item.action_type || item.actionType || item.action || '';
                            return (
                                <div key={item.id} className="relative pl-7 group">
                                    <div className="absolute left-0 top-0.5 w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center z-10">
                                        {getActivityIcon(currentActionType, "w-3.5 h-3.5", item.metadata)}
                                    </div>
                                    <div className="flex flex-col">
                                         <p className="text-xs font-medium text-gray-900 leading-snug">
                                             {getActivityDescription(item)}
                                         </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                                            {dayjs(item.created_at || item.createdAt).fromNow()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
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
