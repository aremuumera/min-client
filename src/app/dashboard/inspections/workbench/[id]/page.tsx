"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    useUpdateAssignmentStatusMutation,
    useGetWorkbenchDetailQuery,
    useGetInspectorProfileQuery,
    useUploadAssignmentPhotosMutation,
    useGetAssignmentPhotosQuery,
    useCompleteInspectionMutation,
} from '@/redux/features/inspector/inspector_api';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Chip } from '@/components/ui/chip';
import {
    FileText, Camera, CheckCircle2, Clock, Upload, ArrowLeft,
    MapPin, Calendar, Beaker, ClipboardCheck, ArrowRight,
    Loader2, Image as ImageIcon, ShieldCheck, ShieldAlert, Video, Play
} from 'lucide-react';

const PHASES = [
    { id: 'ASSIGNED', label: 'Invitation', description: 'Assignment received. Review details and respond.', icon: ClipboardCheck },
    { id: 'ACCEPTED', label: 'Accepted', description: 'Terms agreed. Prepare for site visit.', icon: CheckCircle2 },
    { id: 'SITE_VISIT', label: 'On-Site Audit', description: 'Conduct physical inspection and collect samples.', icon: MapPin },
    { id: 'LAB_ANALYSIS', label: 'Lab Analysis', description: 'Test mineral samples and verify grade.', icon: Beaker },
    { id: 'REPORT_WRITING', label: 'Report Writing', description: 'Compile findings and draft official report.', icon: FileText },
    { id: 'COMPLETED', label: 'Completed', description: 'Report submitted. Assignment finalized.', icon: CheckCircle2 },
] as const;

type PhaseId = typeof PHASES[number]['id'];

