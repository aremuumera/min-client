'use client';

import React from 'react';
import { useGetClientStagesQuery } from '@/redux/features/doc-hub/doc_hub_api';
import { CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helper';
import { motion } from 'framer-motion';

export const TradeStageTracker = ({ inquiryId, currentStatus }: { inquiryId: string; currentStatus: string }) => {
    const { data, isLoading } = useGetClientStagesQuery({ inquiryId });
    const stages = data?.data || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
                <span className="ml-3 text-sm font-bold text-gray-500">Loading Tracking Data...</span>
            </div>
        );
    }

    if (!stages || stages.length === 0) {
        return null; // Return null if there's no stages configured to avoid breaking UI layout
    }

    // Determine current index based on the inquiry's "currentStatus" matching a stage slug. 
    // In our system, inquiry status typically matches or maps to a stage slug, or we can just show the sequential flow
    // By default, if the current status isn't matched easily, we'll try to find the matching stage
    let currentStepIndex = stages.findIndex((s: any) =>
        currentStatus.toLowerCase().includes(s.slug.toLowerCase().replace(/_/g, '')) ||
        s.slug.toLowerCase().includes(currentStatus.toLowerCase().replace(/_/g, ''))
    );

    // Fallback if no exact string match is found
    if (currentStepIndex === -1) {
        if (currentStatus === 'PENDING' || currentStatus === 'CLAIMED') currentStepIndex = 0;
        else if (currentStatus === 'SUPPLIER_MATCHED' || currentStatus === 'ACKNOWLEDGED') currentStepIndex = 1;
        else currentStepIndex = 2; // Default show some progress
    }

    return (
        <div className="relative flex items-center justify-between py-10 px-8 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group">
            {/* Connecting Lines Background */}
            <div className="absolute top-[64px] left-[10%] right-[10%] h-[2px] bg-gray-50 -translate-y-1/2" />

            {/* Active Connecting Line */}
            <div
                className="absolute top-[64px] left-[10%] h-[2px] bg-emerald-500 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                style={{ width: `${Math.max(0, currentStepIndex * (100 / (stages.length - 1)))}%` }}
            />

            {stages.map((stage: any, index: number) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const isPending = index > currentStepIndex;

                let stateClass = '';
                let Icon = null;

                if (isActive) {
                    stateClass = 'bg-emerald-600 ring-4 ring-emerald-100 text-white';
                    Icon = PlayCircle;
                } else if (isCompleted) {
                    stateClass = 'bg-emerald-100 text-emerald-600';
                    Icon = CheckCircle2;
                } else {
                    stateClass = 'bg-gray-100 text-gray-400';
                    Icon = Clock;
                }

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={stage.id}
                        className="flex flex-col items-center text-center space-y-3 flex-1 relative min-w-[100px] group"
                    >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10", stateClass)}>
                            <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                        </div>
                        <div className="space-y-1">
                            <p className={cn(
                                "text-[10px] uppercase tracking-widest font-black transition-colors",
                                isActive ? "text-gray-900" : (isCompleted ? "text-gray-500" : "text-gray-400")
                            )}>
                                {stage.name}
                            </p>
                            {stage.generates_document && (
                                <p className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                    DOC REQUIRED
                                </p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
