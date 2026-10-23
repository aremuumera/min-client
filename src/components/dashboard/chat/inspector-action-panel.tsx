'use client';

import * as React from 'react';
import { Box, Button, Stack, Typography, Card, CardContent, Spinner } from '@/components/ui';
import { 
  CheckCircle as CheckCircleIcon, 
  XCircle as XCircleIcon, 
  MagnifyingGlass as MagnifyingGlassIcon,
  Check as CheckIcon,
  X as XIcon,
  WarningCircle as WarningCircleIcon
} from '@phosphor-icons/react';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';
import { ChatContext } from '@/providers/chat-provider';
import { toast } from 'sonner';

interface InspectorActionPanelProps {
  thread: any;
}

export function InspectorActionPanel({ thread }: InspectorActionPanelProps) {
  const { roomInquiries, activeInquiryId } = React.useContext(ChatContext);
  const [updateStatus, { isLoading: isSubmitting }] = useUpdateAssignmentStatusMutation();
  const [showAcceptModal, setShowAcceptModal] = React.useState(false);
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  // Get active cycle metadata
  const activeCycle = roomInquiries.find((i: any) => i.id === activeInquiryId) || {};

  // Assignment ID is stored in the trade sub-doc (activeCycle) or root metadata
  const assignmentId = activeCycle.inspector_assignment_id || thread?.metadata?.inspector_assignment_id;
  const status = (activeCycle.inspector_status || activeCycle.status || thread?.metadata?.status || '').toUpperCase();

  const handleConfirmAccept = async () => {
    if (!assignmentId) {
      toast.error('Assignment ID not found. Please contact support.');
      return;
    }

    try {
      await updateStatus({
        id: assignmentId,
        status: 'ACCEPTED',
      }).unwrap();
      toast.success('Inspection assignment accepted successfully!');
      setShowAcceptModal(false);
    } catch (error: any) {
      console.error('Failed to accept:', error);
      toast.error(error?.data?.message || 'Failed to accept assignment');
    }
  };

  const handleDecline = async () => {
    if (!rejectionReason.trim()) return;
    if (!assignmentId) {
      toast.error('Assignment ID not found. Please contact support.');
      return;
    }

    try {
      await updateStatus({
        id: assignmentId,
        status: 'DECLINED',
        notes: rejectionReason.trim(),
      }).unwrap();
      toast.success('Inspection assignment declined');
      setShowRejectForm(false);
    } catch (error: any) {
      console.error('Failed to decline:', error);
      toast.error(error?.data?.message || 'Failed to decline assignment');
    }
  };

  // State: Assignment Declined / Replaced / Revoked
  if (['DECLINED', 'REPLACED', 'REVOKED'].includes(status)) {
    return (
      <Box className="p-3 sm:p-6 border-t border-red-100 bg-red-50/30">
        <Card className="border-red-200 overflow-hidden shadow-none">
          <CardContent className="p-0">
            <Box className="bg-red-600 p-3 sm:p-4 text-white flex items-center gap-2">
              <XCircleIcon size={20} weight="fill" className="shrink-0" />
              <Typography variant="subtitle2" className="font-bold uppercase tracking-wider text-[11px] text-white">
                Assignment {status}
              </Typography>
            </Box>
            <Box className="p-4 sm:p-6 space-y-4 bg-white text-center">
              <Typography variant="h6" className="font-black text-gray-900 leading-snug break-words">
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

  // State: Report Submitted (Awaiting Admin Release)
  if (['INSPECTION_COMPLETED', 'COMPLETED'].includes(status)) {
    const roundNumber = activeCycle.round_number || thread?.metadata?.round_number || 1;
    return (
      <Box className="p-3 sm:p-4 border-t border-emerald-100 bg-emerald-50/50">
        <div className="bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-between shadow-none">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={18} weight="fill" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Inspection Report Submitted (Round {roundNumber})
            </span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-700 px-2 py-0.5 rounded text-emerald-100 uppercase">
            Awaiting Admin Release
          </span>
        </div>
      </Box>
    );
  }

  // State: Active inspection execution — don't block the chat
  if (['ACCEPTED', 'SCHEDULED', 'INSPECTION_SCHEDULED', 'INSPECTION_FEE_PAID', 'SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING'].includes(status)) {
    return null;
  }

  // State: Initial Assignment (Pending Acceptance)
  const roundNumber = activeCycle.round_number || thread?.metadata?.round_number || 1;
  const reinspectionReason = activeCycle.reinspection_reason || thread?.metadata?.reinspection_reason;
  const isReinspection = roundNumber > 1 || Boolean(reinspectionReason);

  return (
    <>
      <Box className="border-b border-emerald-200 bg-emerald-50/50 p-3 sm:p-4 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <MagnifyingGlassIcon size={18} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {isReinspection ? `Re-Inspection Assignment (Round ${roundNumber})` : 'New Inspection Assignment'}
                </span>
              </div>
              <Typography variant="subtitle2" className="font-black text-gray-900 leading-snug truncate text-sm sm:text-base">
                {thread?.itemTitle || 'Mineral Trade Inspection'}
              </Typography>
              {reinspectionReason ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-1.5 mt-1">
                  Scope: &quot;{reinspectionReason}&quot;
                </p>
              ) : (
                <p className="text-xs text-gray-600 italic line-clamp-1 mt-0.5">
                  &quot;{thread?.metadata?.description || 'You have been appointed as the official inspector for this trade.'}&quot;
                </p>
              )}
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
                onClick={() => setShowAcceptModal(true)}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3.5 rounded-lg font-bold flex items-center justify-center transition-all uppercase tracking-wider text-[10px] flex-1 sm:flex-initial gap-1.5"
              >
                <CheckIcon size={14} weight="bold" />
                Accept Job
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
                  Reason for declining assignment
                </Typography>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, outside operational region..."
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
                  onClick={handleDecline}
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

      {/* Confirmation Action Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-none animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircleIcon size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Accept Inspection Assignment</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Confirm your acceptance for this trade</p>
                </div>
              </div>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-gray-700">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
                <WarningCircleIcon size={20} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Please ensure you have reviewed and signed the inspection document sent to your trade room before accepting this job.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/80">
              <Button
                variant="outlined"
                onClick={() => setShowAcceptModal(false)}
                disabled={isSubmitting}
                className="border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAccept}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5"
              >
                {isSubmitting ? <Spinner size={14} color="text-white" /> : <CheckIcon size={14} weight="bold" />}
                Confirm & Accept Job
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
