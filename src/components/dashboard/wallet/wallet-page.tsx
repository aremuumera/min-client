'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { Alert, Button, DataTable, DropdownSelect, FilterBar, PageHeader, SectionCard, SegmentProgress, SideSheet, StatusBadge, Tab, TabList, TabPanel, Tabs } from '@/components/ui';
import { useAppSelector } from '@/redux/hooks';
import { normalizeRole } from '@/lib/permissions';
import { formatDate, formatDateTime } from '@/lib/format';
import { walletHelp } from '@/lib/help/wallet';
import { cn } from '@/utils/helper';
import { methodText, type Currency, type InvoiceToPay, type WalletEntry } from './wallet-types';
import { BalanceCard } from './balance-card';
import { AddMoneyDialog, ChangePinDialog, PayInvoiceSheet, WithdrawDialog } from './dialogs';
import { EntryDetail } from './entry-detail';
import { PayInPanel } from './pay-in';
import { SecurityPanel, SettlementPanel } from './settlement';
import { KIND, STATUS, balancesOf, money, useWallet } from './wallet-store';

const HELD_STEPS = ['Paid in', 'Inspected', 'In transit', 'Delivered'];
const SIDE_LABEL = { buying: 'Buying', selling: 'Selling', inspecting: 'Inspecting' } as const;
/* The last line of "About this page": what the figures are, in each mode */
const MODE_NOTE = {
  preview: 'Not live yet: wallet payments wait for MINMEG\'s payment provider. Until then every figure is 0.',
  demo: 'Demo only: nothing here moves real money, and a reload starts again from the sample data.',
} as const;

