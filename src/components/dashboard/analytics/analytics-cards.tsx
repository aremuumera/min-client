'use client'

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { BsBoxSeam, BsClipboardData } from 'react-icons/bs';
import { AiOutlineStar, AiOutlineShoppingCart } from 'react-icons/ai';
import { GrTest } from 'react-icons/gr';
import { useSelector } from 'react-redux';
import { useGetAllRfqByBuyerIdQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetAllProductBySupplierIdQuery } from '@/redux/features/supplier-products/products_api';
import { useAppSelector } from '@/redux';

const AnalyticsCards = () => {

    const { limit, page } = useAppSelector((state) => state.marketplace);
    const { user, isTeamMember, ownerUserId } = useAppSelector((state) => state.auth);


    const { data, isLoading: isRfqLoaing, isError } = useGetAllRfqByBuyerIdQuery({
        limit,
        page,
        buyerId: isTeamMember ? ownerUserId : user?.id,
    }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        // refetchOnReconnect: true,
        // refetchOnError: true,
        // pollingInterval: 30000,
    });

    const { data: prodData, isLoading: isProdLoading, isError: isProdError } = useGetAllProductBySupplierIdQuery({
        limit,
        page,
        supplierId: isTeamMember ? ownerUserId : user?.id,
    }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        // refetchOnReconnect: true,
        // refetchOnError: true,
        // pollingInterval: 30000,
        // skip: !category && !mainCategory && !subCategory,
    });

    // console.log(data, 'all rfq data')
    // console.log(prodData, 'all product data')


    //   console.log(data, 'all rfq data')

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        },
        hover: {
            y: -2,
            transition: {
                duration: 0.2
            }
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const analyticsCards = [
        {
            title: "Total Products",
            value: prodData?.total_items,
            icon: <BsBoxSeam size={18} />,
            description: "Active products in your catalog"
        },
        {
            title: "Total RFQs",
            value: data?.total_items,
            icon: <BsClipboardData size={18} />,
            description: "Request for quotations received"
        },
        {
            title: "Sample Requests",
            value: 0,
            icon: <GrTest size={18} />,
            description: "Product samples requested"
        },
        {
            title: "Total Reviews",
            value: 0,
            icon: <AiOutlineStar size={18} />,
            description: "Customer reviews across products"
        }
    ];

    return (
        <div className="w-full space-y-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
                <p className="text-base text-gray-500">Track your business performance and growth metrics</p>
            </div>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {analyticsCards.map((card, index) => (
                    <motion.div
                        key={index}
                        className="bg-green-50/60 rounded-xl border border-green-200/50 p-6 transition-all hover:border-green-400 hover:bg-green-50/80 hover:shadow-md hover:shadow-green-100/50 group"
                        variants={cardVariants}
                        whileHover="hover"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors shadow-sm shadow-green-200/50">
                                {card.icon}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-sm font-medium text-gray-500">
                                {card.title}
                            </h2>

                            {isRfqLoaing || isProdLoading ? (
                                <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-md"></div>
                            ) : (
                                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {card.value || 0}
                                </div>
                            )}

                            <p className="text-xs text-gray-400 font-medium">
                                {card.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default AnalyticsCards;