"use client";

import React, { useState } from 'react';
import {
  useCancelInvoiceMutation,
  useGetInvoiceAgreementByIdQuery,
  useSubmitForInspectionMutation,
  useUpdateApprovalMutation,
} from '@/redux/features/invoice/invoice_api';
import {
  ArrowLeft as ArrowBackIcon,
  XCircle as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Clock as PendingIcon,
  Send as SendIcon,
  AlertTriangle as WarningIcon,
} from 'lucide-react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
} from '@/components/ui';
import { useMediaQuery } from '@/hooks/use-media-query';
import { EditIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';

import { dayjs } from '@/lib/dayjs';
import { useAlert } from '@/providers';

import { updateInvoiceStatusInChats } from '../chat/chat_service';
import { InvoiceAgreementModal } from './invoice_modal';
import { CancelInvoiceModal } from './cancel-invoice-modal';
import { cn } from '@/utils/helper';

// import { RejectInvoiceModal } from './reject_invoice_modal';

export function InvoiceDetailPage({ invoiceId: propInvoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const params = useParams();
  const invoiceId = propInvoiceId || (params?.invoiceId as string);
  const { user } = useSelector((state: any) => state.auth);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const { showAlert } = useAlert();
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmittings, setIsSubmitting] = useState(false);

  const { data: invoiceData, isLoading, error, refetch } = useGetInvoiceAgreementByIdQuery(invoiceId);
  const [updateApproval, { isLoading: isUpdating }] = useUpdateApprovalMutation();
  const [submitForInspection, { isLoading: isSubmitting }] = useSubmitForInspectionMutation();
  const [cancelInvoice, { isLoading: isCancelling }] = useCancelInvoiceMutation();

  const invoice = invoiceData?.data;

  console.log('params', params);

  // ============ DETERMINE ROLES ============

  // Get current user's approval
  const myApproval = invoice?.approvals?.find((a: any) => a.approvedByUserId === user.id);

  // Determine if current user is creator or receiver
  const isCreator = myApproval?.approvalStatus === 'APPROVED' && myApproval?.approvedAt;
  const isReceiver = myApproval?.approvalStatus === 'PENDING_APPROVAL' && !myApproval?.approvedAt;

  // Alternative method: Check createdBy field if available
  const isCreatorAlt = invoice?.createdBy === user.id;
  const isReceiverAlt = !isCreatorAlt;

  // Determine which method to use (prefer checking approval status)
  const userIsCreator = isCreator || isCreatorAlt;
  const userIsReceiver = isReceiver || isReceiverAlt;

  // Get the other party's approval (for displaying their status)
  const otherPartyApproval = invoice?.approvals?.find((a: any) => a.approvedByUserId !== user.id);

  // Check if both parties have approved
  const bothApproved = invoice?.approvals?.every((a: any) => a.approvalStatus === 'APPROVED');

  // Get current user's role and approval status
  const isBuyer = user.id === invoice?.buyerId;
  const isSupplier = user.id === invoice?.supplierId;
  //   const myApproval = invoice?.approvals?.find((approval) => approval.approvedByUserId === user.id);

  // Check if both parties have approved
  //   const bothApproved = invoice?.approvals?.every((a) => a.approvalStatus === 'APPROVED');

  // Check if user can edit (creator AND agreement is cancelled/rejected)
  const canEdit =
    userIsCreator &&
    (invoice?.status === 'CANCELLED' ||
      myApproval?.approvalStatus === 'REJECTED' ||
      otherPartyApproval?.approvalStatus === 'REJECTED');

  const handleApprove = async () => {
    try {
      const result = await updateApproval({
        id: invoiceId,
        approvalData: {
          approvalStatus: 'APPROVED',
        },
      }).unwrap();

      // 2. Update chat with the updated invoice data from server response
      if (result?.data && invoice.chatId) {
        try {
          await updateInvoiceStatusInChats(
            invoice.chatId, // conversationId
            invoice.id,
            result.data.status, // Get updated status from server
            {
              approvals: result.data.approvals, // Get updated approvals array
              approvedBy: user.id,
              approvedAt: new Date().toISOString(),
            }
          );
        } catch (chatError) {
          console.warn('Failed to update chat status:', chatError);
          // Don't fail the whole operation if chat update fails
        }
      }

      showAlert('Agreement approved successfully.', 'success');
      refetch();
    } catch (error) {
      showAlert('Failed to approve agreement. Please try again.', 'error');
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    setIsSubmittingReject(true);
    try {
      const result = await updateApproval({
        id: invoiceId,
        approvalData: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectComment || 'Rejected',
        },
      }).unwrap();

      console.log('Reject result:', result);

      if (result?.data && invoice.chatId) {
        try {
          await updateInvoiceStatusInChats(invoice.chatId, invoice.id, result.data.approval_status, {
            approvals: result.data.approvals,
            rejectedBy: user.id,
            rejectedAt: new Date().toISOString(),
            rejectionReason: result.data.reject_description,
          });
        } catch (chatError) {
          console.warn('Failed to update chat status:', chatError);
        }
      }
      setRejectDialogOpen(false);
      setIsSubmittingReject(false);
      setRejectComment('');
      showAlert('Agreement rejected successfully.', 'success');
      refetch();
    } catch (error: any) {
      setIsSubmittingReject(false);
      showAlert(`${error?.data?.message || 'Failed to reject agreement. Please try again.'}`, 'error');
      console.error('Failed to reject:', error);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleSubmitForInspection = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitForInspection(invoiceId).unwrap();

      // 2. Update chat with the updated invoice data from server response
      if (result?.data && invoice.chatId) {
        try {
          await updateInvoiceStatusInChats(
            invoice.chatId, // conversationId
            invoice.id,
            result.data.status, // Get updated status from server
            {
              approvals: result.data.approvals, // Get updated approvals array
              approvedBy: user.id,
              approvedAt: new Date().toISOString(),
            }
          );
          setIsSubmitting(false);
        } catch (chatError) {
          console.warn('Failed to update chat status:', chatError);
          // Don't fail the whole operation if chat update fails
        }
      }
      showAlert('Agreement submitted for inspection successfully.', 'success');
    } catch (error: any) {
      console.error('Failed to submit for inspection:', error);
      showAlert(`${error?.data?.message || 'Failed to submit for inspection. Please try again.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (reason: string) => {
    setIsSubmittingCancel(true);
    try {
      const result = await cancelInvoice({
        id: invoiceId,
        reason,
      }).unwrap();

      // 2. Update chat with the updated invoice data from server response
      if (result?.data && invoice.chatId) {
        try {
          await updateInvoiceStatusInChats(invoice.chatId, invoice.id, result.data.status, {
            approvals: result.data.approvals,
            approvedBy: user.id,
            approvedAt: new Date().toISOString(),
          });
          setIsSubmittingCancel(false);
          setCancelDialogOpen(false);
        } catch (chatError) {
          console.warn('Failed to update chat status:', chatError);
          // Don't fail the whole operation if chat update fails
        } finally {
          setIsSubmittingCancel(false);
        }
      }

      showAlert('Agreement cancelled successfully.', 'success');
      refetch();
    } catch (error: any) {
      showAlert(`${error?.data?.message || 'Failed to cancel agreement. Please try again.'}`, 'error');
      console.error('Failed to cancel:', error);
    }
  };

  // NEW: Handle edit - open modal with prefilled data
  const handleEdit = () => {
    setEditModalOpen(true);
  };

  // NEW: Handle successful update from modal
  const handleUpdateSuccess = () => {
    setEditModalOpen(false);
    showAlert('Agreement updated successfully!', 'success');
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'SUBMITTED_FOR_INSPECTION':
        return 'info';
      case 'INSPECTION_ASSIGNED':
        return 'info';
      case 'INSPECTION_COMPLETED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProgressStep = (status: string) => {
    switch (status) {
      case 'DRAFT':
      case 'PENDING_APPROVAL':
        return 0;
      case 'APPROVED':
        return 1;
      case 'SUBMITTED_FOR_INSPECTION':
        return 2;
      case 'INSPECTION_ASSIGNED':
        return 3;
      case 'INSPECTION_COMPLETED':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const steps = [
    'Approval Pending',
    'Approved',
    'Submitted for Inspection',
    'Inspection Assigned',
    'Inspection Complete',
    'Trade Complete',
  ];


  function renderActionButtons() {
    if (!invoice) return null;

    const { status } = invoice;

    if (canEdit) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <WarningIcon className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">
                Agreement {status === 'CANCELLED' ? 'Cancelled' : 'Rejected'}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                You can edit and resubmit this agreement with the necessary changes.
              </p>
            </div>
          </div>
          <Button
            variant="contained"
            fullWidth
            className="rounded-xl h-11 bg-green-600 hover:bg-green-700 font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-green-200"
            onClick={handleEdit}
          >
            <div className="flex items-center gap-2">
              <EditIcon size={16} />
              Edit & Resubmit Agreement
            </div>
          </Button>
        </div>
      );
    }

    // If cancelled or rejected, no actions
    if (status === 'CANCELLED' || status === 'REJECTED') {
      return (
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-3">
          <PendingIcon className="text-gray-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-gray-500 font-medium">
            This agreement has been {status.toLowerCase()}. No further actions available.
          </p>
        </div>
      );
    }

    // If completed or in inspection, no actions for users
    if (['COMPLETED', 'INSPECTION_COMPLETED', 'INSPECTION_ASSIGNED', 'SUBMITTED_FOR_INSPECTION'].includes(status)) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <PendingIcon className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-blue-600 font-medium leading-relaxed">
            This agreement is being processed. No further actions required from you.
          </p>
        </div>
      );
    }

    // RECEIVER can approve/reject when status is PENDING_APPROVAL
    if (userIsReceiver && status === 'PENDING_APPROVAL' && myApproval?.approvalStatus === 'PENDING_APPROVAL') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <WarningIcon className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">Action Required</p>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                You need to approve or reject this agreement before it can proceed.
              </p>
            </div>
          </div>

          <Button
            variant="contained"
            fullWidth
            className="rounded-xl h-11 bg-green-600 hover:bg-green-700 font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-green-200"
            onClick={handleApprove}
            disabled={isUpdating}
          >
            <div className="flex items-center gap-2">
              {isUpdating ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon size={16} />}
              {isUpdating ? 'Approving...' : 'Approve Agreement'}
            </div>
          </Button>

          <Button
            variant="outlined"
            fullWidth
            className="rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold uppercase tracking-wider text-[11px] transition-all"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isUpdating}
          >
            <div className="flex items-center gap-2">
              <CancelIcon size={16} />
              Reject Agreement
            </div>
          </Button>
        </div>
      );
    }

    // CREATOR can cancel when status is PENDING_APPROVAL (waiting for receiver)
    if (userIsCreator && status === 'PENDING_APPROVAL') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <PendingIcon className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Waiting for Approval</p>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Waiting for the other party to approve or reject this agreement.
              </p>
            </div>
          </div>

          <Button
            variant="outlined"
            fullWidth
            className="rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold uppercase tracking-wider text-[11px] transition-all"
            onClick={() => setCancelDialogOpen(true)}
            disabled={isCancelling}
          >
            <div className="flex items-center gap-2">
              {isCancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon size={16} />}
              {isCancelling ? 'Cancelling...' : 'Cancel Agreement'}
            </div>
          </Button>
        </div>
      );
    }

    // BOTH PARTIES can submit for inspection when status is APPROVED
    if (status === 'APPROVED' && bothApproved) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
            <CheckCircleIcon className="text-green-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-green-900 uppercase tracking-tight">Ready for Inspection</p>
              <p className="text-xs text-green-800 leading-relaxed font-medium">
                Both parties have approved. You can now submit for inspection.
              </p>
            </div>
          </div>

          <Button
            variant="contained"
            fullWidth
            className="rounded-xl h-11 bg-green-600 hover:bg-green-700 font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-green-200"
            onClick={handleSubmitForInspection}
            disabled={isSubmitting || isSubmittings}
          >
            <div className="flex items-center gap-2">
              {isSubmitting || isSubmittings ? <CircularProgress size={16} color="inherit" /> : <SendIcon size={16} />}
              {isSubmitting || isSubmittings ? 'Submitting...' : 'Submit for Inspection'}
            </div>
          </Button>
        </div>
      );
    }

    // BOTH PARTIES can cancel in DRAFT status
    if (status === 'DRAFT') {
      return (
        <Button
          variant="outlined"
          fullWidth
          className="rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold uppercase tracking-wider text-[11px] transition-all"
          onClick={() => setCancelDialogOpen(true)}
          disabled={isCancelling}
        >
          <div className="flex items-center gap-2">
            {isCancelling ? <CircularProgress size={16} color="inherit" /> : <CancelIcon size={16} />}
            {isCancelling ? 'Cancelling...' : 'Cancel Agreement'}
          </div>
        </Button>
      );
    }

    return (
      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
        <p className="text-sm text-gray-500 font-medium">No actions available at this time.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <CircularProgress size={40} className="text-green-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CancelIcon className="text-red-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load invoice</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We encountered an error while fetching the trade agreement details. Please try again or contact support.
        </p>
        <Button
          onClick={() => refetch()}
          className="rounded-xl px-8 h-12 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard/invoices')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowBackIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Invoices
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Trade Agreement</h1>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              ID: {invoice.id}
            </p>
          </div>

          <div className={cn(
            "inline-flex px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border shadow-sm",
            invoice.status === 'APPROVED' || invoice.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-100" :
              invoice.status === 'PENDING_APPROVAL' ? "bg-amber-50 text-amber-700 border-amber-100" :
                invoice.status === 'CANCELLED' || invoice.status === 'REJECTED' ? "bg-red-50 text-red-700 border-red-100" :
                  "bg-gray-50 text-gray-700 border-gray-100"
          )}>
            {invoice.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {invoice.status !== 'CANCELLED' && (
        <Card outlined className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="relative">
              {/* Horizontal Connector (Desktop) */}
              <div className="hidden md:block absolute top-[18px] left-0 w-full h-0.5 bg-gray-100 z-0" />
              <div
                className="hidden md:block absolute top-[18px] left-0 h-0.5 bg-green-500 transition-all duration-1000 z-0"
                style={{ width: `${(getProgressStep(invoice.status) / (steps.length - 1)) * 100}%` }}
              />

              {/* Vertical Connector (Mobile) */}
              <div className="md:hidden absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-100 z-0 my-4" />

              <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-4">
                {steps.map((label, idx) => {
                  const active = idx <= getProgressStep(invoice.status);
                  const current = idx === getProgressStep(invoice.status);

                  return (
                    <div key={label} className="flex flex-row md:flex-col items-center gap-4 md:gap-3 z-10">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-2 bg-white",
                        active ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" : "border-gray-200 text-gray-400"
                      )}>
                        {active ? <CheckCircleIcon size={18} /> : idx + 1}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 text-left md:text-center",
                        active ? "text-green-600" : "text-gray-400",
                        current && "text-gray-900 md:border-b-2 md:border-green-500 md:pb-1"
                      )}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NEW: Rejection/Cancellation Reason Card */}
      {(() => {
        const rejectedApproval = invoice.approvals?.find((a: any) => a.approvalStatus === 'REJECTED');
        const isCancelled = invoice.status === 'CANCELLED';
        const isRejected = !!rejectedApproval;

        if (isCancelled || isRejected) {
          return (
            <Card outlined className={cn(
              "border-l-4",
              isRejected ? "border-l-red-500 bg-red-50/30" : "border-l-amber-500 bg-amber-50/30"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CancelIcon className={isRejected ? "text-red-600" : "text-amber-600"} size={20} />
                  <h3 className={cn("text-lg font-bold", isRejected ? "text-red-900" : "text-amber-900")}>
                    {isRejected ? `${rejectedApproval.approvedByRole} Rejected` : 'Agreement Cancelled'}
                  </h3>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider italic">
                    {isRejected ? 'Reason for rejection' : 'Cancellation reason'}:
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-xl border border-gray-100/50">
                    {isRejected ? rejectedApproval.rejectionReason : invoice.cancelled_reason}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Action Alerts */}
      {invoice.status === 'PENDING_APPROVAL' && myApproval?.approvalStatus === 'PENDING' && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
          <WarningIcon className="text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">Action Required</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              This agreement requires your approval before it can proceed to inspection.
            </p>
          </div>
        </div>
      )}

      {bothApproved && invoice.status === 'APPROVED' && (
        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-4">
          <CheckCircleIcon className="text-green-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-green-900 uppercase tracking-tight">Ready for Inspection</h4>
            <p className="text-sm text-green-800 leading-relaxed">
              Both parties have approved this agreement. You can now submit it to MIMEI for inspection assignment.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Product Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Name</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{invoice.productName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</p>
                  <p className="text-sm font-medium text-gray-600">{invoice.productCategory}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</p>
                  <p className="text-sm font-bold text-gray-900">{invoice.quantity} {invoice.unitType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price</p>
                  <p className="text-sm font-bold text-gray-900">
                    <span className="text-gray-400 mr-0.5">{invoice.currency === 'USD' ? '$' : '₦'}</span>
                    {invoice.unitPrice.toLocaleString() || 0.00}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Trade Terms
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trade Type</p>
                  <div className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                    {invoice.tradeType} {invoice.tradeType === 'LOCAL' ? '(Within Nigeria)' : ''}
                  </div>
                </div>
                {invoice.incoterm && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Incoterm</p>
                    <p className="text-sm font-medium text-gray-600 italic">{invoice.incoterm}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Inspection Details
              </h3>
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sampling Location</p>
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 italic">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{invoice.samplingAddress}</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tight">
                      {invoice.samplingLGA}, {invoice.samplingState}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Required Grade</p>
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-green-600">{invoice.agreedGradePercentage}%</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase italic">Minimum</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspection Contact</p>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-gray-900">{invoice.inspectionContactName}</p>
                      <p className="text-xs font-mono text-gray-500">{invoice.inspectionContactDialCode} {invoice.inspectionContactPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Parties Involved
              </h3>
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Supplier</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{invoice.supplier?.company_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 font-medium">{invoice.supplier?.first_name} {invoice.supplier?.last_name} {isSupplier && <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">You</span>}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Buyer
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{invoice.buyer?.company_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 font-medium">{invoice.buyer?.first_name} {invoice.buyer?.last_name} {isBuyer && <span className="ml-2 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">You</span>}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Approval Flow
              </h3>
              <div className="space-y-4">
                {invoice.approvals?.map((approval: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                      approval.approvalStatus === 'APPROVED' ? "border-green-500 bg-green-50 text-green-600" :
                        approval.approvalStatus === 'REJECTED' ? "border-red-500 bg-red-50 text-red-600" :
                          "border-gray-200 bg-gray-50 text-gray-400"
                    )}>
                      {approval.approvalStatus === 'APPROVED' ? <CheckCircleIcon size={14} /> :
                        approval.approvalStatus === 'REJECTED' ? <CancelIcon size={14} /> :
                          <PendingIcon size={14} />}
                    </div>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{approval.approvedByRole}</p>
                        <div className={cn(
                          "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase",
                          approval.approvalStatus === 'APPROVED' ? "bg-green-100 text-green-700" :
                            approval.approvalStatus === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {approval.approvalStatus}
                        </div>
                      </div>
                      {approval.comments && <p className="text-xs text-gray-500 italic leading-snug">"{approval.comments}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {renderActionButtons()}
                {invoice.chatId && (
                  <Button
                    variant="outlined"
                    fullWidth
                    className="rounded-xl h-11 border-gray-200 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all font-primary uppercase tracking-wider text-[11px]"
                    onClick={() => router.push(`/dashboard/chat/product/${invoice.chatId}/${invoice.id}`)}
                  >
                    View in Chat
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card outlined>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                Agreement History
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created</p>
                  <p className="text-xs font-bold text-gray-700">{dayjs(invoice.createdAt).format('MMM D, YYYY')}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Modified</p>
                  <p className="text-xs font-bold text-gray-700">{dayjs(invoice.updatedAt).fromNow()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle className="p-6 flex items-center gap-2 border-b border-gray-100">
          <CancelIcon className="text-red-500" />
          <span className="text-lg font-bold text-gray-900">Reject Trade Agreement</span>
        </DialogTitle>
        <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
          <WarningIcon className="text-amber-500 shrink-0" size={18} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-900">Important Information</p>
            <ul className="text-[11px] text-amber-800 list-disc pl-4 space-y-0.5 font-medium leading-tight">
              <li>Immediately cancels the agreement</li>
              <li>Notifies the other party</li>
              <li>Records your reason permanently</li>
              <li>Prevents submission for inspection</li>
            </ul>
          </div>
        </div>
        <DialogContent className="p-6">
          <p className="text-sm text-gray-500 mb-4 font-medium">Please provide a reason for rejecting this agreement:</p>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your reason..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            className="rounded-xl"
          />
        </DialogContent>
        <DialogActions className="p-6 bg-gray-50/50 border-t border-gray-100 gap-3">
          <Button onClick={() => setRejectDialogOpen(false)} className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={isUpdating || !rejectComment.trim()}
            className="rounded-xl h-10 px-6 font-bold shadow-none"
          >
            {isUpdating || isSubmittingReject ? <CircularProgress size={20} color="inherit" /> : 'Reject Agreement'}
          </Button>
        </DialogActions>
      </Dialog>

      <CancelInvoiceModal
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        invoiceId={invoiceId}
      />

      {editModalOpen && (
        <InvoiceAgreementModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          thread={{
            conversationId: invoice.chatId,
            currentOtherUserName: isBuyer ? invoice.supplier?.full_name : invoice.buyer?.full_name,
            currentOtherUserCompanyName: isBuyer ? invoice.supplier?.company_name : invoice.buyer?.company_name,
            itemTitle: invoice.productName,
            otherUserId: isBuyer ? invoice.supplierId : invoice.buyerId,
          }}
          existingInvoice={invoice}
          isEditMode={true}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
