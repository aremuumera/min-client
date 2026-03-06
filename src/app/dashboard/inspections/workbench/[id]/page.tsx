"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { MessageBox } from '@/components/dashboard/chat/message-box';
import { useResolveTradeChatMutation } from '@/redux/features/trade/trade_api';
import { customerTradeChatService } from '@/components/dashboard/chat/trade_chat_service';
import {
    useUpdateAssignmentStatusMutation,
    useGetWorkbenchDetailQuery,
    useGetInspectorProfileQuery
} from '@/redux/features/inspector/inspector_api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { Chip } from '@/components/ui/chip';
import { FileText, Camera, CheckCircle2, AlertCircle, Clock, Upload, Send, X } from 'lucide-react';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderCompanyName: string;
    text: string;
    timestamp: any;
    status: string;
    type: string;
}

const PHASES = [
    { id: 'ASSIGNED', label: 'Invitation', description: 'Reviewing trade specifications.' },
    { id: 'ACCEPTED', label: 'Accepted', description: 'Terms agreed by inspector.' },
    { id: 'SCHEDULED', label: 'Scheduled', description: 'Date and time confirmed.' },
    { id: 'SITE_VISIT', label: 'On-Site Audit', description: 'Conducting physical audit.' },
    { id: 'LAB_ANALYSIS', label: 'Lab Analysis', description: 'Testing mineral samples.' },
    { id: 'REPORT_WRITING', label: 'Reporting', description: 'Drafting official findings.' },
    { id: 'COMPLETED', label: 'Finalized', description: 'Assignment closed.' }
];

