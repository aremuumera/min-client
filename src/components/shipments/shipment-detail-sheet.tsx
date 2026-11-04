'use client';

import * as React from 'react';
import { Button, CopyableId, ErrorState, FormField, Modal, QuantityInput, SideSheet, StatusBadge, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { formatDateTime } from '@/lib/format';
import { DELIVERY_RECORDED, LINE_LABELS, MOVING, PLANNING, shipmentStatusLabel, vehicleTypeLabel, type Shipment, type ShipmentLine } from '@/lib/shipments';
import { showQuantity } from '@/lib/trade-stock';
import { useGetReadinessQuery, useGetShipmentQuery, useRemoveLineMutation, useShipmentActionMutation } from '@/redux/features/shipments/shipments_api';
import { CustodyPanel } from '@/components/traceability/custody-panel';
import { SubjectRecords } from '@/components/traceability/subject-records';
import { ShipmentFormSheet } from './shipment-form-sheet';
import { ShipmentTracking } from './shipment-tracking';
import { CarbonFor } from '@/components/esg/carbon-panel';

type LineAmounts = Record<string, { received: string; rejected: string }>;

/** A modal with a reason or note box and, for delivery and new measurements, a quantity per line */
function ActionModal({ shipment, kind, onClose }: { shipment: Shipment; kind: 'dispatch' | 'deliver' | 'reject' | 'reconcile' | 'return' | 'cancel'; onClose: () => void }) {
  const lines = (shipment.lines ?? []).filter((l) => l.status !== 'CANCELLED');
  const [text, setText] = React.useState('');
  const [amounts, setAmounts] = React.useState<LineAmounts>(Object.fromEntries(lines.map((l) => [l.id, { received: kind === 'reconcile' ? l.quantityReceived ?? '' : l.quantityShipped.replace(/\.?0+$/, ''), rejected: '0' }])));
  const [error, setError] = React.useState<string | null>(null);
  const { key } = useIdempotencyKey();
  const [act, { isLoading }] = useShipmentActionMutation();
  const readiness = useGetReadinessQuery(shipment.id, { skip: kind !== 'dispatch' });
  const anyRejected = lines.some((l) => Number(amounts[l.id]?.rejected) > 0);
  const returnable = lines.filter((l) => Number(l.quantityRejected ?? 0) > 0);

  const copy = {
    dispatch: { title: `Dispatch ${shipment.shipmentNumber}?`, body: 'The goods leave now. Each line comes off its batch, custody passes to the carrier, and the trade room moves to Shipped. This cannot be undone.', button: 'Dispatch', textLabel: 'Note', required: false },
    deliver: { title: 'Record what arrived', body: 'Enter what arrived and what you reject, per line. Rejecting anything needs a reason.', button: 'Record delivery', textLabel: 'Reason for rejecting', required: anyRejected },
    reject: { title: 'Reject the whole delivery?', body: 'Everything on this shipment is refused. Either side can then start a return.', button: 'Reject delivery', textLabel: 'Reason', required: true },
    reconcile: { title: 'Record a new measurement', body: 'A new weight replaces what counts as received. Every measurement is kept. A difference over the material tolerance waits for MINMEG staff.', button: 'Save measurement', textLabel: 'Note', required: false },
    return: { title: 'Send rejected goods back?', body: `A return shipment is planned for ${returnable.length} rejected line(s). The goods go back into the same batch, which is held until checked.`, button: 'Start return', textLabel: 'Note', required: false },
    cancel: { title: `Cancel ${shipment.shipmentNumber}?`, body: 'Nothing has left yet. Its quantities can go on another shipment.', button: 'Cancel shipment', textLabel: 'Reason', required: true },
  }[kind];

  const submit = async () => {
    setError(null);
    const note = text.trim();
    const body: Record<string, unknown> =
      kind === 'deliver'
        ? { lines: lines.map((l) => ({ shipmentAllocationId: l.id, quantityReceived: amounts[l.id].received || '0', quantityRejected: amounts[l.id].rejected || '0' })), ...(anyRejected ? { rejectionReason: note } : note ? { note } : {}) }
        : kind === 'reconcile'
          ? { lines: lines.filter((l) => amounts[l.id].received !== '').map((l) => ({ shipmentAllocationId: l.id, measuredQuantity: amounts[l.id].received })), ...(note ? { note } : {}) }
          : kind === 'reject' || kind === 'cancel'
            ? { reason: note }
            : note
              ? { note }
              : {};
    try {
      await act({ id: shipment.id, action: kind, body, idempotencyKey: kind === 'return' ? key : undefined }).unwrap();
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const blocked = kind === 'dispatch' && readiness.data?.data && !readiness.data.data.ready;
  const showLines = kind === 'deliver' || kind === 'reconcile';
  return (
    <Modal open onClose={onClose} size="md">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{copy.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{copy.body}</p>
        </div>
        {kind === 'dispatch' && (
          readiness.isLoading ? (
            <p className="text-sm text-gray-500">Checking the inspection and labels…</p>
          ) : readiness.data?.data ? (
            <div className="space-y-2">
              {readiness.data.data.problems.map((p) => (
                <p key={p.code} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{p.message}</p>
              ))}
              {readiness.data.data.notices.map((p) => (
                <p key={p.code} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">{p.message}</p>
              ))}
              {blocked && <p className="text-sm text-gray-600">Only MINMEG staff can dispatch before these are done. Ask them in the trade chat.</p>}
            </div>
          ) : null
        )}
        {showLines &&
          lines.map((l) => (
            <div key={l.id} className="space-y-2 rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">{l.material?.name ?? 'Batch'} · {l.batch?.batchCode} · {showQuantity(l.quantityShipped, l.unit?.symbol)} shipped</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField htmlFor={`received-${l.id}`} label={kind === 'reconcile' ? 'Measured' : 'Received'} required={kind === 'deliver'} optional={kind === 'reconcile'}>
                  <QuantityInput id={`received-${l.id}`} value={amounts[l.id].received} onChange={(v) => setAmounts({ ...amounts, [l.id]: { ...amounts[l.id], received: v } })} unit={l.unit?.symbol} />
                </FormField>
                {kind === 'deliver' && (
                  <FormField htmlFor={`rejected-${l.id}`} label="Rejected" optional info="Part of what arrived that you refuse.">
                    <QuantityInput id={`rejected-${l.id}`} value={amounts[l.id].rejected} onChange={(v) => setAmounts({ ...amounts, [l.id]: { ...amounts[l.id], rejected: v } })} unit={l.unit?.symbol} />
                  </FormField>
                )}
              </div>
            </div>
          ))}
        <FormField htmlFor="shipment-action-text" label={copy.textLabel} required={copy.required} optional={!copy.required}>
          <Textarea id="shipment-action-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Back</Button>
          <Button disabled={isLoading || !!blocked || (copy.required && text.trim().length < 3)} onClick={submit}>{isLoading ? 'Saving…' : copy.button}</Button>
        </div>
      </div>
    </Modal>
  );
}

function LineRow({ line, canRemove, onRemove }: { line: ShipmentLine; canRemove: boolean; onRemove: () => void }) {
  const rec = line.metadata?.reconciliation;
  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium text-ink">{line.material?.name ?? 'Batch'}</p>
        <CopyableId value={line.batch?.batchCode} label="Batch" mono={false} />
        <p className="text-steel">
          Shipped {showQuantity(line.quantityShipped, line.unit?.symbol)}
          {line.quantityReceived !== null && <> · received {showQuantity(line.quantityReceived, line.unit?.symbol)}</>}
          {Number(line.quantityRejected ?? 0) > 0 && <> · rejected {showQuantity(line.quantityRejected, line.unit?.symbol)}</>}
        </p>
        {rec?.status === 'PENDING_APPROVAL' && <p className="text-amber-700">A difference of {showQuantity(rec.difference, line.unit?.symbol)} waits for MINMEG staff.</p>}
        {line.metadata?.rejectionReason && <p className="text-steel">Reason: {line.metadata.rejectionReason}</p>}
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={line.status}>{LINE_LABELS[line.status] ?? line.status}</StatusBadge>
        {canRemove && <Button size="sm" variant="outlined" onClick={onRemove}>Remove</Button>}
      </div>
    </li>
  );
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) =>
  value ? (
    <div>
      <dt className="text-xs text-steel">{label}</dt>
      <dd className="break-words text-sm text-ink">{value}</dd>
    </div>
  ) : null;

/** One shipment: the plan, the lines, and what the viewer may do next */
export function ShipmentDetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const query = useGetShipmentQuery(id ?? '', { skip: !id, refetchOnMountOrArgChange: true });
  const [action, setAction] = React.useState<null | 'dispatch' | 'deliver' | 'reject' | 'reconcile' | 'return' | 'cancel'>(null);
  const [editing, setEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [act, { isLoading }] = useShipmentActionMutation();
  const [removeLine] = useRemoveLineMutation();
  const { confirm, dialog } = useConfirm();
  const s = query.data?.data;

  const simple = async (kind: 'arrive' | 'close', title: string, description: string, confirmLabel: string) => {
    if (!s || !(await confirm({ title, description, confirmLabel }))) return;
    setError(null);
    try {
      await act({ id: s.id, action: kind }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };
  const remove = async (line: ShipmentLine) => {
    if (!s || !(await confirm({ title: 'Remove this line?', description: 'Its quantity can go on another shipment.', confirmLabel: 'Remove' }))) return;
    setError(null);
    try {
      await removeLine({ id: s.id, lineId: line.id }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const seller = s?.viewerRole === 'seller';
  const buyer = s?.viewerRole === 'buyer';
  const isReturn = s?.shipmentType === 'RETURN';
  // On a return the seller receives and either side moves it (decision #65)
  const mover = seller || (isReturn && buyer);
  const receiver = isReturn ? seller : buyer;
  const open = !!s && !s.finalizedAt;
  const planning = open && PLANNING.includes(s.status);
  const moving = open && MOVING.includes(s.status);
  const recorded = open && DELIVERY_RECORDED.includes(s.status);
  const hasRejected = Number(s?.totals?.rejected ?? 0) > 0 && !isReturn;
  const vehicle = s?.metadata?.vehicle;

  const buttons = s
    ? [
        planning && seller && !isReturn && <Button key="edit" variant="outlined" onClick={() => setEditing(true)}>Edit plan</Button>,
        planning && mover && <Button key="dispatch" onClick={() => setAction('dispatch')}>Dispatch</Button>,
        planning && seller && <Button key="cancel" variant="outlined" onClick={() => setAction('cancel')}>Cancel shipment</Button>,
        moving && receiver && s.status !== 'ARRIVED' && <Button key="arrive" variant="outlined" disabled={isLoading} onClick={() => simple('arrive', 'Mark as arrived?', 'The goods are at your site. You then record what arrived.', 'Mark arrived')}>Mark arrived</Button>,
        moving && receiver && <Button key="deliver" onClick={() => setAction('deliver')}>Record delivery</Button>,
        moving && receiver && !isReturn && <Button key="reject" variant="outlined" onClick={() => setAction('reject')}>Reject delivery</Button>,
        recorded && receiver && <Button key="reconcile" variant="outlined" onClick={() => setAction('reconcile')}>New measurement</Button>,
        recorded && hasRejected && (seller || buyer) && <Button key="return" variant="outlined" onClick={() => setAction('return')}>Start return</Button>,
        recorded && seller && <Button key="close" variant="outlined" disabled={isLoading} onClick={() => simple('close', 'Close this shipment?', 'No more changes can be made. A difference still waiting for MINMEG staff stops this.', 'Close')}>Close</Button>,
      ].filter(Boolean)
    : [];

  return (
    <SideSheet
      open={!!id}
      onClose={onClose}
      size="lg"
      title={s ? s.shipmentNumber : 'Shipment'}
      subtitle={s ? <span className="flex flex-wrap items-center gap-2"><StatusBadge status={s.status}>{shipmentStatusLabel(s.status)}</StatusBadge>{s.closed && <span>Closed</span>}{isReturn && <span>Return</span>}</span> : undefined}
      footer={buttons.length ? <div className="flex flex-wrap justify-end gap-2">{buttons}</div> : undefined}
    >
      {query.isError ? (
        <ErrorState description={toApiError(query.error).message} onRetry={query.refetch} />
      ) : !s ? (
        <p className="text-sm text-steel">Loading…</p>
      ) : (
        <div className="space-y-6">
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Trade" value={s.trade?.tradeCode} />
            <Field label="From" value={s.origin?.name} />
            <Field label="To" value={s.destination?.name ?? "The trade's delivery site"} />
            <Field label="Planned departure" value={s.plannedDepartureAt && formatDateTime(s.plannedDepartureAt)} />
            <Field label="Left" value={s.actualDepartureAt && formatDateTime(s.actualDepartureAt)} />
            <Field label="Planned arrival" value={s.plannedArrivalAt && formatDateTime(s.plannedArrivalAt)} />
            <Field label="Arrived" value={s.actualArrivalAt && formatDateTime(s.actualArrivalAt)} />
            <Field label="Carrier" value={s.carrierName} />
            <Field label="Waybill or tracking number" value={s.trackingReference} />
            <Field label="Vehicle" value={vehicle && [vehicle.vehicleType && vehicleTypeLabel(vehicle.vehicleType), vehicle.plateNumber, vehicle.containerNumber].filter(Boolean).join(' · ')} />
            <Field label="Driver" value={vehicle && [vehicle.driverName, vehicle.driverPhone].filter(Boolean).join(' · ')} />
            <Field label="Seal" value={vehicle?.sealNumber} />
            <Field label="Cancelled because" value={s.metadata?.cancellation?.reason} />
          </dl>
          {s.totals && (
            <p className="text-sm text-steel">
              Shipped {s.totals.shipped.replace(/\.?0+$/, '')} · received {s.totals.received.replace(/\.?0+$/, '')} · rejected {s.totals.rejected.replace(/\.?0+$/, '')}
            </p>
          )}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Lines</h3>
            <ul className="divide-y divide-hairline rounded-xl border border-hairline">
              {(s.lines ?? []).map((l) => (
                <LineRow key={l.id} line={l} canRemove={planning && seller && l.status === 'PLANNED'} onRemove={() => remove(l)} />
              ))}
            </ul>
          </section>
          {s.status !== 'CANCELLED' && <ShipmentTracking shipment={s} />}
          {s.status !== 'CANCELLED' && <CustodyPanel subjectType="SHIPMENT" subjectId={s.id} canHandOver={false} />}
          {/* Step 2.8b D7: the shipment's history of readings and events */}
          <SubjectRecords subjectType="SHIPMENT" subjectId={s.id} role="owner" title="History: readings and events" />
          {/* Step 2.10a: the seller declares the shipment's carbon; the buyer and carrier read it */}
          {s.status !== 'CANCELLED' && (seller || buyer) && <CarbonFor subjectType="SHIPMENT" subjectId={s.id} mode={seller ? 'owner' : 'reader'} />}
          {!!s.returnShipments?.length && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Returns</h3>
              <ul className="space-y-1 text-sm">
                {s.returnShipments.map((r) => (
                  <li key={r.id}>{r.shipmentNumber} · {shipmentStatusLabel(r.status)}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      {s && action && <ActionModal shipment={s} kind={action} onClose={() => setAction(null)} />}
      {s && editing && <ShipmentFormSheet open onClose={() => setEditing(false)} shipment={s} />}
      {dialog}
    </SideSheet>
  );
}
