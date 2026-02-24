"use client";

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/redux';
import { clearComparison, removeFromComparison } from '@/redux/features/comparison/comparison-slice';
import { X, ArrowRight, Table } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const ComparisonBar = () => {
    const { comparisonList } = useAppSelector((state) => state.comparison);
    const dispatch = useAppDispatch();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    useEffect(() => {
        setIsMounted(true);
        setWindowWidth(window.innerWidth);

        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        const checkSidebar = () => {
            const saved = localStorage.getItem('dashboard-sidebar-collapsed');
            setIsCollapsed(saved === 'true');
        };
        checkSidebar();

        const interval = setInterval(checkSidebar, 500);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if (!isMounted) return null;
    console.log('comparisonList', comparisonList);
    return (
        <AnimatePresence>
            {comparisonList.length > 0 && (
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 right-0 bg-white border-t border-t-[#f9fafb] shadow-2xl z-100 p-4"
                    style={{ width: windowWidth >= 1024 ? `calc(100% - ${isCollapsed ? '80px' : '280px'})` : '100%' }}
                >
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                            <div className="hidden md:flex flex-col">
                                <span className="text-sm font-bold text-gray-900">Compare Products</span>
                                <span className="text-xs text-gray-500">{comparisonList.length} of 4 selected</span>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                {comparisonList.map((product: any) => (
                                    <div key={product.id} className="relative group shrink-0">
                                        <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                            {(() => {
                                                // Find first non-video image
                                                const firstImage = product?.images?.find(
                                                    (img: any) => !img.url.toLowerCase().endsWith('.mp4') && !img.url.toLowerCase().endsWith('.webm')
                                                ) || product?.images?.[0]; // Fallback to first if all are videos

                                                if (firstImage?.url?.toLowerCase().endsWith('.mp4') || firstImage?.url?.toLowerCase().endsWith('.webm')) {
                                                    return (
                                                        <video
                                                            src={firstImage.url}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                        />
                                                    );
                                                }
                                                return (
                                                    <img
                                                        src={firstImage?.url || '/assets/logo5.png'}
                                                        alt={product.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <button
                                            onClick={() => dispatch(removeFromComparison(product.id))}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 z-50 hover:bg-red-600 shadow-sm transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {Array.from({ length: 4 - comparisonList.length }).map((_, i) => (
                                    <div key={`empty-${i}`} className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                                        <span className="text-gray-300 text-xs">+</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                            <button
                                onClick={() => dispatch(clearComparison())}
                                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
                            >
                                Clear All
                            </button>
                            <Link
                                href="/dashboard/marketplace/compare"
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${comparisonList.length >= 2
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                onClick={(e) => comparisonList.length < 2 && e.preventDefault()}
                            >
                                <Table size={16} />
                                Compare Now
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ComparisonBar;