export default function TradeWorkbenchPage() {
    const { id: assignmentId } = useParams();
    const router = useRouter();

    // RTK Query
    const { data: workbenchRes, isLoading, refetch } = useGetWorkbenchDetailQuery(assignmentId as string);
    const { data: profileRes } = useGetInspectorProfileQuery('me');
    const { data: photosRes, refetch: refetchPhotos } = useGetAssignmentPhotosQuery(assignmentId as string);
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateAssignmentStatusMutation();
    const [uploadPhotos, { isLoading: uploadingPhotos }] = useUploadAssignmentPhotosMutation();
    const [completeInspection, { isLoading: completingInspection }] = useCompleteInspectionMutation();

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingPhase, setPendingPhase] = useState<PhaseId | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    // Report form state
    const [gradePercentage, setGradePercentage] = useState('');
    const [quantityVerified, setQuantityVerified] = useState('');
    const [qualityRemarks, setQualityRemarks] = useState('');
    const [uploadedReports, setUploadedReports] = useState<File[]>([]);

    const assignment = workbenchRes?.data;
    const currentPhase = assignment?.status as PhaseId || 'ASSIGNED';
    const siteUploads: any[] = assignment?.siteUploads || photosRes?.data || [];
    const labUploads: any[] = assignment?.labUploads || [];

    useEffect(() => {
        if (assignment) {
            if (assignment.gradeAchieved) setGradePercentage(String(assignment.gradeAchieved));
            if (assignment.quantityVerified || assignment.quantity) setQuantityVerified(String(assignment.quantityVerified || assignment.quantity));
            if (assignment.completionNotes) setQualityRemarks(assignment.completionNotes);
        }
    }, [assignment]);

    // Pre-formatted directly from backend API
    const displayProductName = assignment?.productName || 'Mineral Inspection Job';
    const displayCategory = assignment?.mineral_tag && assignment.mineral_tag !== 'N/A' && assignment.mineral_tag !== 'mineral' ? assignment.mineral_tag : '';

    // Exact full ID string preserved with hyphens
    const displayId = useMemo(() => {
        return assignmentId ? `ID: ${assignmentId}` : '';
    }, [assignmentId]);

    const isCancelledOrRejected = ['CANCELLED', 'REJECTED'].includes(assignment?.status);

    // Compute current phase index and next phase
    const currentPhaseIndex = useMemo(() => {
        if (!currentPhase || isCancelledOrRejected) return -1;
        return PHASES.findIndex(p => p.id === currentPhase);
    }, [currentPhase, isCancelledOrRejected]);

    const nextPhase = useMemo(() => {
        if (isCancelledOrRejected || currentPhaseIndex < 0 || currentPhaseIndex >= PHASES.length - 1) return null;
        return PHASES[currentPhaseIndex + 1];
    }, [currentPhaseIndex, isCancelledOrRejected]);

    // SLA Calculation
    const slaInfo = useMemo(() => {
        if (!assignment?.scheduledDate) return { remaining: 48, status: 'good' as const };
        const scheduled = new Date(assignment.scheduledDate);
        const now = new Date();
        const slaHours = profileRes?.data?.operational_limits?.report_sla_hours || 48;
        const deadline = new Date(scheduled.getTime() + slaHours * 60 * 60 * 1000);
        const diff = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
            remaining: Math.max(0, Math.round(diff)),
            status: diff < 6 ? 'expired' as const : diff < 12 ? 'warning' as const : 'good' as const,
        };
    }, [assignment, profileRes]);

    // Handle advancing to the next phase
    const handleAdvancePhase = () => {
        if (!nextPhase) return;
        setPendingPhase(nextPhase.id);
        setIsConfirmOpen(true);
    };

    const confirmPhaseAdvance = async () => {
        if (!pendingPhase) return;
        try {
            await updateStatus({
                id: assignmentId,
                status: pendingPhase,
            }).unwrap();
            toast.success(`Phase advanced to ${PHASES.find(p => p.id === pendingPhase)?.label || pendingPhase}`);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to advance phase');
        } finally {
            setIsConfirmOpen(false);
            setPendingPhase(null);
        }
    };

    // Handle rejection
    const handleReject = async () => {
        if (rejectionReason.trim().length < 10) {
            toast.error('Please provide a detailed rejection reason (min 10 characters)');
            return;
        }
        try {
            await updateStatus({
                id: assignmentId,
                status: 'REJECTED',
                rejectionReason,
            }).unwrap();
            toast.success('Assignment declined');
            router.push('/dashboard/inspections');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to decline assignment');
        }
    };

    // Handle photo/video/pdf upload to backend (capped at 5 files per batch, max 20MB per file)
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 5) {
            toast.error('Maximum 5 files allowed per upload batch');
            e.target.value = '';
            return;
        }

        const maxSizeBytes = 20 * 1024 * 1024;
        const oversizedFile = Array.from(files).find(f => f.size > maxSizeBytes);
        if (oversizedFile) {
            toast.error(`File "${oversizedFile.name}" exceeds the maximum 20MB size limit`);
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('category', 'SITE_EVIDENCE');
        Array.from(files).forEach(file => {
            formData.append('images', file);
        });

        try {
            await uploadPhotos({
                assignmentId: assignmentId as string,
                formData,
            }).unwrap();
            toast.success(`${files.length} file(s) uploaded successfully`);
            refetchPhotos();
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to upload files');
        }
        e.target.value = '';
    };

    // Handle PDF report file selection (appends new files, capped at 5 files total)
    const handleReportFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;

        setUploadedReports(prev => {
            const combined = [...prev, ...selected];
            if (combined.length > 5) {
                toast.error('Maximum 5 report files allowed per submission (capped at 5)');
                return combined.slice(0, 5);
            }
            return combined;
        });
        e.target.value = '';
    };

    const removeUploadedReport = (index: number) => {
        setUploadedReports(prev => prev.filter((_, i) => i !== index));
    };

    // Handle final report submission
    const handleSubmitReport = async () => {
        const grade = parseFloat(gradePercentage);
        const qty = parseFloat(quantityVerified);

        if (isNaN(grade) || grade < 0 || grade > 100) {
            toast.error('Grade percentage must be between 0 and 100');
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            toast.error('Quantity verified must be a positive number');
            return;
        }
        if (!qualityRemarks.trim() || qualityRemarks.trim().length < 10) {
            toast.error('Laboratory Quality & Composition Report remarks are required (min 10 chars)');
            return;
        }

        try {
            let primaryPdfUrl: string | null = null;

            // Upload PDF report documents if attached
            if (uploadedReports.length > 0) {
                const formData = new FormData();
                formData.append('category', 'LAB_REPORT');
                uploadedReports.forEach(file => {
                    formData.append('images', file);
                });
                const uploadRes = await uploadPhotos({
                    assignmentId: assignmentId as string,
                    formData,
                }).unwrap();
                if (uploadRes?.data && uploadRes.data.length > 0) {
                    primaryPdfUrl = uploadRes.data[0].photoUrl;
                }
                refetchPhotos();
            }

            const targetStatus = isCompleted ? 'COMPLETED' : currentPhase === 'REPORT_WRITING' ? 'COMPLETED' : currentPhase;

            await completeInspection({
                id: assignmentId,
                status: targetStatus,
                inspectionReport: {
                    gradePercentage: grade,
                    quantityVerified: qty,
                    qualityRemarks: qualityRemarks.trim(),
                    certificateUrl: primaryPdfUrl || assignment?.inspectionReportUrl || null,
                    photos: [],
                },
            }).unwrap();

            toast.success('Inspection report & findings submitted successfully');
            setIsSubmitModalOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to submit report');
        }
    };

    // Helper for timeline date & 12h AM/PM time
    const formatDateTime = (dateStr?: string | Date | null) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const dateFormatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${dateFormatted} at ${timeFormatted}`;
    };

    if (isLoading) return (
        <div className="h-full flex flex-col items-center justify-center p-20 animate-pulse">
            <div className="w-12 h-12 border-3 border-neutral-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <Typography variant="caption" className="text-neutral-400 uppercase tracking-widest">Loading Workbench...</Typography>
        </div>
    );

    if (!assignment) return (
        <div className="h-full flex flex-col items-center justify-center p-20">
            <Typography variant="h6" className="text-red-500">Assignment not found</Typography>
        </div>
    );

    const isCompleted = currentPhase === 'COMPLETED';
    const isRejected = assignment?.status === 'REJECTED';

    return (
        <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6 bg-white min-h-screen overflow-x-hidden">
            {/* Top Header */}
            <div className="space-y-3 pb-4 border-b border-gray-100 min-w-0">
                {/* Topmost Navigation Bar: Back Arrow & Status Chip */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shrink-0"
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        <Chip
                            label={isCompleted ? 'Inspection Completed' : isRejected ? 'Declined' : 'Inspection In Progress'}
                            color={isCompleted ? 'success' : isRejected ? 'error' : 'primary'}
                            variant="outlined"
                            size="sm"
                        />
                        {!isCompleted && !isRejected && (
                            <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-[11px] font-bold ${slaInfo.status === 'good' ? 'bg-green-50 border-green-200 text-green-700' :
                                slaInfo.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                    'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                <Clock size={13} />
                                {slaInfo.remaining}h SLA
                            </div>
                        )}
                    </div>
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        <span className="shrink-0">Inspector Workbench</span>
                        <span>&bull;</span>
                        <span className="text-gray-500 font-bold break-all">{displayId}</span>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight break-words">
                        {displayProductName}
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5 break-words">
                        Category: <span className="font-bold text-gray-800">{displayCategory}</span>
                    </p>
                </div>
            </div>

            {isCancelledOrRejected && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-800 font-bold text-sm">
                    <ShieldAlert size={20} className="text-red-600 shrink-0" />
                    <span>This inspection assignment has been {assignment.status.toLowerCase()}. All phase progression actions are disabled.</span>
                </div>
            )}

            {/* Workflow Phase Tracker — Stepper */}
            <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Workflow Progress</span>
                    <span className="text-xs font-bold text-gray-500">
                        Phase {currentPhaseIndex + 1} of {PHASES.length}
                    </span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {PHASES.map((phase, idx) => {
                        const isActive = currentPhase === phase.id;
                        const isDone = currentPhaseIndex > idx || (currentPhase === 'COMPLETED' && idx === currentPhaseIndex);
                        const PhaseIcon = phase.icon;

                        return (
                            <React.Fragment key={phase.id}>
                                <div className={`flex-1 min-w-[90px] flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 border border-emerald-200' :
                                    isDone ? 'bg-green-50/50' : ''
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone ? 'bg-green-500 text-white' :
                                        isActive ? 'bg-emerald-600 text-white' :
                                            'bg-gray-100 text-gray-400'
                                        }`}>
                                        {isDone ? <CheckCircle2 size={16} /> : <PhaseIcon size={14} />}
                                    </div>
                                    <span className={`text-[9px] font-bold text-center leading-tight ${isActive ? 'text-emerald-800' : isDone ? 'text-green-700' : 'text-gray-400'
                                        }`}>
                                        {phase.label}
                                    </span>
                                </div>
                                {idx < PHASES.length - 1 && (
                                    <div className={`w-4 h-0.5 rounded-full shrink-0 ${currentPhaseIndex > idx ? 'bg-green-400' : 'bg-gray-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Assignment Details */}
                <div className="lg:col-span-1 space-y-5">

                    {/* Assignment Info Card */}
                    <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block border-b border-gray-100 pb-2">
                            Assignment Specifications
                        </span>

                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Product Name</span>
                                <span className="text-sm font-black text-gray-900 block">{displayProductName}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Category</span>
                                <span className="text-xs font-bold text-gray-800 block">{displayCategory}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Quantity</span>
                                    <span className="text-sm font-black text-gray-900">{Number(assignment.quantity || 0).toLocaleString()} <span className="text-xs font-medium text-gray-500">{assignment.unitType || 'MT'}</span></span>
                                </div>
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Target Grade</span>
                                    <span className="text-sm font-black text-gray-900">{Number(assignment.agreedGradePercentage || 0).toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Inspection Location</span>
                                        <span className="text-xs font-bold text-gray-900 block">{assignment.inspectionLocation}{assignment.inspectionState ? `, ${assignment.inspectionState}` : ''}</span>
                                        {assignment.site_contact_info && (
                                            <div className="mt-1 pt-1 border-t border-gray-200/60 text-[10px] text-gray-600 font-medium">
                                                <span className="font-bold text-gray-700">Site Contact: </span>
                                                {typeof assignment.site_contact_info === 'string' ? assignment.site_contact_info : `${assignment.site_contact_info.name || ''} ${assignment.site_contact_info.phone ? `(${assignment.site_contact_info.phone})` : ''}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-start gap-2">
                                    <Calendar size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Scheduled Date & Time</span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {formatDateTime(assignment.scheduledDate) || 'Flexible / To Be Confirmed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {(assignment.inquiry?.description || assignment.productDescription) && (
                                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Buyer Inquiry Requirements</span>
                                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{assignment.inquiry?.description || assignment.productDescription}</p>
                                </div>
                            )}

                            {(assignment.inquiry?.moisture_max != null || assignment.inquiry?.packaging || assignment.inquiry?.sampling_method) && (
                                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                                    <span className="text-[9px] font-bold text-emerald-700 uppercase block">Buyer Quality & Sampling Specs</span>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {assignment.inquiry?.moisture_max != null && (
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Moisture Limit</span>
                                                <span className="font-bold text-gray-900">{assignment.inquiry.moisture_max}% Max</span>
                                            </div>
                                        )}
                                        {assignment.inquiry?.packaging && (
                                            <div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Packaging</span>
                                                <span className="font-bold text-gray-900">{assignment.inquiry.packaging}</span>
                                            </div>
                                        )}
                                        {assignment.inquiry?.sampling_method && (
                                            <div className="col-span-full">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Sampling Method</span>
                                                <span className="font-bold text-gray-900">{assignment.inquiry.sampling_method}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {assignment.adminNotes && (
                                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                                    <span className="text-[9px] font-bold text-amber-700 uppercase block mb-0.5">Admin Instructions</span>
                                    <p className="text-xs text-amber-900 leading-relaxed font-medium">{assignment.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Phase Action Card */}
                    {!isCompleted && !isRejected && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                                Current Phase: {PHASES[currentPhaseIndex]?.label}
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {PHASES[currentPhaseIndex]?.description}
                            </p>

                            {nextPhase && (
                                <Button
                                    onClick={handleAdvancePhase}
                                    disabled={updatingStatus}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
                                >
                                    {updatingStatus ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                    Advance to {nextPhase.label}
                                </Button>
                            )}

                            {(currentPhase === 'REPORT_WRITING' || currentPhase === 'LAB_ANALYSIS') && (
                                <Button
                                    onClick={() => setIsSubmitModalOpen(true)}
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 text-sm mt-2"
                                >
                                    <FileText size={16} />
                                    Submit Final Inspection Report
                                </Button>
                            )}

                            {currentPhase === 'ASSIGNED' && !showRejectForm && (
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="w-full text-center text-xs text-red-500 font-bold py-2 hover:underline"
                                >
                                    Decline Assignment
                                </button>
                            )}

                            {showRejectForm && (
                                <div className="space-y-2 pt-2 border-t border-red-100">
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Provide reason for declining (min 10 chars)..."
                                        className="w-full border border-red-200 rounded-xl p-3 text-xs focus:outline-none focus:border-red-400 min-h-[80px] resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                                            variant="outlined"
                                            size="sm"
                                            className="flex-1 text-xs"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            disabled={updatingStatus}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg"
                                        >
                                            Confirm Decline
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Evidence & Documentation */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Site Inspection Evidence & Photos */}
                    <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-black text-gray-900">Site Inspection Evidence & Documents</h3>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">Upload geotagged field photos & lab PDF documents for verification.</p>
                            </div>
                            <Chip label={`${siteUploads.length} Files Uploaded`} size="sm" color="primary" variant="outlined" />
                        </div>

                        <div className="flex flex-wrap gap-4 items-start min-h-[140px]">
                            {/* File Upload Card */}
                            {!isCancelledOrRejected && !isCompleted && (
                                <label className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group bg-gray-50/50">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,.pdf,application/pdf,.mp4,.webm,.mov,.avi"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhotos}
                                    />
                                    {uploadingPhotos ? (
                                        <Loader2 size={20} className="text-emerald-500 animate-spin" />
                                    ) : (
                                        <Camera size={22} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                    )}
                                    <span className="text-[10px] text-gray-600 font-bold group-hover:text-emerald-700 text-center px-1">
                                        {uploadingPhotos ? 'Uploading...' : '+ Add Photo / Video / PDF'}
                                    </span>
                                </label>
                            )}

                            {/* Server Uploaded Site Photos, Videos & Documents */}
                            {siteUploads.map((photo: any) => {
                                const url = photo.photoUrl || photo.url || '';
                                const isVideo = Boolean(url?.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) || url?.includes('/video/upload/'));
                                const isPdf = Boolean(url?.match(/\.pdf(\?.*)?$/i) || photo.category === 'FIELD_REPORT_PDF' || photo.caption?.toLowerCase().endsWith('.pdf'));

                                return (
                                    <a
                                        key={photo.id}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-28 h-28 rounded-xl bg-gray-900 relative overflow-hidden border border-gray-200 group block hover:ring-2 hover:ring-emerald-500 transition-all"
                                    >
                                        {isVideo ? (
                                            <div className="w-full h-full flex items-center justify-center relative bg-black">
                                                <video src={url} className="w-full h-full object-cover opacity-80" preload="metadata" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-white/90 text-emerald-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                        <Play size={14} className="ml-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <span className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-md">
                                                    <Video size={10} />
                                                </span>
                                            </div>
                                        ) : isPdf ? (
                                            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-2 text-center">
                                                <FileText size={28} className="text-red-500 mb-1" />
                                                <span className="text-[9px] font-bold text-gray-800 line-clamp-2 leading-tight">{photo.caption || 'PDF Document'}</span>
                                            </div>
                                        ) : (
                                            <img src={url} className="w-full h-full object-cover" alt={photo.caption || 'inspection evidence'} />
                                        )}
                                        {photo.category && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                                                <span className="text-[8px] text-white font-bold uppercase block truncate">{photo.category.replace(/_/g, ' ')}</span>
                                            </div>
                                        )}
                                    </a>
                                );
                            })}

                            {siteUploads.length === 0 && !uploadingPhotos && (
                                <div className="flex-1 flex items-center justify-center min-h-[100px] border border-dashed border-gray-100 rounded-xl">
                                    <div className="text-center py-2">
                                        <ImageIcon size={28} className="text-gray-300 mx-auto mb-1" />
                                        <p className="text-xs text-gray-400 font-medium">Click "+ Add Photo / PDF" to upload field evidence</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lab Test Results Summary */}
                    {(currentPhaseIndex >= 3 || isCompleted) && (
                        <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Lab Test Results</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Grade verification and quality analysis findings.</p>
                                </div>
                                {/* <Chip
                                    label={(assignment.gradeAchieved != null && assignment.gradeAchieved !== '') ? `${assignment.gradeAchieved}% TESTED GRADE` : 'Pending Lab Analysis'}
                                    color={(assignment.gradeAchieved != null && assignment.gradeAchieved !== '') ? 'success' : 'warning'}
                                    variant="filled"
                                    size="sm"
                                /> */}

                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Tested Grade</span>
                                        <span className="text-lg font-black text-gray-900">
                                            {(assignment.gradeAchieved != null && assignment.gradeAchieved !== '') ? `${assignment.gradeAchieved}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Target Grade Spec</span>
                                        <span className="text-lg font-black text-gray-500">
                                            {(assignment.agreedGradePercentage != null) ? `${assignment.agreedGradePercentage}%` : 'N/A'}
                                        </span>
                                    </div>
                                    {/* <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Verification Status</span>
                                        <span className={`text-xs font-black block ${(assignment.gradeAchieved != null && assignment.gradeAchieved !== '' && Number(assignment.gradeAchieved) > 0) ? 'text-emerald-700' : 'text-amber-600'}`}>
                                            {(assignment.gradeAchieved != null && assignment.gradeAchieved !== '' && Number(assignment.gradeAchieved) > 0) ? `Verified (${assignment.gradeAchieved}%)` : 'Pending Lab Report'}
                                        </span>
                                    </div> */}
                                    <div className="col-span-full p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Laboratory Test Remarks</span>
                                        <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{assignment.completionNotes || 'No remarks'}</p>
                                    </div>
                                    {labUploads.length > 0 && (
                                        <div className="col-span-full space-y-2">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block">Uploaded Test Certificates & Reports ({labUploads.length})</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {labUploads.map((report: any) => (
                                                    <a
                                                        key={report.id || report.photoUrl}
                                                        href={report.photoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 hover:bg-emerald-100/80 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold block truncate text-emerald-950 group-hover:text-emerald-800">{report.caption || 'Lab Test Report'}</span>
                                                            <span className="text-[9px] text-emerald-700 font-medium block">Click to view lab document</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!isCancelledOrRejected && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <Button
                                            onClick={() => setIsSubmitModalOpen(true)}
                                            variant="outlined"
                                            className="w-full text-xs font-bold text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 py-2.5"
                                        >
                                            <FileText size={14} />
                                            {isCompleted || assignment.completionNotes || assignment.gradeAchieved ? 'Update Lab Test Results and Report' : 'Enter Lab Test Results and Report'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Completion Summary Timeline */}
                    {isCompleted && (
                        <div className="rounded-2xl border border-green-200 bg-green-50/30 p-4 sm:p-5 space-y-4 w-full min-w-0">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                                <h3 className="text-sm sm:text-base font-black text-green-900">Assignment Progression Timeline</h3>
                            </div>

                            {/* Timeline with Lucide icons */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Assignment Issued', date: assignment.createdAt, icon: ClipboardCheck },
                                    { label: 'Accepted by Inspector', date: assignment.acceptedAt, icon: CheckCircle2 },
                                    { label: 'Scheduled Inspection Date', date: assignment.scheduledDate, icon: Calendar },
                                    { label: 'Site Visit Started', date: assignment.startedAt, icon: MapPin },
                                    { label: 'Report & Findings Submitted', date: assignment.completedAt, icon: FileText },
                                ].filter(item => item.date).map((item, idx) => {
                                    const IconComp = item.icon;
                                    return (
                                        <div key={idx} className="flex items-start sm:items-center gap-3 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 shrink-0 mt-0.5 sm:mt-0">
                                                <IconComp size={14} />
                                            </div>
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between border-b border-green-100 pb-2 gap-0.5 min-w-0">
                                                <span className="text-xs font-bold text-green-900 truncate">{item.label}</span>
                                                <span className="text-[11px] sm:text-xs text-green-700 font-medium shrink-0">
                                                    {formatDateTime(item.date)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Inspector & Result Summary Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-green-100">
                                {assignment.inspectorCompany?.companyName && (
                                    <div className="p-3 rounded-xl bg-white border border-green-200">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Assigned Inspector</span>
                                        <span className="text-xs font-black text-gray-900 block truncate">{assignment.inspectorCompany.companyName}</span>
                                    </div>
                                )}
                                {assignment.gradeAchieved && (
                                    <div className="p-3 rounded-xl bg-white border border-green-200">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5">Grade Achieved</span>
                                        <span className="text-xs font-black text-gray-900 block">{assignment.gradeAchieved}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase Advance Confirmation Dialog */}
            {isConfirmOpen && pendingPhase && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <div className="bg-emerald-50 p-6 text-center space-y-2 border-b border-emerald-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto">
                                <ArrowRight size={24} className="text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Confirm Phase Advance</h3>
                            <p className="text-xs text-gray-500">
                                You are advancing status to <strong>{PHASES.find(p => p.id === pendingPhase)?.label}</strong>.
                            </p>
                        </div>
                        <div className="p-6 flex gap-3">
                            <Button
                                variant="outlined"
                                onClick={() => { setIsConfirmOpen(false); setPendingPhase(null); }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmPhaseAdvance}
                                disabled={updatingStatus}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {updatingStatus ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Report Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden border border-gray-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-900 p-6 text-center space-y-2">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
                                <FileText size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-black text-white">Submit Inspection Report</h3>
                            <p className="text-xs text-gray-300">
                                Enter the lab analysis results and submit your final inspection findings.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Grade Achieved (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={gradePercentage}
                                    onChange={(e) => setGradePercentage(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-emerald-400"
                                    placeholder="e.g. 85.5"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Target: {Number(assignment.agreedGradePercentage || 0).toFixed(1)}%</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quantity Verified ({assignment.unitType || 'MT'})</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={quantityVerified}
                                    onChange={(e) => setQuantityVerified(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-emerald-400"
                                    placeholder={`e.g. ${assignment.quantity}`}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-gray-700 uppercase">Laboratory Quality & Composition Report *</label>
                                    <span className="text-[9px] text-emerald-600 font-bold">Required</span>
                                </div>
                                <textarea
                                    value={qualityRemarks}
                                    onChange={(e) => setQualityRemarks(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 min-h-[110px] resize-y font-mono leading-relaxed"
                                    placeholder="Enter laboratory breakdown (e.g. Chemical composition %, Moisture content, Impurities, Particle size/mesh, etc.)..."
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setQualityRemarks(prev => `${prev}\n\n[Chemical Analysis]: Li2O: __%, Fe2O3: __%, SiO2: __%`)}
                                        className="text-[10px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-bold px-2 py-1 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        + Chemical Composition
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQualityRemarks(prev => `${prev}\n\n[Physical Parameters]: Moisture: __%, Mesh / Grain Size: __`)}
                                        className="text-[10px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-bold px-2 py-1 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        + Moisture & Mesh
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQualityRemarks(prev => `${prev}\n\n[Impurities & Penalty Elements]: __`)}
                                        className="text-[10px] bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-bold px-2 py-1 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        + Impurities & Penalties
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-gray-700 uppercase">Inspection Report PDF Certificates (Max 5 files)</label>
                                    <span className="text-[9px] text-gray-400 font-medium">Max 5 files</span>
                                </div>
                                <label className={`block border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer group ${uploadedReports.length > 0 ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-300'
                                    }`}>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,application/pdf,image/*"
                                        className="hidden"
                                        onChange={handleReportFilesChange}
                                        disabled={completingInspection || uploadingPhotos}
                                    />
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${uploadedReports.length > 0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-300 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                                        }`}>
                                        {uploadingPhotos ? <Loader2 size={20} className="animate-spin text-white" /> : uploadedReports.length > 0 ? <CheckCircle2 size={20} /> : <Upload size={20} />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 block">
                                        {uploadedReports.length > 0 ? `+ Add More Files (${uploadedReports.length}/5 Selected)` : 'Click to upload PDF reports / certificates (up to 5)'}
                                    </span>
                                </label>

                                {uploadedReports.length > 0 && (
                                    <div className="mt-3 space-y-1.5 text-left">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Selected Files ({uploadedReports.length}/5):</span>
                                        <div className="flex flex-wrap gap-2">
                                            {uploadedReports.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900">
                                                    <FileText size={14} className="text-emerald-600 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{file.name}</span>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); removeUploadedReport(idx); }} className="text-red-500 hover:text-red-700 ml-1 font-bold">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outlined"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    disabled={completingInspection || uploadingPhotos}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitReport}
                                    disabled={completingInspection || uploadingPhotos}
                                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                                >
                                    {(completingInspection || uploadingPhotos) ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin text-emerald-400" />
                                            <span>{uploadingPhotos ? 'Uploading Files...' : 'Submitting Report...'}</span>
                                        </>
                                    ) : (
                                        <span>Submit Report</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
