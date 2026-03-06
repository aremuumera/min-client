"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface Job {
    id: string;
    productName: string;
    product_name?: string;
    status: string;
    updatedAt: string;
    [key: string]: any;
}

interface Props {
    assignments: Job[];
}

const STATUS_MAP: Record<string, { label: string, color: 'success' | 'warning' | 'info' | 'default' | 'primary' | 'error' }> = {
    COMPLETED: { label: 'Completed', color: 'success' },
    ASSIGNED: { label: 'New', color: 'primary' },
    ACCEPTED: { label: 'Accepted', color: 'info' },
    SCHEDULED: { label: 'Scheduled', color: 'info' },
    SITE_VISIT: { label: 'On-Site', color: 'warning' },
    LAB_ANALYSIS: { label: 'Lab', color: 'default' },
    REPORT_WRITING: { label: 'Reporting', color: 'default' },
}

export const WorkImprovementTable = ({ assignments }: Props) => {
    const recentJobs = assignments.slice(0, 5);

    return (
        <Card outlined className="border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <Typography variant="h6" className="font-black text-neutral-900 tracking-tight">Project History</Typography>
                <Link href="/dashboard/inspections" className="text-[10px] font-black uppercase text-neutral-400 hover:text-primary-600 tracking-widest transition-colors">
                    View Full List
                </Link>
            </div>
            <div className="overflow-x-auto max-h-[400px] no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-50 bg-neutral-50/20">
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 italic">Inquiry/Asset</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 italic text-center">Status</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 italic text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {recentJobs.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-5 py-10 text-center">
                                    <Typography variant="caption" className="text-neutral-300 italic font-medium">No recent work activity detected</Typography>
                                </td>
                            </tr>
                        ) : (
                            recentJobs.map((job, index) => {
                                const status = STATUS_MAP[job.status] || { label: job.status, color: 'default' };
                                return (
                                    <tr key={job.id || `hist-${index}`} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <Typography variant="body2" className="font-black text-neutral-800 line-clamp-1">
                                                    {job.product_name || job.productName}
                                                </Typography>
                                                <Typography variant="caption" className="text-neutral-400 font-bold tracking-tight uppercase">
                                                    #{job.id.split('-')[0]}
                                                </Typography>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                variant="outlined"
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link href={`/dashboard/inspections/workbench/${job.id}`}>
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-50 text-neutral-300 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all border border-transparent group-hover:border-primary-100">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
