import type { WalletSeed } from './wallet-types';

/*
 * Where the wallet's figures come from. MINMEG has no wallet yet (no payment provider chosen, F-04), so this
 * source is empty: every balance is 0 and nothing can be paid, added or withdrawn. The page shows how the
 * wallet will work.
 *
 * The demo replaces this import with its sample wallet (minmeg-demo scripts/sync-from-merchants.mjs, patch
 * "The wallet's sample data"). Keep the exported names the same in both.
 */
export function walletFor(companyId: string, companyName: string, role: string): WalletSeed {
  return {
    mode: 'preview',
    companyId,
    companyName,
    sides: { buying: role === 'buyer' || role === 'buyer_supplier', selling: role === 'supplier' || role === 'buyer_supplier', inspecting: role === 'inspector' },
    entries: [],
    toPay: [],
    held: [],
    payoutAccounts: [],
    permanentAccount: null,
    usdWire: null,
    autoSettle: false,
    demoPin: null,
    pinChangedAt: null,
  };
}

/** Opened when the buyer pays an invoice by one-time account: only in the demo until wallet payments go live */
export const oneTimeAccountFor: (invoiceId: string, companyName: string) => { bankName: string; accountNumber: string; accountName: string; expiresAt: string } = () => {
  throw new Error('Wallet payments are not live yet');
};

/** An id for an entry made on the page (the demo's withdrawals and payments; the demo makes them from the seed) */
export const newId: (seed: string) => string = () => crypto.randomUUID();
