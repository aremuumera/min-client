"use client";

import React, { useState } from 'react';
import { Phone, Mail, CheckCircle2, MapPin, Shield, Briefcase, Award, Star, Globe, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/marketplace/LeafletMap'), { ssr: false });

interface InspectorProfilePreviewProps {
    profile: any;
    isLoading?: boolean;
}

/* ─── HERO ─── */
const InspectorHero = ({ profile }: { profile: any }) => {
    const banner = profile?.banner;
    const logo = profile?.logo;

    return (
        <div className="w-full">
            {/* Banner */}
            <div className="relative w-full bg-gray-900 rounded-2xl overflow-hidden">
                <div className="w-full h-40 md:h-56 lg:h-64">
                    {banner ? (
                        <img src={banner} alt={`${profile?.companyName} banner`} className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full bg-linear-to-r from-green-900 via-emerald-800 to-gray-900" />
                    )}
                </div>

                {/* Logo */}
                <div className="absolute left-6 md:left-10 bottom-0 translate-y-1/2 p-1.5 bg-white rounded-2xl shadow-lg">
                    {logo ? (
                        <img src={logo} alt={`${profile?.companyName} logo`} className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl object-cover border border-gray-100 bg-white" />
                    ) : (
                        <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl bg-linear-to-br from-green-100 to-green-50 border border-green-100 flex items-center justify-center">
                            <Shield className="w-10 h-10 md:w-14 md:h-14 text-green-600" />
                        </div>
                    )}
                </div>
            </div>

            {/* Company Info */}
            <div className="mt-14 md:mt-18 lg:mt-20 px-4 md:px-10">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                                {profile?.companyName || 'Inspector Company'}
                            </h1>
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                        </div>
                        <p className="text-gray-500 font-medium text-sm">{profile?.companyCategory || 'Inspection Services'}</p>
                    </div>

                    {/* Contact & Stats */}
                    <div className="flex flex-col gap-4 md:items-end">
                        <div className="flex gap-3">
                            {profile?.contactPhone && (
                                <Link href={`tel:${profile.dialCode || ''}${profile.contactPhone}`}
                                    className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors">
                                    <Phone size={18} />
                                </Link>
                            )}
                            {profile?.contactEmail && (
                                <Link href={`mailto:${profile.contactEmail}`}
                                    className="bg-gray-100 p-2.5 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-700 transition-colors">
                                    <Mail size={18} />
                                </Link>
                            )}
                        </div>
                        <div className="flex gap-8">
                            <div className="flex flex-col md:items-end">
                                <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">Inspections</span>
                                <span className="text-sm font-bold text-gray-800">{profile?.totalInspections || 0}</span>
                            </div>
                            <div className="flex flex-col md:items-end">
                                <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">Rating</span>
                                <span className="text-sm font-bold text-gray-800">{profile?.rating ? `${parseFloat(profile.rating).toFixed(1)}/5` : 'N/A'}</span>
                            </div>
                            {profile?.yearsOfExperience && (
                                <div className="flex flex-col md:items-end">
                                    <span className="text-xs text-gray-400 uppercase tracking-wide font-bold">Experience</span>
                                    <span className="text-sm font-bold text-gray-800">{profile.yearsOfExperience} yrs</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── ABOUT TAB ─── */
const AboutTab = ({ profile }: { profile: any }) => {
    const specialties = Array.isArray(profile?.specialties) ? profile.specialties : [];
    const equipmentList = Array.isArray(profile?.equipment_list) ? profile.equipment_list : [];
    const countries = Array.isArray(profile?.coverageCountries) ? profile.coverageCountries : [];
    const states = Array.isArray(profile?.coverageStates) ? profile.coverageStates : [];

    return (
        <div className="py-6 px-4 md:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 p-0 md:p-6 bg-white rounded-lg">
                {/* Column 1 — Company Profile */}
                <div>
                    <div className="text-lg pb-4 flex items-center gap-2 border-b border-gray-100 mb-4">
                        <CheckCircle2 className="text-green-600 w-5 h-5" />
                        <h2 className="font-semibold text-gray-800">Company Profile</h2>
                    </div>
                    <div className="space-y-4">
                        <InfoRow label="Company Category" value={profile?.companyCategory} />
                        <InfoRow label="Certification Number" value={profile?.certificationNumber} />
                        <InfoRow label="Years of Experience" value={profile?.yearsOfExperience ? `${profile.yearsOfExperience} years` : undefined} />
                        <InfoRow label="Total Inspections" value={profile?.totalInspections?.toString()} />
                        <InfoRow label="Success Rate" value={profile?.statistics?.successRate ? `${profile.statistics.successRate}%` : undefined} />
                        <InfoRow label="Address" value={profile?.address} />
                    </div>
                </div>

                {/* Column 2 — Capabilities */}
                <div>
                    <div className="text-lg pb-4 flex items-center gap-2 border-b border-gray-100 mb-4">
                        <Award className="text-green-600 w-5 h-5" />
                        <h2 className="font-semibold text-gray-800">Capabilities & Coverage</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <span className='text-sm text-gray-500 block mb-2'>Specialties</span>
                            {specialties.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {specialties.map((s: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">{s}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="font-semibold text-gray-800 text-base">Not specified</span>
                            )}
                        </div>
                        <div className="h-px bg-gray-100 w-full" />
                        <div>
                            <span className='text-sm text-gray-500 block mb-2'>Equipment</span>
                            {equipmentList.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {equipmentList.map((e: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">{e}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="font-semibold text-gray-800 text-base">Not specified</span>
                            )}
                        </div>
                        <div className="h-px bg-gray-100 w-full" />
                        <InfoRow label="Coverage Countries" value={countries.length > 0 ? countries.join(', ') : undefined} />
                        <InfoRow label="Coverage States" value={states.length > 0 ? states.join(', ') : undefined} />
                        <InfoRow label="Availability" value={profile?.availability_status?.replace(/_/g, ' ')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <>
        <div>
            <span className='text-sm text-gray-500 block mb-1'>{label}</span>
            <span className="font-semibold text-gray-800 text-base">{value || 'N/A'}</span>
        </div>
        <div className="h-px bg-gray-100 w-full" />
    </>
);

/* ─── COVERAGE & LOCATION TAB ─── */
const CoverageTab = ({ profile }: { profile: any }) => {
    const countries = Array.isArray(profile?.coverageCountries) ? profile.coverageCountries : [];
    const states = Array.isArray(profile?.coverageStates) ? profile.coverageStates : [];

    return (
        <div className="py-8 w-full max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-600 p-3 rounded-2xl shadow-lg shadow-green-100">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">{profile?.companyName || 'Coverage Area'}</h3>
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <MapPin size={16} className="text-green-600" />
                                <span>{profile?.address || 'Address not specified'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Status</span>
                        <span className="text-sm font-bold text-green-600">{profile?.availability_status?.replace(/_/g, ' ') || 'AVAILABLE'}</span>
                    </div>
                </div>

                {/* Map Placeholder — no lat/lng in InspectorCompany model yet */}
                <div className="p-2">
                    <div className="w-full h-[350px] bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-center p-12">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                            <Globe className="w-12 h-12 text-gray-200 animate-pulse" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Map Preview</h4>
                        <p className="text-gray-500 max-w-sm font-medium">
                            The coverage area for <span className="text-green-600">{profile?.companyName}</span> spans the regions listed below.
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/50 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Countries</span>
                        <span className="font-bold text-gray-800">{countries.length > 0 ? countries.join(', ') : 'Not specified'}</span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">States / Regions</span>
                        <span className="font-bold text-gray-800">{states.length > 0 ? states.join(', ') : 'Not specified'}</span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">HQ Address</span>
                        <span className="font-bold text-gray-800">{profile?.address || 'Not specified'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── REVIEWS TAB ─── */
const ReviewsTab = () => (
    <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Star className="w-12 h-12 text-gray-200" />
        </div>
        <h4 className="text-xl font-bold text-gray-900 mb-2">Reviews & Ratings</h4>
        <p className="text-gray-500 max-w-sm font-medium">
            Client reviews and performance ratings will appear here once inspections are completed.
        </p>
    </div>
);

/* ─── MAIN COMPONENT ─── */
export default function InspectorProfilePreview({ profile, isLoading }: InspectorProfilePreviewProps) {
    const [currentTab, setCurrentTab] = useState(0);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </div>
        );
    }

    const tabs = [
        { label: "About", component: <AboutTab profile={profile} /> },
        { label: "Coverage & Location", component: <CoverageTab profile={profile} /> },
        { label: "Reviews", component: <ReviewsTab /> },
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <InspectorHero profile={profile} />

            {/* Tabs */}
            <section className="py-8 bg-white w-full">
                <div className="w-full mt-4">
                    <div className="flex justify-center border-b-2 border-gray-100 mb-8 overflow-x-auto">
                        <div className="flex gap-8 px-4 w-full md:w-auto min-w-max">
                            {tabs.map((tab, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTab(index)}
                                    className={`pb-3 px-4 text-base font-medium transition-all relative whitespace-nowrap ${currentTab === index ? 'text-green-700' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    {tab.label}
                                    {currentTab === index && (
                                        <span className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-green-600 rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="animate-in fade-in duration-300">
                        {tabs[currentTab].component}
                    </div>
                </div>
            </section>
        </div>
    );
}
