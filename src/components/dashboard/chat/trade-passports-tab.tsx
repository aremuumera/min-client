'use client';

import * as React from 'react';
import { EmptyState, ErrorState } from '@/components/ui';
import { BatchPassport } from '@/components/passports/passport-panel';
import { CertificateDetail, CertificatesFor } from '@/components/passports/certificate-detail';
import { SideSheet } from '@/components/ui';
import { useGetBatchResultsQuery } from '@/redux/features/passports/passports_api';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';
import { toApiError } from '@/lib/api/errors';
import { useGetTradeAllocationsQuery, useGetTradeRecordQuery, useGetTradeStockQuery } from '@/redux/features/trade/trade_api';

/*
 * The trade room's Passport & certificates tab (step 2.9 D5): the passports of the batches on this
 * trade. The supplier works on its own passports here as on the batch; the buyer sees the
 * published versions only, filtered by the server. Certificates join in step 2.9d.
 */
export function TradePassportsTab({ inquiryId, itemType, extra }: { inquiryId: string; itemType: 'product' | 'rfq'; extra?: (tradeId: string) => React.ReactNode }) {
  const found = useGetTradeStockQuery(itemType === 'rfq' ? { rfqOfferId: inquiryId } : { productInquiryId: inquiryId }, { skip: !inquiryId, refetchOnMountOrArgChange: true });
  const tradeId = found.data?.data?.[0]?.id;
  const trade = useGetTradeRecordQuery(tradeId ?? '', { skip: !tradeId });
  const allocations = useGetTradeAllocationsQuery(tradeId ?? '', { skip: !tradeId });
  if (found.isLoading || allocations.isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (found.error) return <ErrorState title="Could not load the trade" description={toApiError(found.error).message} />;
  if (!tradeId) return <EmptyState title="No trade record yet" description="Passports show here once the trade is agreed and stock is held for it." />;
  const seller = (trade.data?.data as { viewerRole?: string } | undefined)?.viewerRole === 'seller';
  const batches = [...new Map((allocations.data?.data ?? []).filter((a) => a.batch && !['RELEASED', 'CANCELLED'].includes(a.status)).map((a) => [a.batch!.id, a.batch!])).values()];
  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="trade-passports">
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Passports</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {seller ? 'Your batch passports on this trade. The buyer sees each published version.' : 'The digital passport of each batch on this trade: where it comes from and what was checked. Typed values are declared by the supplier; verified ones come from checked records.'}
          </p>
        </div>
        {!batches.length && <p className="text-sm text-gray-500">No batch is held for this trade yet.</p>}
        {batches.map((b) => (
          <div key={b.id} className="space-y-2 rounded-xl border border-gray-200 p-4">
            <p className="break-all text-sm font-bold text-gray-900">{b.batchCode}{b.material?.name ? ` · ${b.material.name}` : ''}</p>
            <BatchPassport batchId={b.id} mode={seller ? 'owner' : 'reader'} />
          </div>
        ))}
      </section>
      <TradeCertificates tradeId={tradeId} batchIds={batches.map((b) => b.id)} />
      {extra?.(tradeId)}
    </div>
  );
}

/** The lab and inspection results of one batch, as certificate subjects */
function BatchResultCertificates({ batchId, onOpen }: { batchId: string; onOpen: (id: string) => void }) {
  const results = useGetBatchResultsQuery(batchId);
  const ids = [...(results.data?.data.assayResults ?? []).map((r) => r.id), ...(results.data?.data.inspectionResults ?? []).map((r) => r.id)];
  return <>{ids.map((id) => <CertificatesFor key={id} subjectId={id} onOpen={onOpen} />)}</>;
}

/** MINMEG's certificates on this trade's goods and shipments (step 2.9d) */
function TradeCertificates({ tradeId, batchIds }: { tradeId: string; batchIds: string[] }) {
  const shipments = useGetShipmentsQuery({ tradeId, limit: 50 });
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5" data-testid="trade-certificates">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Certificates</h3>
        <p className="mt-0.5 text-xs text-gray-500">MINMEG&apos;s certificates on the lab and inspection results of these goods and on their shipments. Each downloads as a PDF.</p>
      </div>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" aria-label="Certificates on this trade">
        {batchIds.map((id) => <BatchResultCertificates key={id} batchId={id} onOpen={setOpen} />)}
        {(shipments.data?.data ?? []).map((s) => <CertificatesFor key={s.id} subjectId={s.id} onOpen={setOpen} />)}
      </ul>
      <p className="text-xs text-gray-400">Nothing listed means MINMEG has not issued a certificate on this trade yet.</p>
      {open && (
        <SideSheet open onClose={() => setOpen(null)} title="Certificate">
          <CertificateDetail certificateId={open} />
        </SideSheet>
      )}
    </section>
  );
}
