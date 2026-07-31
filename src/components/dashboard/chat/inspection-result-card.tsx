"use client";

import React from 'react';
import { Box, Card, CardContent, Typography } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, FileText as FileTextIcon, DownloadSimple as DownloadIcon, MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';

interface InspectionResultCardProps {
    assignment: any;
    onViewReport?: (reportUrl: string) => void;
}

export function InspectionResultCard({ assignment, onViewReport }: InspectionResultCardProps) {
    if (!assignment) return null;

    const roundNumber = assignment.round_number || 1;
    const inspectorName = assignment.inspector_company || assignment.inspector?.company || 'Accredited Inspection Firm';
    const status = assignment.status || 'COMPLETED';
    const reportUrl = assignment.report_url || assignment.inspection_report_url;
    const completedAt = assignment.completed_at || assignment.updatedAt;

    return (
        <Card className="border-emerald-200 bg-white overflow-hidden my-3 shadow-sm">
            <CardContent className="p-0">
                {/* Header Banner */}
                <div className="bg-emerald-700 px-4 py-2.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MagnifyingGlassIcon size={18} weight="bold" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Verified Inspection Result (Round {roundNumber})
                        </span>
                    </div>
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {status}
                    </span>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-900">{inspectorName}</p>
                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                Verified by Min-meg Admin {completedAt ? `• ${new Date(completedAt).toLocaleDateString()}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircleIcon size={14} weight="fill" />
                            <span>Verified</span>
                        </div>
                    </div>

                    {assignment.notes && (
                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs text-gray-600 font-medium">
                            <strong className="text-gray-800 block text-[10px] uppercase font-bold mb-0.5">Inspector Notes:</strong>
                            &quot;{assignment.notes}&quot;
                        </div>
                    )}

                    {/* Report Download/View Action */}
                    {reportUrl ? (
                        <a
                            href={reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
                        >
                            <FileTextIcon size={16} />
                            <span>Download Official Inspection Report (PDF)</span>
                            <DownloadIcon size={14} className="ml-auto" />
                        </a>
                    ) : (
                        <p className="text-[11px] text-gray-400 italic">Report document pending upload by inspector</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
