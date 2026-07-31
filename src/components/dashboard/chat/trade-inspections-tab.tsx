"use client";

import React, { useState } from 'react';
import { useGetTradeAssignmentsHistoryQuery, useApproveInspectionAndProceedMutation, useGetReleasedReportQuery } from '@/redux/features/trade/trade_api';
import { Spinner } from '@/components/ui';
import { ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, RefreshCw, XCircle, Eye, MapPin, FlaskConical, CalendarDays, Image as ImageIcon, X, Video, Play } from 'lucide-react';
import RequestReinspectionModal from './modals/RequestReinspectionModal';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/helper';

interface TradeInspectionsTabProps {
    tradeId: string;
    itemType?: string;
    isBuyer?: boolean;
}

// ─── Photo & Video Lightbox ─────────────────────────────────────
function PhotoLightbox({ url, caption, onClose }: { url: string; caption?: string | null; onClose: () => void }) {
    const isVideo = Boolean(url?.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) || url?.includes('/video/upload/'));
    const isPdf = Boolean(url?.match(/\.pdf(\?.*)?$/i) || url?.includes('/raw/upload/'));

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-100 z-10 shadow-xl">
                    <X size={18} />
                </button>
                {isVideo ? (
                    <video src={url} controls autoPlay className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl bg-black" />
                ) : isPdf ? (
                    <iframe src={url} className="w-full h-[80vh] rounded-xl bg-white shadow-2xl" title={caption || 'Inspection PDF'} />
                ) : (
                    <img src={url} alt={caption || 'Inspection media'} className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl" />
                )}
                {caption && <p className="mt-3 text-xs text-white/90 font-medium text-center bg-black/50 px-4 py-1.5 rounded-full">{caption}</p>}
            </div>
        </div>
    );
}

