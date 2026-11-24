"use client";

import React from 'react';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import BusinessVerificationOverview from '@/components/dashboard/overview/not-verified-view';
import { MerchantOverview } from './merchant-overview';
import { InspectorOverview } from './inspector-overview';

/*
 * The overview at /dashboard (decisions #147 to #150; spec docs/new/implementation/specs/overview-page.md).
 * Not verified yet (or a supplier without a store profile): the verification steps, as before.
 * Inspectors: their jobs. Buyers, suppliers and companies that do both: their trades.
 */
export function Overviews() {
    const { isInspector, isSupplier, isBusinessVerified, isProfileCreated } = useAuthIdentity();

    const finalRelease = isBusinessVerified && (!isSupplier || isProfileCreated);
    if (!finalRelease) return <BusinessVerificationOverview />;

    return isInspector ? <InspectorOverview /> : <MerchantOverview />;
}
