"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import { paths } from '@/config/paths';
import { List, Calendar as CalendarIcon, Search, Filter, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Skeleton } from '@/components/ui/skeleton';
import AssignmentDetailsModal from '@/components/dashboard/inspections/AssignmentDetailsModal';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const STATUS_COLORS: Record<string, string> = {
    ASSIGNED: '#2563eb', // blue-600
    ACCEPTED: '#0284c7', // sky-600
    SCHEDULED: '#0284c7',
    SITE_VISIT: '#d97706', // amber-600
    LAB_ANALYSIS: '#4f46e5', // indigo-600
    REPORT_WRITING: '#7c3aed', // violet-600
    COMPLETED: '#059669', // emerald-600
    CANCELLED: '#dc2626', // red-600
    REJECTED: '#dc2626', // red-600
};

const LEGEND_ITEMS = [
    { label: 'Assigned', color: '#2563eb' },
    { label: 'Accepted', color: '#0284c7' },
    { label: 'On-Site Visit', color: '#d97706' },
    { label: 'Lab Analysis', color: '#4f46e5' },
    { label: 'Reporting', color: '#7c3aed' },
    { label: 'Completed', color: '#059669' },
    { label: 'Cancelled / Declined', color: '#dc2626' },
];

export default function CalendarPage() {
    const { data: assignmentsRes, isLoading } = useGetInspectorAssignmentsQuery();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const assignments = assignmentsRes?.data || [];

    // Filter assignments dynamically based on search and status filter
    const filteredAssignments = useMemo(() => {
        return assignments.filter((a: any) => {
            const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
            const searchTerm = search.toLowerCase().trim();
            const matchesSearch = !searchTerm ||
                a.product_name?.toLowerCase().includes(searchTerm) ||
                a.productName?.toLowerCase().includes(searchTerm) ||
                a.mineral_tag?.toLowerCase().includes(searchTerm) ||
                a.inspectionLocation?.toLowerCase().includes(searchTerm) ||
                a.location?.toLowerCase().includes(searchTerm) ||
                a.status?.toLowerCase().includes(searchTerm);
            return matchesStatus && matchesSearch;
        });
    }, [assignments, search, statusFilter]);

    // Format events for FullCalendar
    const events = useMemo(() => {
        return filteredAssignments.map((a: any) => {
            let dateStr = a.scheduledDate || a.createdAt || new Date().toISOString();
            if (typeof dateStr === 'string' && dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }

            let startIso = dateStr;
            let isAllDay = true;

            if (a.scheduledTime) {
                const cleanTime = a.scheduledTime.length === 5 ? `${a.scheduledTime}:00` : a.scheduledTime;
                startIso = `${dateStr}T${cleanTime}`;
                isAllDay = false;
            }

            const isRfq = a.item_type === 'rfq';
            const productName = a.productName || a.product_name || (isRfq ? 'RFQ Request' : 'Product Inspection');
            const statusColor = STATUS_COLORS[a.status] || '#2563eb';

            return {
                id: a.id,
                title: productName,
                start: startIso,
                allDay: isAllDay,
                backgroundColor: statusColor,
                borderColor: statusColor,
                textColor: '#ffffff',
                extendedProps: { ...a, statusColor }
            };
        });
    }, [filteredAssignments]);

    if (isLoading) {
        return (
            <Box className="space-y-6 pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[600px] rounded-2xl" />
            </Box>
        );
    }

    return (
        <Box className="space-y-8 pb-20 animate-in fade-in duration-700 max-w-7xl mx-auto">
            <style>{`
                .fc { --fc-border-color: #f3f4f6; --fc-today-bg-color: #f8fafc; font-family: inherit; }
                .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; color: #111827; letter-spacing: -0.025em; }
                .fc .fc-button-primary { background-color: white !important; border-color: #e5e7eb !important; color: #4b5563 !important; font-weight: 700 !important; font-size: 0.75rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; box-shadow: none !important; border-radius: 8px !important; }
                .fc .fc-button-primary:hover { background-color: #f9fafb !important; color: #111827 !important; }
                .fc .fc-button-active { background-color: #f3f4f6 !important; color: #111827 !important; border-color: #d1d5db !important; }
                .fc .fc-daygrid-event { background-color: transparent !important; border: none !important; padding: 1px !important; margin: 2px 0 !important; border-radius: 6px !important; white-space: normal !important; }
                .fc .fc-daygrid-event-harness { margin-bottom: 3px !important; }
                .fc .fc-timegrid-event { border-radius: 6px !important; }
                .fc .fc-event-main { padding: 0 !important; color: #ffffff !important; font-weight: 700 !important; }
                .fc-v-event { border: none !important; }
                .fc .fc-col-header-cell-cushion { font-weight: 800 !important; font-size: 0.75rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: #6b7280 !important; padding: 10px 0 !important; }
                .fc .fc-daygrid-day-number { font-weight: 700 !important; font-size: 0.75rem !important; color: #6b7280 !important; }
                .fc .fc-day-today .fc-daygrid-day-number { color: #16b364 !important; font-weight: 900 !important; }
            `}</style>

            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Typography variant="h3" className="font-bold text-neutral-900">
                        Site Schedule & Calendar
                    </Typography>
                    <Typography variant="body2" className="text-neutral-500 mt-1">
                        Schedule view for field inspections, site audits, and verification time slots.
                    </Typography>
                </div>

                {/* Switch between List and Calendar */}
                <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
                    <Link
                        href="/dashboard/inspections"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-white transition-all"
                    >
                        <List className="w-4 h-4" />
                        List View
                    </Link>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-green-700 border border-neutral-200 transition-all cursor-default"
                    >
                        <CalendarIcon className="w-4 h-4 text-green-600" />
                        Calendar View
                    </button>
                </div>
            </div>

            {/* Search and Filters bar */}
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
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 focus:outline-hidden focus:border-green-600 focus:bg-white bg-white transition-all"
                    >
                        <option value="ALL">All Statuses ({filteredAssignments.length})</option>
                        <option value="ASSIGNED">Assigned / New</option>
                        <option value="ACCEPTED">Accepted / Scheduled</option>
                        <option value="SITE_VISIT">On-Site Visit</option>
                        <option value="LAB_ANALYSIS">Lab Analysis</option>
                        <option value="REPORT_WRITING">Report Writing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled / Declined</option>
                    </select>
                </div>
            </div>

            {/* Status Legend Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs">
                <span className="font-black text-neutral-400 uppercase tracking-wider text-[10px] mr-1">Status Legend:</span>
                {LEGEND_ITEMS.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-50 border border-neutral-100">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-neutral-700 text-[11px]">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Google Calendar Container */}
            <Card className="p-6 border-neutral-200 rounded-3xl bg-white overflow-hidden">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    displayEventTime={false}
                    allDaySlot={true}
                    allDayText="SCHEDULED"
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
                    scrollTime="08:00:00"
                    eventContent={(eventInfo: any) => {
                        const a = eventInfo.event.extendedProps;
                        const isRfq = a.item_type === 'rfq';
                        const title = a.productName || a.product_name || (isRfq ? 'RFQ Request' : 'Product Inspection');
                        const status = a.status ? a.status.replace(/_/g, ' ') : 'ASSIGNED';
                        const bgColor = STATUS_COLORS[a.status] || '#2563eb';

                        return (
                            <div
                                title={`${title} • Status: ${status}`}
                                className="w-full p-1.5 rounded-lg text-white font-bold text-[10px] leading-tight shadow-xs cursor-pointer hover:opacity-95 transition-opacity flex flex-col gap-1"
                                style={{ backgroundColor: bgColor }}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[8px] font-black uppercase px-1 rounded bg-black/30 shrink-0">
                                        {isRfq ? 'RFQ' : 'PRODUCT'}
                                    </span>
                                    <span className="text-[8px] font-black uppercase px-1 rounded bg-white/20 shrink-0 tracking-wider">
                                        {status}
                                    </span>
                                </div>
                                <div className="font-extrabold text-[11px] text-white leading-snug break-words whitespace-normal">
                                    {title}
                                </div>
                            </div>
                        );
                    }}
                    eventClick={(info: any) => {
                        info.jsEvent.preventDefault();
                        const assignment = info.event.extendedProps;
                        setSelectedAssignment(assignment);
                        setIsModalOpen(true);
                    }}
                    height="750px"
                    nowIndicator={true}
                    editable={false}
                    selectable={true}
                    dayMaxEvents={false}
                />
            </Card>

            {/* Click-to-Open Details Modal */}
            <AssignmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
            />
        </Box>
    );
}
