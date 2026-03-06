"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    useGetInspectorPricingQuery,
    useUpdateInspectorPricingMutation,
    useSetPricingAddonMutation,
    useDeletePricingAddonMutation,
    useGetInspectorProfileQuery,
} from '@/redux/features/inspector/inspector_api';
import { useGetPricingDefsQuery } from '@/redux/features/definitions/definition_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { TextField } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { IconButton } from '@/components/ui/icon-button';
import { Trash2, Plus, Info, HelpCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui";
import { useGetMainCategoryQuery } from '@/redux/features/categories/cat_api';
import { useMemo } from 'react';

const PRICING_METHODS = [
    { value: 'per_metric_ton', label: 'Per Metric Ton' },
    { value: 'per_site_visit', label: 'Per Site Visit' },
    { value: 'per_scope', label: 'Per Scope' },
    { value: 'custom_quote', label: 'Custom Quote' },
];

export default function PricingPage() {
    const { data: profileRes, isLoading: profileLoading } = useGetInspectorProfileQuery('me');
    const inspectorId = profileRes?.data?.id;

    const { data: pricingRes, isLoading: pricingLoading } = useGetInspectorPricingQuery(inspectorId!, {
        skip: !inspectorId,
    });
    const { data: defsRes, isLoading: defsLoading } = useGetPricingDefsQuery();

    const [updatePricing, { isLoading: savingEngine }] = useUpdateInspectorPricingMutation();
    const [setAddon, { isLoading: savingAddon }] = useSetPricingAddonMutation();
    const [deleteAddon, { isLoading: deletingAddon }] = useDeletePricingAddonMutation();

    // Engine state
    const [mineralTag, setMineralTag] = useState('');
    const [pricingMethod, setPricingMethod] = useState('');
    const [baseFee, setBaseFee] = useState(''); // Formatted with commas
    const [customMethodName, setCustomMethodName] = useState('');
    const [payoutCommission, setPayoutCommission] = useState('');
    const [isMineralFocus, setIsMineralFocus] = useState(false);

    // Addon state
    const [addonMineralTag, setAddonMineralTag] = useState('');
    const [addonDefId, setAddonDefId] = useState('');
    const [addonPrice, setAddonPrice] = useState(''); // Formatted with commas
    const [infoOpen, setInfoOpen] = useState(false);
    const [isAddonMineralFocus, setIsAddonMineralFocus] = useState(false);

    const formatWithCommas = (val: string) => {
        const nums = val.replace(/\D/g, '');
        return nums ? parseInt(nums).toLocaleString() : '';
    };

    const unformatNumber = (val: string) => val.replace(/,/g, '');

    const { data: categoriesRes } = useGetMainCategoryQuery();
    const allCategories = useMemo(() => categoriesRes?.data || [], [categoriesRes]);

    const pricingData = pricingRes?.data;
    const engineEntries = pricingData?.engine || [];
    const addonEntries = pricingData?.addons || [];
    const pricingDefs = defsRes?.data || [];

    // Load existing engine entry when mineral changes
    useEffect(() => {
        if (mineralTag && engineEntries.length > 0) {
            const entry = engineEntries.find((e: any) => e.mineral_tag === mineralTag);
            if (entry) {
                setPricingMethod(entry.pricing_method || '');
                setBaseFee(formatWithCommas(entry.base_fee?.toString() || ''));
                setPayoutCommission(entry.payout_p_commission?.toString() || '');
                setCustomMethodName(entry.input_logic_json?.custom_method_name || '');
            } else {
                setPricingMethod('');
                setBaseFee('');
                setPayoutCommission('');
                setCustomMethodName('');
            }
        }
    }, [mineralTag, engineEntries]);

    const handleSaveEngine = async () => {
        if (!inspectorId) {
            toast.error('Identity not found. Please refresh or complete profile setup.');
            return;
        }
        if (!mineralTag) {
            toast.error('Please enter or select a Mineral Tag');
            return;
        }
        if (!pricingMethod) {
            toast.error('Please select a Pricing Method');
            return;
        }
        if (baseFee === '' || baseFee === null) {
            toast.error('Please enter a Base Fee');
            return;
        }

        try {
            await updatePricing({
                inspectorId,
                mineral_tag: mineralTag,
                pricing_method: pricingMethod,
                base_fee: parseFloat(unformatNumber(baseFee)),
                payout_p_commission: parseFloat(payoutCommission || '0'),
                input_logic_json: pricingMethod === 'custom_quote' ? { custom_method_name: customMethodName } : null,
            }).unwrap();
            toast.success('Pricing engine updated');
        } catch {
            toast.error('Failed to update pricing');
        }
    };

    const handleAddAddon = async () => {
        if (!inspectorId || !addonMineralTag || !addonDefId || !addonPrice) {
            toast.error('Please fill all addon fields');
            return;
        }
        try {
            await setAddon({
                inspectorId,
                mineral_tag: addonMineralTag,
                pricing_def_id: parseInt(addonDefId),
                addon_price: parseFloat(unformatNumber(addonPrice)),
            }).unwrap();
            toast.success('Addon saved');
            setAddonPrice('');
            setAddonDefId('');
        } catch {
            toast.error('Failed to save addon');
        }
    };

    const handleDeleteAddon = async (addonId: string) => {
        try {
            await deleteAddon(addonId).unwrap();
            toast.success('Addon removed');
        } catch {
            toast.error('Failed to delete addon');
        }
    };

    if (profileLoading || pricingLoading || defsLoading) {
        return (
            <Box className="space-y-6 max-w-5xl pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
            </Box>
        );
    }

    // Extract unique mineral tags from existing entries
    const knownMinerals = [...new Set(engineEntries.map((e: any) => e.mineral_tag))];

    return (
        <Box className="space-y-8 max-w-5xl pb-20">
            {/* Header */}
            <div>
                <Box className="flex items-center gap-2">
                    <Typography variant="h3">Pricing &amp; Addons</Typography>
                    <Button onClick={() => setInfoOpen(true)}
                        variant="outlined"
                        color="primary"
                        size="sm"
                        className="text-neutral-400 hover:text-green-600 transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </Button>
                </Box>
                <Typography variant="body2" className="text-neutral-500 mt-1">
                    Configure your base pricing engine and optional fee addons per mineral category.
                </Typography>
            </div>

            {/* ──── Base Pricing Engine ──── */}
            <Card outlined>
                <CardHeader
                    title={<Typography variant="h6">Base Pricing Engine</Typography>}
                    subheader={<Typography variant="caption">Set your pricing method and base fee per mineral.</Typography>}
                />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1.5 relative">
                            <Typography variant="caption" className="font-medium">Mineral Tag</Typography>
                            <input
                                type="text"
                                placeholder="e.g., lithium"
                                value={mineralTag}
                                onChange={(e) => setMineralTag(e.target.value.toLowerCase())}
                                onFocus={() => setIsMineralFocus(true)}
                                onBlur={() => setTimeout(() => setIsMineralFocus(false), 200)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 transition-colors"
                            />
                            {isMineralFocus && (
                                <Box className="absolute z-10 w-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg max-h-48 overflow-auto py-2">
                                    {(mineralTag ? allCategories.filter((cat: any) => cat.name.toLowerCase().includes(mineralTag.toLowerCase())) : allCategories)
                                        .map((cat: any) => (
                                            <div
                                                key={cat.id}
                                                className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm font-medium"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setMineralTag(cat.name.toLowerCase());
                                                }}
                                            >
                                                {cat.name}
                                            </div>
                                        ))}
                                </Box>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">Pricing Method</Typography>
                            <select
                                value={pricingMethod}
                                onChange={(e) => setPricingMethod(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 bg-white transition-colors"
                            >
                                <option value="">Select method</option>
                                {PRICING_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">
                                {pricingMethod === 'custom_quote' ? 'Estimate Fee (₦)' : 'Base Fee (₦)'}
                            </Typography>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={baseFee}
                                onChange={(e) => setBaseFee(formatWithCommas(e.target.value))}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 transition-colors"
                            />
                        </div>
                        {pricingMethod === 'custom_quote' && (
                            <div className="space-y-1.5">
                                <Typography variant="caption" className="font-medium">Custom Method Key (e.g. Per kilometer)</Typography>
                                <input
                                    type="text"
                                    placeholder="e.g., Per Metric Ton"
                                    value={customMethodName}
                                    onChange={(e) => setCustomMethodName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 transition-colors"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">Commission (%)</Typography>
                            <input
                                type="number"
                                placeholder="0"
                                value={payoutCommission}
                                onChange={(e) => setPayoutCommission(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                            />
                        </div>
                    </div>
                    <Button variant="contained" color="primary" onClick={handleSaveEngine} loading={savingEngine}>
                        Save Pricing Engine
                    </Button>
                </CardContent>
            </Card>

            {/* Existing Engine Entries */}
            {engineEntries.length > 0 && (
                <Card outlined>
                    <CardHeader title={<Typography variant="h6">Configured Pricing</Typography>} />
                    <CardContent>
                        <div className="divide-y divide-neutral-100">
                            {engineEntries.map((entry: any) => (
                                <div key={entry.id} className="flex items-center justify-between py-3 gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <Typography variant="body2" className="font-semibold text-neutral-800 uppercase">
                                            {entry.mineral_tag}
                                        </Typography>
                                        <Typography variant="caption" className="text-neutral-400">
                                            {PRICING_METHODS.find((m) => m.value === entry.pricing_method)?.label || entry.pricing_method}
                                        </Typography>
                                    </div>
                                    <Typography variant="body2" className="font-bold text-neutral-800">
                                        ₦{parseFloat(entry.base_fee).toLocaleString()}
                                        {entry.pricing_method === 'custom_quote' && entry.input_logic_json?.custom_method_name && (
                                            <span className="text-xs font-normal text-neutral-400 ml-1">
                                                ({entry.input_logic_json.custom_method_name})
                                            </span>
                                        )}
                                    </Typography>
                                    <Button
                                        variant="text"
                                        color="primary"
                                        size="sm"
                                        onClick={() => {
                                            setMineralTag(entry.mineral_tag);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ──── Fee Addons ──── */}
            <Card outlined>
                <CardHeader
                    title={<Typography variant="h6">Fee Addons</Typography>}
                    subheader={
                        <Typography variant="caption">
                            Add optional surcharges (e.g., Urgency, Night Hazard) from the admin-defined pricing definitions.
                        </Typography>
                    }
                />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1.5 relative">
                            <Typography variant="caption" className="font-medium">Service Mineral</Typography>
                            <input
                                type="text"
                                placeholder="Choose configured mineral"
                                value={addonMineralTag}
                                readOnly
                                onFocus={() => setIsAddonMineralFocus(true)}
                                onBlur={() => setTimeout(() => setIsAddonMineralFocus(false), 200)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 bg-neutral-50 cursor-pointer transition-colors"
                            />
                            {isAddonMineralFocus && (
                                <Box className="absolute z-10 w-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg max-h-40 overflow-auto py-2">
                                    {knownMinerals.length > 0 ? (
                                        knownMinerals.map((m: any) => (
                                            <div
                                                key={m}
                                                className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm font-medium"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setAddonMineralTag(m);
                                                }}
                                            >
                                                {m.toUpperCase()}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-xs text-neutral-400 italic">Configure base pricing first</div>
                                    )}
                                </Box>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">Fee Type</Typography>
                            <select
                                value={addonDefId}
                                onChange={(e) => setAddonDefId(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 bg-white transition-colors"
                            >
                                <option value="">Select fee</option>
                                {pricingDefs.map((def: any) => (
                                    <option key={def.id} value={def.id}>
                                        {def.fee_name} ({def.calc_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">Addon Price (₦)</Typography>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={addonPrice}
                                onChange={(e) => setAddonPrice(formatWithCommas(e.target.value))}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 transition-colors"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleAddAddon}
                                loading={savingAddon}
                                startIcon={<Plus className="w-4 h-4" />}
                            >
                                Add Addon
                            </Button>
                        </div>
                    </div>

                    {/* Existing Addons */}
                    {addonEntries.length > 0 && (
                        <div className="mt-4 divide-y divide-neutral-100">
                            {addonEntries.map((addon: any) => (
                                <div key={addon.id} className="flex items-center justify-between py-3 gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <Typography variant="body2" className="font-semibold text-neutral-800 uppercase">
                                            {addon.mineral_tag}
                                        </Typography>
                                        <Typography variant="caption" className="text-neutral-400">
                                            {addon.definition?.fee_name || `Def #${addon.pricing_def_id}`}
                                        </Typography>
                                        <Typography variant="caption" className="text-neutral-300">
                                            {addon.definition?.calc_type}
                                        </Typography>
                                    </div>
                                    <Typography variant="body2" className="font-bold text-neutral-800">
                                        ₦{parseFloat(addon.addon_price).toLocaleString()}
                                    </Typography>
                                    <Button
                                        color="error"
                                        size="sm"
                                        variant="outlined"
                                        onClick={() => handleDeleteAddon(addon.id)}
                                        disabled={deletingAddon}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {addonEntries.length === 0 && (
                        <div className="py-8 text-center">
                            <Typography variant="caption" className="text-neutral-400">
                                No addons configured yet. Add surcharges above.
                            </Typography>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-green-600" />
                        Pricing &amp; Addons Guide
                    </DialogTitle>
                    <p>
                        Configure your inspection rates and additional service fees.
                    </p>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <Typography variant="body2" className="text-green-800 font-medium">
                                Your pricing is configured per mineral category and consists of a base engine and optional functional addons.
                            </Typography>
                        </div>

                        <div className="space-y-3">
                            <Typography variant="subtitle2" className="font-bold">1. Base Pricing Engine:</Typography>
                            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                                <li>Select a <span className="font-semibold">Mineral Tag</span> (standard or custom).</li>
                                <li>Choose a <span className="font-semibold">Pricing Method</span> (Per Ton, Per Visit, etc.).</li>
                                <li>Set your <span className="font-semibold">Base Fee in NGN (₦)</span>.</li>
                                <li><span className="font-semibold">Custom Quote:</span> If selected, the fee acts as an initial estimate for negotiation.</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Typography variant="subtitle2" className="font-bold">2. Fee Addons:</Typography>
                            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                                <li>Add specific surcharges like <span className="font-semibold">Urgency Fees</span> or <span className="font-semibold">Night Hazard</span>.</li>
                                <li>Choose from pre-defined fee types and set a flat rate for each.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <Typography variant="caption" className="text-amber-800">
                                <span className="font-bold">Currency Notice:</span> All prices are now listed and paid in Nigerian Naira (₦). Ensure your rates reflect this change.
                            </Typography>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
