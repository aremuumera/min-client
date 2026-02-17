'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import { paths } from '@/config/paths';
import { useGetAllProductBySupplierIdQuery } from '@/redux/features/supplier-products/products_api';
import { useGetAllRfqByBuyerIdQuery } from '@/redux/features/buyer-rfq/rfq-api';

export const ProfileHealth = () => {
    const { appData, user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);
    const { limit, page } = useAppSelector((state) => state.marketplace);

    // Fetch products to check listing status
    const { data: prodData } = useGetAllProductBySupplierIdQuery({
        limit,
        page,
        supplierId: isTeamMember ? ownerUserId : user?.id,
    }, { skip: !user?.id });

    // Fetch RFQs to check buyer activity
    const { data: rfqData } = useGetAllRfqByBuyerIdQuery({
        limit,
        page,
        buyerId: isTeamMember ? ownerUserId : user?.id,
    }, { skip: !user?.id });

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const isProfileCreated = appData?.isProfileCreated;
    const hasProducts = (prodData?.total_items || 0) > 0;
    const hasRfqs = (rfqData?.total_items || 0) > 0;

    const steps = [
        {
            label: 'Business Verification',
            completed: isBusinessVerified,
            link: paths.dashboard.companyInfoVerification,
            description: 'Verify your business to unlock all features.'
        },
        {
            label: 'Create Supplier Profile',
            completed: isProfileCreated,
            link: '/dashboard/supplier-list/create', // Assuming this path
            description: 'Set up your public business presence.'
        },
        {
            label: 'List Your First Product',
            completed: hasProducts,
            link: paths.dashboard.products.create,
            description: 'Start selling by adding to your catalog.'
        },
        {
            label: 'Create Your First RFQ',
            completed: hasRfqs,
            link: paths.dashboard.rfqs.create,
            description: 'Request quotes from global suppliers.'
        }
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <Box className="bg-white border border-[#e5e7eb] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-bold text-gray-900">
                    Profile Health
                </Typography>
                <Typography variant="caption" className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {progress}% Complete
                </Typography>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-6">
                <div
                    className="bg-primary-500 h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="space-y-4 grow">
                {steps.map((step, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                        <div className="shrink-0 mt-0.5">
                            {step.completed ? (
                                <CheckCircle className="w-4 h-4 text-primary-500" />
                            ) : (
                                <Circle className="w-4 h-4 text-gray-300" />
                            )}
                        </div>
                        <div className="grow">
                            <p className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {step.label}
                            </p>
                            {!step.completed && (
                                <Link
                                    href={step.link}
                                    className="text-primary-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                                >
                                    Complete now <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Box>
    );
};
