
"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Banner from '@/components/dashboard/overview/banner';
import BusinessVerificationOverview from '@/components/dashboard/overview/not-verified-view';
import { ProfileHealth } from './profile-health';
import { ActivityTimeline } from './activity-timeline';

export function Overviews() {
    const { user, appData } = useSelector((state: RootState) => state.auth);

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const isSupplierProfileCreated = appData?.isProfileCreated;

    // Based on original logic: const allRoles = ['buyer', 'supplier', 'buyer_supplier', 'inspector'];
    const finalRelease = isBusinessVerified && (user?.role !== 'supplier' || isSupplierProfileCreated);

    return (
        <div className="animate-in fade-in duration-700 pb-10">
            {finalRelease ? (
                <div className="space-y-8">
                    {/* New Bento Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Hero & Greeting - 8 columns */}
                        <div className="lg:col-span-8 space-y-2">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                                Welcome back, {user?.firstName} 👋
                            </h2>
                            <p className="text-gray-500 font-medium">
                                Here's an overview of what's happening in your marketplace today.
                            </p>
                        </div>

                        {/* Main Stream (Banner) - 8 columns */}
                        <div className="lg:col-span-8 space-y-6">
                            <Banner />
                        </div>

                        {/* Sidebar (Profile + Activity) - 4 columns */}
                        <div className="lg:col-span-4 space-y-6">
                            <ProfileHealth />
                            <ActivityTimeline />
                        </div>
                    </div>

                    {/* Previous Layout (Preserved as requested)
                    <div className="space-y-8">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                                Welcome back, {user?.firstName} 👋
                            </h2>
                            <p className="text-gray-500 font-medium">
                                Here's what's happening with your business today.
                            </p>
                        </div>
                        <Banner />
                    </div>
                    */}
                </div>
            ) : (
                <BusinessVerificationOverview />
            )}
        </div>
    );
}
