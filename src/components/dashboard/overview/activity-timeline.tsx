'use client';

import React, { useContext } from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { ChatContext } from '@/providers/chat-provider';
import { Bell, Heart, MessageSquare, Briefcase } from 'lucide-react';
import { dayjs } from '@/lib/dayjs';

export const ActivityTimeline = () => {
    const chatContext = useContext(ChatContext);
    const notifications = chatContext?.notifications || [];

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageSquare className="w-3.5 h-3.5" />;
            case 'saved': return <Heart className="w-3.5 h-3.5" />;
            case 'rfq': return <Briefcase className="w-3.5 h-3.5" />;
            default: return <Bell className="w-3.5 h-3.5" />;
        }
    };

    return (
        <Box className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
                <Typography variant="h6" className="font-bold text-gray-900">
                    Recent Activity
                </Typography>
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            </div>

            <div className="grow relative overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Bell className="w-10 h-10 text-gray-100 mb-2" />
                        <Typography variant="body2" className="text-gray-400">
                            Stay active to see your<br />engagement timeline here.
                        </Typography>
                    </div>
                ) : (
                    <div className="space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                        {notifications.slice(0, 4).map((item: any) => (
                            <div key={item.id} className="relative pl-8 group">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full border border-white bg-primary-50 text-primary-600 flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                                    {getIcon(item.itemType)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                                        {item.senderName}
                                        <span className="font-normal text-gray-600"> sent you a message</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {dayjs(item.timestamp).fromNow()}
                                    </p>
                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-[#f3f4f6]">
                                        <p className="text-[12px] text-gray-600 line-clamp-2 italic">
                                            "{item.message}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {notifications.length > 0 && (
                <button className="mt-6 text-[13px] font-bold text-gray-500 hover:text-primary-600 transition-colors uppercase tracking-widest">
                    View Full History
                </button>
            )}
        </Box>
    );
};
