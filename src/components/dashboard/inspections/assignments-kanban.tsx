"use client";

import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';

interface Job {
    id: string;
    product_name?: string;
    productName?: string;
    status: string;
    mineral_tag?: string;
    scheduledDate?: string;
    [key: string]: any;
}

/**
 * LEGACY KANBAN BOARD (PHASE 2)
 * Currently disabled in favor of professional Calendar-First workflow.
 */

/*
interface Column {
    id: string;
    title: string;
    statuses: string[];
    accent: string;
}

const COLUMNS: Column[] = [
    { id: 'invitations', title: 'Invitations', statuses: ['ASSIGNED'], accent: 'border-t-primary-500' },
    { id: 'scheduled', title: 'Scheduled', statuses: ['ACCEPTED', 'SCHEDULED'], accent: 'border-t-info-500' },
    { id: 'onsite', title: 'On-Site', statuses: ['SITE_VISIT'], accent: 'border-t-warning-500' },
    { id: 'processing', title: 'Lab & Report', statuses: ['LAB_ANALYSIS', 'REPORT_WRITING'], accent: 'border-t-secondary-500' },
    { id: 'completed', title: 'Completed', statuses: ['COMPLETED'], accent: 'border-t-success-500' },
];

const STATUS_CHIP_MAP: Record<string, { color: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error'; label: string }> = {
    ASSIGNED: { color: 'primary', label: 'New' },
    ACCEPTED: { color: 'info', label: 'Accepted' },
    SCHEDULED: { color: 'info', label: 'Scheduled' },
    SITE_VISIT: { color: 'warning', label: 'On-Site' },
    LAB_ANALYSIS: { color: 'default', label: 'Lab' },
    REPORT_WRITING: { color: 'default', label: 'Report' },
    COMPLETED: { color: 'success', label: 'Done' },
};
*/

export default function AssignmentsKanban({ assignments }: { assignments: Job[] }) {
    return (
        <Box className="flex flex-col items-center justify-center p-20 border border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
            <Typography variant="h6" className="font-black text-neutral-400">Board View (Phase 2)</Typography>
            <Typography variant="body2" className="text-neutral-400 mt-1">Kanban workflow is currently being optimized. Please use the Calendar or List view.</Typography>
        </Box>
    );
}
