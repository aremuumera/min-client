"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import AssignmentsTable from '@/components/dashboard/inspections/assignments-table';
import { Grid } from '@/components/ui/grid';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { List, Calendar, Search, Filter } from 'lucide-react';

export default function MyAssignmentsPage() {
    const { data: assignmentsRes, isLoading, isError } = useGetInspectorAssignmentsQuery();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const assignments = assignmentsRes?.data || [];

    const filteredAssignments = useMemo(() => {
        return assignments.filter((a: any) => {
            const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
            const searchTerm = search.toLowerCase().trim();
            const matchesSearch = !searchTerm ||
                a.product_name?.toLowerCase().includes(searchTerm) ||
                a.productName?.toLowerCase().includes(searchTerm) ||
                a.mineral_tag?.toLowerCase().includes(searchTerm) ||
                a.location?.toLowerCase().includes(searchTerm) ||
                a.status?.toLowerCase().includes(searchTerm);
            return matchesStatus && matchesSearch;
        });
    }, [assignments, search, statusFilter]);

    if (isLoading) {
        return (
            <Box className="space-y-6 pb-20 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-[500px] rounded-2xl" />
            </Box>
        );
    }

    if (isError) {
        return (
            <Card outlined className="m-8 max-w-7xl mx-auto">
                <CardContent className="py-12 text-center">
                    <Typography variant="body1" className="text-red-500 font-medium">
                        Failed to load assignments. Please try again.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Typography variant="h3" className="font-bold text-neutral-900">
                        My Assignments
                    </Typography>
                    <Typography variant="body2" className="text-neutral-500 mt-1">
                        Track, claim, and update your active inspection field assignments.
                    </Typography>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-neutral-900 border border-neutral-200 cursor-default transition-all"
                    >
                        <List className="w-4 h-4 text-neutral-700" />
                        List View
                    </button>
                    <Link
                        href="/dashboard/inspections/calendar"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-white transition-all"
                    >
                        <Calendar className="w-4 h-4 text-green-600" />
                        Calendar View
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <Grid container spacing={4} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-neutral-200">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-bold uppercase tracking-wider">Total Jobs</Typography>
                        <Typography variant="h4" className="mt-1 font-bold">{assignments.length}</Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-200">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-bold uppercase tracking-wider">Pending Invitations</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-amber-600">
                            {assignments.filter((a: any) => a.status === 'PENDING' || a.status === 'INVITATION').length}
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-200">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-bold uppercase tracking-wider">In Progress</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-blue-600">
                            {assignments.filter((a: any) => ['ACCEPTED', 'IN_PROGRESS', 'STARTED'].includes(a.status)).length}
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-200">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-bold uppercase tracking-wider">Completed</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-green-600">
                            {assignments.filter((a: any) => a.status === 'COMPLETED').length}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-neutral-200">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search assignments by product, mineral, location, or status..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-green-600 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-hidden focus:border-green-600 focus:bg-white bg-white transition-all cursor-pointer"
                    >
                        <option value="ALL">All Statuses ({assignments.length})</option>
                        <option value="ASSIGNED">Assigned / New</option>
                        <option value="ACCEPTED">Accepted / Scheduled</option>
                        <option value="SITE_VISIT">On-Site Visit</option>
                        <option value="LAB_ANALYSIS">Lab Analysis</option>
                        <option value="REPORT_WRITING">Report Writing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Declined / Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div>
                {filteredAssignments.length === 0 ? (
                    <Card outlined className="border-neutral-200 rounded-2xl">
                        <CardContent className="py-16 text-center">
                            <Typography variant="body1" className="text-neutral-500 font-semibold">
                                No inspection assignments match your filter.
                            </Typography>
                            <Typography variant="caption" className="text-neutral-400 mt-1 block">
                                Try adjusting your search query or status filter.
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <AssignmentsTable assignments={filteredAssignments} />
                )}
            </div>
        </Box>
    );
}
