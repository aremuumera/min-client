"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { useGetInspectorProfileQuery, useUpdateInspectorProfileMutation } from '@/redux/features/inspector/inspector_api';

export default function InspectorProfilePage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [activeTab, setActiveTab] = useState<'details' | 'payouts' | 'security'>('details');

    // RTK Query
    const { data: profileRes, isLoading: profileLoading } = useGetInspectorProfileQuery(user?.id as string, {
        skip: !user?.id
    });
    const [updateProfile, { isLoading: saving }] = useUpdateInspectorProfileMutation();

    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (profileRes?.data) {
            setProfile(profileRes.data);
        }
    }, [profileRes]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({ userId: user?.id, ...profile }).unwrap();
            toast.success('Company profile updated');
        } catch (error) {
            toast.error('Failed to save profile');
        }
    };

    if (profileLoading) return <div className="p-8 text-center font-bold animate-pulse text-neutral-400">Synchronizing Credentials...</div>;

    return (
        <div className="space-y-8 max-w-4xl pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Professional Profile</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Manage your professional identity, fiscal accounts, and security.</p>
                </div>
            </div>

            {/* Premium Tab Bar */}
            <div className="flex gap-4 border-b border-neutral-100 pb-px">
                {[
                    { id: 'details', label: 'Company Details' },
                    { id: 'payouts', label: 'Payout Methods' },
                    { id: 'security', label: 'Account Security' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === 'details' && (
                    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-neutral-400 tracking-widest pl-1">Professional Entity Name</label>
                                    <input
                                        type="text"
                                        value={profile?.company_name || ''}
                                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-neutral-100 outline-none focus:border-neutral-900 transition-all font-bold text-lg"
                                        placeholder="e.g. Veritas Inspection Solutions"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-neutral-400 tracking-widest pl-1">Tax Registration Number</label>
                                    <input
                                        type="text"
                                        value={profile?.tax_number || ''}
                                        onChange={(e) => setProfile({ ...profile, tax_number: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-neutral-100 outline-none focus:border-neutral-900 transition-all font-bold text-lg"
                                        placeholder="VAT / TAX ID"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase text-neutral-400 tracking-widest pl-1">Operational Headquarters</label>
                                    <textarea
                                        value={profile?.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        className="w-full h-32 p-5 rounded-2xl border-2 border-neutral-100 outline-none focus:border-neutral-900 transition-all font-bold text-lg resize-none"
                                        placeholder="Full operational address..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-neutral-100 flex justify-between items-center">
                                <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-full border border-green-100">Verified Partner</span>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-14 px-10 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md active:scale-95"
                                >
                                    {saving ? 'Updating...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {activeTab === 'payouts' && (
                    <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <h2 className="text-xl font-black tracking-tight text-neutral-800">Financial Disbursement</h2>
                            <p className="text-neutral-500 text-sm font-medium">Configure where you receive professional commissions.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[30px] border-2 border-neutral-900 bg-neutral-50 flex flex-col justify-between h-48 group cursor-pointer transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <svg className="w-6 h-6 text-neutral-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" /></svg>
                                    </div>
                                    <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-black uppercase rounded-full">Primary</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-neutral-900">Direct Bank Transfer</p>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Ending in ****4291</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-[30px] border-2 border-neutral-100 border-dashed hover:border-neutral-300 flex flex-col items-center justify-center h-48 group cursor-pointer transition-all">
                                <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                                    <svg className="w-6 h-6 text-neutral-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                </div>
                                <p className="mt-4 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Add Payment Method</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-2">
                            <h2 className="text-xl font-black tracking-tight text-neutral-800">Account Protection</h2>
                            <p className="text-neutral-500 text-sm font-medium">Maintain control over your professional credentials.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-neutral-900">Change Password</p>
                                    <p className="text-[10px] font-medium text-neutral-400">Regularly updating your password increases security.</p>
                                </div>
                                <button className="h-10 px-6 bg-white border border-neutral-200 text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-neutral-400 transition-all">
                                    Update
                                </button>
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between opacity-50 select-none">
                                <div>
                                    <p className="text-sm font-black text-neutral-900">Two-Factor Authentication</p>
                                    <p className="text-[10px] font-medium text-neutral-400">Coming soon for enhanced trade protection.</p>
                                </div>
                                <div className="w-12 h-6 bg-neutral-200 rounded-full cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
