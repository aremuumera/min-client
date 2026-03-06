'use client';

import * as React from 'react';
import { Box, Button, Stack, Typography, Card, CardContent, Spinner } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';
import { ChatContext } from '@/providers/chat-provider';
import { toast } from 'sonner';

interface InspectorActionPanelProps {
    thread: any;
}

export function InspectorActionPanel({ thread }: InspectorActionPanelProps) {
    const { roomInquiries, activeInquiryId } = React.useContext(ChatContext);
    const [updateStatus, { isLoading: isSubmitting }] = useUpdateAssignmentStatusMutation();
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [showRejectForm, setShowRejectForm] = React.useState(false);
    console.log("roomInquiries", roomInquiries, thread);
    // Get active cycle metadata
    const activeCycle = roomInquiries.find(i => i.id === activeInquiryId) || {};

    // Assignment ID is generated from MySQL assignment ID and stored in the trade sub-doc (activeCycle)
    const assignmentId = activeCycle.inspector_assignment_id || thread.metadata?.inspector_assignment_id;
    // Check status from either root or active cycle
    const status = activeCycle.inspector_status || activeCycle.status || thread.metadata?.status;

    const handleAccept = async () => {
        if (!assignmentId) {
            toast.error("Assignment ID not found. Please contact support.");
            return;
        }

        try {
            await updateStatus({
                id: assignmentId,
                status: 'ACCEPTED',
                notes: 'Accepted via chat dashboard.'
            }).unwrap();
            toast.success("Assignment accepted successfully");
        } catch (error: any) {
            console.error('Failed to accept:', error);
            toast.error(error?.data?.message || 'Failed to accept assignment');
        }
    };

    const handleDecline = async () => {
        if (!rejectionReason.trim()) return;
        if (!assignmentId) {
            toast.error("Assignment ID not found. Please contact support.");
            return;
        }

        try {
            await updateStatus({
                id: assignmentId,
                status: 'DECLINED',
                notes: rejectionReason
            }).unwrap();
            toast.success("Assignment declined successfully");
        } catch (error: any) {
            console.error('Failed to decline:', error);
            toast.error(error?.data?.message || 'Failed to decline assignment');
        }
    };

    if (status === 'DECLINED' || status === 'REPLACED' || status === 'REVOKED') {
        return (
            <Box className="p-6 border-t border-red-100 bg-red-50/30">
                <Card className="border-red-200 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <Box className="bg-red-600 p-4 text-white flex items-center gap-2">
                            <XCircleIcon size={20} weight="fill" />
                            <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white!">
                                Assignment {status}
                            </Typography>
                        </Box>
                        <Box className="p-6 space-y-4 bg-white text-center">
                            <Typography variant="h6" className="font-black text-gray-900">
                                This inspection assignment has been closed.
                            </Typography>
                            <Typography variant="caption" className="block text-gray-400">
                                You are no longer the active inspector for this trade cycle.
                                <br />You can still view the chat history for your records.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (status === 'ACCEPTED' || status === 'SITE_VISIT' || status === 'COMPLETED') {
        return null; // Don't block the chat after acceptance
    }

    return (
        <Box className="p-3 border-t border-green-100 bg-green-50/30">
            <Card className="border-green-200 overflow-hidden shadow-sm">
                <CardContent className="p-0">
                    <Box className="bg-green-600 px-4 py-2 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MagnifyingGlassIcon size={16} weight="fill" />
                            <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[10px] text-white!">
                                New Inspection Assignment
                            </Typography>
                        </div>
                    </Box>
                    <Box className="p-4 space-y-4 bg-white">
                        <div className="flex justify-between items-start gap-4">
                            <Stack spacing={0.5} className="flex-1">
                                <Typography variant="subtitle1" className="font-black text-gray-900 leading-tight">
                                    {thread.itemTitle || 'Trade Inspection'}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500 italic line-clamp-1">
                                    &quot;{thread.metadata?.description || 'You have been selected for this trade.'}&quot;
                                </Typography>
                            </Stack>
                        </div>

                        {!showRejectForm ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleAccept}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 py-3 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-green-100"
                                    sx={{
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                        }
                                    }}
                                >
                                    {isSubmitting ? <Spinner size={16} color="text-white" /> : <CheckCircleIcon size={20} weight="bold" />}
                                    {isSubmitting ? 'Accepting...' : 'Accept Job'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={isSubmitting}
                                    className="border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-3 px-6 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-widest text-[11px]"
                                >
                                    <XCircleIcon size={20} weight="bold" />
                                    Decline
                                </Button>
                            </Stack>
                        ) : (
                            <Stack spacing={2}>
                                <Box className="space-y-1">
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Reason for declining..."
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all outline-none text-xs min-h-[60px]"
                                    />
                                </Box>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        onClick={handleDecline}
                                        variant="outlined"
                                        disabled={isSubmitting || !rejectionReason.trim()}
                                        className="bg-red-600 hover:bg-red-700 text-white flex-1 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Spinner size={16} color="text-white" /> : <XCircleIcon size={16} weight="bold" />}
                                        {isSubmitting ? 'Declining...' : 'Confirm'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowRejectForm(false)}
                                        disabled={isSubmitting}
                                        className="border-gray-200 py-2 px-4 rounded-lg font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        Back
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                        <Typography variant="caption" className="block text-center text-gray-400 font-medium">
                            The Trade Admin will be notified of your decision immediately.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
