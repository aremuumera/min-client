"use client";

import React from 'react';
import Link from 'next/link';
import { useGetInspectorAssignmentsQuery } from '@/redux/features/inspector/inspector_api';
import { paths } from '@/config/paths';
import { LayoutGrid, List, Calendar as CalendarIcon } from 'lucide-react';
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
    ASSIGNED: '#16b364', // primary (green-500)
    ACCEPTED: '#0ea5e9', // info (sky-500)
    SCHEDULED: '#0ea5e9',
    SITE_VISIT: '#f59e0b', // warning (amber-500)
    LAB_ANALYSIS: '#6366f1', // indigo-500
    REPORT_WRITING: '#8b5cf6', // violet-500
    COMPLETED: '#10b981', // success (emerald-500)
};

export default function CalendarPage() {
    const { data: assignmentsRes, isLoading } = useGetInspectorAssignmentsQuery();
    const [selectedAssignment, setSelectedAssignment] = React.useState<any>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const assignments = assignmentsRes?.data || [];

    const events = assignments.map((a: any) => ({
        id: a.id,
        title: a.product_name || a.productName || 'Inspection Job',
        start: a.scheduledDate ? `${a.scheduledDate}T${a.scheduledTime || '09:00:00'}` : undefined,
        backgroundColor: STATUS_COLORS[a.status] || '#94a3b8',
        borderColor: 'transparent',
        url: paths.dashboard.inspections.workbench(a.id),
        extendedProps: { ...a }
    })).filter((e: any) => e.start);

    if (isLoading) {
        return (
            <Box className="space-y-6 pb-20">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[600px] rounded-xl" />
            </Box>
        );
    }

    return (
        <Box className="space-y-8 pb-20 animate-in fade-in duration-700">
            <style>{`
                .fc { --fc-border-color: #f3f4f6; --fc-today-bg-color: #f8fafc; font-family: inherit; }
                .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 900 !important; color: #111827; letter-spacing: -0.025em; }
                .fc .fc-button-primary { background-color: white !important; border-color: #e5e7eb !important; color: #6b7280 !important; font-weight: 700 !important; font-size: 0.75rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; box-shadow: none !important; }
                .fc .fc-button-primary:hover { background-color: #f9fafb !important; color: #111827 !important; }
                .fc .fc-button-active { background-color: #f3f4f6 !important; color: #111827 !important; border-color: #d1d5db !important; }
                .fc .fc-event { border-radius: 6px !important; padding: 2px 4px !important; font-weight: 700 !important; font-size: 0.7rem !important; border: none !important; }
                .fc-v-event { border: none !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; }
                .fc .fc-col-header-cell-cushion { font-weight: 900 !important; font-size: 0.7rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: #9ca3af !important; padding: 10px 0 !important; }
                .fc .fc-daygrid-day-number { font-weight: 700 !important; font-size: 0.75rem !important; color: #9ca3af !important; }
                .fc .fc-day-today .fc-daygrid-day-number { color: var(--primary-600) !important; font-weight: 900 !important; }
            `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Typography variant="h3" className="font-black tracking-tighter">Site Schedule</Typography>
                    <Typography variant="body2" className="text-neutral-500 mt-1 font-medium italic">
                        Real-time visualization of all global inspection field activities.
                    </Typography>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-100">
                    <Link
                        href="/dashboard/inspections"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Board
                    </Link>
                    <Link
                        href="/dashboard/inspections"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <List className="w-3.5 h-3.5" />
                        List
                    </Link>
                    <div className="w-px h-4 bg-neutral-200" />
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white text-primary-600 border border-neutral-100 shadow-sm"
                    >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Calendar
                    </button>
                </div>
            </div>

            <Card outlined className="p-6 border-neutral-200">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    eventClick={(info: any) => {
                        info.jsEvent.preventDefault();
                        const assignment = info.event.extendedProps;
                        if (assignment.status === 'ASSIGNED') {
                            setSelectedAssignment(assignment);
                            setIsModalOpen(true);
                        } else if (info.event.url) {
                            window.location.href = info.event.url;
                        }
                    }}
                    height="700px"
                    nowIndicator={true}
                    editable={false}
                    selectable={true}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    dayMaxEvents={true}
                />
            </Card>

            <AssignmentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
            />
        </Box>
    );
}
