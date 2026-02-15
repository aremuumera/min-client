import React from 'react';
import { useUpdateApprovalMutation } from '@/redux/features/invoice/invoice_api';
import { formatDate } from '@/utils/helper';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/divider';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux';
import {
  MdCheckCircle as CheckCircleIcon,
  MdPending as PendingIcon,
  MdCancel as CancelIcon,
  MdInfo as InfoIcon,
  MdDescription as DescriptionIcon
} from 'react-icons/md';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/utils/helper';

interface Approval {
  approvedByUserId: string;
  approvedByRole: string;
  approvalStatus: string;
}

interface Invoice {
  id: string;
  buyerId: string;
  supplierId: string;
  status: string;
  productName: string;
  quantity: number | string;
  unitType: string;
  unitPrice: number | string;
  currency: string;
  tradeType: string;
  incoterm?: string;
  agreedGradePercentage: number | string;
  samplingAddress: string;
  samplingLGA: string;
  samplingState: string;
  inspectionContactName: string;
  inspectionContactDialCode: string;
  inspectionContactPhone: string;
  approvals?: Approval[];
}

interface InvoiceMessageCardProps {
  invoice: Invoice;
  position?: 'left' | 'right';
}

/**
 * Special message card that displays invoice agreements in chat
 * Similar to WhatsApp's order/payment cards
 */
export function InvoiceMessageCard({ invoice, position = 'left' }: InvoiceMessageCardProps) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [updateApproval, { isLoading }] = useUpdateApprovalMutation();

  // Determine if current user is buyer or supplier
  const isBuyer = user.id === invoice.buyerId;
  const isSupplier = user.id === invoice.supplierId;

  // Get current user's approval status
  const myApproval = invoice.approvals?.find((approval: any) => approval.approvedByUserId === user.id);

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
      case 'INSPECTION_COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'REJECTED':
        return 'error';
      case 'INSPECTION_ASSIGNED':
        return 'info';
      case 'INSPECTION_COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon size={18} />;
      case 'PENDING_APPROVAL':
        return <PendingIcon size={18} />;
      case 'CANCELLED':
        return <CancelIcon size={18} />;
      case 'REJECTED':
        return <CancelIcon size={18} />;
      case 'INSPECTION_ASSIGNED':
        return <InfoIcon size={18} />;
      case 'INSPECTION_COMPLETED':
        return <CheckCircleIcon size={18} />;
      default:
        return <InfoIcon size={18} />;
    }
  };

  const handleApprove = async () => {
    try {
      await updateApproval({
        id: invoice.id,
        approvalData: {
          approvalStatus: 'APPROVED',
          comments: 'Approved via chat',
        },
      }).unwrap();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    try {
      await updateApproval({
        id: invoice.id,
        approvalData: {
          approvalStatus: 'REJECTED',
          comments: 'Rejected via chat',
        },
      }).unwrap();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/invoices/${invoice.id}`);
  };

  // Calculate if both parties have approved
  const bothApproved = invoice.approvals?.every((a: Approval) => a.approvalStatus === 'APPROVED');

  return (
    <Card
      className={cn(
        "max-w-[400px] border-2 rounded-lg border-[#F5F5F5] py-4",
        position === 'right' ? " bg-primary-50" : "border-[#F5F5F5] bg-white"
      )}
    >
      <CardContent>
        {/* Header */}
        <div className="sm:flex items-center mb-4 ">

          <Typography variant="body1" fontWeight="semibold" className="flex items-center gap-2 mb-2 sm:mb-0">
            <DescriptionIcon className="text-primary-main" size={24} />
            Trade Agreement
          </Typography>
          <Box className="ml-auto">
            <Chip
              label={invoice.status.replace(/_/g, ' ')}
              color={getStatusColor(invoice.status) as any}
              size="sm"
              icon={getStatusIcon(invoice.status)}
            />
          </Box>
        </div>

        <Divider className="mb-4" />

        {/* Product Details */}
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Product
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {invoice.productName}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body2">
              {invoice.quantity} {invoice.unitType}{' '}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Price
            </Typography>
            <Typography variant="body2">
              {invoice.currency === 'NGN' ? '₦' : invoice.currency === 'USD' ? '$' : '₦'}
              {invoice.unitPrice}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Trade Type
            </Typography>
            <Typography variant="body2">
              {invoice.tradeType}
              {invoice.incoterm && ` (${invoice.incoterm})`}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Grade Required
            </Typography>
            <Typography variant="body2">{invoice.agreedGradePercentage}%</Typography>
          </Box>
        </Stack>

        {/* location Details */}
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Inspection Location
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {invoice.samplingAddress}, {invoice.samplingLGA}, {invoice.samplingState}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Contact Person
            </Typography>
            <Typography variant="body2">
              {invoice.inspectionContactName} ({invoice.inspectionContactDialCode}
              {invoice.inspectionContactPhone})
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Trade Type
            </Typography>
            <Typography variant="body2">
              {invoice.tradeType}
              {invoice.incoterm && ` (${invoice.incoterm})`}
            </Typography>
          </Box>
        </Stack>

        <Divider className="my-4" />

        {/* Approval Status */}
        <Box className="mb-4">
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Approval Status
          </Typography>
          <Stack direction="row" spacing={1} className="mt-2">
            {invoice?.approvals?.map((approval: Approval, index: number) => (
              <Chip
                key={index}
                label={approval.approvedByRole}
                size="sm"
                color={
                  approval.approvalStatus === 'APPROVED'
                    ? 'success'
                    : approval.approvalStatus === 'REJECTED'
                      ? 'error'
                      : 'default'
                }
                variant={approval.approvedByUserId === user.id ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        {/* Action Buttons */}
        {invoice.status === 'PENDING_APPROVAL' && myApproval?.approvalStatus === 'PENDING' && (
          <Alert severity="warning" className="mb-4">
            <Typography variant="body2">Your approval is required for this agreement</Typography>
          </Alert>
        )}

        <Stack spacing={1}>
          {/* Approval Actions */}
          {invoice.status === 'PENDING_APPROVAL' && myApproval?.approvalStatus === 'PENDING' && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleApprove}
                disabled={isLoading}
                size="sm"
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleReject}
                disabled={isLoading}
                size="sm"
              >
                Reject
              </Button>
            </Stack>
          )}

          {/* View Details */}
          <Button variant="outlined" fullWidth onClick={handleViewDetails} size="sm">
            View Full Details
          </Button>

          {/* Submit for Inspection (only if both approved) */}
          {bothApproved && invoice.status === 'APPROVED' && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2">Both parties approved! Ready to submit for inspection.</Typography>
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
