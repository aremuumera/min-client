
"use client";
import React from 'react';
import { paths } from '@/config/paths';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { HiOutlineShieldCheck, HiSparkles } from 'react-icons/hi2';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const UnverifiedBanner = () => {
    const { appData, user } = useSelector((state: any) => state.auth);
    const IsBusinessStatus = appData?.businessVerification?.status;
    const role = user?.role;

    const contentMap = {
        supplier: {
            description: "Complete your business verification in minutes and get instant access to our full platform. Connect with verified buyers, list products, and grow your business globally.",
            actionLabel: "Start Trading",
            actionDescription: "Source and list products"
        },
        buyer: {
            description: "Complete your business verification in minutes and get instant access to our full platform. Connect with verified suppliers, find products, and source quality materials for your business.",
            actionLabel: "Start Sourcing",
            actionDescription: "Source and find products"
        },
        inspector: {
            description: "Complete your business verification in minutes and get instant access to our full platform. Join our network of professional inspectors and start verifying businesses.",
            actionLabel: "Start Inspecting",
            actionDescription: "Conduct and manage inspections"
        },
        default: {
            description: "Complete your business verification in minutes and get instant access to our full platform. Connect with verified partners and grow your business globally.",
            actionLabel: "Start Trading",
            actionDescription: "Source and list products"
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

    return (
        <div className="  flex items-center justify-center py-3 relative overflow-hidden">
            {/* Animated Background Elements */}
            {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-teal-400/20 to-green-400/20 rounded-full blur-3xl"
        />
      </div> */}

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="max-w-4xl w-full relative z-10"
            >
                {/* Glass Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl  border border-white/20 overflow-hidden">
                    {/* Top Accent Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

                    <div className="p-8 md:p-16">
                        {/* Icon with Glow Effect */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.2,
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                            }}
                            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-8 shadow-xl shadow-green-500/30 relative mx-auto md:mx-0"
                        >
                            <HiOutlineShieldCheck className="w-12 h-12 text-white" />
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="absolute inset-0 bg-green-400 rounded-2xl blur-xl"
                            />
                        </motion.div>

                        <div className="text-center md:text-left">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-full mb-6 border border-green-500/20"
                            >
                                <HiSparkles className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-600">Action Required</span>
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight"
                            >
                                Verify Your Business
                                <br />
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    Unlock Everything
                                </span>
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl text-gray-600 mb-10 max-w-2xl"
                            >
                                {roleContent.description}
                            </motion.p>

                            {/* Stats Grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10 max-w-2xl"
                            >
                                {[
                                    {
                                        icon: (
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                            </svg>
                                        ),
                                        label: 'Get Verified',
                                        description: 'Complete verification process',
                                    },
                                    {
                                        icon: (
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                        ),
                                        label: 'Create Profile',
                                        description: 'Build your company presence',
                                    },
                                    {
                                        icon: (
                                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                        ),
                                        label: roleContent.actionLabel,
                                        description: roleContent.actionDescription,
                                    },
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        whileHover={{
                                            y: -4,
                                            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
                                            transition: { duration: 0.2 },
                                        }}
                                        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-200/50 hover:border-green-200/50 transition-all duration-300"
                                    >
                                        {/* Decorative background element */}
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="relative z-10">
                                            {/* Icon container with gradient background */}
                                            <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 mb-4 rounded-xl bg-gradient-to-br from-green-50 to-indigo-50 group-hover:from-green-100 group-hover:to-indigo-100 transition-all duration-300">
                                                <div className="text-green-600 group-hover:text-green-700 transition-colors duration-300">
                                                    {stat.icon}
                                                </div>
                                            </div>

                                            {/* Text content */}
                                            <h3 className="text-lg md:text-xl text-left font-semibold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">
                                                {stat.label}
                                            </h3>
                                            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                                                {stat.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* CTA Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start"
                            >
                                <Link
                                    href={paths.dashboard.companyInfoVerification}
                                    className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:-translate-y-1"
                                >
                                    <span className="text-lg">{theText}</span>
                                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                                </Link>

                                {/* 
                <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Learn more →
                    </button> 
                */}
                            </motion.div>

                            {/* Trust Badge */}
                            {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500"
              >
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-white" />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white" />
                </div>
                <span>Join 10,000+ verified businesses</span>
              </motion.div> */}
                        </div>
                    </div>
                </div>

                {/* Bottom Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-6 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/40 text-center"
                >
                    <p className="text-sm text-gray-600">
                        🔒 <span className="font-medium">Secure & Confidential</span> — Your data is encrypted and protected
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default UnverifiedBanner;
