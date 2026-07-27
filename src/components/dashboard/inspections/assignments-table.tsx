"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { paths } from '@/config/paths';
import {
    MoreVertical,
    Eye,
    CheckCircle2,
    Briefcase,
    Download,
    Clock,
    MapPin
} from 'lucide-react';
import { formatTimeAmPm } from '@/utils/helper';
import AssignmentDetailsModal, { CopyableId } from './AssignmentDetailsModal';
import { PortalPopover } from '@/components/ui/portal-popover';

interface Job {
    id: string;
    item_type?: string;
    product_name?: string;
    productName?: string;
    status: string;
    mineral_tag?: string;
    scheduledDate?: string;
    inspectionLocation?: string;
    location?: string;
    delivery_location?: string;
    inspectionState?: string;
    delivery_state?: string;
    inspectionReportUrl?: string;
    [key: string]: any;
}

export default function AssignmentsTable({ assignments }: { assignments: Job[] }) {
    const [selectedAssignment, setSelectedAssignment] = useState<Job | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50/60 border-b border-neutral-100">
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Assignment / Item</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Domain</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Category</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Status</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Schedule (Date & Time)</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">Inspection Site / Location</th>
                            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-neutral-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {assignments.map((job) => {
                            const isRfq = job.item_type === 'rfq';
                            const productName = job.productName || job.product_name || (isRfq ? 'RFQ Request' : 'Product Inquiry');
                            const locationStr = [job.inspectionLocation || job.location || job.delivery_location, job.inspectionState || job.delivery_state]
                                .filter(Boolean)
                                .filter(val => val !== 'N/A')
                                .join(', ');

                            return (
                                <tr key={job.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-neutral-900 group-hover:text-green-700 transition-colors">
                                                {productName}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <CopyableId id={job.id} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${isRfq ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                            {isRfq ? 'RFQ' : 'Product'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {job.mineral_tag && job.mineral_tag !== 'N/A' && job.mineral_tag !== 'mineral' ? (
                                            <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60 inline-block max-w-[220px] truncate" title={job.mineral_tag}>
                                                {job.mineral_tag}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-neutral-400 italic">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusStyles(job.status)}`}>
                                            {job.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-neutral-700 font-bold text-xs">
                                            <Clock size={13} className="text-neutral-400 shrink-0" />
                                            <span>
                                                {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                                                {job.scheduledTime ? ` at ${formatTimeAmPm(job.scheduledTime)}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {locationStr ? (
                                            <div className="flex items-center gap-1.5 text-neutral-700 font-bold text-xs">
                                                <MapPin size={13} className="text-neutral-400 shrink-0" />
                                                <span className="truncate max-w-[180px]">{locationStr}</span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400 text-xs italic">Unspecified</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <PortalPopover
                                            position="bottom"
                                            align="end"
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                                                    aria-label="Actions menu"
                                                >
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
                        })}
                    </tbody>
                </table>
            </div>

            <AssignmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
            />

            {assignments.length === 0 && (
                <div className="p-16 text-center bg-neutral-50/40 rounded-2xl border border-dashed border-neutral-200">
                    <p className="font-bold text-neutral-400 text-xs italic">No inspection assignments found matching the current filters.</p>
                </div>
            )}
        </div>
    );
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'ASSIGNED': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'ACCEPTED':
        case 'SCHEDULED': return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'SITE_VISIT': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'LAB_ANALYSIS': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'REPORT_WRITING': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'CANCELLED':
        case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
}
