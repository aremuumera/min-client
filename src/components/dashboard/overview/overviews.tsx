"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetInspectorStatsQuery, useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import Banner from '@/components/dashboard/overview/banner';
import BusinessVerificationOverview from '@/components/dashboard/overview/not-verified-view';
import { ProfileHealth } from './profile-health';
import { ActivityTimeline } from './activity-timeline';

// Inspector Specific Components
import { InspectorStatsRow } from './inspector-stats-row';
import { InspectorInvitationCards } from './inspector-invitation-cards';
import { MiniCalendar } from './mini-calendar';
import { WorkImprovementTable } from './work-improvement-table';

export function Overviews() {
    const { user, appData } = useSelector((state: RootState) => state.auth);
    const isInspector = user?.role === 'inspector';

    // Data fetching for Inspector Dashboard
    const { data: statsRes, isLoading: statsLoading } = useGetInspectorStatsQuery(undefined, { skip: !isInspector });
    const { data: assignmentsRes, isLoading: assignmentsLoading } = useGetInspectorAssignmentsQuery(undefined, { skip: !isInspector });

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const isSupplierProfileCreated = appData?.isProfileCreated;

    // Logic for showing verification or dashboard
    const finalRelease = isBusinessVerified && (user?.role !== 'supplier' || isSupplierProfileCreated);

    if (!finalRelease) {
        return <BusinessVerificationOverview />;
    }

    // INSPECTOR DASHBOARD LAYOUT
    if (isInspector) {
        return (
            <div className="animate-in fade-in duration-700 pb-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Operational Live
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                            Command <span className="text-green-600">Center</span> ⚡️
                        </h2>
                        <p className="text-gray-500 font-medium tracking-tight text-lg max-w-xl">
                            Welcome back, <span className="text-gray-900 font-bold">{user?.firstName}</span>. Your global monitoring is synchronized and active.
                        </p>
                    </div>
                </div>

                {/* Top Quick Stats */}
                <InspectorStatsRow stats={statsRes?.data} isLoading={statsLoading} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Stream (Main Actions & History) */}
                    <div className="lg:col-span-8 space-y-10">
                        <InspectorInvitationCards
                            assignments={assignmentsRes?.data || []}
                            isLoading={assignmentsLoading}
                        />
                        <WorkImprovementTable
                            assignments={assignmentsRes?.data || []}
                        />
                    </div>

                    {/* Right Sidebar (Schedule & Audit) */}
                    <div className="lg:col-span-4 space-y-10">
                        <MiniCalendar
                            assignments={assignmentsRes?.data || []}
                        />
                        <ActivityTimeline />
                    </div>
                </div>
            </div>
        );
    }

    // STANDARD MARKETPLACE DASHBOARD LAYOUT (Buyer/Supplier)
    return (
        <div className="animate-in fade-in duration-700 pb-10">
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Hero & Greeting */}
                    <div className="lg:col-span-8 space-y-2">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                            Welcome back, {user?.firstName} 👋
                        </h2>
                        <p className="text-gray-500 font-medium">
                            Here's an overview of what's happening in your marketplace today.
                        </p>
                    </div>

                    {/* Main Stream (Banner) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Banner />
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <ProfileHealth />
                        <ActivityTimeline />
                    </div>
                </div>
            </div>
        </div>
    );
}
