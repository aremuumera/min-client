'use client';

import * as React from 'react';
import { Box, Button, Stack, Typography, Card, CardContent, Spinner } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, Info as InfoIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import { ChatContext } from '@/providers/chat-provider';

interface ActionPanelProps {
    thread?: any;
}

export function ActionPanel({ thread }: ActionPanelProps) {
    if (thread?.metadata?.status === 'rejected') {
        return (
            <Box className="p-3 sm:p-6 border-t border-red-100 bg-red-50/30">
                <Card className="border-red-200 overflow-hidden">
                    <CardContent className="p-0">
                        <Box className="bg-red-600 p-3 sm:p-4 text-white flex items-center gap-2">
                            <XCircleIcon size={20} weight="fill" className="shrink-0" />
                            <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white!">
                                Trade Inquiry Declined
                            </Typography>
                        </Box>
                        <Box className="p-4 sm:p-6 space-y-4 bg-white text-center">
                            <Typography variant="h6" className="font-black text-gray-900 leading-snug break-words">
                                This inquiry has been declined
                            </Typography>
                            {thread?.metadata?.rejection_reason && (
                                <Box className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 text-left">
                                    <Typography variant="caption" className="block text-gray-400 uppercase font-bold mb-1">Reason provided:</Typography>
                                    <Typography variant="body2" className="text-gray-600 font-medium italic break-words">
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

    return null;
}

interface SupplierPendingActionBannerProps {
    thread?: any;
    activeInquiry?: any;
}

export function SupplierPendingActionBanner({ thread, activeInquiry }: SupplierPendingActionBannerProps) {
    const { acknowledgeTrade, rejectTrade, activeInquiryId } = React.useContext(ChatContext);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [showRejectForm, setShowRejectForm] = React.useState(false);

    const targetInquiryId = activeInquiry?.id || activeInquiryId || thread?.conversationId;

    const handleAcknowledge = async () => {
        if (!targetInquiryId) return;
        setIsSubmitting(true);
        try {
            await acknowledgeTrade(targetInquiryId);
        } catch (error) {
            console.error('Failed to acknowledge:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!targetInquiryId || !rejectionReason.trim()) return;
        setIsSubmitting(true);
        try {
            await rejectTrade(targetInquiryId, rejectionReason);
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box className="border-b border-emerald-200 bg-emerald-50/50 p-3 sm:p-4 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                {/* Left info */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <InfoIcon size={18} weight="fill" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Action Required: Pending Acknowledgment
                            </span>
                            {activeInquiry?.quantity && (
                                <span className="text-[11px] font-semibold text-gray-600">
                                    Qty: {activeInquiry.quantity} {activeInquiry.measure_type || 'MT'}
                                </span>
                            )}
                        </div>
                        <Typography variant="subtitle2" className="font-black text-gray-900 leading-snug truncate text-sm sm:text-base">
                            {thread.itemTitle || activeInquiry?.product_name || 'Mineral Trade Inquiry'}
                        </Typography>
                        <p className="text-xs text-gray-600 italic line-clamp-1 mt-0.5">
                            &quot;{thread.metadata?.description || activeInquiry?.description || 'Buyer initiated a trade inquiry for this product.'}&quot;
                        </p>
                    </div>
                </div>

                {/* Right buttons */}
                {!showRejectForm ? (
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center w-full sm:w-auto">
                        <Button
                            variant="outlined"
                            onClick={() => setShowRejectForm(true)}
                            disabled={isSubmitting}
                            className="border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center transition-all uppercase tracking-wider text-[10px] flex-1 sm:flex-initial"
                        >
                            Decline
                        </Button>
                        <Button
                            onClick={handleAcknowledge}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3.5 rounded-lg font-bold flex items-center justify-center transition-all uppercase tracking-wider text-[10px] flex-1 sm:flex-initial"
                        >
                            {isSubmitting ? <Spinner size={12} color="text-white" /> : 'Acknowledge & Accept'}
                        </Button>
                    </div>
                ) : null}
            </div>

            {/* Decline Reason Form */}
            {showRejectForm && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                    <Stack spacing={2}>
                        <div className="space-y-1">
                            <Typography variant="caption" className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                                Reason for declining inquiry
                            </Typography>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Out of stock, pricing or specification mismatch..."
                                className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all outline-none text-xs min-h-[60px] bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                            <Button
                                variant="outlined"
                                onClick={() => setShowRejectForm(false)}
                                disabled={isSubmitting}
                                className="border-gray-300 text-gray-600 hover:bg-gray-100 py-1 px-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReject}
                                disabled={isSubmitting || !rejectionReason.trim()}
                                className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg font-bold uppercase tracking-wider text-[10px] flex items-center"
                            >
                                {isSubmitting ? <Spinner size={12} color="text-white" /> : 'Confirm Decline'}
                            </Button>
                        </div>
                    </Stack>
                </div>
            )}
        </Box>
    );
}
