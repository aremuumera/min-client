"use client";

import React from 'react';
import Link from 'next/link';
import { useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import { paths } from '@/config/paths';
import AssignmentsKanban from '@/components/dashboard/inspections/assignments-kanban';
import AssignmentsTable from '@/components/dashboard/inspections/assignments-table';
import { Grid } from '@/components/ui/grid';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutGrid, List, Calendar } from 'lucide-react';

export default function MyAssignmentsPage() {
    const [view, setView] = React.useState<'kanban' | 'table'>('kanban');
    const { data: assignmentsRes, isLoading, isError } = useGetInspectorAssignmentsQuery();
    const assignments = assignmentsRes?.data || [];

    if (isLoading) {
        return (
            <Box className="space-y-6 pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-[500px] rounded-xl" />
            </Box>
        );
    }

    if (isError) {
        return (
            <Card outlined className="m-8">
                <CardContent className="py-12 text-center">
                    <Typography variant="body1" className="text-red-500 font-medium">
                        Failed to load assignments. Please try again.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Typography variant="h3">My Assignments</Typography>
                    <Typography variant="body2" className="text-neutral-500 mt-1">
                        Track the status of your active inspection assignments.
                    </Typography>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-50 p-1 rounded-lg border border-neutral-100">
                    <button
                        onClick={() => setView('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white text-neutral-900 border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Board
                    </button>
                    <button
                        onClick={() => setView('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-white text-neutral-900 border border-neutral-200' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        <List className="w-3.5 h-3.5" />
                        List
                    </button>
                    <div className="w-px h-4 bg-neutral-200" />
                    <Link
                        href="/dashboard/inspections/calendar"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        Calendar
                    </Link>
                </div>
            </div>

            <Grid container spacing={4} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-neutral-100 shadow-sm">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-medium">Total Assignments</Typography>
                        <Typography variant="h4" className="mt-1 font-bold">{assignments.length}</Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-100 shadow-sm">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-medium">Pending Invitations</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-amber-600">
                            {assignments.filter((a: any) => a.status === 'PENDING' || a.status === 'INVITATION').length}
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-100 shadow-sm">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-medium">In Progress</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-blue-600">
                            {assignments.filter((a: any) => ['ACCEPTED', 'IN_PROGRESS', 'STARTED'].includes(a.status)).length}
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="bg-white border-neutral-100 shadow-sm">
                    <CardContent className="p-4">
                        <Typography variant="caption" className="text-neutral-500 font-medium">Completed</Typography>
                        <Typography variant="h4" className="mt-1 font-bold text-green-600">
                            {assignments.filter((a: any) => a.status === 'COMPLETED').length}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <div>
                {assignments.length === 0 ? (
                    <Card outlined>
                        <CardContent className="py-16 text-center">
                            <Typography variant="body1" className="text-neutral-400">
                                No active assignments found.
                            </Typography>
                            <Typography variant="caption" className="text-neutral-300 mt-1">
                                New inspection invitations will appear here.
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    view === 'kanban' ? (
                        <AssignmentsKanban assignments={assignments} />
                    ) : (
                        <AssignmentsTable assignments={assignments} />
                    )
                )}
            </div>
        </Box>
    );
}
