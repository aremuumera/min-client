
"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Banner from '@/components/dashboard/overview/banner';
import BusinessVerificationOverview from '@/components/dashboard/overview/not-verified-view';

export function Overviews() {
    const { user, appData } = useSelector((state: RootState) => state.auth);

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const userRole = user?.role;
    const isSupplierProfileCreated = appData?.isProfileCreated;

    // Based on original logic: const allRoles = ['buyer', 'supplier', 'buyer_supplier', 'inspector'];
    const finalRelease = isBusinessVerified && (user?.role !== 'supplier' || isSupplierProfileCreated);

    return (
        <div className="animate-in fade-in duration-700">
            {finalRelease ? (
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
            ) : (
                <BusinessVerificationOverview />
            )}
        </div>
    );
}
