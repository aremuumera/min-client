"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Chip } from '@/components/ui/chip';
import { ArrowUpRight, Clock, MapPin, MoreVertical, Eye, Briefcase, Download, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import AssignmentDetailsModal, { CopyableId } from '../inspections/AssignmentDetailsModal';
import { formatTimeAmPm } from '@/utils/helper';
import { PortalPopover } from '@/components/ui/portal-popover';
import { paths } from '@/config/paths';

interface Job {
    id: string;
    productName: string;
    product_name?: string;
    status: string;
    item_type?: string;
    mineral_tag?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    inspectionLocation?: string;
    location?: string;
    delivery_location?: string;
    inspectionState?: string;
    delivery_state?: string;
    updatedAt: string;
    inspectionReportUrl?: string;
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
    CANCELLED: { label: 'Cancelled', color: 'error' },
    REJECTED: { label: 'Declined', color: 'error' },
};

export const WorkImprovementTable = ({ assignments }: Props) => {
    const recentJobs = assignments.slice(0, 5);
    const [selectedAssignment, setSelectedAssignment] = React.useState<any>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <Card outlined className="border-neutral-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <Typography variant="h6" className="font-black text-neutral-900 tracking-tight">Recent Assignment History</Typography>
                <Link href="/dashboard/inspections" className="text-[10px] font-black uppercase text-neutral-400 hover:text-primary-600 tracking-widest transition-colors">
                    View All
                </Link>
            </div>
            <div className="overflow-x-auto max-h-[400px] no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 bg-neutral-50/60">
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Assignment / Item</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Domain</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Category</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Status</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Schedule (Date & Time)</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Inspection Site / Location</th>
                            <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {recentJobs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-10 text-center">
                                    <Typography variant="caption" className="text-neutral-300 italic font-medium">No recent work activity detected</Typography>
                                </td>
                            </tr>
                        ) : (
                            recentJobs.map((job, index) => {
                                const status = STATUS_MAP[job.status] || { label: job.status, color: 'default' };
                                const isRfq = job.item_type === 'rfq';
                                const productName = job.productName || job.product_name || (isRfq ? 'RFQ Request' : 'Product Inquiry');
                                const locationStr = [job.inspectionLocation || job.location || job.delivery_location, job.inspectionState || job.delivery_state]
                                    .filter(Boolean)
                                    .filter(val => val !== 'N/A')
                                    .join(', ');

                                return (
                                    <tr key={job.id || `hist-${index}`} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <Typography variant="body2" className="font-black text-neutral-900 group-hover:text-green-700 transition-colors line-clamp-1">
                                                    {productName}
                                                </Typography>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <CopyableId id={job.id} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isRfq ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                {isRfq ? 'RFQ' : 'Product'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {job.mineral_tag && job.mineral_tag !== 'N/A' && job.mineral_tag !== 'mineral' ? (
                                                <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60 inline-block max-w-[200px] truncate" title={job.mineral_tag}>
                                                    {job.mineral_tag}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-neutral-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                variant="outlined"
                                            />
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-neutral-700 font-bold text-xs">
                                                <Clock size={13} className="text-neutral-400 shrink-0" />
                                                <span>
                                                    {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                                                    {job.scheduledTime ? ` at ${formatTimeAmPm(job.scheduledTime)}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {locationStr ? (
                                                <div className="flex items-center gap-1.5 text-neutral-700 font-bold text-xs">
                                                    <MapPin size={13} className="text-neutral-400 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{locationStr}</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-xs italic">Unspecified</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <PortalPopover
                                                trigger={
                                                    <button className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                }
                                            >
                                                <div className="w-48 bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAssignment(job);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <Eye size={14} className="text-neutral-400" />
                                                        View Details & Info
                                                    </button>

                                                    {job.status === 'ASSIGNED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedAssignment(job);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="w-full px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-50 flex items-center gap-2.5 transition-colors"
                                                        >
                                                            <CheckCircle2 size={14} className="text-green-600" />
                                                            Respond to Invitation
                                                        </button>
                                                    )}

                                                    {job.status !== 'ASSIGNED' && job.status !== 'REJECTED' && job.status !== 'CANCELLED' && (
                                                        <Link
                                                            href={paths.dashboard.inspections.workbench(job.id)}
                                                            className="w-full px-3.5 py-2 text-xs font-bold text-neutral-900 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                                                        >
                                                            <Briefcase size={14} className="text-neutral-400" />
                                                            Open Job Workbench
                                                        </Link>
                                                    )}


                                                </div>
                                            </PortalPopover>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <AssignmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
            />
        </Card>
    );
};
