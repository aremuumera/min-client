'use client';

import { Skeleton, StatusBadge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { offerStatusLabel, offerStatusTone, type RfqOffer } from '@/lib/rfqs';
import { useGetOfferHistoryQuery } from '@/redux/features/trade/trade_api';

/** Every version of an offer, newest first. Revising keeps the old ones here */
export function OfferHistory({ offerId }: { offerId: string }) {
  const history = useGetOfferHistoryQuery(offerId);
  if (history.isLoading) return <Skeleton className="h-16 w-full" />;
  const versions = ((history.data?.data ?? []) as RfqOffer[]).slice().sort((a, b) => (b.version_number ?? 1) - (a.version_number ?? 1));
  if (versions.length < 2) return null;
  return (
    <section aria-label="Offer versions">
      <h3 className="mb-2 text-sm font-medium text-ink">Versions</h3>
      <ul className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline text-sm">
        {versions.map((v) => (
          <li key={v.external_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span>
              Version {v.version_number ?? 1}: {Number(v.quantity).toLocaleString()} {v.measure_type} at {v.currency === 'USD' ? '$' : '₦'}{Number(v.unit_price).toLocaleString()}
              <span className="block text-xs text-steel">{formatDate(v.createdAt)}</span>
            </span>
            <StatusBadge tone={offerStatusTone(v)}>{offerStatusLabel(v)}</StatusBadge>
          </li>
        ))}
      </ul>
    </section>
  );
}
