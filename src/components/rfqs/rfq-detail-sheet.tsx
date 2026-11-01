'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, KeyValueList, SideSheet, Skeleton, StatusBadge, useConfirm } from '@/components/ui';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { FULFILMENT_OPTIONS, LOCATION_TYPE_OPTIONS, canEditRfq, optionLabel, rfqStatusLabel, rfqStatusTone, type Rfq } from '@/lib/rfqs';
import { useChangeRfqStatusMutation, useDeleteRFQMutation, useGetRfqDetailsForbuyQuery } from '@/redux/features/buyer-rfq/rfq-api';

/** One RFQ of the buyer's: everything it says, and what can be done with it now */
export function RfqDetailSheet({ rfqId, row, buyerId, onClose }: { rfqId: string | null; row?: Rfq; buyerId: string; onClose: () => void }) {
  const detail = useGetRfqDetailsForbuyQuery({ rfqId }, { skip: !rfqId, refetchOnMountOrArgChange: true });
  const loaded = (detail.data as { data?: Rfq } | undefined)?.data;
  const rfq = loaded?.rfqId === rfqId ? loaded : undefined;
  const [change, changing] = useChangeRfqStatusMutation();
  const [remove, removing] = useDeleteRFQMutation();
  const [cancelling, setCancelling] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const { confirm, dialog } = useConfirm();
  const offerCount = row?.offerCount ?? 0;

  const publish = async () => {
    if (!rfq) return;
    const ok = await confirm({ title: `Publish ${rfq.rfqProductName}?`, description: 'Suppliers and MINMEG can see it and send offers until the deadline.', confirmLabel: 'Publish' });
    if (!ok) return;
    try {
      await change({ buyerId, rfqId: rfq.rfqId, status: 'published' }).unwrap();
      toast.success('RFQ published');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const destroy = async () => {
    if (!rfq) return;
    const ok = await confirm({ title: `Delete ${rfq.rfqProductName}?`, description: "It is removed for good. This can't be undone.", confirmLabel: 'Delete', tone: 'error' });
    if (!ok) return;
    try {
      await remove({ buyerId, rfqId: rfq.rfqId }).unwrap();
      toast.success('RFQ deleted');
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const editable = !!rfq && canEditRfq(rfq.status);
  return (
    <SideSheet
      open={!!rfqId}
      onClose={onClose}
      size="lg"
      title={rfq?.rfqProductName ?? row?.rfqProductName ?? 'RFQ'}
      subtitle={rfq && <StatusBadge tone={rfqStatusTone(rfq.status)}>{rfqStatusLabel(rfq.status)}</StatusBadge>}
      footer={
        rfq && (
          <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:justify-end">
            {editable && offerCount === 0 && <Button type="button" variant="outlined" color="error" onClick={destroy} loading={removing.isLoading}>Delete</Button>}
            {editable && <Button type="button" variant="outlined" color="error" onClick={() => setCancelling(true)}>Cancel RFQ</Button>}
            {offerCount > 0 && <Link href={`${paths.dashboard.rfqs.offers}?rfq=${rfq.rfqId}`}><Button type="button" variant="outlined">See offers ({offerCount})</Button></Link>}
            {editable && <Link href={paths.dashboard.rfqs.update(rfq.rfqId) ?? ''}><Button type="button" variant="outlined">Edit</Button></Link>}
            {rfq.status === 'draft' && <Button type="button" onClick={publish} loading={changing.isLoading}>Publish</Button>}
          </div>
        )
      }
    >
      {detail.isError ? (
        <Alert severity="error">{toApiError(detail.error).message}</Alert>
      ) : !rfq ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="flex flex-col gap-5">
          {error && <Alert severity="error">{error}</Alert>}
          <KeyValueList
            columns={2}
            items={[
              { label: 'RFQ ID', value: <CopyableId value={rfq.rfqId} />, wide: true },
              { label: 'Material from the list', value: rfq.material?.name ?? 'Not from the list' },
              { label: 'Category', value: [rfq.rfqProductMainCategory, rfq.rfqProductCategory, rfq.rfqProductSubCategory].filter(Boolean).join(' › ') },
              { label: 'Quantity', value: `${rfq.quantityRequired} ${rfq.unit?.symbol ?? rfq.quantityMeasure}` },
              { label: 'Bidding deadline', value: rfq.bidding_deadline ? formatDate(rfq.bidding_deadline) : 'None' },
              { label: 'Duration of supply', value: rfq.durationOfSupply },
              { label: 'Delivery period', value: rfq.deliveryPeriod },
              { label: 'Purity or grade', value: rfq.purity_grade },
              { label: 'Max moisture', value: rfq.moisture_max == null ? null : `${rfq.moisture_max}%` },
              { label: 'Packaging', value: rfq.packaging },
              { label: 'Sampling method', value: rfq.sampling_method },
              { label: 'Payment terms', value: rfq.selectedPayments?.join(', ') },
              { label: 'Shipping terms', value: rfq.selectedShippings?.join(', ') },
              { label: 'Payment details', value: rfq.paymentsTermsDescribed, wide: true },
              { label: 'Shipping details', value: rfq.shippingTermsDescribed, wide: true },
              { label: 'Supply', value: rfq.inquiry_type === 'recurring' ? `Recurring, ${rfq.recurring_frequency ?? ''}, ${rfq.recurring_duration ?? ''} months` : 'One time' },
              { label: 'Urgency', value: rfq.urgency_level === 'urgent' ? 'Urgent' : 'Standard' },
              { label: 'Inspection', value: rfq.is_inspection_required ? 'Requested' : 'Not requested' },
              { label: 'Shipment', value: rfq.is_shipment_included ? 'Included' : 'Not included' },
              { label: 'Fulfilment', value: optionLabel(FULFILMENT_OPTIONS, rfq.fulfillment_type) || null },
              { label: 'Location type', value: optionLabel(LOCATION_TYPE_OPTIONS, rfq.location_type) || null },
              { label: 'Destination', value: [rfq.fullAddress, rfq.selectedState, rfq.selectedCountryName ?? rfq.productDestination].filter(Boolean).join(', '), wide: true },
              { label: 'Description', value: rfq.rfqDescription, wide: true },
              { label: 'Posted', value: formatDate(rfq.createdAt) },
            ]}
          />
          {(rfq.attachments?.length ?? 0) > 0 && (
            <ul aria-label="Attachments" className="flex flex-col gap-1 text-sm">
              {rfq.attachments?.map((a) => (
                <li key={a.url}><a className="text-brand-green-dark underline" href={a.url} target="_blank" rel="noopener noreferrer">{a.url.split('/').pop()}</a></li>
              ))}
            </ul>
          )}
        </div>
      )}
      <ConfirmDialog
        open={cancelling}
        tone="error"
        title={`Cancel ${rfq?.rfqProductName ?? 'this RFQ'}?`}
        description={offerCount ? `Its ${offerCount} open offers are declined and the suppliers are told. This can't be undone.` : "Suppliers can no longer see it. This can't be undone."}
        confirmLabel="Cancel RFQ"
        cancelLabel="Keep it"
        reason={{ label: 'Reason (Optional)', minLength: 0 }}
        loading={changing.isLoading}
        onConfirm={async (reason) => {
          try {
            await change({ buyerId, rfqId: rfq!.rfqId, status: 'cancelled', reason: reason || undefined }).unwrap();
            toast.success('RFQ cancelled');
          } catch (err) {
            setError(toApiError(err).message);
          }
          setCancelling(false);
        }}
        onClose={() => setCancelling(false)}
      />
      {dialog}
    </SideSheet>
  );
}
