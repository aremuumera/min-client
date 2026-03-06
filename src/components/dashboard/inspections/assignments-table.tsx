"use client";

import React from 'react';
import Link from 'next/link';
import { paths } from '@/config/paths';
import {
    MoreHorizontal,
    ExternalLink,
    Download,
    Clock,
    ShieldCheck,
    ChevronRight,
    Search,
    Filter,
    Boxes
} from 'lucide-react';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import { Button } from '@/components/ui/button';

interface Job {
    id: string;
    product_name?: string;
    productName?: string;
    status: string;
    mineral_tag?: string;
    scheduledDate?: string;
    [key: string]: any;
}

export default function AssignmentsTable({ assignments }: { assignments: Job[] }) {
    const [selectedAssignment, setSelectedAssignment] = React.useState<Job | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/50 border-b border-neutral-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Assignment</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Category</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Schedule</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {assignments.map((job) => (
                            <tr key={job.id} className="hover:bg-neutral-50/30 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-neutral-800">{job.product_name || job.productName || 'Unnamed Asset'}</span>
                                        <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[150px]">ID: {job.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md border border-green-100/50">
                                        {job.mineral_tag || 'MINERAL'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusStyles(job.status)}`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-neutral-600 font-bold text-xs">
                                        <Clock size={12} className="text-neutral-300" />
                                        {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {job.status === 'ASSIGNED' ? (
                                            <button
                                                onClick={() => { setSelectedAssignment(job); setIsModalOpen(true); }}
                                                className="h-9 px-4 bg-primary-600 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-600/10"
                                            >
                                                View Invitation
                                            </button>
                                        ) : (
                                            <Link
                                                href={paths.dashboard.inspections.workbench(job.id)}
                                                className="h-9 px-4 bg-neutral-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                                            >
                                                Workbench
                                            </Link>
                                        )}
                                        {job.inspectionReportUrl && (
                                            <a
                                                href={job.inspectionReportUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 border border-neutral-200 text-neutral-600 rounded-xl flex items-center justify-center hover:bg-neutral-50 transition-all shadow-sm"
                                            >
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AssignmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
            />
            {assignments.length === 0 && (
                <div className="p-20 text-center opacity-40">
                    <p className="font-bold text-neutral-400 italic">No trade orchestrations found in current perspective.</p>
                </div>
            )}
        </div>
    );
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'ASSIGNED': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'ACCEPTED':
        case 'SCHEDULED': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'SITE_VISIT': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        case 'COMPLETED': return 'bg-green-50 text-green-600 border-green-100';
        case 'CANCELLED':
        case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
        default: return 'bg-neutral-50 text-neutral-500 border-neutral-200';
    }
}
