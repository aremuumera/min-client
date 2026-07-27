"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    useGetInspectorPricingQuery,
    useUpdateInspectorPricingMutation,
    useDeletePricingEngineMutation,
    useSetPricingAddonMutation,
    useDeletePricingAddonMutation,
    useGetInspectorProfileQuery,
} from '@/redux/features/inspector/inspector_api';
import { useGetPricingDefsQuery } from '@/redux/features/definitions/definition_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Info, HelpCircle, ChevronDown, Search, Folder, Tag } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui";
import { useGetCategoryTreeQuery } from '@/redux/features/categories/cat_api';

const PRICING_METHODS = [
    { value: 'per_metric_ton', label: 'Per Metric Ton' },
    { value: 'per_site_visit', label: 'Per Site Visit' },
    { value: 'per_scope', label: 'Per Scope' },
    { value: 'custom_quote', label: 'Custom Quote' },
];

function renderCategoryNodes(
    nodes: any[],
    search: string,
    onSelect: (name: string) => void,
    level = 0
) {
    if (!nodes || nodes.length === 0) return null;

    return nodes.map((node: any) => {
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        const matchesSearch = !search || node.name?.toLowerCase().includes(search.toLowerCase());

        const childMatches = hasChildren && node.children.some((c: any) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            (Array.isArray(c.children) && c.children.some((subC: any) => subC.name?.toLowerCase().includes(search.toLowerCase())))
        );

        if (!matchesSearch && !childMatches) return null;

        return (
            <div key={node.id || node.original_id || node.name} className={hasChildren ? "pt-1 pb-0.5" : ""}>
                {hasChildren ? (
                    /* Parent/group category — display as a non-clickable section header */
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-wider text-neutral-500 font-bold bg-neutral-50/80 my-0.5 rounded-lg ${level > 0 ? (level === 1 ? 'ml-3' : 'ml-6') : ''}`}
                    >
                        <Folder className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{node.name}</span>
                    </div>
                ) : (
                    /* Leaf mineral — clickable and selectable */
                    <div
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-green-50 font-medium text-sm text-neutral-800 ${level > 0 ? (level === 1 ? 'ml-3' : 'ml-6') : ''}`}
                        onClick={() => onSelect(node.name)}
                    >
                        <span className="flex items-center gap-2 truncate">
                            <Tag className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span>{node.name}</span>
                        </span>
                        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold border border-green-100 shrink-0 hover:bg-green-100">
                            Select
                        </span>
                    </div>
                )}

                {hasChildren && (
                    <div className="space-y-0.5">
                        {renderCategoryNodes(node.children, search, onSelect, level + 1)}
                    </div>
                )}
            </div>
        );
    });
}

