'use client';

import * as React from 'react';
import { Button, CopyableId, DropdownSelect, EmptyState, ErrorState, FormField, Modal, QuantityInput, StatTile, StatusBadge, Textarea } from '@/components/ui';
import { toast } from '@/components/core/toaster';
import { toApiError } from '@/lib/api/errors';
import { newIdempotencyKey } from '@/lib/api/idempotency';
import { formatDate } from '@/lib/format';
import { ALLOCATION_LABELS, showQuantity, HOLDS_CAN_CHANGE, stillToAllocate, type TradeAllocation, type TradeStockRecord } from '@/lib/trade-stock';
import { useGetBatchesQuery } from '@/redux/features/batches/batches_api';
import { useGetTradeAllocationsQuery, useGetTradeRecordQuery, useGetTradeStockQuery, useHoldBatchMutation, useReleaseHoldMutation } from '@/redux/features/trade/trade_api';

type StockProps = { inquiryId: string; itemType: 'product' | 'rfq' };

const lookup = ({ inquiryId, itemType }: StockProps) => (itemType === 'rfq' ? { rfqOfferId: inquiryId } : { productInquiryId: inquiryId });

function useTradeRecord(props: StockProps) {
  const found = useGetTradeStockQuery(lookup(props), { skip: !props.inquiryId, refetchOnMountOrArgChange: true });
  const id = found.data?.data?.[0]?.id;
  const record = useGetTradeRecordQuery(id ?? '', { skip: !id, refetchOnMountOrArgChange: true });
  return { found, record, trade: record.data?.data };
}

/** On an RFQ trade the seller chooses the batches: Trade Accepted is refused until they cover the offer */
export function TradeStockNotice({ onOpen, ...props }: StockProps & { onOpen: () => void }) {
  const { trade } = useTradeRecord(props);
  if (!trade || trade.viewerRole !== 'seller' || trade.stockMode !== 'BATCHES' || !HOLDS_CAN_CHANGE.includes(trade.status)) return null;
  const left = stillToAllocate(trade);
  if (!left) return null;
  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:px-6">
      <span>Allocate {showQuantity(left, trade.unit?.symbol)} before this trade can be accepted.</span>
      <Button size="sm" variant="outlined" onClick={onOpen}>Open Stock</Button>
    </div>
  );
}

