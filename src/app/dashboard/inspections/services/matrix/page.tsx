"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    useGetInspectorCapabilitiesQuery,
    useUpdateInspectorCapabilitiesMutation,
    useGetInspectorProfileQuery,
} from '@/redux/features/inspector/inspector_api';
import { useGetCapabilitiesQuery } from '@/redux/features/definitions/definition_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Checkbox } from '@/components/ui/checkbox';
import { Box } from '@/components/ui/box';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, HelpCircle, X } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui";
import { useGetMainCategoryQuery } from '@/redux/features/categories/cat_api';

interface CapabilityDef {
    id: number;
    category: string;
    display_name: string;
    tech_id: string;
    mineral_tag: string;
    pricing_method: string;
    base_fee: string;
    value: boolean;
    capability_def_id: number;
    capability_def: CapabilityDef;
}

interface InspectorCap {
    id: string;
    capability_def_id: number;
    category: string;
    display_name: string;
    tech_id: string;
    mineral_tag: string;
    pricing_method: string;
    base_fee: string;
    value: boolean;
}

export default function CapabilityMatrixPage() {
    const { data: profileRes, isLoading: profileLoading } = useGetInspectorProfileQuery('me');
    const inspectorId = profileRes?.data?.id;

    const { data: defsRes, isLoading: defsLoading } = useGetCapabilitiesQuery({ target_role: 'Inspector' });
    const { data: myCapsRes, isLoading: capsLoading } = useGetInspectorCapabilitiesQuery(inspectorId!, {
        skip: !inspectorId,
    });
    const [updateCaps, { isLoading: saving }] = useUpdateInspectorCapabilitiesMutation();

    // mineral_tag to submit capabilities for
    const [selectedMineral, setSelectedMineral] = useState('');
    const [toggledCaps, setToggledCaps] = useState<Record<number, boolean>>({});
    const [infoOpen, setInfoOpen] = useState(false);
    const [mineralInput, setMinInput] = useState('');
    const [isMineralFocus, setIsMineralFocus] = useState(false);

    const { data: categoriesRes } = useGetMainCategoryQuery();
    const allCategories = useMemo(() => categoriesRes?.data || [], [categoriesRes]);

    const definitions = useMemo(() => defsRes?.data || [], [defsRes?.data]);
    // Backend returns capabilities grouped by mineral_tag
    const myCaps = useMemo(() => myCapsRes?.data || {}, [myCapsRes?.data]);

    // Group definitions by category
    const groupedDefs = useMemo(() => {
        const groups: Record<string, CapabilityDef[]> = {};
        definitions.forEach((def: CapabilityDef) => {
            if (!groups[def.category]) groups[def.category] = [];
            groups[def.category].push(def);
        });
        return groups;
    }, [definitions]);

    // Available minerals from the inspector's existing capability data + currently selected one
    const mineralTags = Array.from(new Set([...Object.keys(myCaps), selectedMineral])).filter(Boolean);

    // When a mineral is selected, load its current values into state
    useEffect(() => {
        if (selectedMineral && myCaps[selectedMineral]) {
            const capMap: Record<number, boolean> = {};
            // First set all definitions to false (to ensure we always send all caps and don't get missing keys)
            // definitions.forEach((def: CapabilityDef) => {
            //     capMap[def.id] = false;
            // });
            // Overwrite with existing data
            myCaps[selectedMineral].forEach((cap: CapabilityDef) => {
                capMap[cap.capability_def_id] = cap.value;
            });
            setToggledCaps(capMap);
        } else {
            // Default all to false
            const capMap: Record<number, boolean> = {};
            definitions.forEach((def: CapabilityDef) => {
                capMap[def.id] = false;
            });
            setToggledCaps(capMap);
        }
    }, [selectedMineral, myCaps, definitions]);

    const handleToggle = (defId: number) => {
        setToggledCaps((prev) => ({ ...prev, [defId]: !prev[defId] }));
    };

    const handleSave = async () => {
        if (!inspectorId || !selectedMineral) {
            toast.error('Please select a mineral category first');
            return;
        }
        try {
            const capabilities = Object.entries(toggledCaps).map(([defId, value]) => ({
                capability_def_id: parseInt(defId),
                value,
            }));
            await updateCaps({
                inspectorId,
                mineral_tag: selectedMineral,
                capabilities,
            }).unwrap();
            toast.success('Capability matrix synced successfully');
        } catch {
            toast.error('Failed to update capabilities');
        }
    };

    if (profileLoading || defsLoading || capsLoading) {
        return (
            <Box className="space-y-6 max-w-5xl pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
            </Box>
        );
    }

    return (
        <Box className="space-y-8 max-w-5xl pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <Box className="flex items-center gap-2">
                        <Typography variant="h3">Capability Matrix</Typography>
                        <Button onClick={() => setInfoOpen(true)} variant="outlined" size="sm" className="text-neutral-400 hover:text-green-600 transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </Box>
                    <Typography variant="body2" className="text-neutral-500 mt-1">
                        Select a mineral category and toggle the inspection capabilities you offer for it.
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    size="lg"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!selectedMineral || definitions.length === 0}
                    title={definitions.length === 0 ? "No capabilities configured in the system" : ""}
                >
                    Sync Changes
                </Button>
            </div>

            {/* Mineral Tag Selector */}
            <Card outlined>
                <CardContent className="py-4">
                    <Typography variant="overline" className="text-neutral-400 mb-3 block">
                        Select Mineral Category
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                        {/* Show existing minerals + allow typing a new one */}
                        {mineralTags.length > 0 ? (
                            mineralTags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag.toUpperCase()}
                                    color={selectedMineral === tag ? 'primary' : 'default'}
                                    variant={selectedMineral === tag ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedMineral(tag)}
                                    className="cursor-pointer"
                                />
                            ))
                        ) : (
                            <Typography variant="caption" className="text-neutral-400">
                                No minerals configured yet. Type a mineral tag below to get started.
                            </Typography>
                        )}
                    </div>
                    <div className="mt-3 relative">
                        <input
                            type="text"
                            value={mineralInput}
                            placeholder="Type a mineral name (e.g., lithium, gold)..."
                            className="w-full h-10 px-4 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 transition-colors"
                            onChange={(e) => setMinInput(e.target.value)}
                            onFocus={() => setIsMineralFocus(true)}
                            onBlur={() => setTimeout(() => setIsMineralFocus(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && mineralInput.trim()) {
                                    setSelectedMineral(mineralInput.trim().toLowerCase());
                                    setMinInput('');
                                }
                            }}
                        />
                        {isMineralFocus && (
                            <Box className="absolute z-10 w-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg max-h-48 overflow-auto py-2">
                                {(mineralInput ? allCategories.filter((cat: any) => cat.name.toLowerCase().includes(mineralInput.toLowerCase())) : allCategories)
                                    .map((cat: any) => (
                                        <div
                                            key={cat.id}
                                            className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm font-medium"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedMineral(cat.name.toLowerCase());
                                                setMinInput('');
                                                setIsMineralFocus(false);
                                            }}
                                        >
                                            {cat.name}
                                        </div>
                                    ))}
                                {mineralInput && (
                                    <div
                                        className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm font-medium text-green-600 border-t border-neutral-50"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedMineral(mineralInput.trim().toLowerCase());
                                            setMinInput('');
                                            setIsMineralFocus(false);
                                        }}
                                    >
                                        Add custom: "{mineralInput}"
                                    </div>
                                )}
                            </Box>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Capability Definitions grouped by Category */}
            {selectedMineral ? (
                <div className="space-y-6">
                    <Typography variant="overline" className="text-neutral-400">
                        Capabilities for <span className="text-primary-600 font-bold">{selectedMineral.toUpperCase()}</span>
                    </Typography>

                    {Object.entries(groupedDefs).map(([category, defs]) => (
                        <Card key={category} outlined>
                            <CardHeader
                                title={
                                    <Typography variant="h6" className="text-neutral-800">
                                        {category}
                                    </Typography>
                                }
                                subheader={
                                    <Typography variant="caption">
                                        {defs.length} capabilities in this group
                                    </Typography>
                                }
                            />
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {defs.map((def) => (
                                        <div
                                            key={def.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors"
                                        >
                                            <Checkbox
                                                id={`cap-${def.id}`}
                                                checked={!!toggledCaps[def.id]}
                                                onChange={() => handleToggle(def.id)}
                                            />
                                            <label
                                                htmlFor={`cap-${def.id}`}
                                                className="flex-1 min-w-0 cursor-pointer"
                                            >
                                                <Typography variant="body2" className="font-medium text-neutral-800 truncate">
                                                    {def.display_name}
                                                </Typography>
                                                <Typography variant="caption" className="text-neutral-400">
                                                    {def.tech_id}
                                                </Typography>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card outlined>
                    <CardContent className="py-16 text-center">
                        <Typography variant="body2" className="text-neutral-400">
                            Select or create a mineral category above to manage your capabilities.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-green-600" />
                        About the Capability Matrix
                    </DialogTitle>
                    <p>
                        Learn how to manage the inspection services you offer.
                    </p>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <Typography variant="body2" className="text-green-800 font-medium">
                                The Capability Matrix allows you to define exactly which inspection tasks you can perform for specific minerals or products.
                            </Typography>
                        </div>

                        <div className="space-y-3">
                            <Typography variant="subtitle2" className="font-bold">How it works:</Typography>
                            <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
                                <li><span className="font-semibold">Select a Mineral:</span> Choose an existing mineral category or type a new one to get started.</li>
                                <li><span className="font-semibold">Hybrid Search:</span> You can pick from standard minerals (like Gold, Lithium) or enter your own custom product name.</li>
                                <li><span className="font-semibold">Toggle Capabilities:</span> Check the boxes for the services you provide for that specific mineral (e.g., Visual Inspection, Chemical Analysis).</li>
                                <li><span className="font-semibold">Sync Changes:</span> Don't forget to click "Sync Changes" to save your profile.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <Typography variant="caption" className="text-amber-800">
                                <span className="font-bold">Note:</span> These capabilities help buyers find you when they request specific inspection services for their trades.
                            </Typography>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
