'use client';

import * as React from 'react';
import { Button, EmptyState, ErrorState, StatusBadge } from '@/components/ui';
import { ShipmentDetailSheet } from '@/components/shipments/shipment-detail-sheet';
import { ShipmentFormSheet } from '@/components/shipments/shipment-form-sheet';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { shipmentStatusLabel } from '@/lib/shipments';
import { showQuantity } from '@/lib/trade-stock';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';
import { useGetTradeRecordQuery, useGetTradeStockQuery } from '@/redux/features/trade/trade_api';

/** The trade room's Shipments tab: this trade's shipments, and planning one for the seller */
export function TradeShipmentsTab({ inquiryId, itemType }: { inquiryId: string; itemType: 'product' | 'rfq' }) {
  const found = useGetTradeStockQuery(itemType === 'rfq' ? { rfqOfferId: inquiryId } : { productInquiryId: inquiryId }, { skip: !inquiryId, refetchOnMountOrArgChange: true });
  const tradeId = found.data?.data?.[0]?.id;
  const trade = useGetTradeRecordQuery(tradeId ?? '', { skip: !tradeId });
  const list = useGetShipmentsQuery({ tradeId, limit: 50 }, { skip: !tradeId, refetchOnMountOrArgChange: true });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [planning, setPlanning] = React.useState(false);

  if (found.isLoading || list.isLoading) return <p className="p-6 text-sm text-gray-500">Loading shipments…</p>;
  if (found.isError || list.isError) return <ErrorState description={toApiError(found.error ?? list.error).message} onRetry={found.refetch} />;
  if (!tradeId || trade.data?.data.stockMode === 'TYPED') {
    return <EmptyState title="No shipments for this trade" description={tradeId ? 'Tools, equipment and services have no shipments. The trade steps record their delivery.' : 'Shipments start once the trade has stock committed at Trade Accepted.'} />;
  }

  const rows = list.data?.data ?? [];
  const canPlan = trade.data?.data.viewerRole === 'seller' && Number(trade.data.data.allocationSummary.committed) > 0;
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {canPlan && (
        <div className="flex justify-end">
          <Button onClick={() => setPlanning(true)}>Plan a shipment</Button>
        </div>
      )}
      {!rows.length ? (
        <EmptyState title="No shipments yet" description={canPlan ? 'Plan the first truck or container for this trade.' : 'The supplier plans shipments once the stock is committed.'} />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setSelected(r.id)} className="flex w-full flex-col gap-2 p-4 text-left hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="block font-bold text-gray-900">{r.shipmentNumber}{r.shipmentType === 'RETURN' && <span className="ml-2 text-xs font-normal text-gray-500">Return</span>}</span>
                  <span className="block text-sm text-gray-600">
                    {r.quantityShipped ? showQuantity(r.quantityShipped, r.unitSymbol) : `${r.lineCount ?? 0} line(s)`}
                    {(r.actualDepartureAt ?? r.plannedDepartureAt) && <> · {formatDateTime(r.actualDepartureAt ?? r.plannedDepartureAt)}</>}
                  </span>
                </span>
                <StatusBadge status={r.status}>{shipmentStatusLabel(r.status)}</StatusBadge>
              </button>
            </li>
          ))}
        </ul>
      )}
      <ShipmentDetailSheet id={selected} onClose={() => setSelected(null)} />
      {planning && <ShipmentFormSheet open onClose={() => setPlanning(false)} tradeId={tradeId} onSaved={setSelected} />}
    </div>
  );
}
