"use client";

import React from 'react';
import { useGetTradeAssignmentsHistoryQuery } from '@/redux/features/trade/trade_api';
import { InspectionResultCard } from './inspection-result-card';
import { Spinner } from '@/components/ui';
import { MagnifyingGlass as MagnifyingGlassIcon, Clock as ClockIcon } from '@phosphor-icons/react';

interface InspectionHistoryPanelProps {
    tradeId: string;
    itemType?: string;
}

export function InspectionHistoryPanel({ tradeId, itemType = 'product' }: InspectionHistoryPanelProps) {
    const { data: assignments = [], isLoading, error } = useGetTradeAssignmentsHistoryQuery(
        { tradeId, itemType },
        { skip: !tradeId }
    );

    if (isLoading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <Spinner size={24} className="text-emerald-600 animate-spin" />
                <p className="text-xs font-bold text-gray-500">Loading Inspection History...</p>
            </div>
        );
    }

    if (error || !assignments || assignments.length === 0) {
        return (
            <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200">
                <MagnifyingGlassIcon size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-bold text-gray-700">No Inspection Records Found</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Inspection assignments for this trade will appear here once appointed by Admin.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <ClockIcon size={16} className="text-emerald-600" /> Inspection History ({assignments.length} {assignments.length === 1 ? 'Round' : 'Rounds'})
                </h4>
            </div>

            <div className="space-y-3">
                {assignments.map((assignment: any, index: number) => (
                    <div key={assignment.id || index} className="relative">
                        {assignment.is_current && (
                            <span className="absolute top-2 right-2 z-10 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-300">
                                Current Round
                            </span>
                        )}
                        <InspectionResultCard assignment={assignment} />
                    </div>
                ))}
            </div>
        </div>
    );
}
