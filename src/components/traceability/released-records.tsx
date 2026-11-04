'use client';

import * as React from 'react';
import { Alert, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { eventStatusLabel, readingTrust, sourceLabel } from '@/lib/records';
import { numberText } from '@/lib/traceability';
import { useGetReleasedRecordsQuery } from '@/redux/features/traceability/traceability_api';
import { useGetTradeStockQuery } from '@/redux/features/trade/trade_api';
import { EvidenceList } from './evidence-list';

/*
 * What MINMEG released on this trade to your side (decision #107): readings and events on the
 * trade's batches and shipments, each with its evidence. MINMEG can take a release back, and then it
 * disappears from here.
 */
const valueOf = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'number' || typeof v === 'string' ? numberText(v) : JSON.stringify(v));

export function ReleasedRecords({ inquiryId, itemType }: { inquiryId: string; itemType: 'product' | 'rfq' }) {
  const found = useGetTradeStockQuery(itemType === 'rfq' ? { rfqOfferId: inquiryId } : { productInquiryId: inquiryId }, { skip: !inquiryId });
  const tradeId = found.data?.data?.[0]?.id;
  const released = useGetReleasedRecordsQuery(tradeId ?? '', { skip: !tradeId, refetchOnMountOrArgChange: true });
  if (!tradeId) return null;
  const data = released.data?.data;
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="released-records" data-testid="released-records">
      <div>
        <h3 id="released-records" className="text-sm font-bold uppercase tracking-wider text-gray-900">Readings and events released by MINMEG</h3>
        <p className="mt-0.5 text-xs text-gray-500">Weights, moisture and what happened to the goods, with the files behind them. Each file opens through a link that works for 10 minutes; open it again for a new one.</p>
      </div>
      {released.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {released.error && <Alert severity="error">{toApiError(released.error).message}</Alert>}
      {data && !data.records.length && <p className="text-sm text-gray-500">Nothing released yet.</p>}
      {data?.records.map((item) =>
        item.kind === 'READING' ? (
          <div key={item.release.id} className="space-y-1 rounded-lg bg-gray-50 p-3" data-testid={`released-${item.record.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900">{item.record.measurementType?.name ?? 'Reading'}: {numberText(item.record.value)} {item.record.unit?.symbol}</span>
              <StatusBadge status={readingTrust(item.record).status}>{readingTrust(item.record).label}</StatusBadge>
            </div>
            <p className="text-xs text-gray-500">{sourceLabel(item.record.sourceType)} · measured {formatDateTime(item.record.measuredAt)} · released {formatDateTime(item.release.releasedAt)}</p>
            <EvidenceList evidence={item.evidence} />
          </div>
        ) : (
          <div key={item.release.id} className="space-y-1 rounded-lg bg-gray-50 p-3" data-testid={`released-${item.record.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-900">{item.record.eventType?.name ?? 'Event'}</span>
              <StatusBadge status={item.record.status === 'RECORDED' ? 'ACTIVE' : item.record.status}>{eventStatusLabel(item.record.status)}</StatusBadge>
            </div>
            <p className="text-xs text-gray-500">{formatDateTime(item.record.occurredAt)} · released {formatDateTime(item.release.releasedAt)}</p>
            {!!item.record.data && !!Object.keys(item.record.data).length && <p className="text-sm text-gray-700">{Object.entries(item.record.data).map(([k, v]) => `${k}: ${valueOf(v)}`).join(' · ')}</p>}
            <EvidenceList evidence={item.evidence} />
          </div>
        ),
      )}
    </section>
  );
}
