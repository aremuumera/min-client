"use client";

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Spinner } from '@/components/ui';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, ArrowsClockwise as ArrowsClockwiseIcon, FileText as FileTextIcon, ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react';
import { ChatContext } from '@/providers/chat-provider';
import { useApproveInspectionAndProceedMutation } from '@/redux/features/trade/trade_api';
import { toast } from 'sonner';
import RequestReinspectionModal from './modals/RequestReinspectionModal';
import { getErrorMessage } from '@/utils/helper';

interface BuyerInspectionDecisionPanelProps {
    thread: any;
}

export function BuyerInspectionDecisionPanel({ thread }: BuyerInspectionDecisionPanelProps) {
    const { activeInquiryId, roomInquiries } = React.useContext(ChatContext);
    const [approveAndProceed, { isLoading: isApproving }] = useApproveInspectionAndProceedMutation();
    const [showReinspectionModal, setShowReinspectionModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const activeInq = roomInquiries.find((i: any) => i.id === activeInquiryId);
    const tradeId = activeInquiryId || thread?.conversationId;
    const itemType = activeInq?.type === 'rfq_offer' ? 'rfq' : 'product';

    const handleApprove = async () => {
        try {
            await approveAndProceed({ tradeId, itemType }).unwrap();
            toast.success('Inspection approved! Trade advancing to Contract Negotiation.');
        } catch (err: any) {
            toast.error(getErrorMessage(err, 'Failed to approve inspection'));
        }
    };

    const handleCancelTrade = async () => {
        // Cancel trade uses the reject mechanism
        toast.info('Trade cancellation submitted. Min-meg Admin will finalize.');
        setShowCancelConfirm(false);
    };

    return (
        <>
            <Box className="p-3 sm:p-6 border-t border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white">
                <Card className="border-emerald-200 overflow-hidden">
                    <CardContent className="p-0">
                        {/* Header */}
                        <Box className="bg-emerald-600 p-3 sm:p-4 text-white flex items-center gap-2">
                            <ShieldCheckIcon size={20} weight="fill" className="shrink-0" />
                            <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white!">
                                Inspection Report Verified — Action Required
                            </Typography>
                        </Box>

                        <Box className="p-4 sm:p-6 space-y-4 bg-white">
                            {/* Info Card */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-medium leading-relaxed">
                                <FileTextIcon size={14} weight="fill" className="inline mr-1" />
                                Min-meg Admin has verified and released the inspection results for this trade.
                                Please review the lab data in the Document Vault and choose your next action:
                            </div>

                            {/* Action Buttons */}
                            {!showCancelConfirm ? (
                                <Stack spacing={2}>
                                    {/* Approve & Proceed */}
                                    <Button
                                        onClick={handleApprove}
                                        disabled={isApproving}
                                        className="w-full py-3 px-4 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-wider text-[11px] text-white"
                                        sx={{
                                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                                            }
                                        }}
                                    >
                                        {isApproving ? <Spinner size={16} color="text-white" /> : <CheckCircleIcon size={20} weight="bold" className="shrink-0" />}
                                        <span>{isApproving ? 'Processing...' : 'Approve & Proceed to Contract'}</span>
                                    </Button>

                                    {/* Request Re-Inspection */}
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowReinspectionModal(true)}
                                        className="w-full py-3 px-4 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-wider text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                                    >
                                        <ArrowsClockwiseIcon size={20} weight="bold" className="shrink-0" />
                                        <span>Request Re-Inspection</span>
                                    </Button>

                                    {/* Cancel Trade */}
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="w-full py-3 px-4 rounded-xl font-bold flex items-center gap-2 justify-center transition-all uppercase tracking-wider text-[11px] border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200"
                                    >
                                        <XCircleIcon size={20} weight="bold" className="shrink-0" />
                                        <span>Cancel Trade</span>
                                    </Button>
                                </Stack>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                        <Typography variant="subtitle2" className="font-bold text-red-800">
                                            Are you sure you want to cancel this trade?
                                        </Typography>
                                        <Typography variant="caption" className="block text-red-600 mt-1">
                                            This action will terminate the trade lifecycle. You can still create a new inquiry for the same product.
                                        </Typography>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outlined"
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider border-gray-200"
                                        >
                                            Go Back
                                        </Button>
                                        <Button
                                            onClick={handleCancelTrade}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-red-600 text-white hover:bg-red-700"
                                        >
                                            Confirm Cancellation
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Typography variant="caption" className="block text-center text-gray-400 font-medium text-[10px]">
                                Your decision will be communicated to Min-meg Admin and the Supplier in real-time.
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Re-Inspection Modal */}
            <RequestReinspectionModal
                isOpen={showReinspectionModal}
                onClose={() => setShowReinspectionModal(false)}
                tradeId={tradeId}
                itemType={itemType as 'product' | 'rfq'}
            />
        </>
    );
}
