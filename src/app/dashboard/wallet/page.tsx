'use client';

import { WalletPage } from '@/components/dashboard/wallet/wallet-page';
import { RequireAccess } from '@/lib/permissions';

/* Wallet: naira and dollar balances, escrow per trade, ways to pay, settlement and the wallet PIN.
   Not live yet outside the demo: every figure is 0 until wallet payments go live (wallet-source.ts). */
export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier', 'inspector']} teamKey="wallet">
      <WalletPage />
    </RequireAccess>
  );
}