const flattenCategories = (nodes: any[]): string[] => {
    let result: string[] = [];
    if (!nodes || !Array.isArray(nodes)) return result;
    for (const node of nodes) {
        if (node.name) result.push(node.name);
        if (Array.isArray(node.children) && node.children.length > 0) {
            result = result.concat(flattenCategories(node.children));
        }
    }
    return [...new Set(result)];
};

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
    const [deleteEngine, { isLoading: deletingEngine }] = useDeletePricingEngineMutation();

    // Engine state
    const [mineralTag, setMineralTag] = useState('');
    const [pricingMethod, setPricingMethod] = useState('');
    const [baseFee, setBaseFee] = useState(''); // Formatted with commas
    const [customMethodName, setCustomMethodName] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // Addon state
    const [addonMineralTag, setAddonMineralTag] = useState('');
    const [addonDefId, setAddonDefId] = useState('');
    const [addonPrice, setAddonPrice] = useState(''); // Formatted with commas
    const [infoOpen, setInfoOpen] = useState(false);
    const [isAddonMineralFocus, setIsAddonMineralFocus] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; mineralTag: string } | null>(null);

    const formatWithCommas = (val: string) => {
        const nums = val.replace(/\D/g, '');
        return nums ? parseInt(nums).toLocaleString() : '';
    };

    const unformatNumber = (val: string) => val.replace(/,/g, '');

    const { data: categoryTreeRes } = useGetCategoryTreeQuery();
    // Backend returns raw array (not wrapped in { data })
    const categoryTree = useMemo(() => Array.isArray(categoryTreeRes) ? categoryTreeRes : (categoryTreeRes?.data || []), [categoryTreeRes]);
    const allCategories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

    const pricingData = pricingRes?.data;
    const engineEntries = pricingData?.engine || [];
    const addonEntries = pricingData?.addons || [];
    const pricingDefs = defsRes?.data || [];

    // Dynamically resolve commission rate from backend engine entry
    const activeEntry = useMemo(() => {
        return engineEntries.find((e: any) => e.mineral_tag.toLowerCase() === mineralTag.toLowerCase());
    }, [engineEntries, mineralTag]);

    const commissionRate = activeEntry?.payout_p_commission ? parseFloat(activeEntry.payout_p_commission) : 0;

    // Load existing engine entry when mineral changes
    useEffect(() => {
        if (mineralTag && engineEntries.length > 0) {
            const entry = engineEntries.find((e: any) => e.mineral_tag.toLowerCase() === mineralTag.toLowerCase());
            if (entry) {
                setPricingMethod(entry.pricing_method || '');
                setBaseFee(formatWithCommas(entry.base_fee?.toString() || ''));
                setCustomMethodName(entry.input_logic_json?.custom_method_name || '');
            } else {
                setPricingMethod('');
                setBaseFee('');
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
                input_logic_json: pricingMethod === 'custom_quote' ? { custom_method_name: customMethodName } : null,
            }).unwrap();
            toast.success('Pricing engine updated');
            // Clear form so they can add another entry
            setMineralTag('');
            setPricingMethod('');
            setBaseFee('');
            setCustomMethodName('');
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

    const knownMinerals = [...new Set(engineEntries.map((e: any) => e.mineral_tag))];

    const baseFeeNum = parseFloat(unformatNumber(baseFee || '0')) || 0;
    const platformFeeAmount = Math.round((baseFeeNum * commissionRate) / 100);
    const netPayoutAmount = baseFeeNum - platformFeeAmount;
    const inspectorSharePercent = 100 - commissionRate;

    return (
        <Box className="space-y-8 max-w-5xl pb-20">
            {/* Header */}
            <div>
                <Box className="flex flex-wrap items-center gap-2.5">
                    <Typography variant="h3">Inspection Fees &amp; Pricing</Typography>
                    <Button
                        onClick={() => setInfoOpen(true)}
                        variant="outlined"
                        size="sm"
                        className="border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 rounded-xl px-3 py-1.5 font-bold text-xs whitespace-nowrap shrink-0 transition-all inline-flex items-center gap-1.5"
                    >
                        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="whitespace-nowrap">How it works</span>
                    </Button>
                </Box>
                <Typography variant="body2" className="text-neutral-500 mt-1 max-w-2xl">
                    Define standard base rates and optional add-on fees (such as rapid testing or lab reports) for your inspection services per mineral category.
                </Typography>
            </div>

            {/* ──── Base Rates & Pricing Method ──── */}
            <Card outlined>
                <CardHeader
                    title={<Typography variant="h6">Base Rate per Mineral</Typography>}
                    subheader={<Typography variant="caption">Choose a mineral, pick how you charge (e.g. Per Metric Ton, Per Site Visit), and set your base fee.</Typography>}
                />
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Category Popover Selector */}
                        <div className="space-y-1.5 relative">
                            <Typography variant="caption" className="font-medium">Mineral Category</Typography>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-neutral-200 text-sm bg-white hover:border-neutral-300 transition-colors font-medium text-neutral-800 text-left shadow-sm"
                            >
                                <span className={mineralTag ? "font-bold text-neutral-900 flex items-center gap-2" : "text-neutral-400"}>
                                    {mineralTag ? mineralTag.toUpperCase() : "-- Select Mineral Category --"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl p-2 max-h-80 flex flex-col shadow-xl">
                                        <div className="relative mb-2 shrink-0">
                                            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                                placeholder="Search mineral category..."
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 bg-neutral-50"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
                                            {renderCategoryNodes(categoryTree, categorySearch, (catName) => {
                                                setMineralTag(catName.toLowerCase());
                                                setDropdownOpen(false);
                                                setCategorySearch('');
                                            })}

                                            {categorySearch && !allCategories.some((c: string) => c.toLowerCase() === categorySearch.toLowerCase()) && (
                                                <div
                                                    className="px-4 py-2.5 bg-green-50/90 border-t border-green-100 hover:bg-green-100/90 cursor-pointer text-xs font-semibold text-green-800 flex items-center justify-between transition-colors mt-1 rounded-lg"
                                                    onClick={() => {
                                                        setMineralTag(categorySearch.toLowerCase().trim());
                                                        setDropdownOpen(false);
                                                        setCategorySearch('');
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">+</span>
                                                        <span>Use custom mineral: <strong>"{categorySearch}"</strong></span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Click to Select</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Pricing Method Selection */}
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

                        {/* Base Fee Input */}
                        <div className="space-y-1.5">
                            <Typography variant="caption" className="font-medium">
                                {pricingMethod === 'custom_quote' ? 'Estimate Base Fee (₦)' : 'Base Fee (₦)'}
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
                            <div className="space-y-1.5 md:col-span-3">
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
                    </div>

                    {/* Dynamic Payout Summary Badge fetched from backend rates */}
                    {baseFeeNum > 0 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-green-900 font-sans">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-green-600 shrink-0" />
                                <span>
                                    Base Inspection Rate: <strong>₦{baseFeeNum.toLocaleString()}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-neutral-500">
                                    Platform Fee: <strong>{commissionRate}%</strong> (₦{platformFeeAmount.toLocaleString()})
                                </span>
                                <span className="font-bold text-green-800 bg-green-100/90 px-2.5 py-1 rounded border border-green-200">
                                    Net Earnings Payout: ₦{netPayoutAmount.toLocaleString()} ({inspectorSharePercent}%)
                                </span>
                            </div>
                        </div>
                    )}

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
                            {engineEntries.map((entry: any) => {
                                const baseFeeVal = parseFloat(entry.base_fee) || 0;
                                const commRate = parseFloat(entry.payout_p_commission) || 0;
                                const calcType = entry.calculation_type || 'percentage';
                                const fixedFee = entry.fixed_fee_amount || 0;
                                const platformFee = entry.platform_fee_amount !== undefined ? entry.platform_fee_amount : baseFeeVal * (commRate / 100);
                                const netPayout = entry.net_payout_amount !== undefined ? entry.net_payout_amount : baseFeeVal - platformFee;

                                return (
                                    <div key={entry.id} className="py-4 space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <Typography variant="body2" className="font-bold text-neutral-800 uppercase">
                                                    {entry.mineral_tag}
                                                </Typography>
                                                <Typography variant="caption" className="text-neutral-400">
                                                    {PRICING_METHODS.find((m) => m.value === entry.pricing_method)?.label || entry.pricing_method}
                                                </Typography>
                                                {entry.pricing_method === 'custom_quote' && entry.input_logic_json?.custom_method_name && (
                                                    <Typography variant="caption" className="text-neutral-400">
                                                        ({entry.input_logic_json.custom_method_name})
                                                    </Typography>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
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
                                                <Button
                                                    variant="text"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeleteConfirm({ id: entry.id, mineralTag: entry.mineral_tag })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Payout Breakdown */}
                                        <div className="flex items-center gap-3 flex-wrap text-xs">
                                            <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded border border-neutral-200 font-medium">
                                                Base Fee: ₦{baseFeeVal.toLocaleString()}
                                            </span>

                                            {calcType === 'fixed' ? (
                                                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200 font-medium">
                                                    Platform Fee: Fixed ₦{fixedFee.toLocaleString()}
                                                </span>
                                            ) : calcType === 'percentage_plus_fixed' ? (
                                                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200 font-medium">
                                                    Platform Fee: {commRate}% + ₦{fixedFee.toLocaleString()} (₦{platformFee.toLocaleString()})
                                                </span>
                                            ) : (
                                                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200 font-medium">
                                                    Platform Fee: {commRate}% (₦{platformFee.toLocaleString()})
                                                </span>
                                            )}

                                            <span className="bg-green-50 text-green-800 px-2.5 py-1 rounded border border-green-200 font-bold">
                                                Net Payout: ₦{netPayout.toLocaleString()} ({baseFeeVal > 0 ? ((netPayout / baseFeeVal) * 100).toFixed(0) : 100}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* Delete Pricing Engine Confirmation Modal */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <DialogContent className="max-w-sm p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                            <Trash2 className="w-7 h-7 text-red-500" />
                        </div>
                        <div>
                            <Typography variant="h6" className="mb-1">Delete Pricing Entry</Typography>
                            <Typography variant="body2" className="text-neutral-500">
                                Are you sure you want to delete the pricing configuration for{' '}
                                <strong className="text-neutral-800">{deleteConfirm?.mineralTag?.toUpperCase()}</strong>?
                                This will also remove all associated fee addons for this mineral.
                            </Typography>
                        </div>
                        <div className="flex items-center gap-3 w-full mt-2">
                            <Button
                                variant="outlined"
                                className="flex-1"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                loading={deletingEngine}
                                onClick={async () => {
                                    if (!deleteConfirm) return;
                                    try {
                                        await deleteEngine(deleteConfirm.id).unwrap();
                                        toast.success(`Pricing for ${deleteConfirm.mineralTag} deleted`);
                                        setDeleteConfirm(null);
                                    } catch {
                                        toast.error('Failed to delete pricing entry');
                                    }
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