export function WalletPage() {
  const auth = useAppSelector((s) => s.auth);
  const companyId: string = auth.ownerUserId || auth.user?.id || '';
  const companyName: string = auth.user?.companyName || auth.user?.business_name || auth.user?.company_name || 'Your company';
  const role = normalizeRole(auth.user?.role) ?? 'buyer';
  const [state, update] = useWallet(companyId, companyName, role);
  const balances = balancesOf(state);

  const [tab, setTab] = React.useState('activity');
  const [selected, setSelected] = React.useState<WalletEntry | null>(null);
  const [paying, setPaying] = React.useState<InvoiceToPay | null>(null);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [pinOpen, setPinOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [ccyFilter, setCcyFilter] = React.useState('');
  const [kindFilter, setKindFilter] = React.useState('');

  // the main currency first: the one with more going on
  const count = (c: Currency) => state.entries.filter((e) => e.currency === c).length + state.toPay.filter((p) => p.currency === c).length;
  const order: Currency[] = count('USD') > count('NGN') ? ['USD', 'NGN'] : ['NGN', 'USD'];
  // inspectors are paid in naira only
  const shown: Currency[] = state.sides.inspecting ? ['NGN'] : order;

  const q = search.trim().toLowerCase();
  const rows = state.entries.filter(
    (e) =>
      (!ccyFilter || e.currency === ccyFilter) &&
      (!kindFilter || e.kind === kindFilter) &&
      (!q || [e.title, e.reference, e.invoiceId, e.tradeId, e.product].some((v) => v?.toLowerCase().includes(q))),
  );
  const kinds = [...new Set(state.entries.map((e) => e.kind))];
  const canPayIn = state.sides.buying;
  const live = state.mode !== 'preview';

  return (
    <div>
      <PageHeader
        title="Wallet"
        help={{ ...walletHelp, goodToKnow: [...(walletHelp.goodToKnow ?? []), MODE_NOTE[state.mode]] }}
        meta={<StatusBadge tone="neutral">{live ? 'Demo' : 'Not live yet'}</StatusBadge>}
        description={
          state.sides.inspecting
            ? 'Your inspection fees, held by MINMEG until each trade settles, and paid to your bank.'
            : state.sides.buying && !state.sides.selling
              ? 'Pay MINMEG for your trades in naira or US dollars. MINMEG holds the money until the goods are inspected and delivered.'
              : 'Money from your trades in naira and US dollars: held by MINMEG until delivery, then released to you and settled to your bank.'
        }
        actions={
          <>
            {canPayIn && (
              <Button startIcon={<Plus size={16} />} onClick={() => setAddOpen(true)} disabled={!live}>
                Add money
              </Button>
            )}
            <Button variant={canPayIn ? 'outlined' : 'contained'} startIcon={<ArrowUpRight size={16} />} onClick={() => setWithdrawOpen(true)} disabled={!live}>
              Withdraw
            </Button>
          </>
        }
      />

      {!live && (
        <Alert severity="info" title="Wallet payments aren't live yet" className="mb-4">
          Every figure is 0 for now. Once payments go live, what you pay, what MINMEG holds for your trades and what is paid to your bank shows here, in naira and US dollars.
        </Alert>
      )}

      <div className={cn('grid gap-4', shown.length > 1 && 'md:grid-cols-2')}>
        {shown.map((c, i) => (
          <BalanceCard key={c} currency={c} balance={balances[c]} sides={state.sides} dark={i === 0} />
        ))}
      </div>

      {state.toPay.length > 0 && (
        <SectionCard title="Invoices waiting for your payment" className="mt-5" padded={false}>
          <ul className="divide-y divide-hairline border-t border-hairline">
            {state.toPay.map((p) => (
              <li key={p.invoiceId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium text-ink">{p.invoiceType}: {p.product}</div>
                  <div className="text-[13px] text-steel">
                    Pay by {formatDate(p.dueAt)}
                    {p.rate ? ` · invoice ${money(p.amountNgn, 'NGN')} at ₦${p.rate.toLocaleString('en-US')} = $1` : ''}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-base font-medium text-ink">{money(p.amount, p.currency)}</span>
                  <Button size="sm" onClick={() => setPaying(p)}>Pay</Button>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <Tabs value={tab} onChange={setTab} className="mt-6">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabList className="min-w-max">
            <Tab value="activity" label="Activity" />
            <Tab value="held" label={`Held for trades (${state.held.length})`} />
            {canPayIn && <Tab value="payin" label="Ways to pay" />}
            <Tab value="settlement" label="Settlement" />
            <Tab value="security" label="PIN & security" />
          </TabList>
        </div>

        <TabPanel value="activity" className="pt-5">
          <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by product, invoice, trade or reference" activeCount={(ccyFilter ? 1 : 0) + (kindFilter ? 1 : 0)} onClear={() => { setCcyFilter(''); setKindFilter(''); }}>
            <DropdownSelect aria-label="Currency" value={ccyFilter} onValueChange={setCcyFilter} options={[{ value: 'NGN', label: 'Naira (NGN)' }, { value: 'USD', label: 'US dollars (USD)' }]} placeholder="All currencies" className="md:w-48" />
            <DropdownSelect aria-label="Type" value={kindFilter} onValueChange={setKindFilter} options={kinds.map((k) => ({ value: k, label: KIND[k] }))} placeholder="All types" className="md:w-56" />
          </FilterBar>
          <DataTable<WalletEntry>
            caption="Wallet activity"
            rows={rows}
            getRowId={(r) => r.id}
            onRowClick={setSelected}
            selectedId={selected?.id}
            empty={{ title: 'Nothing here yet', description: 'Payments, releases and settlements for your trades show here.' }}
            columns={[
              {
                key: 'what',
                header: 'Description',
                mobile: 'title',
                cell: (r) => (
                  <div className="flex items-start gap-3">
                    <span className={cn('mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full sm:flex', r.direction === 'in' ? 'bg-brand-green-soft text-brand-green-dark' : 'bg-surface-soft text-slate')}>
                      {r.direction === 'in' ? <ArrowDownLeft size={16} aria-hidden /> : <ArrowUpRight size={16} aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-medium text-ink">{r.title}</p>
                      <p className="text-[13px] text-steel">{KIND[r.kind]} · {methodText(r.method)}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'at', header: 'Date', mobile: 'subtitle', cell: (r) => formatDateTime(r.at) },
              { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusBadge> },
              {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                cell: (r) => <span className={cn('whitespace-nowrap font-medium', r.direction === 'in' ? 'text-brand-green-dark' : 'text-ink')}>{money(r.amount, r.currency, { sign: r.direction === 'in' ? '+' : '-' })}</span>,
              },
            ]}
          />
        </TabPanel>

        <TabPanel value="held" className="pt-5">
          {state.held.length === 0 ? (
            <SectionCard>
              <p className="text-sm text-steel">MINMEG holds no money for your trades right now.</p>
            </SectionCard>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {state.held.map((h) => (
                <SectionCard key={`${h.tradeId}:${h.side}:${h.currency}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-medium text-ink">{h.product}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <StatusBadge tone="dark">{SIDE_LABEL[h.side]}</StatusBadge>
                        <StatusBadge tone="neutral">{h.currency}</StatusBadge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-steel">{h.side === 'buying' ? 'You paid in' : 'Held for you'}</div>
                      <div className="break-words text-lg font-medium text-ink">{money(h.amount, h.currency)}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <SegmentProgress step={h.step} total={HELD_STEPS.length} label={HELD_STEPS[h.step - 1]} />
                    <p className="mt-2 text-[13px] text-slate">{h.waitingFor}</p>
                  </div>
                  <Link href={`/dashboard/trade/details/${h.tradeId}`} className="mt-3 inline-block text-[13px] font-medium text-primary hover:text-primary-pressed">Open the trade</Link>
                </SectionCard>
              ))}
            </div>
          )}
        </TabPanel>

        {canPayIn && (
          <TabPanel value="payin" className="pt-5">
            <PayInPanel state={state} />
          </TabPanel>
        )}

        <TabPanel value="settlement" className="pt-5">
          <SettlementPanel state={state} onSelect={setSelected} onToggleAuto={(on) => update((s) => ({ ...s, autoSettle: on }))} />
        </TabPanel>

        <TabPanel value="security" className="pt-5">
          <SecurityPanel state={state} onChangePin={() => setPinOpen(true)} />
        </TabPanel>
      </Tabs>

      {selected && (
        <SideSheet open onClose={() => setSelected(null)} title={selected.title} subtitle={KIND[selected.kind]}>
          <EntryDetail entry={state.entries.find((e) => e.id === selected.id) ?? selected} accounts={state.payoutAccounts} />
        </SideSheet>
      )}
      {paying && <PayInvoiceSheet invoice={paying} onClose={() => setPaying(null)} state={state} update={update} />}
      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} state={state} update={update} />
      <AddMoneyDialog open={addOpen} onClose={() => setAddOpen(false)} state={state} update={update} startWith={order[0]} />
      <ChangePinDialog open={pinOpen} onClose={() => setPinOpen(false)} state={state} update={update} />
    </div>
  );
}
