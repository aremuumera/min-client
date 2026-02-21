"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetInspectorStatsQuery } from '@/redux/features/inspector/inspector_api';

export default function InspectorOverviewPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: statsRes, isLoading } = useGetInspectorStatsQuery();
    const stats = statsRes?.data;

    if (isLoading) return <div className="p-8 text-center font-bold animate-pulse">Calculating Performance Metrics...</div>;

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Inspector Dashboard</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Welcome back, {(user as any)?.firstName}. Here's your operational snapshot.</p>
                </div>
                <div className="px-5 py-2 bg-green-50 rounded-2xl flex items-center gap-3 border border-green-100">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black uppercase text-green-700 tracking-widest">Active Status: Available</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Jobs', value: stats?.active_assignments || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Completed', value: stats?.completed_assignments || 0, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'SLA Compliance', value: `${stats?.avg_sla_compliance || 100}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Earnings', value: '$12.4k', color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2 group hover:border-neutral-400 transition-all cursor-default">
                        <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">{stat.label}</p>
                        <p className={`text-4xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Activity Spoke */}
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                        <div className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Recent Assignments</h2>
                            <button className="text-[10px] font-black uppercase text-blue-600">View All</button>
                        </div>
                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="font-bold text-neutral-800">No activity in the last 24 hours</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
