'use client';

import React from 'react';
import { useGetClientStagesQuery } from '@/redux/features/doc-hub/doc_hub_api';
import { CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helper';
import { motion } from 'framer-motion';

import { MAIN_TRADE_PHASES } from '@/config/trade-stepper-config';

export const TradeStageTracker = ({ inquiryId, currentStatus }: { inquiryId: string; currentStatus: string }) => {
    const { data, isLoading } = useGetClientStagesQuery({ inquiryId: inquiryId || '' }, { skip: !inquiryId });
    const fetchedStages = data?.data || [];

    const stages = (fetchedStages && fetchedStages.length > 0) ? fetchedStages : MAIN_TRADE_PHASES.map((p) => ({
        id: p.slug,
        name: p.name,
        slug: p.slug,
        stage_order: p.order,
        generates_document: false,
    }));

    if (isLoading && (!stages || stages.length === 0)) {
        return (
            <div className="flex items-center justify-center p-10 bg-white rounded-[32px] border border-gray-200">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
                <span className="ml-3 text-sm font-bold text-gray-500">Loading Tracking Data...</span>
            </div>
        );
    }

    let currentStepIndex = stages.findIndex((s: any) => s.is_current_stage);
    if (currentStepIndex === -1) {
        currentStepIndex = stages.findIndex((s: any) =>
            currentStatus && (
                currentStatus.toLowerCase().includes(s.slug.toLowerCase().replace(/_/g, '')) ||
                s.slug.toLowerCase().includes(currentStatus.toLowerCase().replace(/_/g, ''))
            )
        );
    }
    if (currentStepIndex === -1) currentStepIndex = 0;

    const activeStage = stages[currentStepIndex];

    return (
        <div className="relative flex items-center justify-between py-10 px-8 bg-white rounded-[32px] border border-gray-200 overflow-x-auto no-scrollbar group">
            {/* Connecting Lines Background */}
            <div className="absolute top-[64px] left-[10%] right-[10%] h-[2px] bg-gray-100 -translate-y-1/2" />

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
