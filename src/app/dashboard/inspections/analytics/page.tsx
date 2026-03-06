"use client";

import React from 'react';
import { useGetInspectorAnalyticsQuery } from '@/redux/features/inspector/inspector_api';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart3,
    Zap,
    Trophy,
    Clock,
    CheckCircle2,
    AlertCircle,
    Timer,
    LineChart
} from 'lucide-react';

export default function InspectorAnalyticsPage() {
    const { data: analyticsRes, isLoading, isError } = useGetInspectorAnalyticsQuery();
    const analytics = analyticsRes?.data;

    if (isLoading) {
        return (
            <Box className="space-y-10 pb-20">
                <Skeleton className="h-20 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-80 rounded-3xl" />
                    <Skeleton className="h-80 rounded-3xl" />
                </div>
            </Box>
        );
    }

    if (isError) {
        return (
            <Card outlined className="m-8">
                <CardContent className="py-20 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <Typography variant="h6">Failed to load analytics engine</Typography>
                    <Typography variant="body2" className="text-neutral-400 mt-2 italic">Please synchronize your connection and try again.</Typography>
                </CardContent>
            </Card>
        );
    }

    const { metrics, yieldAnalysis, distribution } = analytics || {};

    return (
        <div className="space-y-10 pb-20 max-w-6xl">
            <div>
                <Typography variant="h3">Performance Analytics</Typography>
                <Typography variant="body2" className="text-neutral-500 mt-1">
                    Deep dive into your operational efficiency and service yield.
                </Typography>
            </div>

            {/* High Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="SLA Compliance"
                    value={`${metrics?.slaCompliance || 0}%`}
                    subLabel="On-time report delivery"
                    icon={<Trophy className="w-5 h-5 text-amber-500" />}
                    color="amber"
                />
                <MetricCard
                    label="Avg Turnaround"
                    value={`${metrics?.avgTurnaround || 0}h`}
                    subLabel="Acceptance to completion"
                    icon={<Zap className="w-5 h-5 text-green-500" />}
                    color="green"
                />
                <MetricCard
                    label="Response Speed"
                    value={`${metrics?.avgResponse || 0}h`}
                    subLabel="Invite to acceptance"
                    icon={<Timer className="w-5 h-5 text-blue-500" />}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Yield Analysis */}
                <Card outlined className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase">Yield Analysis</Typography>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
                            <LineChart className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-[10px] font-black uppercase text-green-600">6 Month Trend</span>
                        </div>
                    </div>

                    {yieldAnalysis?.length > 0 ? (
                        <div className="h-64 flex items-end p-2 gap-3">
                            {yieldAnalysis.map((item: any, i: number) => {
                                const height = Math.min(100, (item.count / 10) * 100); // Scale relative to 10 for visual
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full bg-primary-500/20 rounded-t-lg relative group transition-all hover:bg-primary-500/40" style={{ height: `${height}%` }}>
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-black">
                                                {item.count} Jobs
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter transform rotate-45 mt-4">
                                            {item.month.split('-')[1]}/{item.month.split('-')[0].slice(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-64 bg-neutral-50 rounded-2xl flex items-center justify-center border border-dashed border-neutral-200">
                            <Typography variant="caption" className="text-neutral-400 italic font-medium">Insufficient performance data for trending.</Typography>
                        </div>
                    )}
                </Card>

                {/* Outcome Matrix */}
                <Card outlined className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <Typography variant="overline" className="text-neutral-400 font-bold tracking-widest uppercase">Outcome Matrix</Typography>
                        <BarChart3 className="w-4 h-4 text-neutral-300" />
                    </div>

                    <div className="space-y-4 pt-4">
                        <DistributionRow
                            label="Completed"
                            count={distribution?.COMPLETED || 0}
                            total={Object.values(distribution || {}).reduce((a: any, b: any) => a + b, 0) as number}
                            color="bg-green-500"
                        />
                        <DistributionRow
                            label="Active/Processing"
                            count={(distribution?.ACCEPTED || 0) + (distribution?.SITE_VISIT || 0) + (distribution?.LAB_ANALYSIS || 0) + (distribution?.REPORT_WRITING || 0)}
                            total={Object.values(distribution || {}).reduce((a: any, b: any) => a + b, 0) as number}
                            color="bg-amber-500"
                        />
                        <DistributionRow
                            label="Pending"
                            count={distribution?.ASSIGNED || 0}
                            total={Object.values(distribution || {}).reduce((a: any, b: any) => a + b, 0) as number}
                            color="bg-blue-500"
                        />
                        <DistributionRow
                            label="Cancelled/Rejected"
                            count={(distribution?.CANCELLED || 0) + (distribution?.REJECTED || 0)}
                            total={Object.values(distribution || {}).reduce((a: any, b: any) => a + b, 0) as number}
                            color="bg-red-500"
                        />
                    </div>
                </Card>
            </div>

            <Card outlined className="bg-neutral-50/30">
                <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                            <Typography variant="h6" className="text-neutral-800">Historical Performance Logs</Typography>
                            <Typography variant="caption" className="text-neutral-500 font-medium tracking-tight">Systematic record of all concluded trade orchestrations.</Typography>
                        </div>
                    </div>
                    <div className="p-20 text-center bg-white rounded-2xl border border-neutral-100 border-dashed">
                        <Typography variant="body2" className="text-neutral-400 italic">Advanced historical audit logs arriving in next cycle.</Typography>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ label, value, subLabel, icon, color }: any) {
    const colorMap: any = {
        amber: 'bg-amber-50 border-amber-100 text-amber-600',
        green: 'bg-green-50 border-green-100 text-green-600',
        blue: 'bg-blue-50 border-blue-100 text-blue-600'
    };
    return (
        <Card outlined className="p-6 transition-all hover:border-neutral-300 group">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl border transition-all group-hover:scale-110 ${colorMap[color]}`}>
                    {icon}
                </div>
                <div>
                    <Typography variant="overline" className="text-neutral-400 font-black tracking-widest">{label}</Typography>
                    <Typography variant="h4" className="text-neutral-900">{value}</Typography>
                    <Typography variant="caption" className="text-neutral-400 block mt-0.5 font-medium">{subLabel}</Typography>
                </div>
            </div>
        </Card>
    );
}

function DistributionRow({ label, count, total, color }: any) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">{label}</span>
                <span className="text-xs font-black text-neutral-800">{count} <span className="text-neutral-300 font-medium">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                <div
                    className={`h-full transition-all duration-1000 ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
