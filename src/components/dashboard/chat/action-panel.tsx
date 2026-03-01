'use client';

import * as React from 'react';
import { Box, Button, Stack, Typography, Card, CardContent, Spinner } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, Info as InfoIcon } from '@phosphor-icons/react';
import { ChatContext } from '@/providers/chat-provider';

interface ActionPanelProps {
    thread: any;
}

export function ActionPanel({ thread }: ActionPanelProps) {
    const { acknowledgeTrade, rejectTrade, activeInquiryId } = React.useContext(ChatContext);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [showRejectForm, setShowRejectForm] = React.useState(false);

    const handleAcknowledge = async () => {
        setIsSubmitting(true);
        try {
            await acknowledgeTrade(activeInquiryId || thread.conversationId);
        } catch (error) {
            console.error('Failed to acknowledge:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) return;
        setIsSubmitting(true);
        try {
            await rejectTrade(activeInquiryId || thread.conversationId, rejectionReason);
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (thread.metadata?.status === 'rejected') {
        return (
            <Box className="p-6 border-t border-red-100 bg-red-50/30">
                <Card className="border-red-200 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <Box className="bg-red-600 p-4 text-white flex items-center gap-2">
                            <XCircleIcon size={20} weight="fill" />
                            <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white!">
                                Trade Inquiry Declined
                            </Typography>
                        </Box>
                        <Box className="p-6 space-y-4 bg-white text-center">
                            <Typography variant="h6" className="font-black text-gray-900">
                                This inquiry has been declined
                            </Typography>
                            {thread.metadata?.rejection_reason && (
                                <Box className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                                    <Typography variant="caption" className="block text-gray-400 uppercase font-bold mb-1">Reason provided:</Typography>
                                    <Typography variant="body2" className="text-gray-600 font-medium italic">
                                        &quot;{thread.metadata.rejection_reason}&quot;
                                    </Typography>
                                </Box>
                            )}
                            <Typography variant="caption" className="block text-gray-400">
                                No further messages can be sent for this specific trade cycle.
                                <br />You can still view the chat history for your records.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box className="p-6 border-t border-emerald-100 bg-emerald-50/30">
            <Card className="border-emerald-200 overflow-hidden">
                <CardContent className="p-0">
                    <Box className="bg-emerald-600 p-4 text-white flex items-center gap-2">
                        <InfoIcon size={20} weight="fill" />
                        <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white!">
                            New Multi-Mineral Trade Inquiry
                        </Typography>
                    </Box>
                    <Box className="p-6 space-y-6 bg-white">
                        <Stack spacing={1}>
                            <Typography variant="h5" className="font-black text-gray-900">
                                {thread.itemTitle || 'Trade Inquiry'}
                            </Typography>
                            <Typography variant="body2" className="text-gray-500 italic">
                                &quot;{thread.metadata?.description || 'Buyer is interested in establishing a trade relationship for this item.'}&quot;
                            </Typography>
                        </Stack>

                        {!showRejectForm ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleAcknowledge}
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-3 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-widest text-xs"
                                >
                                    {isSubmitting ? <Spinner size={20} color="text-white" /> : <CheckCircleIcon size={20} weight="bold" />}
                                    {isSubmitting ? 'Processing...' : 'Acknowledge & Start Chat'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={isSubmitting}
                                    className="border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-3 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-widest text-xs"
                                >
                                    <XCircleIcon size={20} weight="bold" />
                                    Decline
                                </Button>
                            </Stack>
                        ) : (
                            <Stack spacing={3} className="pt-2">
                                <Box className="space-y-2">
                                    <Typography variant="caption" className="font-bold text-gray-400 uppercase tracking-tighter">
                                        Reason for declining
                                    </Typography>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g., Out of stock, price mismatch..."
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all outline-none text-sm min-h-[100px]"
                                    />
                                </Box>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        onClick={handleReject}
                                        variant="outlined"
                                        disabled={isSubmitting || !rejectionReason.trim()}
                                        className="bg-red-600 hover:bg-red-700 text-white flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Spinner size={20} color="text-white" /> : <XCircleIcon size={20} weight="bold" />}
                                        {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowRejectForm(false)}
                                        disabled={isSubmitting}
                                        className="border-gray-200 py-3 px-6 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Back
                                    </Button>
                                </Stack>
                            </Stack>
                        )}

                        <Typography variant="caption" className="block text-center text-gray-400 font-medium">
                            The trade desk will be notified of your decision immediately.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