function HoldBatchModal({ trade, onClose }: { trade: TradeStockRecord; onClose: () => void }) {
  const batches = useGetBatchesQuery({ limit: 100 }, { refetchOnMountOrArgChange: true });
  const [hold, { isLoading }] = useHoldBatchMutation();
  const [batchId, setBatchId] = React.useState('');
  const [quantity, setQuantity] = React.useState(String(stillToAllocate(trade) || ''));
  const [error, setError] = React.useState<string | null>(null);
  const [key] = React.useState(newIdempotencyKey);
  const usable = (batches.data?.data ?? []).filter((b) => Number(b.availableQuantity) > 0);
  const chosen = usable.find((b) => b.id === batchId);

  const submit = async () => {
    setError(null);
    try {
      await hold({ tradeId: trade.id, batchId, quantity, idempotencyKey: key }).unwrap();
      toast.success('Stock held for this trade');
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Add a batch</h3>
          <p className="mt-1 text-sm text-gray-500">The quantity stays held for this trade and can't be sold elsewhere. The hold ends after 7 days without trade activity.</p>
        </div>
        <FormField htmlFor="hold-batch" label="Batch" required>
          <DropdownSelect
            id="hold-batch"
            aria-label="Batch"
            value={batchId}
            onValueChange={setBatchId}
            placeholder={batches.isLoading ? 'Loading batches…' : 'Choose a batch'}
            searchable
            options={usable.map((b) => ({ value: b.id, label: `${b.batchCode}${b.material ? ` · ${b.material.name}` : ''} · ${b.availableQuantity} available` }))}
          />
        </FormField>
        <FormField htmlFor="hold-quantity" label="Quantity" required help={chosen ? `${chosen.availableQuantity} free on this batch. Given in the batch's unit.` : undefined}>
          <QuantityInput id="hold-quantity" aria-label="Quantity" value={quantity} onChange={setQuantity} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button disabled={!batchId || !Number(quantity) || isLoading} onClick={submit}>{isLoading ? 'Holding…' : 'Hold stock'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReleaseHoldModal({ allocation, onClose }: { allocation: TradeAllocation; onClose: () => void }) {
  const [release, { isLoading }] = useReleaseHoldMutation();
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await release({ id: allocation.id, reason: reason.trim() }).unwrap();
      toast.success('The hold was released');
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Release this hold?</h3>
          <p className="mt-1 text-sm text-gray-500">{showQuantity(allocation.quantityAllocated, allocation.unit?.symbol)} on {allocation.batch?.batchCode} goes back to being free to sell.</p>
        </div>
        <FormField htmlFor="release-reason" label="Reason" required>
          <Textarea id="release-reason" aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Keep the hold</Button>
          <Button disabled={reason.trim().length < 3 || isLoading} onClick={submit}>{isLoading ? 'Releasing…' : 'Release'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** The trade room's Stock tab: the seller manages holds, the buyer reads what is held for them */
export function TradeStockTab(props: StockProps) {
  const { found, record, trade } = useTradeRecord(props);
  const allocations = useGetTradeAllocationsQuery(trade?.id ?? '', { skip: !trade?.id || trade.stockMode === 'TYPED', refetchOnMountOrArgChange: true });
  const [adding, setAdding] = React.useState(false);
  const [releasing, setReleasing] = React.useState<TradeAllocation | null>(null);

  if (found.isLoading || record.isLoading) return <p className="p-6 text-sm text-gray-500">Loading stock…</p>;
  if (found.isError || record.isError) return <ErrorState description={toApiError(found.error ?? record.error).message} onRetry={found.refetch} />;
  if (!trade) {
    return (
      <EmptyState
        title="No stock held yet"
        description={props.itemType === 'rfq' ? 'The trade opens when the Trade Desk accepts the offer. The supplier then chooses the batches.' : 'Stock is held when the supplier acknowledges the inquiry.'}
      />
    );
  }

  const unit = trade.unit?.symbol ?? '';
  const seller = trade.viewerRole === 'seller';
  const canChange = seller && HOLDS_CAN_CHANGE.includes(trade.status);

  if (trade.stockMode === 'TYPED') {
    const taken = trade.metadata?.typedQuantityTaken;
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <StatTile label="Trade quantity" value={showQuantity(trade.quantity, unit)} />
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          {taken
            ? `${showQuantity(taken, unit)} came off the listing when the trade was accepted. It goes back if the trade is cancelled.`
            : 'This item has no batches. Its quantity comes off the listing when the trade is accepted, and goes back if the trade is cancelled.'}
        </div>
      </div>
    );
  }

  const rows = allocations.data?.data ?? [];
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Trade quantity" value={showQuantity(trade.quantity, unit)} />
        <StatTile label="Held" value={showQuantity(trade.allocationSummary.reserved, unit)} />
        <StatTile label="Committed" value={showQuantity(trade.allocationSummary.committed, unit)} />
        <StatTile label="Still to allocate" value={showQuantity(stillToAllocate(trade), unit)} />
      </div>
      {seller && trade.metadata?.allocationNote && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{trade.metadata.allocationNote}</p>
      )}
      {canChange && (
        <div className="flex justify-end">
          <Button onClick={() => setAdding(true)}>Add a batch</Button>
        </div>
      )}
      {allocations.isError ? (
        <ErrorState description={toApiError(allocations.error).message} onRetry={allocations.refetch} />
      ) : !rows.length ? (
        <EmptyState title={allocations.isLoading ? 'Loading stock…' : 'No batches on this trade yet'} />
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {rows.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-bold text-gray-900">{a.batch?.material?.name ?? 'Batch'}</p>
                <CopyableId value={a.batch?.batchCode} label="Batch" mono={false} />
                <p className="text-sm text-gray-600">{showQuantity(a.quantityAllocated, a.unit?.symbol)}</p>
                {a.status === 'RESERVED' && a.expiresAt && <p className="text-xs text-gray-500">Held until {formatDate(a.expiresAt)}</p>}
                {seller && (a.releaseReason || a.cancellationReason) && <p className="text-xs text-gray-500">Reason: {a.releaseReason || a.cancellationReason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={a.status}>{ALLOCATION_LABELS[a.status] ?? a.status}</StatusBadge>
                {canChange && a.status === 'RESERVED' && <Button size="sm" variant="outlined" onClick={() => setReleasing(a)}>Release</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && <HoldBatchModal trade={trade} onClose={() => setAdding(false)} />}
      {releasing && <ReleaseHoldModal allocation={releasing} onClose={() => setReleasing(null)} />}
    </div>
  );
}
