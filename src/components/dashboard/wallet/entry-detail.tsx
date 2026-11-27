import * as React from 'react';
import Link from 'next/link';
import { CopyableId, KeyValueList, StatusBadge, Timeline, type KeyValueItem } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { methodText, type PayoutAccount, type WalletEntry } from './wallet-types';
import { KIND, STATUS, money } from './wallet-store';

/* One wallet entry: the amount, where it came from, the invoice and trade it belongs to, and where the money is now */
export function EntryDetail({ entry, accounts }: { entry: WalletEntry; accounts: PayoutAccount[] }) {
  const account = entry.accountId ? accounts.find((a) => a.id === entry.accountId) : undefined;
  const items: KeyValueItem[] = [
    { label: 'Type', value: KIND[entry.kind] },
    { label: 'Date', value: formatDateTime(entry.at) },
    { label: 'Method', value: methodText(entry.method) },
    { label: 'Currency', value: entry.currency },
  ];
  if (entry.gross !== undefined && entry.fee !== undefined) {
    items.push({ label: entry.kind === 'inspection_fee' ? 'Inspection fee' : 'Buyer paid', value: money(entry.gross, entry.currency) });
    items.push({ label: entry.kind === 'inspection_fee' ? 'MINMEG commission' : 'MINMEG fee', value: money(entry.fee, entry.currency, { sign: '-' }) });
  }
  if (entry.invoiceNgn !== undefined && entry.rate) {
    items.push({ label: 'Invoice amount', value: money(entry.invoiceNgn, 'NGN') });
    items.push({ label: 'Exchange rate (locked)', value: `₦${entry.rate.toLocaleString('en-US')} = $1` });
  }
  if (account) items.push({ label: 'Paid to', value: `${account.bankName}, ${account.kind}, ${account.accountNumber}`, wide: true });
  items.push({ label: 'Reference', value: <CopyableId value={entry.reference} />, wide: true });
  if (entry.invoiceId)
    items.push({
      label: 'Invoice',
      wide: true,
      value: (
        <div className="space-y-1">
          <CopyableId value={entry.invoiceId} />
          <Link href={`/dashboard/invoices/${entry.invoiceId}`} className="text-[13px] font-medium text-primary hover:text-primary-pressed">Open the invoice</Link>
        </div>
      ),
    });
  if (entry.tradeId)
    items.push({
      label: 'Trade',
      wide: true,
      value: (
        <div className="space-y-1">
          <CopyableId value={entry.tradeId} />
          <Link href={`/dashboard/trade/details/${entry.tradeId}`} className="text-[13px] font-medium text-primary hover:text-primary-pressed">Open the trade</Link>
        </div>
      ),
    });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-hairline bg-surface-soft p-4">
        <div className="text-[13px] text-steel">{entry.direction === 'in' ? 'Into your wallet' : entry.kind === 'payout' ? 'To your bank' : 'Paid to MINMEG'}</div>
        <div className="mt-1 break-words text-2xl font-medium text-ink">{money(entry.amount, entry.currency, { sign: entry.direction === 'in' ? '+' : '-' })}</div>
        <div className="mt-2">
          <StatusBadge tone={STATUS[entry.status].tone}>{STATUS[entry.status].label}</StatusBadge>
        </div>
      </div>
      <KeyValueList items={items} columns={2} />
      <div>
        <h3 className="mb-3 text-sm font-medium text-ink">Where the money is</h3>
        <Timeline entries={entry.steps.map((s, i) => ({ id: String(i), title: s.title, at: s.at ?? 'Not yet', description: s.note, tone: s.done ? 'success' : 'neutral' }))} />
      </div>
      <p className="text-[13px] text-steel">MINMEG stands between the buyer and the seller: it collects the payment, holds it until the goods are inspected and delivered, takes its fee and releases the rest.</p>
    </div>
  );
}
