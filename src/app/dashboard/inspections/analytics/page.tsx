"use client";

import React from 'react';

export default function InspectorAnalyticsPage() {
    return (
        <div className="space-y-10 pb-20">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Performance Analytics</h1>
                <p className="text-neutral-500 font-medium tracking-tight">Deep dive into your operational efficiency and service yield.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Yield Analysis */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Yield Analysis</h2>
                        <span className="text-[10px] font-black uppercase text-green-600">+12% vs last month</span>
                    </div>
                    <div className="h-64 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-end p-6 gap-3">
                        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 bg-green-500/20 rounded-t-lg relative group transition-all hover:bg-green-500/40" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${h * 10}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Response SLA */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Response SLA</h2>
                        <span className="text-[10px] font-black uppercase text-blue-600">Avg 4.2h</span>
                    </div>
                    <div className="h-64 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center p-8">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-100" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 * (1 - 0.85)} className="text-blue-500 transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-neutral-800 tracking-tighter">85%</span>
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Compliance</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/30">
                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Historical Performance Logs</h2>
                </div>
                <div className="p-20 text-center opacity-30">
                    <p className="font-bold text-neutral-800 italic">Advanced reporting features coming soon...</p>
                </div>
            </div>
        </div>
    );
}
