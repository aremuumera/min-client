"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsProps {
    stats: {
        pendingRequests: number;
        activeProjectCount: number;
        completedProjectCount: number;
        slaDeadlinesCount: number;
        avgTurnaround: number;
    } | null;
    isLoading: boolean;
}

export const InspectorStatsRow = ({ stats, isLoading }: StatsProps) => {
    const items = [
        {
            label: 'New Invitations',
            value: stats?.pendingRequests || 0,
            icon: <Briefcase className="w-4 h-4 text-green-600" />,
            bg: 'bg-green-50',
            borderColor: 'border-green-100'
        },
        {
            label: 'Active Jobs',
            value: stats?.activeProjectCount || 0,
            icon: <Clock className="w-4 h-4 text-green-600" />,
            bg: 'bg-green-50',
            borderColor: 'border-green-100'
        },
        {
            label: 'SLA Deadlines',
            value: stats?.slaDeadlinesCount || 0,
            icon: <AlertCircle className="w-4 h-4 text-red-600" />,
            bg: 'bg-red-50',
            borderColor: 'border-red-100'
        },
        {
            label: 'Avg Turnaround',
            value: `${stats?.avgTurnaround || 0}h`,
            icon: <CheckCircle className="w-4 h-4 text-green-600" />,
            bg: 'bg-green-50',
            borderColor: 'border-green-100'
        }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.label} outlined className="hover:border-neutral-300 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${item.bg} border ${item.borderColor} flex items-center justify-center`}>
                            {item.icon}
                        </div>
                        <div className="flex flex-col">
                            <Typography variant="overline" className="text-neutral-400 font-bold">
                                {item.label}
                            </Typography>
                            <Typography variant="h5" className="font-black text-neutral-900">
                                {item.value}
                            </Typography>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
