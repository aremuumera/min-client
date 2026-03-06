"use client";

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    useGetInspectorLimitsQuery,
    useUpdateInspectorLimitsMutation,
    useGetInspectorProfileQuery,
} from '@/redux/features/inspector/inspector_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Info, HelpCircle } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui";

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const STATUS_OPTIONS = ['AVAILABLE', 'AWAY', 'ON_LEAVE', 'AT_CAPACITY'] as const;

interface LimitsForm {
    max_inspections_daily: number | null;
    max_inspections_weekly: number | null;
    max_concurrent_inspections: number | null;
    lead_time_days: number | null;
    available_inspection_days: string[];
    blackout_dates: any[];
    availability_status: string;
    onsite_duration: { min: number; max: number; unit: string };
    lab_duration: { min: number; max: number; unit: string };
    report_sla_hours: number | null;
    equipment_list: string[];
}

const DEFAULT_LIMITS: LimitsForm = {
    max_inspections_daily: null,
    max_inspections_weekly: null,
    max_concurrent_inspections: null,
    lead_time_days: null,
    available_inspection_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    blackout_dates: [],
    availability_status: 'AVAILABLE',
    onsite_duration: { min: 4, max: 4, unit: 'hours' },
    lab_duration: { min: 0, max: 0, unit: 'days' },
    report_sla_hours: 48,
    equipment_list: [],
};

