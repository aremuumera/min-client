'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { CheckCircle, Circle, ArrowRight, ShieldCheck, Store, PackagePlus, FilePlus2, Search, Sparkles, ShieldAlert, Clock } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import { paths } from '@/config/paths';
import { useGetAllProductBySupplierIdQuery } from '@/redux/features/supplier-products/products_api';
import { useGetAllRfqByBuyerIdQuery } from '@/redux/features/buyer-rfq/rfq-api';

export const ProfileHealth = () => {
    const { appData, user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);
    const { limit, page } = useAppSelector((state) => state.marketplace);

    const userRole = (user?.role || '').toLowerCase();
    const isBuyerOnly = userRole === 'buyer';
    const isDualRole = userRole === 'buyer_supplier' || userRole === 'both';

    // Role upgrade status tracking
    const roleUpgradeStatus = appData?.roleUpgrade?.status || user?.role_upgrade_status || 'none';
    const roleUpgradeReason = appData?.roleUpgrade?.reason || user?.role_upgrade_reason || null;
    const isRoleUpgradeRejected = roleUpgradeStatus === 'rejected';
    const isRoleUpgradePending = roleUpgradeStatus === 'requested';

    // Fetch products to check listing status (Skip if pure buyer)
    const { data: prodData } = useGetAllProductBySupplierIdQuery({
        limit,
        page,
        supplierId: isTeamMember ? ownerUserId : user?.id,
    }, { skip: !user?.id || isBuyerOnly });

    // Fetch RFQs to check buyer activity
    const { data: rfqData } = useGetAllRfqByBuyerIdQuery({
        limit,
        page,
        buyerId: isTeamMember ? ownerUserId : user?.id,
    }, { skip: !user?.id });

    const isBusinessVerified = !!appData?.businessVerification?.isVerified;
    const isProfileCreated = !!appData?.isProfileCreated;
    const hasProducts = (prodData?.total_items || 0) > 0;
    const hasRfqs = (rfqData?.total_items || 0) > 0;

    // Tailored checklist steps based on user role (buyer, supplier, or buyer_supplier)
    const steps = isBuyerOnly ? [
        {
            label: 'Business Verification',
            completed: isBusinessVerified,
            link: paths.dashboard.companyInfoVerification,
            description: 'Verify your company documentation to unlock trade features.',
            icon: ShieldCheck,
        },
        {
            label: 'Buyer Account Setup',
            completed: isProfileCreated || isBusinessVerified,
            link: paths.dashboard.settings.business,
            description: 'Update corporate contact and purchasing information.',
            icon: Store,
        },
        {
            label: 'Create Your First RFQ',
            completed: hasRfqs,
            link: paths.dashboard.rfqs.create,
            description: 'Post a Request For Quote to source minerals globally.',
            icon: FilePlus2,
        },
        {
            label: 'Explore Catalog & Products',
            completed: hasRfqs || (prodData?.total_items || 0) > 0,
            link: paths.marketplace.products,
            description: 'Browse verified mineral products and contact suppliers.',
            icon: Search,
        }
    ] : [
        {
            label: 'Business Verification',
            completed: isBusinessVerified,
            link: paths.dashboard.companyInfoVerification,
            description: 'Verify your company documentation to unlock trade features.',
            icon: ShieldCheck,
        },
        {
            label: 'Create Supplier Profile',
            completed: isProfileCreated,
            link: paths.dashboard.products.companyProfile || paths.dashboard.becomeASupplier,
            description: 'Set up your public storefront & business presence.',
            icon: Store,
        },
        {
            label: 'List Your First Product',
            completed: hasProducts,
            link: paths.dashboard.products.create,
            description: 'Add your mineral inventory to the marketplace catalog.',
            icon: PackagePlus,
        },
        {
            label: isDualRole ? 'Create Your First RFQ' : 'RFQ Sourcing Activity',
            completed: hasRfqs,
            link: paths.dashboard.rfqs.create,
            description: 'Post a Request For Quote to source minerals globally.',
            icon: FilePlus2,
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <Box className="bg-white border border-[#e5e7eb] rounded-2xl p-4 sm:p-5 flex flex-col w-full">
            {/* Header & Percentage Badge */}
            <div className="flex flex-row items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                    <Typography variant="h6" className="font-bold text-gray-900 tracking-tight text-base sm:text-lg truncate">
                        Profile Health
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 block text-xs mt-0.5 leading-normal">
                        {isBuyerOnly
                            ? 'Complete buyer setup to source minerals'
                            : isDualRole
                                ? 'Complete dual buyer/supplier account onboarding'
                                : 'Complete key steps to maximize business credibility'
                        }
                    </Typography>
                </div>

                <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border tracking-tight ${progress === 100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                    {progress}% Complete
                </span>
            </div>

            {/* Role Upgrade Rejection Reason Alert */}
            {isRoleUpgradeRejected && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Role Upgrade Request Declined</span>
                    </div>
                    <p className="text-xs text-rose-700 leading-normal">
                        <strong>Admin Reason:</strong> {roleUpgradeReason || 'Your role upgrade request was declined. Please review requirements and update details.'}
                    </p>
                </div>
            )}

            {/* Role Upgrade Pending Alert */}
            {isRoleUpgradePending && (
                <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Role Upgrade Under Review</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-normal">
                        Your request to upgrade to a dual Supplier account is currently being reviewed by an administrator.
                    </p>
                </div>
            )}

            {/* Progress Bar (Flat Solid - No Shadow / No Gradient) */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-5">
                <div
                    className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Checklist Steps */}
            <div className="space-y-3.5 grow">
                {steps.map((step, index) => {
                    return (
                        <div
                            key={index}
                            className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${step.completed
                                ? 'bg-emerald-50/40 border-emerald-200/80'
                                : 'bg-white border-gray-200 hover:bg-gray-50/70'
                                }`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {step.completed ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                            </div>

                            <div className="grow min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs sm:text-sm font-bold truncate ${step.completed ? 'text-emerald-950' : 'text-gray-900'}`}>
                                        {step.label}
                                    </p>
                                    {step.completed && (
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                            Done
                                        </span>
                                    )}
                                </div>

                                <p className="text-[11px] sm:text-xs text-gray-500 leading-normal">
                                    {step.description}
                                </p>

                                {!step.completed && (
                                    <div className="pt-1">
                                        <Link
                                            href={step.link}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                        >
                                            Complete step <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Role Upgrade CTA Banner -> Navigates to Dynamic Role Upgrade page */}
            {!isDualRole && !isRoleUpgradePending && (
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-gray-700 font-medium truncate">
                            {isBuyerOnly ? 'Want to sell minerals too?' : 'Want to buy minerals too?'}
                        </p>
                    </div>

                    <Link
                        href={paths.dashboard.becomeASupplier}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 whitespace-nowrap hover:underline shrink-0 flex items-center gap-1"
                    >
                        {isBuyerOnly ? 'Become a Supplier' : 'Become a Buyer'} <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </Box>
    );
};
