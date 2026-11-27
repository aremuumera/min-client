'use client';

import * as React from 'react';
import type { BadgeTone } from '@/components/ui';
import { newId, oneTimeAccountFor, walletFor } from './wallet-source';
import type { Currency, EntryStatus, WalletEntry, WalletSeed } from './wallet-types';

export { newId, oneTimeAccountFor };

/*
 * The wallet's state, per company, kept for the visit. Outside the demo it is empty (wallet-source.ts).
 * In the demo, withdrawals, payments and PIN changes change only this copy; nothing is sent anywhere.
 */
export type WalletState = WalletSeed & {
  pin: string;
  /** One-time accounts opened during the visit, per invoice */
  oneTime: Record<string, { accountNumber: string; bankName: string; accountName: string; expiresAt: string }>;
};

const cache = new Map<string, WalletState>();
const listeners = new Set<() => void>();

export function useWallet(companyId: string, companyName: string, role: string) {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);
  let state = cache.get(companyId);
  if (!state) {
    const seed = walletFor(companyId, companyName, role);
    state = { ...seed, pin: seed.demoPin ?? '', oneTime: {} };
    cache.set(companyId, state);
  }
  const update = React.useCallback(
    (fn: (s: WalletState) => WalletState) => {
      const cur = cache.get(companyId);
      if (!cur) return;
      cache.set(companyId, fn(cur));
      listeners.forEach((l) => l());
    },
    [companyId],
  );
  return [state, update] as const;
}

export interface Balance {
  available: number;
  held: number;
  confirming: number;
  toPay: number;
  paidToBank: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What the company has in each currency */
export function balancesOf(s: WalletState): Record<Currency, Balance> {
  const out: Record<Currency, Balance> = { NGN: { available: 0, held: 0, confirming: 0, toPay: 0, paidToBank: 0 }, USD: { available: 0, held: 0, confirming: 0, toPay: 0, paidToBank: 0 } };
  for (const e of s.entries) {
    const b = out[e.currency];
    if (e.direction === 'in' && (e.status === 'received' || e.status === 'released')) b.available += e.amount;
    if (e.direction === 'in' && e.status === 'held') b.held += e.amount;
    if (e.kind === 'payment' && e.method === 'wallet_balance') b.available -= e.amount;
    if (e.kind === 'payment' && e.status === 'held') b.held += e.amount;
    if (e.kind === 'payment' && e.status === 'processing') b.confirming += e.amount;
    if (e.kind === 'payout') {
      b.available -= e.amount;
      b.paidToBank += e.amount;
    }
  }
  for (const p of s.toPay) out[p.currency].toPay += p.amount;
  for (const c of Object.keys(out) as Currency[]) for (const k of Object.keys(out[c]) as (keyof Balance)[]) out[c][k] = round2(out[c][k]);
  return out;
}

const SYMBOL: Record<Currency, string> = { NGN: '₦', USD: '$' };
export const CURRENCY_NAME: Record<Currency, string> = { NGN: 'Naira', USD: 'US dollar' };

export function money(n: number, ccy: Currency, opts: { sign?: '+' | '-' } = {}) {
  const v = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${opts.sign === '-' ? '−' : opts.sign === '+' ? '+' : ''}${SYMBOL[ccy]}${v}`;
}

export const STATUS: Record<EntryStatus, { label: string; tone: BadgeTone }> = {
  received: { label: 'Received', tone: 'success' },
  processing: { label: 'Being confirmed', tone: 'warning' },
  held: { label: 'Held by MINMEG', tone: 'neutral' },
  released: { label: 'Released', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  paid_out: { label: 'Paid to bank', tone: 'success' },
};

export const KIND: Record<WalletEntry['kind'], string> = {
  top_up: 'Money added',
  payment: 'Payment to MINMEG',
  refund: 'Refund',
  escrow_in: "Buyer's payment, held for you",
  release: 'Released to you',
  payout: 'Settlement to your bank',
  inspection_fee: 'Inspection fee',
};
