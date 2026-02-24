'use client';

import * as React from 'react';
import { Box, Button, Stack, Typography, Card, CardContent } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, Info as InfoIcon } from '@phosphor-icons/react';
import { ChatContext } from '@/providers/chat-provider';

interface ActionPanelProps {
    thread: any;
}

export function ActionPanel({ thread }: ActionPanelProps) {
    const { acknowledgeTrade, rejectTrade } = React.useContext(ChatContext);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [showRejectForm, setShowRejectForm] = React.useState(false);

    const handleAcknowledge = async () => {
        setIsSubmitting(true);
        try {
            await acknowledgeTrade(thread.conversationId);
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
            await rejectTrade(thread.conversationId, rejectionReason);
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box className="p-6 border-t border-emerald-100 bg-emerald-50/30">
            <Card className="border-emerald-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Box className="bg-emerald-600 p-4 text-white flex items-center gap-2">
                        <InfoIcon size={20} weight="fill" />
                        <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px]">
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
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-6 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    <CheckCircleIcon size={20} weight="bold" />
                                    Acknowledge & Start Chat
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={isSubmitting}
                                    className="border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-6 rounded-xl font-bold flex items-center gap-2 transition-all uppercase tracking-widest text-xs"
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
                                        disabled={isSubmitting || !rejectionReason.trim()}
                                        className="bg-red-600 hover:bg-red-700 text-white flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
                                    >
                                        Confirm Decline
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowRejectForm(false)}
                                        disabled={isSubmitting}
                                        className="text-gray-400 hover:bg-gray-50 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
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
