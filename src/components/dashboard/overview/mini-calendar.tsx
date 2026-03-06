"use client";

import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Job {
    id: string;
    productName: string;
    product_name?: string;
    scheduledDate: string;
    scheduledTime: string;
    status: string;
    [key: string]: any;
}

interface MiniCalendarProps {
    assignments: Job[];
}

export const MiniCalendar = ({ assignments }: MiniCalendarProps) => {
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

    // Filter assignments for selected day (handling potential UTC/Local variations)
    const selectedDateStr = selectedDay ? selectedDay.toISOString().split('T')[0] : '';
    const dayJobs = assignments.filter(a => a.scheduledDate === selectedDateStr);

    // Highlighting days with jobs
    const jobDays = assignments
        .filter(a => a.scheduledDate)
        .map(a => new Date(a.scheduledDate));

    return (
        <Card outlined className="overflow-hidden flex flex-col border-neutral-200">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <Typography variant="overline" className="font-bold text-neutral-400 tracking-widest">Schedule</Typography>
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-300" />
            </div>

            <div className="p-2 flex justify-center">
                <style>{`
                    .rdp-day_selected { background-color: var(--color-primary-600) !important; color: white !important; font-weight: 900; }
                    .rdp-day_today { color: var(--color-primary-600); font-weight: 900; }
                    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: var(--color-primary-50) !important; color: var(--color-primary-600) !important; }
                    .rdp-head_cell { color: var(--color-neutral-400); font-weight: 700; font-size: 0.75rem; }
                    .rdp-nav_button { color: var(--color-primary-600) !important; }
                    .rdp-nav_button:hover { background-color: var(--color-primary-50) !important; }
                    .has-job { position: relative; }
                    .has-job::after { 
                        content: ''; 
                        position: absolute; 
                        bottom: 2px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        width: 4px; 
                        height: 4px; 
                        background-color: var(--color-primary-500); 
                        border-radius: 50%; 
                    }
                `}</style>
                <DayPicker
                    mode="single"
                    selected={selectedDay}
                    onSelect={setSelectedDay}
                    modifiers={{ hasJob: jobDays }}
                    modifiersClassNames={{ hasJob: 'has-job' }}
                    className="m-0"
                />
            </div>

            <div className="flex-1 bg-neutral-50/30 p-4 border-t border-neutral-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Typography variant="caption" className="font-black text-neutral-400 uppercase tracking-widest">
                        {selectedDay ? selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select Day'}
                    </Typography>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded-md">
                        {dayJobs.length} Events
                    </span>
                </div>

                {dayJobs.length > 0 ? (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                        {dayJobs.slice(0, 2).map((job) => (
                            <div key={job.id} className="bg-white p-2.5 rounded-xl border border-neutral-100 flex items-center justify-between group hover:border-primary-200 transition-colors">
                                <div className="space-y-0.5 min-w-0">
                                    <Typography variant="body2" className="font-black text-neutral-800 truncate line-clamp-1">
                                        {job.product_name || job.productName}
                                    </Typography>
                                    <div className="flex items-center gap-1.5 text-neutral-400">
                                        <Clock className="w-3 h-3" />
                                        <Typography variant="caption" className="font-bold">
                                            {job.scheduledTime || 'Unscheduled'}
                                        </Typography>
                                    </div>
                                </div>
                                <Link href={`/dashboard/inspections/workbench/${job.id}`}>
                                    <Box className="w-7 h-7 rounded-lg bg-neutral-50 group-hover:bg-primary-50 flex items-center justify-center text-neutral-300 group-hover:text-primary-500 transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </Box>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-30">
                        <Typography variant="caption" className="font-bold italic">No site visits for this date</Typography>
                    </div>
                )}

                <Link href="/dashboard/inspections/calendar" className="mt-auto">
                    <Button variant="outlined" fullWidth size="sm" className="text-neutral-500 font-black border-neutral-200 hover:bg-white hover:text-neutral-700">
                        View Full Schedule
                    </Button>
                </Link>
            </div>
        </Card>
    );
};
