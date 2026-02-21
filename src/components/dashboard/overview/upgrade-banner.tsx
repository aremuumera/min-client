'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Diamond, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const UpgradeBanner = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-md group"
        >
            {/* Subtle Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative z-10 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
                        <Diamond className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            <span className="font-bold text-white">Upgrade to Premium</span>
                            <span className="text-gray-300 mx-2 hidden sm:inline">•</span>
                            <span className="text-gray-300 hidden sm:inline">Get verified status, real-time alerts & more.</span>
                        </p>
                    </div>
                </div>

                <Link href="/pricing" className="shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold bg-white text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        Upgrade
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </Link>
            </div>
        </motion.div>
    );
};
