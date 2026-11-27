import * as React from 'react';
import { BadgeCheck, KeyRound, Landmark, ShieldCheck } from 'lucide-react';
import { Button, DataTable, SectionCard, StatusBadge, Switch } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/format';
import type { WalletEntry } from './wallet-types';
import { STATUS, money, type WalletState } from './wallet-store';

const STEPS_SELLER = [
  'The buyer pays MINMEG: naira by bank transfer, or dollars by SWIFT wire.',
  'MINMEG holds the money in escrow while the goods are inspected and shipped.',
  'Once the buyer confirms delivery, MINMEG takes its fee and releases the rest to your wallet.',
  'Released money is paid to your default account: naira the same working day, dollars the next working day. Or keep it in the wallet and withdraw when you choose.',
];
const STEPS_INSPECTOR = [
  'MINMEG assigns you an inspection; your fee is part of what the buyer pays.',
  'MINMEG holds the fee in escrow with the trade.',
  'When the trade settles, MINMEG releases your fee less its 10% commission.',
  'Released money is paid to your default account the same working day, or kept in the wallet until you withdraw.',
];
const STEPS_BUYER = [
  'Refunds (for example a deposit returned after a failed inspection) come back to your wallet.',
  'Spend them on your next invoice, or withdraw them to your verified account.',
  'Withdrawals need your wallet PIN: naira arrive the same working day, dollars the next working day.',
];

/* Where released money goes: the payout accounts, automatic settlement and the settlements so far */
export function SettlementPanel({ state, onToggleAuto, onSelect }: { state: WalletState; onToggleAuto: (on: boolean) => void; onSelect: (e: WalletEntry) => void }) {
  const payouts = state.entries.filter((e) => e.kind === 'payout');
  const steps = state.sides.inspecting ? STEPS_INSPECTOR : state.sides.selling ? STEPS_SELLER : STEPS_BUYER;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <SectionCard title="Payout accounts">
          <div className="space-y-3">
            {state.payoutAccounts.length === 0 && (
              <p className="rounded-lg border border-hairline p-4 text-sm text-steel">No payout account yet. You add one, in your company&apos;s name, when wallet payments go live.</p>
            )}
            {state.payoutAccounts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-hairline p-4">
                <div className="mt-0.5 text-primary"><Landmark size={18} aria-hidden /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{a.bankName}</span>
                    <StatusBadge tone="dark">{a.currency}</StatusBadge>
                    {a.isDefault && <StatusBadge tone="success">Default</StatusBadge>}
                  </div>
                  <div className="mt-1 break-words text-sm text-ink">{a.accountNumber}</div>
                  <div className="text-[13px] text-steel">{a.kind} · {a.accountName}</div>
                  {a.status === 'VERIFIED' && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-green-dark">
                      <BadgeCheck size={13} aria-hidden /> Name checked against your company {a.verifiedAt ? `on ${formatDate(a.verifiedAt)}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-steel">Payouts go only to accounts in your company&apos;s name. Adding or changing an account needs your wallet PIN, and MINMEG checks the name with the bank first.</p>
        </SectionCard>
        <SectionCard title="Automatic settlement">
          <Switch
            checked={state.autoSettle}
            disabled={state.mode === 'preview'}
            onChange={(e) => onToggleAuto(e.target.checked)}
            label="Pay released money to my default account"
            description={state.autoSettle ? 'On: naira the same working day, dollars the next working day.' : 'Off: released money stays in your wallet until you withdraw it.'}
          />
          <ol className="mt-5 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-xs font-medium text-brand-green-dark">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
      <SectionCard title="Settlements and withdrawals" padded={false}>
        <DataTable<WalletEntry>
          caption="Settlements and withdrawals"
          rows={payouts}
          getRowId={(r) => r.id}
          onRowClick={onSelect}
          empty={{ title: 'Nothing paid out yet', description: 'Released money and withdrawals to your bank show here.' }}
          columns={[
            { key: 'what', header: 'To', mobile: 'title', cell: (r) => <span className="font-medium text-ink">{r.title}</span> },
            { key: 'at', header: 'Date', mobile: 'subtitle', cell: (r) => formatDateTime(r.at) },
            { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={STATUS[r.status].tone}>{r.status === 'processing' ? 'On its way' : STATUS[r.status].label}</StatusBadge> },
            { key: 'amount', header: 'Amount', align: 'right', cell: (r) => <span className="font-medium text-ink">{money(r.amount, r.currency)}</span> },
          ]}
        />
      </SectionCard>
    </div>
  );
}

/* The wallet PIN and the rules that protect the money */
export function SecurityPanel({ state, onChangePin }: { state: WalletState; onChangePin: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title={<span className="flex items-center gap-2"><KeyRound size={18} className="text-primary" aria-hidden /> Wallet PIN</span>}>
        <div className="flex flex-wrap items-center gap-2">
          {state.pinChangedAt ? (
            <>
              <StatusBadge tone="success">PIN set</StatusBadge>
              <span className="text-[13px] text-steel">Last changed {formatDate(state.pinChangedAt)}</span>
            </>
          ) : (
            <StatusBadge tone="neutral">No PIN yet</StatusBadge>
          )}
        </div>
        <p className="mt-3 text-sm text-slate">Four digits, separate from your password. Asked for every withdrawal, every payment from your balance, and every change to a payout account.</p>
        {state.pinChangedAt ? (
          <div className="mt-4">
            <Button variant="outlined" onClick={onChangePin}>Change PIN</Button>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-steel">You set your PIN when wallet payments go live.</p>
        )}
        {state.demoPin && <p className="mt-4 rounded-lg bg-surface-soft px-3 py-2 text-[13px] text-slate">Demo PIN: <span className="font-medium text-ink">{state.demoPin}</span></p>}
      </SectionCard>
      <SectionCard title={<span className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary" aria-hidden /> How your money is protected</span>}>
        <ul className="space-y-3 text-sm text-slate">
          <li>Buyers pay MINMEG, never the seller directly. MINMEG holds the money until the goods are inspected and delivered.</li>
          <li>Five wrong PINs lock withdrawals for 30 minutes, and the company owner gets an alert.</li>
          <li>Money leaves only to verified accounts in your company&apos;s name.</li>
          <li>Only the owner and team members given &quot;Wallet &amp; payouts&quot; access can see this page.</li>
          <li>MINMEG staff never ask for your PIN.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
