'use client';

import * as React from 'react';
import { EmptyState, ErrorState, KeyValueList, StatTile, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { showQuantity } from '@/lib/trade-stock';
import { CHANGE_STATUS_LABELS, DELIVERY_LABELS, INSPECTION_OPTIONS, PAYMENT_OPTIONS, PAYMENT_STATUS_LABELS, REQUESTED_BY_LABELS, SCHEDULE_LABELS, changeLineText, scheduleLine, shortOf, showDay } from '@/lib/delivery-schedule';
import { useGetDeliveryScheduleQuery, useGetTradeStockQuery } from '@/redux/features/trade/trade_api';

/*
 * Recurring trades (decision #120, #145): the buyer and the supplier read their trade's deliveries.
 * MINMEG staff write the schedule into the agreement and open each delivery. ⚠️ NOT RELEASED: the
 * backend answers 404 while FEATURE_RECURRING_TRADES is off, and the tab and the line are then hidden.
 */

/** The trade behind this room cycle and its schedule; `schedule` only when the trade is recurring */
export function useRecurringTrade(inquiryId: string, itemType: 'product' | 'rfq', skip = false) {
  const found = useGetTradeStockQuery(itemType === 'rfq' ? { rfqOfferId: inquiryId } : { productInquiryId: inquiryId }, { skip: skip || !inquiryId });
  const tradeId = found.data?.data?.[0]?.id;
  const view = useGetDeliveryScheduleQuery(tradeId ?? '', { skip: skip || !tradeId });
  return { tradeId, view, schedule: view.data?.data.schedule ?? null };
}

/** Beside the stepper: "Recurring: 1 of 3 delivered · next due 15 Feb 2027" (nothing for a single trade) */
export function RecurringLine({ inquiryId, itemType, onOpen }: { inquiryId: string; itemType: 'product' | 'rfq'; onOpen: () => void }) {
  const { schedule } = useRecurringTrade(inquiryId, itemType);
  if (!schedule) return null;
  return (
    <div className="flex-none border-b border-gray-200 bg-white px-3 py-2 sm:px-4">
      <button type="button" onClick={onOpen} className="text-left text-xs font-semibold text-emerald-700 hover:underline sm:text-sm">
        {scheduleLine(schedule)}
      </button>
    </div>
  );
}

export function TradeDeliveriesTab({ inquiryId, itemType }: { inquiryId: string; itemType: 'product' | 'rfq' }) {
  const { tradeId, view, schedule } = useRecurringTrade(inquiryId, itemType);
  if (view.isLoading) return <p className="p-6 text-sm text-gray-500">Loading deliveries…</p>;
  if (view.isError) return <ErrorState description={toApiError(view.error).message} onRetry={view.refetch} />;
  if (!tradeId || !schedule) {
    return <EmptyState title="One delivery" description="This trade has a single delivery. When a trade has several, MINMEG writes the schedule into the trade agreement and each delivery shows here." />;
  }
  const unit = schedule.unit;
  const next = schedule.summary.nextDue;
  const choices = [
    { label: 'Payment', value: PAYMENT_OPTIONS.find((o) => o.value === schedule.paymentMode)?.label },
    { label: 'Inspection', value: INSPECTION_OPTIONS.find((o) => o.value === schedule.inspectionMode)?.label },
    ...(schedule.paymentTerms ? [{ label: 'Payment terms', value: schedule.paymentTerms, wide: true }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={schedule.status}>{SCHEDULE_LABELS[schedule.status]}</StatusBadge>
        <p className="text-sm font-semibold text-gray-900">{scheduleLine(schedule)}</p>
      </div>
      {schedule.status === 'DRAFT' && (
        <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          This schedule is part of the trade agreement. It starts when every party has signed. MINMEG opens each delivery when it is due and tells you.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total" value={showQuantity(schedule.totalQuantity, unit)} />
        <StatTile label="Delivered" value={`${schedule.summary.delivered} of ${schedule.summary.deliveries}`} />
        <StatTile label="Accepted so far" value={showQuantity(schedule.summary.deliveredTotal, unit)} />
        <StatTile label="Next due" value={next ? showDay(next.dueDate) : '—'} />
      </div>
      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {schedule.deliveries.map((d) => (
          <li key={d.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">
              <span className="block font-bold text-gray-900">
                Delivery {d.deliveryNumber} of {schedule.summary.deliveries}
              </span>
              <span className="block text-sm text-gray-600">
                Due {showDay(d.dueDate)} · {showQuantity(Number(d.plannedQuantity) + Number(d.carriedOverQuantity), unit)}
                {(d.status === 'DELIVERED' || d.status === 'CLOSED') && ` · ${showQuantity(d.deliveredQuantity, unit)} accepted`}
              </span>
              {Number(d.carriedOverQuantity) > 0 && <span className="block text-xs text-gray-500">Includes {showQuantity(d.carriedOverQuantity, unit)} carried over from an earlier short delivery</span>}
              {d.agreedDueDate && d.agreedDueDate !== d.dueDate && <span className="block text-xs text-gray-500">Moved from {showDay(d.agreedDueDate)}{d.metadata?.dateMoves?.at(-1)?.reason ? `: ${d.metadata.dateMoves.at(-1)!.reason}` : ''}</span>}
              {d.checks && d.status === 'OPEN' && (
                <span className="mt-1 block text-xs text-gray-600">
                  {d.checks.ready ? 'Ready to leave.' : `Before it leaves: ${[!d.checks.stock.ok && 'stock', !d.checks.inspection.ok && (d.checks.inspection.status ? 'its inspection to finish' : 'its inspection'), !d.checks.payment.ok && 'payment'].filter(Boolean).join(', ')}.`}
                  {d.needsInspection && ' This delivery is inspected on its own.'}
                </span>
              )}
              {d.checks && d.status === 'PLANNED' && d.needsInspection && <span className="mt-1 block text-xs text-gray-600">This delivery is inspected on its own before it leaves.</span>}
              {d.metadata?.shortfall && (
                <span className="block text-xs text-gray-500">
                  Arrived {showQuantity(d.metadata.shortfall.quantity, unit)} short: {d.metadata.shortfall.settled === 'CARRIED_OVER' ? `added to delivery ${d.metadata.shortfall.toDeliveryNumber}` : 'dropped by the signed schedule change'}
                </span>
              )}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status}>{DELIVERY_LABELS[d.status]}</StatusBadge>
              {d.status === 'DELIVERED' && shortOf(d) > 0 && <StatusBadge tone="warning">Short by {showQuantity(shortOf(d), unit)}</StatusBadge>}
              {d.paymentStatus !== 'NOT_REQUIRED' && <StatusBadge status={d.paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING'}>{PAYMENT_STATUS_LABELS[d.paymentStatus]}</StatusBadge>}
            </span>
          </li>
        ))}
      </ul>
      {schedule.changes?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Schedule changes</p>
          <ul className="divide-y divide-gray-100">
            {schedule.changes.map((c) => (
              <li key={c.id} className="space-y-1.5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status === 'APPLIED' ? 'COMPLETED' : c.status === 'AWAITING_SIGNATURES' ? 'PENDING' : 'REJECTED'}>{CHANGE_STATUS_LABELS[c.status]}</StatusBadge>
                  <span className="text-xs text-gray-500">Asked for by {REQUESTED_BY_LABELS[c.requestedBy].toLowerCase()} · {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700">{c.reason}</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-gray-700">
                  {c.lines.map((l, i) => (
                    <li key={i}>{changeLineText(l, unit)}</li>
                  ))}
                </ul>
                {c.status === 'AWAITING_SIGNATURES' && <p className="text-xs font-medium text-emerald-700">Sign your copy in the Document Vault. It applies when both parties have signed; if either does not, nothing changes.</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <KeyValueList columns={2} items={choices} />
      </div>
      <p className="text-xs text-gray-500">Each delivery ships on its own shipment (see Shipments). Questions about the schedule go to MINMEG in your chat.</p>
    </div>
  );
}
