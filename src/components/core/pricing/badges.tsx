"use client";

import React from 'react';
import { SealCheck as SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { Medal as MedalIcon } from '@phosphor-icons/react/dist/ssr/Medal';
import { Tooltip } from '@/components/ui/tooltip';

export function VerifiedBadge({ size = 24 }: { size?: number }) {
    return (
        <Tooltip title={<span className="font-bold">Verified Business</span>}>
            <div className="inline-flex items-center gap-1">
                <SealCheckIcon
                    weight="fill"
                    color="#1e88e5" // Blue
                    size={size}
                />
                <span className="text-xs font-bold text-[#1e88e5] uppercase">
                    Verified
                </span>
            </div>
        </Tooltip>
    );
}

export function GoldSupplierBadge({ size = 24 }: { size?: number }) {
    return (
        <Tooltip title={<span className="font-bold">Gold Supplier - Top Tier</span>}>
            <div className="inline-flex items-center gap-1">
                <MedalIcon
                    weight="fill"
                    color="#FFD700" // Gold
                    size={size}
                />
                <span className="text-xs font-bold text-[#DAA520] uppercase">
                    Gold Supplier
                </span>
            </div>
        </Tooltip>
    );
}

export function PricingBadgesPreview() {
    return (
        <div className="my-8 p-6 border border-dashed border-neutral-300 rounded-lg flex flex-col md:flex-row gap-8 justify-center bg-neutral-50/50">
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Tier 2 & 3</span>
                <VerifiedBadge size={32} />
            </div>
            <div className="h-px w-full md:h-12 md:w-px bg-neutral-200" />
            <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Tier 4 (Gold)</span>
                <GoldSupplierBadge size={32} />
            </div>
        </div>
    );
}
