"use client";

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import {
    useGetInspectorCapabilitiesQuery,
    useUpdateInspectorCapabilitiesMutation
} from '@/redux/features/inspector/inspector_api';
import { useGetCapabilitiesQuery } from '@/redux/features/definitions/definition_api';

export default function CapabilityMatrixPage() {
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query
    const { data: defsRes } = useGetCapabilitiesQuery({ target_role: 'inspector' });
    const { data: myCapsRes, isLoading: capsLoading } = useGetInspectorCapabilitiesQuery(user?.id as string, {
        skip: !user?.id
    });
    const [updateCaps, { isLoading: saving }] = useUpdateInspectorCapabilitiesMutation();

    const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
    const definitions = defsRes?.data || [];

    useEffect(() => {
        if (myCapsRes?.data) {
            setSelectedCaps(myCapsRes.data.map((c: any) => c.mineral_tag));
        }
    }, [myCapsRes]);

    const toggleCapability = (tag: string) => {
        if (selectedCaps.includes(tag)) {
            setSelectedCaps(selectedCaps.filter(t => t !== tag));
        } else {
            setSelectedCaps([...selectedCaps, tag]);
        }
    };

    const handleSave = async () => {
        try {
            await updateCaps({ userId: user?.id, capabilities: selectedCaps }).unwrap();
            toast.success('Professional capabilities updated');
        } catch (error) {
            toast.error('Failed to update capabilities');
        }
    };

    if (capsLoading) return <div className="p-8 text-center font-bold animate-pulse">Indexing Professional Capabilities...</div>;

    return (
        <div className="space-y-8 max-w-5xl pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Capability Matrix</h1>
                    <p className="text-neutral-500 font-medium tracking-tight">Select your expertise areas across the global mineral marketplace.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-10 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-md active:scale-95 disabled:bg-neutral-400"
                >
                    {saving ? 'Syncing...' : 'Update Matrix'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {definitions.map((def: any) => (
                    <div
                        key={def.tag}
                        onClick={() => toggleCapability(def.tag)}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group flex items-start justify-between ${selectedCaps.includes(def.tag)
                            ? 'border-green-500 bg-green-50/20'
                            : 'border-neutral-100 hover:border-neutral-300 bg-white'
                            }`}
                    >
                        <div className="space-y-1">
                            <h3 className={`text-lg font-black tracking-tight ${selectedCaps.includes(def.tag) ? 'text-green-800' : 'text-neutral-800'}`}>
                                {def.tag.toUpperCase()}
                            </h3>
                            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                                Global Standard Compliance
                            </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedCaps.includes(def.tag)
                            ? 'bg-green-500 text-white'
                            : 'bg-neutral-50 text-neutral-300 group-hover:bg-neutral-100'
                            }`}>
                            {selectedCaps.includes(def.tag) ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
