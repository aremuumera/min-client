"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageBox } from '@/components/dashboard/chat/message-box';
import { useGetTradeInquiryQuery, useResolveTradeChatMutation } from '@/redux/features/trade/trade_api';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';

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
    { id: 'drafting_brief', label: 'Drafting Brief', description: 'Reviewing trade specifications.' },
    { id: 'site_inspection', label: 'Site Inspection', description: 'Conducting physical audit.' },
    { id: 'drafting_report', label: 'Drafting Report', description: 'Writing the technical findings.' },
    { id: 'final_submission', label: 'Final Submission', description: 'Uploading and closing the assignment.' }
];

export default function TradeWorkbenchPage() {
    const { id: inquiryId } = useParams();
    const { user } = useSelector((state: RootState) => state.auth);

    // RTK Query
    const { data: inquiryRes, isLoading: inquiryLoading } = useGetTradeInquiryQuery(inquiryId as string);
    const [resolveChat] = useResolveTradeChatMutation();
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateAssignmentStatusMutation();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [activePhase, setActivePhase] = useState('drafting_brief');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inquiry = inquiryRes?.data;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const initChat = async () => {
            if (!inquiryId) return;
            try {
                const res = await resolveChat({ inquiryId: inquiryId as string, type: 'inspector' }).unwrap();
                setRoomId(res.data.roomId);
            } catch (error) {
                console.error('Chat resolution failed', error);
                toast.error('Failed to establish secure link');
            }
        };
        initChat();
    }, [inquiryId, resolveChat]);

    useEffect(() => {
        if (!roomId) return;

        const q = query(
            collection(db, 'trade_rooms', roomId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [roomId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId || !user) return;

        const text = newMessage;
        setNewMessage('');

        try {
            await addDoc(collection(db, 'trade_rooms', roomId, 'messages'), {
                text,
                senderId: user.id,
                senderName: `${user.firstName} ${user.lastName}`,
                senderCompanyName: (user as any).companyName || 'Inspector',
                timestamp: serverTimestamp(),
                status: 'sent',
                type: 'text'
            });
        } catch (error) {
            console.error('Failed to send message', error);
            toast.error('Message failed to send');
        }
    };

    const handlePhaseChange = async (phaseId: string) => {
        try {
            await updateStatus({
                userId: user?.id,
                statusData: { status: phaseId, inquiryId }
            }).unwrap();
            setActivePhase(phaseId);
            toast.success(`Trade phase updated to ${phaseId.replace('_', ' ')}`);
        } catch (error) {
            toast.error('Failed to update phase');
        }
    };

    const handleSubmitReport = () => {
        toast.info('Report Submission Engine Initialized...');
        setTimeout(() => {
            toast.success('Inspector Report v1.0 Uploaded to Admin Spoke');
            handlePhaseChange('final_submission');
            setIsSubmitModalOpen(false);
        }, 1500);
    };

    if (inquiryLoading) return <div className="p-8 text-center font-bold animate-pulse text-neutral-400">Synchronizing Trade Dynamics...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Job Info & Phases */}
            <div className="lg:col-span-4 space-y-6 flex flex-col h-full overflow-hidden">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-black tracking-tight">{inquiry?.product_name || 'Inquiry Details'}</h1>
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">{inquiry?.mineral_tag}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {activePhase.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Phase Tracker (Checklist) */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Milestone Dashboard</h2>
                    <div className="space-y-4">
                        {PHASES.map((phase, idx) => {
                            const isCompleted = PHASES.findIndex(p => p.id === activePhase) >= idx;
                            const isActive = activePhase === phase.id;

                            return (
                                <div
                                    key={phase.id}
                                    onClick={() => handlePhaseChange(phase.id)}
                                    className={`flex items-start gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer ${isActive ? 'border-neutral-900 bg-neutral-50' : isCompleted ? 'border-green-100 bg-green-50/20' : 'border-transparent opacity-40 grayscale'
                                        }`}
                                >
                                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-200'
                                        }`}>
                                        {isCompleted ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg> : null}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>{phase.label}</p>
                                        <p className="text-[10px] font-medium text-neutral-400 leading-tight">{phase.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="w-full h-14 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95"
                    >
                        Submit Final Report
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/30">
                        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Document Hub</h2>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-3">
                        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between group hover:border-neutral-200 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-neutral-800">Trade_Specifications.pdf</p>
                                    <p className="text-[10px] font-medium text-neutral-400 tracking-tight">System Generated • 2.4 MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Chat Spoke */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden h-full">
                <div className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center text-white font-black text-xs">AD</div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-800">Admin Live Support</h2>
                            <p className="text-[10px] font-medium text-neutral-400 tracking-tight flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Secure End-to-End Encryption
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 space-y-6 bg-neutral-50/20"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                            <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="font-bold text-neutral-800">Channel Initialized</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <MessageBox key={msg.id} message={msg as any} />
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-neutral-100">
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                        <button type="button" className="p-3 text-neutral-400 hover:text-neutral-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message to Admin..."
                            className="flex-1 h-14 px-6 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-medium outline-none focus:border-neutral-300 transition-all"
                        />
                        <button
                            type="submit"
                            className="h-14 px-8 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {/* Submission Modal Overlay */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-neutral-900 p-10 text-center space-y-4">
                            <h3 className="text-3xl font-black text-white tracking-tight">Final Submission</h3>
                            <p className="text-neutral-400 text-sm font-medium">Please attach your technical audit report to finalize this assignment.</p>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="border-4 border-dashed border-neutral-100 rounded-[30px] p-12 text-center space-y-4 hover:border-neutral-300 transition-all group cursor-pointer">
                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                                <p className="font-bold text-neutral-800">Drag Technical PDF here</p>
                                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Max File Size: 50MB</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitReport}
                                    className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest bg-neutral-900 text-white shadow-xl hover:bg-neutral-800 transition-all active:scale-95"
                                >
                                    Sync Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
