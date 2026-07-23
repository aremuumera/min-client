"use client";

import React from 'react';
import { paths } from '@/config/paths';
import { motion } from 'framer-motion';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import Link from 'next/link';
import {
    Sparkles,
    ArrowRight,
    Building2,
    Store,
    Lock,
    CheckCircle2,
    FileCheck,
    BadgeCheck
} from 'lucide-react';

const UnverifiedBanner = () => {
    const { appData, user, normalizedRole } = useAuthIdentity();
    const IsBusinessStatus = appData?.businessVerification?.status;
    const role = normalizedRole;

    const contentMap = {
        supplier: {
            description: "Complete your business verification in minutes to unlock full platform access. Connect with verified buyers, list products, and scale globally.",
            actionLabel: "Start Trading",
            actionDescription: "List products & connect with buyers"
        },
        buyer: {
            description: "Complete your business verification in minutes to unlock full platform access. Connect with verified suppliers and source quality materials.",
            actionLabel: "Start Sourcing",
            actionDescription: "Find verified products & suppliers"
        },
        inspector: {
            description: "Complete your business verification in minutes to unlock full platform access. Join our verified inspector network and conduct audits.",
            actionLabel: "Start Inspecting",
            actionDescription: "Accept and manage inspections"
        },
        default: {
            description: "Complete your business verification in minutes to unlock full platform access. Connect with verified partners and grow your business.",
            actionLabel: "Start Trading",
            actionDescription: "Source products & connect with partners"
        }
    };

    const roleContent = contentMap[role as keyof typeof contentMap] || contentMap.default;

    const theText =
        IsBusinessStatus === 'approved'
            ? 'Your business is verified!'
            : IsBusinessStatus === 'pending'
                ? 'Continue Verification'
                : IsBusinessStatus === 'rejected'
                    ? 'Continue Verification'
                    : IsBusinessStatus === 'not_started'
                        ? 'Start Verification'
                        : 'Continue Verification';

    const statusBadgeText =
        IsBusinessStatus === 'approved'
            ? 'Account Verified'
            : IsBusinessStatus === 'pending'
                ? 'Verification Under Review'
                : 'Action Required';

    return (
        <div className="w-full py-4 sm:py-6 flex justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-5xl w-full"
            >
                {/* Main Card */}
                <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8">
                        {/* Header Section */}
                        <div className="flex flex-col items-center md:items-start">
                            {/* Action Required Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full mb-6"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs sm:text-sm font-semibold text-emerald-700">
                                    {statusBadgeText}
                                </span>
                            </motion.div>

                            {/* Clean Modern Badge Icon Box */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mb-6">
                                <BadgeCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                            </div>

                            {/* Headline */}
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4 text-center md:text-left tracking-tight">
                                Verify Your Business{' '}
                                <span className="block sm:inline bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                    & Unlock Everything
                                </span>
                            </h1>

                            {/* Description */}
                            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl text-center md:text-left leading-relaxed">
                                {roleContent.description}
                            </p>
                        </div>

                        {/* Step Journey Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {[
                                {
                                    step: '01',
                                    title: 'Verify Business',
                                    desc: 'Complete quick 5-min verification',
                                    icon: FileCheck,
                                },
                                {
                                    step: '02',
                                    title: 'Create Profile',
                                    desc: 'Build your company presence',
                                    icon: Building2,
                                },
                                {
                                    step: '03',
                                    title: roleContent.actionLabel,
                                    desc: roleContent.actionDescription,
                                    icon: Store,
                                },
                            ].map((item, idx) => {
                                const IconComponent = item.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        className="relative p-5 rounded-2xl bg-gray-50/70 border border-gray-200/70 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200 flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-emerald-600">
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 tracking-wider">
                                                    STEP {item.step}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* CTA Row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                            <Link
                                href={paths.dashboard.companyInfoVerification}
                                className="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 text-base sm:text-lg group"
                            >
                                <span>{theText}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>


                        </div>
                    </div>

                    {/* Bottom Security Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <span><strong className="font-semibold text-gray-700">Secure & Confidential</strong></span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UnverifiedBanner;
