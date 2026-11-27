import * as React from 'react';
import { Building2, Clock, Globe2, Landmark } from 'lucide-react';
import { CopyableId, SectionCard, StatusBadge } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import type { PermanentAccount, UsdWire } from './wallet-types';
import type { WalletState } from './wallet-store';

/* Bank details laid out for copying: label on the left, the value (copyable when asked) on the right */
export function BankDetails({ rows }: { rows: { label: string; value: string; copy?: boolean }[] }) {
  return (
    <dl className="divide-y divide-hairline rounded-lg border border-hairline">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-[13px] text-steel">{r.label}</dt>
          <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">{r.copy ? <CopyableId value={r.value} /> : r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PermanentAccountDetails({ account }: { account: PermanentAccount }) {
  return (
    <BankDetails
      rows={[
        { label: 'Bank', value: account.bankName },
        { label: 'Account number', value: account.accountNumber, copy: true },
        { label: 'Account name', value: account.accountName },
      ]}
    />
  );
}

export function UsdWireDetails({ wire, reference }: { wire: UsdWire; reference?: string }) {
  return (
    <BankDetails
      rows={[
        { label: 'Beneficiary', value: wire.beneficiary },
        { label: 'Bank', value: wire.bankName },
        { label: 'Account number', value: wire.accountNumber, copy: true },
        { label: 'SWIFT / BIC', value: wire.swift, copy: true },
        { label: 'Bank address', value: wire.bankAddress },
        { label: 'Payment reference', value: reference ?? wire.reference, copy: true },
      ]}
    />
  );
}

const REGIONS: { region: string; pays: string; how: string; arrives: string }[] = [
  { region: 'Nigeria', pays: 'Naira (NGN)', how: 'Bank transfer to your permanent account, or to a one-time account opened for one invoice', arrives: 'Within minutes' },
  { region: 'Europe and the UK', pays: 'US dollars (USD)', how: 'SWIFT wire with the invoice ID as the reference; the rate is locked when MINMEG issues the invoice', arrives: '1 to 2 working days' },
  { region: 'China and Asia', pays: 'US dollars (USD)', how: 'SWIFT wire with the invoice ID as the reference', arrives: '1 to 3 working days' },
  { region: 'Middle East and the rest of Africa', pays: 'US dollars (USD)', how: 'SWIFT wire with the invoice ID as the reference', arrives: '1 to 3 working days' },
];

/* How money comes in, by where the buyer is */
export function RegionGuide() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {REGIONS.map((r) => (
        <div key={r.region} className="rounded-lg border border-hairline p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium text-ink">{r.region}</div>
            <StatusBadge tone={r.pays.startsWith('Naira') ? 'success' : 'dark'}>{r.pays}</StatusBadge>
          </div>
          <p className="mt-2 text-[13px] text-slate">{r.how}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-steel">
            <Clock size={13} aria-hidden /> {r.arrives}
          </p>
        </div>
      ))}
    </div>
  );
}

/* The buyer's ways to pay in: the permanent account, the USD wire, and one-time accounts opened during the visit */
export function PayInPanel({ state }: { state: WalletState }) {
  const open = Object.entries(state.oneTime);
  if (!state.permanentAccount || !state.usdWire) {
    // no wallet yet: how paying will work, without account numbers
    return (
      <div className="space-y-5">
        <SectionCard title={<span className="flex items-center gap-2"><Landmark size={18} className="text-primary" aria-hidden /> Your payment accounts</span>}>
          <p className="text-sm text-steel">
            When wallet payments go live, your company gets a permanent naira account number and MINMEG&apos;s USD wire details here. You will also be able to pay one invoice through a one-time account.
          </p>
        </SectionCard>
        <SectionCard title="How buyers will pay, by region">
          <RegionGuide />
        </SectionCard>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title={<span className="flex items-center gap-2"><Landmark size={18} className="text-primary" aria-hidden /> Permanent account (NGN)</span>}>
          <p className="mb-4 text-sm text-steel">{state.permanentAccount.note} Use it to add naira to your wallet, then pay any invoice from your balance.</p>
          <PermanentAccountDetails account={state.permanentAccount} />
        </SectionCard>
        <SectionCard title={<span className="flex items-center gap-2"><Globe2 size={18} className="text-primary" aria-hidden /> USD wire (SWIFT)</span>}>
          <p className="mb-4 text-sm text-steel">For buyers outside Nigeria. Send with charges paid by you (OUR) so the full amount arrives. Use your wallet reference to add dollars, or the invoice ID to pay one invoice.</p>
          <UsdWireDetails wire={state.usdWire} />
        </SectionCard>
      </div>
      <SectionCard title={<span className="flex items-center gap-2"><Building2 size={18} className="text-primary" aria-hidden /> One-time accounts</span>}>
        <p className="text-sm text-steel">For one invoice only: MINMEG opens an account for the exact amount, open for 48 hours. A different amount is sent back. Choose it when you pay an invoice.</p>
        {open.length > 0 && (
          <div className="mt-4 space-y-3">
            {open.map(([invoiceId, a]) => (
              <div key={invoiceId} className="rounded-lg border border-hairline p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-ink">{a.accountNumber}</div>
                  <StatusBadge tone="warning">Open until {formatDateTime(a.expiresAt)}</StatusBadge>
                </div>
                <div className="mt-2 text-[13px] text-steel">For invoice</div>
                <CopyableId value={invoiceId} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard title="How buyers pay, by region">
        <RegionGuide />
      </SectionCard>
    </div>
  );
}
