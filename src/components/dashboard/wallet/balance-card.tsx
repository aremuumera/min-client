import * as React from 'react';
import { cn } from '@/utils/helper';
import type { Currency } from './wallet-types';
import { CURRENCY_NAME, money, type Balance } from './wallet-store';

/* One currency's wallet: what can be spent or withdrawn now, and what MINMEG holds. Dark = the main currency. */
export function BalanceCard({ currency, balance, sides, dark }: { currency: Currency; balance: Balance; sides: { buying: boolean; selling: boolean; inspecting: boolean }; dark?: boolean }) {
  const rows: { label: string; value: number; hint: string }[] = [
    { label: 'Held by MINMEG', value: balance.held, hint: sides.inspecting ? 'Your fees, released when each trade settles' : sides.buying && !sides.selling ? 'Paid in, released to the seller on delivery' : 'Paid by buyers, released to you on delivery' },
  ];
  if (sides.buying) {
    rows.push({ label: 'Invoices to pay', value: balance.toPay, hint: 'Waiting for your payment' });
    if (balance.confirming > 0) rows.push({ label: 'Being confirmed', value: balance.confirming, hint: 'Sent; MINMEG is matching it' });
  }
  if (sides.selling || sides.inspecting) rows.push({ label: 'Paid to your bank', value: balance.paidToBank, hint: 'Settled or on its way' });

  return (
    <div className={cn('min-w-0 rounded-xl p-5 md:p-6', dark ? 'bg-brand-dark text-on-dark' : 'border border-hairline bg-canvas')}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('text-[13px] font-medium', dark ? 'text-on-dark-muted' : 'text-steel')}>{CURRENCY_NAME[currency]} wallet</div>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', dark ? 'bg-brand-green-light text-brand-dark' : 'bg-surface-soft text-slate')}>{currency}</span>
      </div>
      <div className={cn('mt-4 text-[13px]', dark ? 'text-on-dark-muted' : 'text-steel')}>Available</div>
      <div className={cn('mt-1 break-words text-[28px] font-medium leading-tight md:text-[32px]', dark ? 'text-on-dark' : 'text-ink')}>{money(balance.available, currency)}</div>
      <div className={cn('mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2', dark ? 'border-hairline-dark' : 'border-hairline')}>
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <div className={cn('text-[13px]', dark ? 'text-on-dark-muted' : 'text-steel')}>{r.label}</div>
            <div className={cn('mt-0.5 break-words text-base font-medium', dark ? 'text-on-dark' : 'text-ink')}>{money(r.value, currency)}</div>
            <div className={cn('text-xs', dark ? 'text-on-dark-muted' : 'text-muted')}>{r.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
