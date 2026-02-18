"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardActions } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Chip } from '@/components/ui/chip';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { cn } from '@/utils/helper';

// --- Types ---
type Tier = 'free' | 'bronze' | 'silver' | 'gold';
type Duration = '3_months' | '6_months';

interface PlanFeature {
    label: string;
    included: boolean;
    tooltip?: string;
}

interface PricingTier {
    id: Tier;
    title: string;
    price: {
        '3_months': string;
        '6_months': string;
    };
    description: string;
    features: PlanFeature[];
    highlight?: boolean;
    buttonText: string;
    buttonVariant: 'outlined' | 'contained';
    color: 'secondary' | 'primary' | 'warning';
}

// --- Data ---
const getPlans = (duration: Duration): PricingTier[] => [
    {
        id: 'free',
        title: 'Free',
        price: { '3_months': 'Free', '6_months': 'Free' },
        description: 'For new businesses testing the platform.',
        features: [
            { label: '3 Products', included: true },
            { label: 'Post RFQ (Limited)', included: true },
            { label: 'Business Page (Basic)', included: true },
            { label: 'Basic Support', included: true },
            { label: 'Verify Tick', included: false },
            { label: 'Ad Banners', included: false },
            { label: 'Upload Catalog/Video', included: false },
            { label: 'Receive General RFQ', included: false },
        ],
        buttonText: 'Get Started',
        buttonVariant: 'outlined',
        color: 'secondary',
    },
    {
        id: 'bronze',
        title: 'Bronze',
        price: { '3_months': '$45', '6_months': '$80' },
        description: 'For small verified businesses.',
        features: [
            { label: '10 Products', included: true },
            { label: 'Verify Tick', included: true },
            { label: 'Upload Company Image', included: true },
            { label: 'Post RFQ', included: true },
            { label: 'Receive General RFQ (Limited)', included: true },
            { label: 'Upload Catalog/Video', included: false },
            { label: 'Link to Verified Buyers', included: false },
            { label: 'Social Media Marketing', included: false },
        ],
        buttonText: 'Upgrade',
        buttonVariant: 'outlined',
        color: 'secondary',
    },
    {
        id: 'silver',
        title: 'Silver',
        price: { '3_months': '$150', '6_months': '$270' },
        description: 'For growing businesses needing visibility.',
        highlight: true,
        features: [
            { label: '50 Products', included: true },
            { label: 'Verify Tick', included: true },
            { label: 'Real-time Keyword Alerts', included: true },
            { label: 'Business Dedicated Page', included: true },
            { label: 'Upload Catalog & Certificates', included: true },
            { label: 'Receive Dedicated RFQ', included: true },
            { label: 'Response to RFQ (50/mo)', included: true },
            { label: '24/7 Chat Support', included: true },
            { label: 'Exclusive Banner Design', included: false },
            { label: 'Top List Placement', included: false },
        ],
        buttonText: 'Upgrade',
        buttonVariant: 'contained',
        color: 'secondary',
    },
    {
        id: 'gold',
        title: 'Gold',
        price: { '3_months': 'Contact Sales', '6_months': 'Contact Sales' },
        description: 'For market leaders and enterprises.',
        features: [
            { label: 'Unlimited Products', included: true },
            { label: 'Verify Tick + Gold Badge', included: true },
            { label: 'Early Access to RFQs (24h)', included: true },
            { label: 'WhatsApp Alerts + Competitor Watch', included: true },
            { label: 'Top List Priority', included: true },
            { label: 'Show on Popular Products', included: true },
            { label: 'Ad Banners', included: true },
            { label: 'Exclusive Banner Design', included: true },
            { label: 'Upload Company Video', included: true },
            { label: 'Response to RFQ (Unlimited)', included: true },
            { label: 'Link to Verified Buyers', included: true },
            { label: 'Social Media Marketing', included: true },
            { label: 'Dedicated Account Manager', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'contained',
        color: 'warning',
    },
];

export function PlansTable() {
    const [duration, setDuration] = useState<Duration>('3_months');

    return (
        <div className="py-16 px-4">
            <div className="flex flex-col items-center gap-4">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-neutral-900">
                        Choose the right plan for your business
                    </h2>
                    <p className="text-lg text-neutral-500">
                        Transparent pricing. No hidden fees.
                    </p>
                </div>

                {/* Duration Toggle */}
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-neutral-200 mt-6">
                    <span className={cn("text-sm font-medium", duration === '3_months' ? "text-primary-600" : "text-neutral-500")}>
                        Quarterly (3 Months)
                    </span>
                    <Switch
                        checked={duration === '6_months'}
                        onChange={(e) => setDuration(e.target.checked ? '6_months' : '3_months')}
                        color="primary"
                    />
                    <span className={cn("text-sm font-medium", duration === '6_months' ? "text-primary-600" : "text-neutral-500")}>
                        Bi-Annual (6 Months)
                    </span>
                    {duration === '6_months' && (
                        <Chip label="Save up to 15%" color="success" size="sm" variant="soft" />
                    )}
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mt-8">
                    {getPlans(duration).map((plan) => (
                        <Card
                            key={plan.id}
                            elevation={plan.highlight ? 2 : 1}
                            className={cn(
                                "flex flex-col relative h-full transition-transform duration-200",
                                plan.highlight && "ring-2 ring-primary-500 scale-105 z-10"
                            )}
                        >
                            {plan.highlight && (
                                <div className="absolute top-4 right-4">
                                    <Chip label="Recommended" color="primary" size="sm" />
                                </div>
                            )}

                            <CardHeader
                                title={<span className="text-neutral-500 font-bold uppercase tracking-wider text-xs">{plan.title}</span>}
                                subheader={
                                    <div className="mt-2 text-neutral-900">
                                        <span className="text-3xl font-bold">{plan.price[duration]}</span>
                                    </div>
                                }
                                className="pb-2"
                            />

                            <CardContent className="flex-1 space-y-4">
                                <p className="text-sm text-neutral-500">{plan.description}</p>

                                <div className="w-full h-px bg-neutral-100 my-4" />

                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            {feature.included ? (
                                                <CheckIcon weight="bold" className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <XIcon weight="bold" className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            )}
                                            <span className={cn(feature.included ? "text-neutral-700" : "text-neutral-400")}>
                                                {feature.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardActions className="pt-4 mt-auto">
                                <Button
                                    fullWidth
                                    variant={plan.buttonVariant}
                                    color={plan.color}
                                    size="lg"
                                    className={cn(plan.highlight && "shadow-md")}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
