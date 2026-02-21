"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { useGetInspectorLimitsQuery, useUpdateInspectorLimitsMutation } from '@/redux/features/inspector/inspector_api';

export default function OperationalLimitsPage() {
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query
    const { data: limitsRes, isLoading: limitsLoading } = useGetInspectorLimitsQuery(user?.id as string, {
        skip: !user?.id
    });
    const [updateLimits, { isLoading: saving }] = useUpdateInspectorLimitsMutation();

    const [limits, setLimits] = useState<any>({
        weekly_capacity: 5,
        lead_time_days: 2,
        report_sla_days: 3,
        is_available: true
    });

    useEffect(() => {
        if (limitsRes?.data) {
            setLimits(limitsRes.data);
        }
    }, [limitsRes]);

    const handleSave = async () => {
        try {
            await updateLimits({ userId: user?.id, ...limits }).unwrap();
            toast.success('Operational limits updated successfully');
        } catch (error) {
            toast.error('Failed to update limits');
        }
    };

    if (limitsLoading) return <div className="p-8 text-center font-bold animate-pulse">Syncing Operational Constraints...</div>;

    return (
        <div className="space-y-8 max-w-4xl pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Operational Limits</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Define your workload capacity and response commitments.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-10 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workload Section */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Capacity Management</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-neutral-800">Weekly Job Capacity</label>
                        <input
                            type="number"
                            value={limits.weekly_capacity}
                            onChange={(e) => setLimits({ ...limits, weekly_capacity: parseInt(e.target.value) })}
                            className="w-full h-12 px-5 rounded-xl bg-neutral-50 border-2 border-neutral-100 outline-none focus:border-neutral-300 font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-neutral-800">Booking Lead Time (Days)</label>
                        <input
                            type="number"
                            value={limits.lead_time_days}
                            onChange={(e) => setLimits({ ...limits, lead_time_days: parseInt(e.target.value) })}
                            className="w-full h-12 px-5 rounded-xl bg-neutral-50 border-2 border-neutral-100 outline-none focus:border-neutral-300 font-bold"
                        />
                    </div>
                </div>

                {/* Service Level Section */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Service Level Commitment</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-neutral-800">Report Submission SLA (Days)</label>
                        <input
                            type="number"
                            value={limits.report_sla_days}
                            onChange={(e) => setLimits({ ...limits, report_sla_days: parseInt(e.target.value) })}
                            className="w-full h-12 px-5 rounded-xl bg-neutral-50 border-2 border-neutral-100 outline-none focus:border-neutral-300 font-bold"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div>
                            <p className="text-sm font-bold text-neutral-800">Accepting Invitations</p>
                            <p className="text-[10px] font-medium text-neutral-400 tracking-tight">Toggle your global availability</p>
                        </div>
                        <button
                            onClick={() => setLimits({ ...limits, is_available: !limits.is_available })}
                            className={`w-14 h-8 rounded-full transition-all relative ${limits.is_available ? 'bg-green-500' : 'bg-neutral-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${limits.is_available ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
