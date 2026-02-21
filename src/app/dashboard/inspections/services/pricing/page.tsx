"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { useGetInspectorPricingQuery, useUpdateInspectorPricingMutation } from '@/redux/features/inspector/inspector_api';
import { useGetPricingDefsQuery } from '@/redux/features/definitions/definition_api';

export default function PricingPage() {
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query
    const { data: pricingRes, isLoading: pricingLoading } = useGetInspectorPricingQuery(user?.id as string, {
        skip: !user?.id
    });
    const { data: defsRes } = useGetPricingDefsQuery();
    const [updatePricing, { isLoading: saving }] = useUpdateInspectorPricingMutation();

    const [pricing, setPricing] = useState<any[]>([]);
    const definitions = defsRes?.data || [];

    useEffect(() => {
        if (pricingRes?.data) {
            setPricing(pricingRes.data);
        }
    }, [pricingRes]);

    const handleUpdatePrice = (tag: string, field: string, value: any) => {
        const existing = pricing.find(p => p.mineral_tag === tag);
        if (existing) {
            setPricing(pricing.map(p => p.mineral_tag === tag ? { ...p, [field]: value } : p));
        } else {
            setPricing([...pricing, { mineral_tag: tag, [field]: value }]);
        }
    };

    const handleSave = async () => {
        try {
            await updatePricing({ userId: user?.id, pricing }).unwrap();
            toast.success('Pricing model updated successfully');
        } catch (error) {
            toast.error('Failed to update pricing');
        }
    };

    if (pricingLoading) return <div className="p-8 text-center font-bold animate-pulse">Calibrating Fee structures...</div>;

    return (
        <div className="space-y-8 max-w-5xl pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Pricing & Addons</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Configure your commission models per mineral category.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-10 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md"
                >
                    {saving ? 'Syncing...' : 'Save Pricing'}
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Mineral Category</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Pricing Method</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Base Fee ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {definitions.map((def: any) => {
                            const current = pricing.find(p => p.mineral_tag === def.tag);
                            return (
                                <tr key={def.tag} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-neutral-800 uppercase tracking-tight">{def.tag}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={current?.pricing_method || ''}
                                            onChange={(e) => handleUpdatePrice(def.tag, 'pricing_method', e.target.value)}
                                            className="h-12 px-4 rounded-xl border-2 border-neutral-100 outline-none focus:border-neutral-300 font-bold bg-white"
                                        >
                                            <option value="">Select Model</option>
                                            <option value="per_visit">Per Site Visit</option>
                                            <option value="per_ton">Per Metric Ton</option>
                                            <option value="fixed">Fixed Scope Fee</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={current?.base_fee || ''}
                                            onChange={(e) => handleUpdatePrice(def.tag, 'base_fee', parseFloat(e.target.value))}
                                            className="h-12 w-32 px-4 rounded-xl border-2 border-neutral-100 outline-none focus:border-neutral-300 font-bold text-center"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Placeholder for Addons */}
            <div className="bg-neutral-50 rounded-3xl border border-neutral-200 p-12 text-center space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Premium Addons (Coming Soon)</p>
                <p className="text-sm font-medium text-neutral-500 italic">Configure urgency surcharges and multi-site travel multipliers.</p>
            </div>
        </div>
    );
}
