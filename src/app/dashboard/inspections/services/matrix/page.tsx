"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    useGetInspectorCapabilitiesQuery,
    useUpdateInspectorCapabilitiesMutation,
    useGetInspectorProfileQuery,
} from '@/redux/features/inspector/inspector_api';
import { useGetCapabilitiesQuery, useCreateCapabilityMutation } from '@/redux/features/definitions/definition_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Checkbox } from '@/components/ui/checkbox';
import { Box } from '@/components/ui/box';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, HelpCircle, X, Plus, ChevronDown, Search, Folder, Tag } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Spinner,
} from "@/components/ui";
import { useGetCategoryTreeQuery } from '@/redux/features/categories/cat_api';
import { getErrorMessage } from '@/utils/helper';

interface CapabilityDef {
    id: number;
    category: string;
    display_name: string;
    tech_id: string;
    target_role: string;
}

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
                {/* Selectable Node Row */}
                <div
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-neutral-100 font-medium ${
                        hasChildren
                            ? 'text-xs uppercase tracking-wider text-neutral-700 font-bold bg-neutral-50/80 my-0.5'
                            : 'text-sm text-neutral-800'
                    } ${level > 0 ? (level === 1 ? 'ml-3' : 'ml-6') : ''}`}
                    onClick={() => onSelect(node.name)}
                >
                    <span className="truncate flex items-center gap-2">
                        {node.img ? (
                            <img src={node.img} alt={node.name} className="w-4 h-4 object-cover rounded shrink-0" />
                        ) : hasChildren ? (
                            <Folder className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        ) : (
                            <Tag className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        )}
                        <span>{node.name}</span>
                    </span>
                    <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold border border-green-100 shrink-0 hover:bg-green-100">
                        Select
                    </span>
                </div>

                {/* Recursive Children Render */}
                {hasChildren && (
                    <div className="space-y-0.5">
                        {renderCategoryNodes(node.children, search, onSelect, level + 1)}
                    </div>
                )}
            </div>
        );
    });
}

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
    const [createCapability, { isLoading: creatingCap }] = useCreateCapabilityMutation();

    const [selectedMineral, setSelectedMineral] = useState('');
    const [toggledCaps, setToggledCaps] = useState<Record<number, boolean>>({});
    const [initialToggledCaps, setInitialToggledCaps] = useState<Record<number, boolean>>({});
    const [infoOpen, setInfoOpen] = useState(false);
    const [mineralInput, setMinInput] = useState('');
    const [isMineralFocus, setIsMineralFocus] = useState(false);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const [customCapOpen, setCustomCapOpen] = useState(false);
    const [customCapName, setCustomCapName] = useState('');

    const handleCreateCustomCap = async () => {
        if (!customCapName.trim()) {
            toast.error('Please enter a service name');
            return;
        }
        try {
            const techId = customCapName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            const res = await createCapability({
                category: 'Specialized Services',
                display_name: customCapName.trim(),
                tech_id: techId,
                target_role: 'Inspector',
            }).unwrap();

            const newCapId = res?.data?.id;
            if (newCapId) {
                setToggledCaps(prev => ({ ...prev, [newCapId]: true }));
            }
            toast.success(`Custom service "${customCapName.trim()}" added to Specialized Services!`);
            setCustomCapName('');
            setCustomCapOpen(false);
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Failed to create custom capability'));
        }
    };

    const { data: treeRes } = useGetCategoryTreeQuery();
    const rawCategoryTree = useMemo(() => {
        return Array.isArray(treeRes) ? treeRes : (treeRes?.data || []);
    }, [treeRes]);

    const allCategories = useMemo(() => {
        if (!rawCategoryTree || rawCategoryTree.length === 0) return [];
        const list: { id: string | number; name: string }[] = [];
        const extractNodes = (nodes: any[]) => {
            nodes.forEach((node) => {
                const hasChildren = Array.isArray(node.children) && node.children.length > 0;
                // Only include leaf mineral items in auto-suggest, skipping parent group headers like "Minerals" & "Metallic Minerals"
                if (node.name && !hasChildren) {
                    list.push({ id: node.original_id || node.id || node.name, name: node.name });
                }
                if (hasChildren) {
                    extractNodes(node.children);
                }
            });
        };
        extractNodes(rawCategoryTree);
        const uniqueMap = new Map();
        list.forEach(item => uniqueMap.set(item.name.toLowerCase(), item));
        return Array.from(uniqueMap.values());
    }, [rawCategoryTree]);

    const definitions = useMemo(() => defsRes?.data || [], [defsRes?.data]);
    const myCaps = useMemo(() => myCapsRes?.data || {}, [myCapsRes?.data]);

    const groupedDefs = useMemo(() => {
        const groups: Record<string, CapabilityDef[]> = {};
        definitions.forEach((def: CapabilityDef) => {
            if (!groups[def.category]) groups[def.category] = [];
            groups[def.category].push(def);
        });
        return groups;
    }, [definitions]);

    const mineralTags = Array.from(new Set([...Object.keys(myCaps), selectedMineral])).filter(Boolean);

    useEffect(() => {
        const capMap: Record<number, boolean> = {};
        if (selectedMineral && myCaps[selectedMineral]) {
            myCaps[selectedMineral].forEach((cap: CapabilityDef) => {
                capMap[cap.capability_def_id] = cap.value;
            });
        } else {
            definitions.forEach((def: CapabilityDef) => {
                capMap[def.id] = false;
            });
        }
        setToggledCaps(capMap);
        setInitialToggledCaps(capMap);
    }, [selectedMineral, myCaps, definitions]);

    const hasChanges = useMemo(() => {
        if (!selectedMineral) return false;
        const keys = Array.from(new Set([...Object.keys(toggledCaps), ...Object.keys(initialToggledCaps)]));
        return keys.some((key) => !!toggledCaps[Number(key)] !== !!initialToggledCaps[Number(key)]);
    }, [toggledCaps, initialToggledCaps, selectedMineral]);

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
            setInitialToggledCaps(toggledCaps);
            toast.success('Capability matrix synced successfully');
        } catch {
            toast.error('Failed to update capabilities');
        }
    };

    if (profileLoading || defsLoading || (inspectorId && capsLoading)) {
        return (
            <Box className="space-y-6 max-w-5xl pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
                <Box className="flex justify-center items-center py-20">
                    <Spinner />
                </Box>
            </Box>
        );
    }

    return (
        <Box className="space-y-8 max-w-5xl pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <Box className="flex flex-wrap items-center gap-2.5">
                        <Typography variant="h3">Services & Testing Capabilities</Typography>
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
                        Select a mineral type below and check off every testing or inspection service your company provides for that mineral.
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    color="primary"
                    size="lg"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!selectedMineral || definitions.length === 0 || !hasChanges}
                    title={!selectedMineral ? "Select a mineral category first" : !hasChanges ? "No changes to save" : ""}
                >
                    Save Capabilities
                </Button>
            </div>

            {/* Mineral Tag Selector */}
            <Card outlined>
                <CardContent className="py-4">
                    <Typography variant="overline" className="text-neutral-400 mb-3 block">
                        Select Mineral Category
                    </Typography>
                    {mineralTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {mineralTags.map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag.toUpperCase()}
                                    color={selectedMineral === tag ? 'primary' : 'default'}
                                    variant={selectedMineral === tag ? 'filled' : 'outlined'}
                                    onClick={() => setSelectedMineral(tag)}
                                    className="cursor-pointer font-bold"
                                />
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Select Mineral Category</label>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="w-full h-10 px-3 flex items-center justify-between rounded-lg border border-neutral-200 text-sm bg-white hover:border-neutral-300 transition-colors font-medium text-neutral-800 text-left shadow-sm"
                            >
                                <span className={selectedMineral ? "font-bold text-neutral-900 flex items-center gap-2" : "text-neutral-400"}>
                                    {selectedMineral ? selectedMineral.toUpperCase() : "-- Choose a Mineral Category --"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl p-2 max-h-80 flex flex-col">
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
                                        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                                            {renderCategoryNodes(rawCategoryTree, categorySearch, (catName) => {
                                                setSelectedMineral(catName.toLowerCase());
                                                setDropdownOpen(false);
                                                setCategorySearch('');
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="relative">
                            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Or Type Mineral Tag</label>
                            <input
                                type="text"
                                value={mineralInput}
                                placeholder="Type mineral name (e.g. lithium, gold)..."
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
                                <Box className="absolute z-10 w-full mt-1 bg-white border border-neutral-100 rounded-xl max-h-48 overflow-auto py-2">
                                    {(mineralInput ? allCategories.filter((cat: any) => cat.name.toLowerCase().includes(mineralInput.toLowerCase())) : allCategories)
                                        .map((cat: any) => (
                                            <div
                                                key={cat.id}
                                                className="px-4 py-2 hover:bg-neutral-50 cursor-pointer text-sm font-medium"
                                                onMouseDown={(e) => {
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
                                            className="px-4 py-2.5 bg-green-50/90 hover:bg-green-100 text-green-800 cursor-pointer text-sm font-semibold border-t border-green-200/80 flex items-center justify-between transition-colors gap-2"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setSelectedMineral(mineralInput.trim().toLowerCase());
                                                setMinInput('');
                                                setIsMineralFocus(false);
                                            }}
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                                                    +
                                                </span>
                                                <span>
                                                    Add custom: <span className="font-bold text-green-950">"{mineralInput.trim()}"</span>
                                                </span>
                                            </span>
                                            <span className="text-[11px] bg-green-600 text-white font-bold px-2.5 py-1 rounded-lg shrink-0">
                                                Click to Add
                                            </span>
                                        </div>
                                    )}
                                </Box>
                            )}
                        </div>
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

                    <Card outlined className="border-dashed border-2 border-neutral-200 bg-neutral-50/50">
                        <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <Typography variant="body1" className="font-bold text-neutral-800">
                                    Don't see your specific test or inspection service?
                                </Typography>
                                <Typography variant="caption" className="text-neutral-500">
                                    Add a custom testing service name to your company's capabilities list.
                                </Typography>
                            </div>
                            <Button
                                variant="outlined"
                                onClick={() => setCustomCapOpen(true)}
                                className="border-neutral-300 hover:border-neutral-800 text-neutral-800 font-bold whitespace-nowrap"
                                startIcon={<Plus className="w-4 h-4" />}
                            >
                                Add Custom Service
                            </Button>
                        </CardContent>
                    </Card>
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

            {/* Custom Capability Creation Dialog */}
            <Dialog open={customCapOpen} onClose={() => setCustomCapOpen(false)}>
                <DialogContent className="max-w-md">
                    <DialogTitle className="flex items-center gap-2 font-bold text-lg">
                        <Plus className="w-5 h-5 text-green-600" />
                        Add Custom Inspection Service
                    </DialogTitle>
                    <div className="space-y-4 py-3">
                        <div>
                            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Service / Test Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Radioactivity & NDT Survey"
                                value={customCapName}
                                onChange={(e) => setCustomCapName(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-green-500 font-medium"
                                autoFocus
                            />
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                            <Typography variant="caption" className="text-neutral-500">
                                Custom inspection services added here will be categorized under <span className="font-semibold text-neutral-800">Specialized Services</span> for your company profile.
                            </Typography>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="text" onClick={() => setCustomCapOpen(false)}>Cancel</Button>
                        <Button variant="contained" color="primary" onClick={handleCreateCustomCap} loading={creatingCap}>
                            Add & Enable Service
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-green-600" />
                        About Services & Testing Capabilities
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
