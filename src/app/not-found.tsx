'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/utils/logo';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <div className="mb-8 flex justify-center">
                    <Logo height={60} />
                </div>

                <div className="relative mb-8">
                    <motion.h1
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2
                        }}
                        className="text-9xl font-black text-gray-100 select-none"
                    >
                        404
                    </motion.h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
                    </div>
                </div>

                <p className="text-gray-500 mb-10 leading-relaxed">
                    Oops! The page you are looking for might have been moved, deleted, or never existed.
                    Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        variant="contained"
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home size={20} />
                            Back to Home
                        </Link>
                    </Button>

                    <Button
                        onClick={() => window.history.back()}
                        variant="outlined"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50 px-8 py-6 rounded-xl font-bold transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <ArrowLeft size={20} />
                            Go Back
                        </div>
                    </Button>
                </div>
            </motion.div>

            {/* Decorative elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-50">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, -45, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                />
            </div>
        </div>
    );
}
