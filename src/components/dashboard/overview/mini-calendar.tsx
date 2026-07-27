"use client";

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Card } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatTimeAmPm } from '@/utils/helper';

interface Job {
    id: string;
    productName: string;
    product_name?: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    item_type?: string;
    inspectionLocation?: string;
    location?: string;
    delivery_location?: string;
    inspectionState?: string;
    delivery_state?: string;
    [key: string]: any;
}

interface MiniCalendarProps {
    assignments: Job[];
}

const getFormattedDateString = (d: Date | string) => {
    if (!d) return '';
    if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return String(d).substring(0, 10);
};

const parseDateString = (dStr?: string) => {
    if (!dStr) return new Date();
    const cleanStr = getFormattedDateString(dStr);
    const [y, m, d] = cleanStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const MiniCalendar = ({ assignments }: MiniCalendarProps) => {
    // Find first available job date or default to today
    const firstJobDate = assignments.find(a => a.scheduledDate || a.createdAt);
    const initialDate = firstJobDate ? parseDateString(firstJobDate.scheduledDate || firstJobDate.createdAt) : new Date();

    const [selectedDay, setSelectedDay] = useState<Date | undefined>(initialDate);

    useEffect(() => {
        if (assignments.length > 0 && !selectedDay) {
            const firstDateStr = getFormattedDateString(assignments[0].scheduledDate || assignments[0].createdAt);
            if (firstDateStr) {
                setSelectedDay(parseDateString(firstDateStr));
            }
        }
    }, [assignments]);

    const selectedDateStr = selectedDay ? getFormattedDateString(selectedDay) : '';

    const dayJobs = assignments.filter(a => {
        const aDateStr = getFormattedDateString(a.scheduledDate || a.createdAt);
        return aDateStr === selectedDateStr;
    });

    // Categorize days by status for distinct color highlights on mini calendar
    const assignedDays: Date[] = [];
    const acceptedDays: Date[] = [];
    const siteVisitDays: Date[] = [];
    const completedDays: Date[] = [];
    const cancelledDays: Date[] = [];

    assignments.forEach(a => {
        if (!a.scheduledDate && !a.createdAt) return;
        const d = parseDateString(a.scheduledDate || a.createdAt);
        const status = String(a.status).toUpperCase();

        if (['CANCELLED', 'REJECTED'].includes(status)) {
            cancelledDays.push(d);
        } else if (['COMPLETED'].includes(status)) {
            completedDays.push(d);
        } else if (['SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING'].includes(status)) {
            siteVisitDays.push(d);
        } else if (['ACCEPTED', 'SCHEDULED'].includes(status)) {
            acceptedDays.push(d);
        } else {
            assignedDays.push(d); // ASSIGNED
        }
    });

    return (
        <Card outlined className="overflow-hidden flex flex-col border-neutral-200">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <Typography variant="overline" className="font-bold text-neutral-400 tracking-widest">Schedule</Typography>
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-300" />
            </div>

            <div className="p-2 flex justify-center">
                <style>{`
                    .rdp-day_selected { 
                        outline: none !important; 
                        box-shadow: none !important;
                        border: none !important;
                        font-weight: 900 !important; 
                    }
                    .rdp-day_today { font-weight: 900; color: #2563eb; }
                    .rdp-button:focus, .rdp-button:focus-visible { outline: none !important; box-shadow: none !important; }
                    .rdp-head_cell { color: var(--color-neutral-400); font-weight: 700; font-size: 0.75rem; }
                    .rdp-nav_button { color: #0f172a !important; }
                    .rdp-nav_button:hover { background-color: var(--color-primary-50) !important; }
                    
                    /* Status-based date highlights - Rounded circles with spacing */
                    .rdp-day { margin: 2px !important; }
                    .job-assigned { 
                        background-color: #2563eb !important; 
                        color: white !important; 
                        font-weight: 900 !important; 
                        border-radius: 9999px !important;
                    }
                    .job-accepted { 
                        background-color: #0284c7 !important; 
                        color: white !important; 
                        font-weight: 900 !important; 
                        border-radius: 9999px !important;
                    }
                    .job-site { 
                        background-color: #d97706 !important; 
                        color: white !important; 
                        font-weight: 900 !important; 
                        border-radius: 9999px !important;
                    }
                    .job-completed { 
                        background-color: #059669 !important; 
                        color: white !important; 
                        font-weight: 900 !important; 
                        border-radius: 9999px !important;
                    }
                    .job-cancelled { 
                        background-color: #dc2626 !important; 
                        color: white !important; 
                        font-weight: 900 !important; 
                        border-radius: 9999px !important;
                    }
                `}</style>
                <DayPicker
                    mode="single"
                    selected={selectedDay}
                    onSelect={(day) => day && setSelectedDay(day)}
                    modifiers={{
                        assigned: assignedDays,
                        accepted: acceptedDays,
                        site: siteVisitDays,
                        completed: completedDays,
                        cancelled: cancelledDays,
                    }}
                    modifiersClassNames={{
                        assigned: 'job-assigned',
                        accepted: 'job-accepted',
                        site: 'job-site',
                        completed: 'job-completed',
                        cancelled: 'job-cancelled',
                    }}
                    className="m-0"
                />
            </div>

            {/* Status Color Legend */}
            <div className="px-3 py-2 border-t border-b border-neutral-100 bg-neutral-50/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-bold text-neutral-600">
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                    <span>Assigned</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                    <span>Accepted</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                    <span>Audit / Testing</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                    <span>Declined</span>
                </div>
            </div>

            <div className="flex-1 bg-neutral-50/30 p-4 border-t border-neutral-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Typography variant="caption" className="font-black text-neutral-400 uppercase tracking-widest">
                        {selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Day'}
                    </Typography>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-md">
                        {dayJobs.length} {dayJobs.length === 1 ? 'Event' : 'Events'}
                    </span>
                </div>

                {dayJobs.length > 0 ? (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {dayJobs.map((job) => {
                            const isRfq = job.item_type === 'rfq';
                            const title = job.productName || job.product_name || (isRfq ? 'RFQ Request' : 'Product Inspection');
                            const locationStr = [job.inspectionLocation || job.location || job.delivery_location, job.inspectionState || job.delivery_state]
                                .filter(Boolean)
                                .filter(val => val !== 'N/A')
                                .join(', ');

                            return (
                                <div key={job.id} className="bg-white p-3 rounded-xl border border-neutral-100 flex items-center justify-between group hover:border-green-300 transition-colors shadow-2xs">
                                    <div className="space-y-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-1.5 py-0.2 text-[9px] font-black uppercase rounded ${isRfq ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                {isRfq ? 'RFQ' : 'PRODUCT'}
                                            </span>
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase">
                                                {job.status}
                                            </span>
                                        </div>
                                        <Typography variant="body2" className="font-black text-neutral-900 leading-snug break-words">
                                            {title}
                                        </Typography>
                                        <div className="flex items-center gap-3 text-neutral-400 text-[10px] font-bold">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                                                <span>{job.scheduledTime ? formatTimeAmPm(job.scheduledTime) : 'Flexible'}</span>
                                            </div>
                                            {locationStr && (
                                                <div className="flex items-center gap-1 truncate max-w-[120px]">
                                                    <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                                                    <span className="truncate">{locationStr}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/inspections/workbench/${job.id}`}>
                                        <Box className="w-7 h-7 rounded-lg bg-neutral-50 group-hover:bg-green-50 flex items-center justify-center text-neutral-400 group-hover:text-green-600 transition-colors shrink-0">
                                            <ArrowRight className="w-4 h-4" />
                                        </Box>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-40">
                        <Typography variant="caption" className="font-bold italic">No site visits for this date</Typography>
                    </div>
                )}

                <Link href="/dashboard/inspections/calendar" className="mt-auto">
                    <Button variant="outlined" fullWidth size="sm" className="text-neutral-600 font-bold text-xs border-neutral-200 hover:bg-white hover:text-neutral-900">
                        View Full Schedule
                    </Button>
                </Link>
            </div>
        </Card>
    );
};
