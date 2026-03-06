"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Chip } from '@/components/ui/chip';
import { MapPin, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { paths } from '@/config/paths';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';
import { toast } from 'sonner';
import { FiCopy } from 'react-icons/fi';

interface Job {
    id: string;
    productName: string;
    scheduledDate: string;
    inspectionLocation: string;
    status: string;
    [key: string]: any;
}

interface Props {
    assignments: Job[];
    isLoading: boolean;
}

export const InspectorInvitationCards = ({ assignments, isLoading }: Props) => {
    const invitations = assignments.filter(a => a.status === 'ASSIGNED').slice(0, 2);
    const [updateStatus, { isLoading: isUpdating }] = useUpdateAssignmentStatusMutation();

    const handleAction = async (id: string, status: string) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success(`Invitation ${status.toLowerCase()}ed successfully`);
        } catch (err) {
            toast.error("Failed to update invitation status");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <Card outlined className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-dashed border-neutral-200 bg-neutral-50/20">
                <div className="w-16 h-16 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center mb-6 text-green-600 shadow-sm shadow-green-100">
                    <Briefcase className="w-8 h-8" />
                </div>
                <Typography variant="h6" className="font-black text-neutral-900 tracking-tight">Zero Pending Requests</Typography>
                <Typography variant="body2" className="text-neutral-500 mt-2 max-w-[280px] font-medium leading-relaxed">You're fast! There are no new invitations waiting for your professional review at this moment.</Typography>
            </Card>
        );
    }

    return (
        <Box className="space-y-5">
            <div className="flex items-center justify-between">
                <Typography variant="h6" className="font-black text-neutral-900 tracking-tight">New Invitations</Typography>
                <Link href="/dashboard/inspections" className="text-[10px] font-black uppercase text-primary-600 hover:text-primary-700 tracking-widest">
                    See All ({assignments.filter(a => a.status === 'ASSIGNED').length})
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {invitations.map((job, index) => (
                    <Card key={job.id || `inv-${index}`} outlined className="group border-l-4 border-l-primary-500 hover:border-primary-200 transition-all">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <Chip label="High Priority" color="primary" variant="outlined" />
                                        <Typography variant="caption" className="text-neutral-400 font-bold uppercase tracking-widest">
                                            ID: {job.id.split('-')[0]}
                                        </Typography>
                                    </div>
                                    <Typography variant="h6" className="font-black text-neutral-900 leading-none">
                                        {job.product_name || job.productName}
                                    </Typography>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-1.5 text-neutral-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <Typography variant="caption" className="font-medium whitespace-nowrap">
                                                {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                                            </Typography>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-neutral-500">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <Typography variant="caption" className="font-medium truncate max-w-[200px]">
                                                {job.inspectionLocation}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 md:mt-0 md:self-center">
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        className="text-error-600 border-error-100 hover:bg-error-50"
                                        disabled={isUpdating}
                                        onClick={() => handleAction(job.id, 'REJECTED')}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleAction(job.id, 'ACCEPTED')}
                                    >
                                        Accept Job
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Box>
    );
};