export default function OperationalLimitsPage() {
    const { data: profileRes, isLoading: profileLoading } = useGetInspectorProfileQuery('me');
    const inspectorId = profileRes?.data?.id;

    const { data: limitsRes, isLoading: limitsLoading } = useGetInspectorLimitsQuery(inspectorId!, {
        skip: !inspectorId,
    });
    const [updateLimits, { isLoading: saving }] = useUpdateInspectorLimitsMutation();

    const [limits, setLimits] = useState<LimitsForm>(DEFAULT_LIMITS);
    const [newEquipment, setNewEquipment] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        if (limitsRes?.data && Object.keys(limitsRes.data).length > 0) {

            const safeParse = (val: any, defaultVal: any) => {
                if (!val) return defaultVal;
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return defaultVal; }
                }
                return val;
            };

            setLimits({
                ...DEFAULT_LIMITS,
                ...limitsRes.data,
                equipment_list: safeParse(limitsRes.data.equipment_list, []),
                available_inspection_days: safeParse(limitsRes.data.available_inspection_days, DEFAULT_LIMITS.available_inspection_days),
                onsite_duration: safeParse(limitsRes.data.onsite_duration, DEFAULT_LIMITS.onsite_duration),
                lab_duration: safeParse(limitsRes.data.lab_duration, DEFAULT_LIMITS.lab_duration),
            });
        }
    }, [limitsRes]);

    const handleSave = async () => {
        if (!inspectorId) return;
        try {
            // Remove readonly DB fields before sending
            const { id, inspector_id, createdAt, updatedAt, inspector, ...basePayload } = limits as any;

            // Ensure correct types (parse if string, fallback to defaults)
            const ensureArray = (val: any, fallback: any[] = []) => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : fallback; } catch { return fallback; } }
                return fallback;
            };
            const ensureObject = (val: any, fallback: object) => {
                if (val && typeof val === 'object' && !Array.isArray(val)) return val;
                if (typeof val === 'string') { try { const p = JSON.parse(val); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : fallback; } catch { return fallback; } }
                return fallback;
            };

            const payload = {
                max_inspections_daily: basePayload.max_inspections_daily,
                max_inspections_weekly: basePayload.max_inspections_weekly,
                max_concurrent_inspections: basePayload.max_concurrent_inspections,
                lead_time_days: basePayload.lead_time_days,
                availability_status: basePayload.availability_status,
                report_sla_hours: basePayload.report_sla_hours,
                equipment_list: ensureArray(basePayload.equipment_list),
                available_inspection_days: ensureArray(basePayload.available_inspection_days, ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
                blackout_dates: ensureArray(basePayload.blackout_dates),
                onsite_duration: ensureObject(basePayload.onsite_duration, { min: 4, max: 4, unit: 'hours' }),
                lab_duration: ensureObject(basePayload.lab_duration, { min: 0, max: 0, unit: 'days' }),
            };

            await updateLimits({ inspectorId, ...payload }).unwrap();
            toast.success('Operational limits updated');
        } catch (error: any) {
            console.error("Save error:", error);
            const errorMsg = error?.data?.errors?.join('\n') || error?.data?.message || 'Failed to update limits.';
            toast.error(errorMsg);
        }
    };

    const updateField = (field: keyof LimitsForm, value: any) => {
        setLimits((prev) => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day: string) => {
        const days = limits.available_inspection_days;
        if (days.includes(day)) {
            updateField('available_inspection_days', days.filter((d) => d !== day));
        } else {
            updateField('available_inspection_days', [...days, day]);
        }
    };

    const addEquipment = () => {
        if (newEquipment.trim()) {
            const currentObj = limits.equipment_list;
            const currentList = Array.isArray(currentObj)
                ? currentObj
                : (typeof currentObj === 'string' ? [currentObj] : []);

            updateField('equipment_list', [...currentList, newEquipment.trim()]);
            setNewEquipment('');
        }
    };

    const removeEquipment = (index: number) => {
        updateField('equipment_list', limits.equipment_list.filter((_, i) => i !== index));
    };

    if (profileLoading || limitsLoading) {
        return (
            <Box className="space-y-6 max-w-5xl pb-20">
                <Skeleton className="h-10 w-64" />
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
                        <Typography variant="h3">Operational Limits</Typography>
                        <Button onClick={() => setInfoOpen(true)}
                            variant="outlined"
                            size="sm"
                            className="text-neutral-400 hover:text-green-600 transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </Box>
                    <Typography variant="body2" className="text-neutral-500 mt-1">
                        Define your workload capacity, availability, and service commitments.
                    </Typography>
                </div>
                <Button variant="contained" color="primary" size="lg" onClick={handleSave} loading={saving}>
                    Save Changes
                </Button>
            </div>

            {/* ──── Availability Status ──── */}
            <Card outlined>
                <CardHeader title={<Typography variant="h6">Availability Status</Typography>} />
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((status) => (
                            <Chip
                                key={status}
                                label={status.replace('_', ' ')}
                                variant={limits.availability_status === status ? 'filled' : 'outlined'}
                                color={
                                    limits.availability_status === status
                                        ? status === 'AVAILABLE' ? 'success' : status === 'AT_CAPACITY' ? 'warning' : 'default'
                                        : 'default'
                                }
                                onClick={() => updateField('availability_status', status)}
                                className="cursor-pointer"
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ──── Capacity Management ──── */}
                <Card outlined>
                    <CardHeader title={<Typography variant="h6">Capacity Management</Typography>} />
                    <CardContent className="space-y-4">
                        <FieldRow
                            label="Max Inspections Daily"
                            description="Maximum number of inspections you can handle per day."
                            value={limits.max_inspections_daily}
                            onChange={(v) => updateField('max_inspections_daily', v)}
                        />
                        <FieldRow
                            label="Max Inspections Weekly"
                            description="Maximum number of inspections per week."
                            value={limits.max_inspections_weekly}
                            onChange={(v) => updateField('max_inspections_weekly', v)}
                        />
                        <FieldRow
                            label="Max Concurrent Inspections"
                            description="Maximum simultaneous or overlapping inspections."
                            value={limits.max_concurrent_inspections}
                            onChange={(v) => updateField('max_concurrent_inspections', v)}
                        />
                        <FieldRow
                            label="Lead Time (Days)"
                            description="Minimum days of advance notice required before accepting an inspection."
                            value={limits.lead_time_days}
                            onChange={(v) => updateField('lead_time_days', v)}
                        />
                    </CardContent>
                </Card>

                {/* ──── Service Level Agreement ──── */}
                <Card outlined>
                    <CardHeader title={<Typography variant="h6">Service Level Agreement (SLA)</Typography>} />
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Typography variant="body2" className="font-medium text-neutral-800">
                                Report Submission SLA (Hours)
                            </Typography>
                            <Typography variant="caption" className="text-neutral-400">
                                The time (in hours) within which you commit to uploading the final inspection report after the site visit is completed.
                            </Typography>
                            <input
                                type="number"
                                value={limits.report_sla_hours ?? ''}
                                onChange={(e) => updateField('report_sla_hours', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="48"
                                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Typography variant="body2" className="font-medium text-neutral-800">
                                On-Site Duration
                            </Typography>
                            <Typography variant="caption" className="text-neutral-400">
                                Typical time spent on-site during a physical inspection visit.
                            </Typography>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={limits.onsite_duration.min}
                                    onChange={(e) => {
                                        const newMin = parseInt(e.target.value) || 0;
                                        updateField('onsite_duration', {
                                            ...limits.onsite_duration,
                                            min: newMin,
                                            max: Math.max(newMin, limits.onsite_duration.max)
                                        });
                                    }}
                                    className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={limits.onsite_duration.max}
                                    onChange={(e) => {
                                        const newMax = parseInt(e.target.value) || 0;
                                        updateField('onsite_duration', {
                                            ...limits.onsite_duration,
                                            max: Math.max(limits.onsite_duration.min, newMax)
                                        });
                                    }}
                                    className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                                />
                                <select
                                    value={limits.onsite_duration.unit}
                                    onChange={(e) => updateField('onsite_duration', { ...limits.onsite_duration, unit: e.target.value })}
                                    className="w-24 h-10 px-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 bg-white transition-colors"
                                >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Typography variant="body2" className="font-medium text-neutral-800">
                                Lab Analysis Duration
                            </Typography>
                            <Typography variant="caption" className="text-neutral-400">
                                Average time for lab analysis after sample collection.
                            </Typography>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={limits.lab_duration.min}
                                    onChange={(e) => {
                                        const newMin = parseInt(e.target.value) || 0;
                                        updateField('lab_duration', {
                                            ...limits.lab_duration,
                                            min: newMin,
                                            max: Math.max(newMin, limits.lab_duration.max)
                                        });
                                    }}
                                    className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={limits.lab_duration.max}
                                    onChange={(e) => {
                                        const newMax = parseInt(e.target.value) || 0;
                                        updateField('lab_duration', {
                                            ...limits.lab_duration,
                                            max: Math.max(limits.lab_duration.min, newMax)
                                        });
                                    }}
                                    className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                                />
                                <select
                                    value={limits.lab_duration.unit}
                                    onChange={(e) => updateField('lab_duration', { ...limits.lab_duration, unit: e.target.value })}
                                    className="w-24 h-10 px-2 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 bg-white transition-colors"
                                >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ──── Available Days ──── */}
            <Card outlined>
                <CardHeader
                    title={<Typography variant="h6">Available Inspection Days</Typography>}
                    subheader={<Typography variant="caption">Select the days of the week you are available for field inspections.</Typography>}
                />
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                            <label key={day} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={limits.available_inspection_days.includes(day)}
                                    onChange={() => toggleDay(day)}
                                />
                                <Typography variant="body2" className="capitalize font-medium">
                                    {day}
                                </Typography>
                            </label>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ──── Equipment List ──── */}
            <Card outlined>
                <CardHeader
                    title={<Typography variant="h6">Equipment &amp; Instrumentation</Typography>}
                    subheader={<Typography variant="caption">List the inspection equipment and tools you use in the field.</Typography>}
                />
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="e.g., XRF Analyzer, Moisture Meter..."
                            value={newEquipment}
                            onChange={(e) => setNewEquipment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addEquipment()}
                            className="flex-1 h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors"
                        />
                        <Button variant="outlined" color="primary" onClick={addEquipment} startIcon={<Plus className="w-4 h-4" />}>
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(limits?.equipment_list) && limits.equipment_list.map((item, index) => (
                            <Chip
                                key={index}
                                label={item}
                                variant="outlined"
                                onDelete={() => removeEquipment(index)}
                            />
                        ))}
                        {(!Array.isArray(limits?.equipment_list) || limits.equipment_list.length === 0) && (
                            <Typography variant="caption" className="text-neutral-400">
                                No equipment listed yet.
                            </Typography>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-green-600" />
                        Operational Limits Guide
                    </DialogTitle>
                    <p>
                        Control your workload and availability to ensure quality service.
                    </p>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <Typography variant="body2" className="text-green-800 font-medium">
                                These settings help our system match you with the right number of assignments and prevent burnout.
                            </Typography>
                        </div>

                        <div className="space-y-3">
                            <Typography variant="subtitle2" className="font-bold">Key Settings:</Typography>
                            <ul className="list-disc list-inside space-y-2 text-sm text-neutral-600">
                                <li><span className="font-semibold">Capacity:</span> Limit the total inspections you can take daily or weekly.</li>
                                <li><span className="font-semibold">Availability Status:</span> Toggle between Available, Away, or At Capacity to instantly pause or resume invitations.</li>
                                <li><span className="font-semibold">SLA (Service Level Agreement):</span> The promised time (e.g., 48 hours) to submit your report after the visit.</li>
                                <li><span className="font-semibold">Equipment:</span> Listing your tools (like XRF analyzers) helps you qualify for specialized high-value assignments.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <Typography variant="caption" className="text-amber-800">
                                <span className="font-bold">Tip:</span> Keeping your equipment list and availability status updated increases your chances of getting approved for premium trades.
                            </Typography>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

/** Reusable number input row */
function FieldRow({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: number | null;
    onChange: (v: number | null) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Typography variant="body2" className="font-medium text-neutral-800">{label}</Typography>
            <Typography variant="caption" className="text-neutral-400">{description}</Typography>
            <input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-500 transition-colors font-medium"
            />
        </div>
    );
}