export default function TradeWorkbenchPage() {
    const { id: assignmentId } = useParams();
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query
    const { data: workbenchRes, isLoading: inquiryLoading } = useGetWorkbenchDetailQuery(assignmentId as string);
    const { data: profileRes } = useGetInspectorProfileQuery('me');
    const [resolveChat] = useResolveTradeChatMutation();
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateAssignmentStatusMutation();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState('ASSIGNED');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const assignment = workbenchRes?.data;
    const inquiry = assignment?.inquiry;

    useEffect(() => {
        if (assignment?.status) {
            setActivePhase(assignment.status);
        }
    }, [assignment]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const initChat = async () => {
            if (!inquiry?.external_id) return;
            try {
                const res = await resolveChat({ inquiryId: inquiry.external_id as string, type: 'inspector' }).unwrap();
                setRoomId(res.data.roomId);
            } catch (error) {
                console.error('Chat resolution failed', error);
                toast.error('Failed to establish secure link');
            }
        };
        initChat();
    }, [inquiry?.external_id, resolveChat]);

    useEffect(() => {
        if (!roomId || !inquiry?.external_id) return;

        // Use hub-and-spoke service for inspector spoke
        const unsubscribe = customerTradeChatService.getSpokeMessages(
            roomId,
            inquiry.external_id,
            'admin_inspector',
            (msgs) => {
                setMessages(msgs as any);
            }
        );

        return () => unsubscribe();
    }, [roomId, inquiry?.external_id]);

    // SLA Calculation
    const [slaInfo, setSlaInfo] = useState<{ remaining: number; status: 'good' | 'warning' | 'expired' }>({ remaining: 48, status: 'good' });

    useEffect(() => {
        if (assignment?.scheduledDate) {
            const scheduled = new Date(assignment.scheduledDate);
            const now = new Date();
            const slaHours = profileRes?.data?.operational_limits?.report_sla_hours || 48;
            const deadline = new Date(scheduled.getTime() + slaHours * 60 * 60 * 1000);
            const diff = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

            setSlaInfo({
                remaining: Math.max(0, Math.round(diff)),
                status: diff < 6 ? 'expired' : diff < 12 ? 'warning' : 'good'
            });
        }
    }, [assignment, profileRes]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId || !inquiry?.external_id || !user) return;

        const text = newMessage;
        setNewMessage('');

        try {
            await customerTradeChatService.sendMessage(
                roomId,
                inquiry.external_id,
                'admin_inspector',
                user.id,
                'inspector',
                `${user.firstName} ${user.lastName}`,
                (user as any).companyName || 'Inspector',
                text
            );
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('Message failed to send');
        }
    };

    const handlePhaseChange = async (phaseId: string) => {
        try {
            await updateStatus({
                id: assignmentId,
                status: phaseId
            }).unwrap();
            setActivePhase(phaseId);
            toast.success(`Trade phase updated to ${phaseId.replace('_', ' ')}`);
        } catch (error) {
            toast.error('Failed to update phase');
        }
    };

    const [uploadedReport, setUploadedReport] = useState<File | null>(null);
    const [photos, setPhotos] = useState<File[]>([]);

    const handleSubmitReport = async () => {
        if (!uploadedReport) {
            toast.error('Please attach the technical audit PDF');
            return;
        }

        toast.info('Syncing Technical Audit to Global Ledger...');
        // In real implementation: 
        // 1. Upload report to Cloudinary -> get URL
        // 2. Upload photos to Cloudinary -> get URLs
        // 3. Call updateStatus with reportURL and grade

        setTimeout(() => {
            toast.success('Inspector Report v1.0 Authenticated');
            handlePhaseChange('COMPLETED');
            setIsSubmitModalOpen(false);
        }, 2000);
    };

    if (inquiryLoading) return (
        <div className="h-full flex flex-col items-center justify-center p-20 animate-pulse">
            <div className="w-12 h-12 border-3 border-neutral-100 border-t-primary-500 rounded-full animate-spin mb-4" />
            <Typography variant="caption" className="text-neutral-400 uppercase tracking-widest">Loading Workbench...</Typography>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Job Info & Phases */}
            <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-hidden">
                <Card outlined>
                    <CardContent className="p-6 space-y-5">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <Typography variant="caption" className="text-primary-600 font-semibold uppercase">
                                    {inquiry?.mineral_tag}
                                </Typography>
                                <Typography variant="h5" className="text-neutral-800">
                                    {inquiry?.product_name || 'Loading Asset...'}
                                </Typography>
                                <Typography variant="caption" className="text-neutral-400">
                                    Assignment ID: {assignmentId}
                                </Typography>
                            </div>
                            <CheckCircle2 className={`w-5 h-5 ${activePhase === 'COMPLETED' ? 'text-green-500' : 'text-neutral-200'}`} />
                        </div>

                        <div className={`p-3 rounded-lg border flex items-center gap-3 ${slaInfo.status === 'good' ? 'bg-green-50/30 border-green-100' :
                            slaInfo.status === 'warning' ? 'bg-amber-50/30 border-amber-100' : 'bg-red-50/30 border-red-100'
                            }`}>
                            <Clock className={`w-4 h-4 ${slaInfo.status === 'good' ? 'text-green-600' :
                                slaInfo.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                                }`} />
                            <div>
                                <Typography variant="caption" className="text-neutral-400 uppercase">SLA Countdown</Typography>
                                <Typography variant="body2" className={`font-semibold ${slaInfo.status === 'good' ? 'text-green-700' :
                                    slaInfo.status === 'warning' ? 'text-amber-700' : 'text-red-700'
                                    }`}>
                                    {slaInfo.remaining}h remaining
                                </Typography>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Phase Tracker */}
                <Card outlined className="flex-1 flex flex-col overflow-hidden">
                    <CardContent className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
                        <Typography variant="overline" className="text-neutral-400">Workflow Phases</Typography>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {PHASES.map((phase, idx) => {
                                const currentIdx = PHASES.findIndex(p => p.id === activePhase);
                                const isCompleted = currentIdx >= idx;
                                const isActive = activePhase === phase.id;

                                return (
                                    <button
                                        key={phase.id}
                                        onClick={() => handlePhaseChange(phase.id)}
                                        disabled={currentIdx > idx || activePhase === 'COMPLETED'}
                                        className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${isActive ? 'border-primary-200 bg-primary-50/30' :
                                            isCompleted ? 'border-green-100 bg-green-50/10' :
                                                'border-neutral-50 opacity-40 hover:opacity-100'
                                            }`}
                                    >
                                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            isActive ? 'border-primary-500' : 'border-neutral-200 text-transparent'
                                            }`}>
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <div>
                                            <Typography variant="body2" className={`font-semibold ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                                {phase.label}
                                            </Typography>
                                            <Typography variant="caption" className="text-neutral-400">
                                                {phase.description}
                                            </Typography>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            variant="contained"
                            color="primary"
                            size="lg"
                            fullWidth
                            onClick={() => setIsSubmitModalOpen(true)}
                            disabled={activePhase === 'COMPLETED'}
                        >
                            {activePhase === 'COMPLETED' ? 'Assignment Finalized' : 'Submit Report'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Chat & Evidence */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
                {/* Chat Spoke */}
                <Card outlined className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-neutral-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold">AD</div>
                            <div>
                                <Typography variant="body2" className="font-semibold text-neutral-800">Admin Channel</Typography>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <Typography variant="caption" className="text-neutral-400">Live</Typography>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/20 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                                <Send size={32} className="text-neutral-400" />
                                <Typography variant="caption" className="text-neutral-500">No messages yet</Typography>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <MessageBox key={msg.id} message={msg as any} />
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-neutral-100">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 h-10 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary-500 transition-colors"
                            />
                            <IconButton color="primary" type="submit" aria-label="Send message">
                                <Send className="w-4 h-4" />
                            </IconButton>
                        </form>
                    </div>
                </Card>

                {/* Site Evidence Spoke */}
                <Card outlined className="h-56 flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-neutral-100 flex justify-between items-center">
                        <Typography variant="overline" className="text-neutral-400">Site Evidence</Typography>
                        <Chip label={`${photos.length} Photos`} size="sm" variant="outlined" />
                    </div>
                    <div className="flex-1 p-4 overflow-x-auto flex gap-3 custom-scrollbar items-center">
                        <label className="shrink-0 w-28 h-28 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-primary-300 transition-colors cursor-pointer group">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setPhotos(prev => [...prev, ...Array.from(e.target.files || [])])}
                            />
                            <Camera size={20} className="text-neutral-300 group-hover:text-primary-500 transition-colors" />
                            <Typography variant="caption" className="text-neutral-400">Add Photo</Typography>
                        </label>

                        {photos.map((photo, i) => (
                            <div key={i} className="shrink-0 w-28 h-28 rounded-lg bg-neutral-100 relative overflow-hidden border border-neutral-200 group">
                                <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="site evidence" />
                                <button
                                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                    className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} className="text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Submission Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-6">
                    <Card outlined className="w-full max-w-lg overflow-hidden">
                        <div className="bg-primary-50 p-8 text-center space-y-3 border-b border-primary-100">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
                                <FileText size={28} className="text-primary-600" />
                            </div>
                            <Typography variant="h5">Submit Report</Typography>
                            <Typography variant="body2" className="text-neutral-500">
                                Upload your inspection report PDF to finalize this assignment.
                            </Typography>
                        </div>

                        <CardContent className="p-8 space-y-6">
                            <label className={`block border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${uploadedReport ? 'border-green-200 bg-green-50/30' : 'border-neutral-200 hover:border-primary-300'
                                }`}>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => setUploadedReport(e.target.files?.[0] || null)}
                                />
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${uploadedReport ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-300 group-hover:bg-primary-50 group-hover:text-primary-500'
                                    }`}>
                                    {uploadedReport ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                                </div>
                                <Typography variant="body2" className="font-medium text-neutral-800">
                                    {uploadedReport ? uploadedReport.name : 'Click to upload PDF'}
                                </Typography>
                                <Typography variant="caption" className="text-neutral-400 mt-1">
                                    Accepted format: PDF
                                </Typography>
                            </label>

                            <div className="flex gap-3">
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setIsSubmitModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleSubmitReport}
                                >
                                    Submit Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