// ─── Detailed Report Panel ─────────────────────────────────────
function InspectionReportPanel({ assignmentId, onClose }: { assignmentId: string; onClose: () => void }) {
    const { data: reportRes, isLoading, error } = useGetReleasedReportQuery(assignmentId, { skip: !assignmentId });
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxCaption, setLightboxCaption] = useState<string | null>(null);

    const report = reportRes?.data || reportRes;

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center space-y-3">
                <Spinner size={24} className="text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-gray-700">Loading Inspection Report...</p>
            </div>
        );
    }

    if (error || !report) {
        const errMsg = (error as any)?.data?.error?.message || 'Unable to load inspection report. Results may not have been released yet.';
        return (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span>Report Not Available</span>
                </div>
                <p className="text-xs text-amber-700 font-medium">{errMsg}</p>
                <button onClick={onClose} className="mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900">Close</button>
            </div>
        );
    }

    const photos = report.photos || [];

    const formatScheduledTime = (dateStr?: string, timeStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        const dateFormatted = d.toLocaleDateString();
        if (!timeStr) return dateFormatted;
        const parts = timeStr.trim().split(':');
        if (parts.length >= 2) {
            const h = parseInt(parts[0], 10);
            const m = parts[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${dateFormatted} at ${h12}:${m} ${ampm}`;
        }
        return `${dateFormatted} at ${timeStr}`;
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden space-y-0">
            {/* Report Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-gray-900">
                        Round {report.round_number || 1} — Detailed Inspection Report
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {report.productName} • {report.mineral_tag}
                    </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="p-5 space-y-5">
                {/* Key Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Grade Achieved</span>
                        <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.gradeAchieved || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Agreed Grade %</span>
                        <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.agreedGradePercentage != null ? `${report.agreedGradePercentage}%` : 'N/A'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Quantity</span>
                        <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.quantity} {report.unitType}</span>
                    </div>
                </div>

                {/* Inspection Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <MapPin size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase block">Inspection Location</span>
                            <span className="text-xs font-bold text-gray-900">
                                {[report.inspectionLocation, report.inspectionState, report.inspectionLGA].filter(Boolean).join(', ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <CalendarDays size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase block">Scheduled Date</span>
                            <span className="text-xs font-bold text-gray-900">
                                {formatScheduledTime(report.scheduledDate, report.scheduledTime)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Milestone Timeline */}
                {(report.acceptedAt || report.startedAt || report.completedAt) && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Inspection Timeline</span>
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-700 flex-wrap">
                            {report.acceptedAt && (
                                <span className="flex items-center gap-1 bg-white rounded-lg px-2.5 py-1 border border-gray-200">
                                    <CheckCircle2 size={12} className="text-blue-500" /> Accepted: {new Date(report.acceptedAt).toLocaleDateString()}
                                </span>
                            )}
                            {report.startedAt && (
                                <span className="flex items-center gap-1 bg-white rounded-lg px-2.5 py-1 border border-gray-200">
                                    <FlaskConical size={12} className="text-amber-500" /> Started: {new Date(report.startedAt).toLocaleDateString()}
                                </span>
                            )}
                            {report.completedAt && (
                                <span className="flex items-center gap-1 bg-white rounded-lg px-2.5 py-1 border border-gray-200">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Completed: {new Date(report.completedAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Re-Inspection Reason */}
                {report.reinspection_reason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                        <strong className="block text-amber-900 mb-0.5">Re-Inspection Request Reason:</strong>
                        &quot;{report.reinspection_reason}&quot;
                    </div>
                )}

                {/* Completion Notes */}
                {report.completionNotes ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-1">
                        <strong className="block text-gray-900 font-bold uppercase text-[10px]">Inspector Lab Notes & Physical Parameters:</strong>
                        <p className="leading-relaxed whitespace-pre-wrap">{report.completionNotes}</p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No additional notes provided for this round.</p>
                )}

                {/* Inspection Photos Gallery */}
                {photos.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-emerald-600" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Inspection Photos ({photos.length})
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {photos.map((photo: any) => {
                                const url = photo.photoUrl || photo.url || '';
                                const isVideo = Boolean(url?.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) || url?.includes('/video/upload/'));
                                const isPdf = Boolean(url?.match(/\.pdf(\?.*)?$/i) || url?.includes('/raw/upload/'));

                                return (
                                    <button
                                        key={photo.id}
                                        onClick={() => { setLightboxUrl(url); setLightboxCaption(photo.caption); }}
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition-all bg-gray-900"
                                    >
                                        {isVideo ? (
                                            <div className="w-full h-full flex items-center justify-center relative bg-black">
                                                <video src={url} className="w-full h-full object-cover opacity-80" preload="metadata" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-10 h-10 rounded-full bg-white/90 text-emerald-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                        <Play size={18} className="ml-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <span className="absolute top-1.5 right-1.5 bg-black/70 text-white p-1 rounded-md">
                                                    <Video size={12} />
                                                </span>
                                            </div>
                                        ) : isPdf ? (
                                            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-3 text-center">
                                                <FileText size={32} className="text-red-500 mb-1" />
                                                <span className="text-[10px] font-bold text-gray-800 line-clamp-2">{photo.caption || 'PDF Document'}</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={url}
                                                alt={photo.caption || 'Inspection photo'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        {photo.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                <p className="text-[10px] text-white font-medium truncate">{photo.caption}</p>
                                            </div>
                                        )}
                                        {photo.category && (
                                            <span className="absolute top-1.5 left-1.5 bg-white/90 text-[9px] font-bold text-gray-700 px-1.5 py-0.5 rounded-md uppercase">
                                                {photo.category}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {photos.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                        <ImageIcon size={20} className="text-gray-300 mx-auto mb-1" />
                        <p className="text-xs text-gray-400 font-medium">No inspection photos uploaded for this round.</p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <PhotoLightbox url={lightboxUrl} caption={lightboxCaption} onClose={() => { setLightboxUrl(null); setLightboxCaption(null); }} />
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────
export function TradeInspectionsTab({ tradeId, itemType = 'product', isBuyer = false }: TradeInspectionsTabProps) {
    const { data: rawData, isLoading, refetch } = useGetTradeAssignmentsHistoryQuery(
        { tradeId, itemType },
        { skip: !tradeId || tradeId === 'undefined' }
    );
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [showReinspectionModal, setShowReinspectionModal] = useState(false);
    const [approveAndProceed, { isLoading: isApproving }] = useApproveInspectionAndProceedMutation();

    const assignments = Array.isArray(rawData)
        ? rawData
        : (Array.isArray(rawData?.data) ? rawData.data : []);

    const latestAssignment = assignments[0] || null;

    // Release check: ONLY show decision banner if Admin has explicitly released to buyer
    const isLatestReleased = latestAssignment && (latestAssignment.released_to_buyer === true || latestAssignment.status === 'RELEASED' || latestAssignment.status === 'INSPECTION_RESULT_RELEASED');

    const handleApprove = async () => {
        try {
            await approveAndProceed({ tradeId, itemType }).unwrap();
            toast.success('Inspection approved! Trade advancing to Contract Negotiation.');
            refetch();
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Failed to approve inspection'));
        }
    };

    if (isLoading && !assignments.length && tradeId && tradeId !== 'undefined') {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-gray-200">
                <Spinner size={28} className="text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-gray-700">Loading Trade Inspection Hub...</p>
            </div>
        );
    }

    if (!assignments || assignments.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900">No Inspections Appointed Yet</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Inspection assignments and accredited laboratory reports for this trade will appear here once appointed by Min-meg Admin.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-emerald-400" />
                        <h3 className="text-base font-bold uppercase tracking-wider">Trade Inspection Hub</h3>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium">
                        Comprehensive record of physical inspection rounds, lab assays, and accredited certifications.
                    </p>
                </div>
                <span className="bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                    Total Rounds: {assignments.length}
                </span>
            </div>

            {/* Inspections Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                        <Clock size={16} className="text-emerald-600" /> Inspection Rounds List
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Round #</th>
                                <th className="py-3 px-4">Inspector / Firm</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Admin Release</th>
                                <th className="py-3 px-4">Scheduled Date</th>
                                <th className="py-3 px-4 text-right">Report</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium">
                            {assignments.map((assignment: any) => {
                                const isReleased = assignment.released_to_buyer || assignment.status === 'RELEASED' || assignment.status === 'INSPECTION_RESULT_RELEASED';
                                const isCancelled = assignment.status === 'CANCELLED';
                                const isCompleted = assignment.status === 'COMPLETED';
                                const canViewDetails = isReleased && isCompleted;

                                return (
                                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            Round {assignment.round_number || 1}
                                            {assignment.is_current && (
                                                <span className="ml-2 bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-800 font-bold">
                                            Accredited Min-meg Inspector
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                isCompleted ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                assignment.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                isCancelled ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {assignment.status?.replace(/_/g, ' ') || 'Assigned'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {isCancelled ? (
                                                <span className="text-[11px] text-gray-400 italic">N/A (Cancelled)</span>
                                            ) : isReleased ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                                    <CheckCircle2 size={13} className="text-emerald-600" /> Released to Merchant
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                                                    <Clock size={13} className="text-amber-500" /> Under Admin Review
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                                            {assignment.scheduledDate ? new Date(assignment.scheduledDate).toLocaleDateString() : (assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'N/A')}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {isCancelled ? (
                                                <span className="text-[11px] text-gray-400 italic">N/A</span>
                                            ) : canViewDetails ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedReportId(assignment.id); }}
                                                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                                >
                                                    <Eye size={14} /> View Details
                                                </button>
                                            ) : isCompleted ? (
                                                <span className="text-[11px] text-amber-600 italic font-medium">Awaiting Admin Release</span>
                                            ) : (
                                                <span className="text-[11px] text-gray-400 italic">In Progress</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Selected Inspection Round — Detailed Report Panel */}
            {selectedReportId && (
                <InspectionReportPanel
                    assignmentId={selectedReportId}
                    onClose={() => setSelectedReportId(null)}
                />
            )}

            {/* Buyer Decision Banner — ONLY shown when latest round has been explicitly verified & released by Minmeg Admin */}
            {isBuyer && isLatestReleased && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-300 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Admin Verified Results — Buyer Trade Decision</span>
                    </div>

                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Min-meg Admin has verified and released the official inspection results above. Please review the assay certificate and select your decision:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isApproving ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
                            <span>Approve & Proceed to Contract</span>
                        </button>

                        <button
                            onClick={() => setShowReinspectionModal(true)}
                            className="py-3 px-4 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} className="text-amber-600" />
                            <span>Request Re-Inspection</span>
                        </button>

                        <button
                            onClick={() => toast.info('Trade cancellation request submitted.')}
                            className="py-3 px-4 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <XCircle size={16} />
                            <span>Cancel Trade</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Re-Inspection Modal */}
            <RequestReinspectionModal
                isOpen={showReinspectionModal}
                onClose={() => setShowReinspectionModal(false)}
                tradeId={tradeId}
                itemType={itemType as 'product' | 'rfq'}
                onSuccess={refetch}
            />
        </div>
    );
}
