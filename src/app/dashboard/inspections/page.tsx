"use client";

import React from 'react';
import Link from 'next/link';
import { useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import { paths } from '@/config/paths';

export default function MyAssignmentsPage() {
    const { data: assignmentsRes, isLoading, isError } = useGetInspectorAssignmentsQuery();
    const assignments = assignmentsRes?.data || [];

    if (isLoading) return <div className="p-8 text-center font-bold animate-pulse">Loading Assignments...</div>;
    if (isError) return <div className="p-8 text-center text-red-500 font-bold">Failed to load assignments</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">My Assignments</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Real-time status of your active trade orchestrations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {assignments.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-neutral-100 p-20 text-center opacity-40">
                        <p className="font-bold text-neutral-400 italic">No active assignments found.</p>
                    </div>
                ) : (
                    assignments.map((job: any) => (
                        <div key={job.id} className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-400 transition-all group">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black tracking-tight text-neutral-800">{job.product_name}</h2>
                                    <span className="px-3 py-1 bg-neutral-100 text-neutral-500 rounded-full text-[10px] font-black uppercase tracking-widest ">
                                        {job.status}
                                    </span>
                                </div>
                                <p className="text-xs font-black text-green-600 uppercase tracking-widest">{job.mineral_tag}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">SLA Deadline</p>
                                    <p className="text-sm font-bold text-neutral-800">48 Hours Remaining</p>
                                </div>
                                <Link
                                    href={paths.dashboard.inspections.workbench(job.id)}
                                    className="h-12 px-8 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                                >
                                    Open Workbench
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
