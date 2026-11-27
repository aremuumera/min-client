/*
 * The wallet's records: balances per currency, entries, invoices to pay, money held for trades, payout accounts.
 * MINMEG stands in the middle: the buyer pays MINMEG, MINMEG holds the money until delivery and inspection,
 * takes its fee and releases the rest. No entry names the other party (hub and spoke).
 * Shared by the wallet page and the demo's sample wallet (minmeg-demo src/demo/seed/wallet.ts).
 */
export type Currency = 'NGN' | 'USD';
export const CURRENCIES: Currency[] = ['NGN', 'USD'];

export type EntryKind = 'top_up' | 'payment' | 'refund' | 'escrow_in' | 'release' | 'payout' | 'inspection_fee';
export type EntryStatus = 'received' | 'processing' | 'held' | 'released' | 'refunded' | 'paid_out';
export type PayMethod = 'permanent_account' | 'one_time_account' | 'usd_wire' | 'wallet_balance' | 'bank_payout' | 'wallet_credit';

export interface MoneyStep {
  title: string;
  at: string | null;
  done: boolean;
  note?: string;
}

export interface WalletEntry {
  id: string;
  at: string;
  kind: EntryKind;
  direction: 'in' | 'out';
  title: string;
  currency: Currency;
  /** In the entry's currency: what moved in or out of this wallet */
  amount: number;
  /** The invoice's amount (naira) when the money moved in dollars */
  invoiceNgn?: number;
  /** Naira per dollar, locked when the invoice was issued */
  rate?: number;
  /** MINMEG's fee taken from this money, in the entry's currency */
  fee?: number;
  /** What the money was before the fee (supplier and inspector) */
  gross?: number;
  status: EntryStatus;
  method: PayMethod;
  /** The bank's or MINMEG's reference for the transfer */
  reference: string;
  invoiceId?: string;
  invoiceType?: string;
  tradeId?: string;
  product?: string;
  /** Where a payout went */
  accountId?: string;
  steps: MoneyStep[];
}

export interface InvoiceToPay {
  invoiceId: string;
  tradeId: string;
  product: string;
  invoiceType: string;
  amountNgn: number;
  currency: Currency;
  /** In the currency the buyer pays */
  amount: number;
  rate?: number;
  issuedAt: string;
  dueAt: string;
}

export interface HeldTrade {
  tradeId: string;
  product: string;
  currency: Currency;
  amount: number;
  /** What still has to happen before MINMEG releases it */
  waitingFor: string;
  step: number;
  total: number;
  side: 'buying' | 'selling' | 'inspecting';
}

export interface PayoutAccount {
  id: string;
  currency: Currency;
  bankName: string;
  accountNumber: string;
  accountName: string;
  country: string;
  kind: string;
  isDefault: boolean;
  status: 'VERIFIED' | 'PENDING_VERIFICATION';
  verifiedAt: string | null;
}

export interface PermanentAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  note: string;
}

export interface UsdWire {
  beneficiary: string;
  bankName: string;
  accountNumber: string;
  swift: string;
  bankAddress: string;
  /** Put in the payment reference so MINMEG can match the wire */
  reference: string;
}

export interface WalletSeed {
  /** preview: MINMEG has no wallet yet (no payment provider chosen, F-04), so every figure is 0 and nothing can be paid,
   *  added or withdrawn. demo: the demo's sample wallet, where the actions change only the visit's copy. */
  mode: 'preview' | 'demo';
  companyId: string;
  companyName: string;
  sides: { buying: boolean; selling: boolean; inspecting: boolean };
  entries: WalletEntry[];
  toPay: InvoiceToPay[];
  held: HeldTrade[];
  payoutAccounts: PayoutAccount[];
  /** Opened when wallet payments go live */
  permanentAccount: PermanentAccount | null;
  usdWire: UsdWire | null;
  autoSettle: boolean;
  /** The demo's PIN, shown so any visitor can try a withdrawal; null outside the demo */
  demoPin: string | null;
  /** When the wallet PIN was last changed; null while no PIN is set */
  pinChangedAt: string | null;
}

/** How the money moved, in words */
export function methodText(m: PayMethod, who: 'buyer' | 'other' = 'other'): string {
  switch (m) {
    case 'permanent_account': return who === 'buyer' ? 'You paid by transfer to your permanent account' : 'Permanent account (NGN)';
    case 'one_time_account': return who === 'buyer' ? 'You paid by transfer to a one-time account' : 'One-time account (NGN)';
    case 'usd_wire': return who === 'buyer' ? 'You paid by USD wire (SWIFT)' : 'USD wire (SWIFT)';
    case 'wallet_balance': return who === 'buyer' ? 'You paid from your wallet balance' : 'Wallet balance';
    case 'bank_payout': return 'Bank settlement';
    case 'wallet_credit': return 'Wallet credit';
  }
}
