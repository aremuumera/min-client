'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Globe2, Landmark, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button, CopyableId, DropdownSelect, FormField, Modal, ModalBody, ModalFooter, ModalHeader, PinInput, SideSheet, StatusBadge, TextField } from '@/components/ui';
import { cn } from '@/utils/helper';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Currency, InvoiceToPay, PayMethod, WalletEntry } from './wallet-types';
import { BankDetails, PermanentAccountDetails, UsdWireDetails } from './pay-in';
import { CURRENCY_NAME, balancesOf, money, newId, oneTimeAccountFor, type WalletState } from './wallet-store';

type Update = (fn: (s: WalletState) => WalletState) => void;
const now = () => new Date().toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

/* Withdraw: currency, amount, verified account, PIN */
export function WithdrawDialog({ open, onClose, state, update }: { open: boolean; onClose: () => void; state: WalletState; update: Update }) {
  const balances = balancesOf(state);
  const currencies = (['NGN', 'USD'] as Currency[]).filter((c) => balances[c].available > 0);
  const [ccy, setCcy] = React.useState<Currency>(currencies[0] ?? 'NGN');
  const [amount, setAmount] = React.useState('');
  const accounts = state.payoutAccounts.filter((a) => a.currency === ccy && a.status === 'VERIFIED');
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? '');
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setAmount('');
    setPin('');
    setError('');
  }, [open]);
  React.useEffect(() => {
    setAccountId(state.payoutAccounts.find((a) => a.currency === ccy && a.status === 'VERIFIED')?.id ?? '');
  }, [ccy, state.payoutAccounts]);

  const available = balances[ccy].available;
  const value = Number(amount.replace(/,/g, ''));
  const submit = () => {
    if (!value || value <= 0) return setError('Enter an amount.');
    if (value > available) return setError(`You have ${money(available, ccy)} available.`);
    if (!accountId) return setError('Choose the account to pay into.');
    if (pin.length < 4) return setError('Enter your 4-digit wallet PIN.');
    if (pin !== state.pin) {
      setPin('');
      return setError('That PIN is not right. Five wrong tries lock withdrawals for 30 minutes.');
    }
    const acct = state.payoutAccounts.find((a) => a.id === accountId)!;
    const at = now();
    const entry: WalletEntry = {
      id: newId(`wallet:${state.companyId}:withdraw:${at}`), at, kind: 'payout', direction: 'out', title: `Withdrawal to ${acct.bankName} ••${acct.accountNumber.slice(-4)}`, currency: ccy, amount: round2(value), status: 'processing', method: 'bank_payout',
      reference: newId(`ref:withdraw:${state.companyId}:${at}`), accountId: acct.id,
      steps: [
        { title: 'Withdrawal requested with your PIN', at, done: true },
        { title: 'Sent to your bank', at: null, done: false, note: ccy === 'NGN' ? 'Same working day for naira' : 'Next working day for dollars' },
        { title: `Paid to ${acct.bankName} ••${acct.accountNumber.slice(-4)}`, at: null, done: false },
      ],
    };
    update((s) => ({ ...s, entries: [entry, ...s.entries] }));
    toast.success(`${money(value, ccy)} is on its way to ${acct.bankName}.`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="md" mobileFullScreen>
      <ModalHeader>Withdraw to your bank</ModalHeader>
      <ModalBody className="space-y-4">
        {currencies.length === 0 ? (
          <p className="text-sm text-steel">Nothing to withdraw yet: money shows as available once MINMEG releases it.</p>
        ) : (
          <>
            <FormField label="From" htmlFor="withdraw-ccy">
              <DropdownSelect id="withdraw-ccy" value={ccy} onValueChange={(v) => setCcy(v as Currency)} options={currencies.map((c) => ({ value: c, label: `${CURRENCY_NAME[c]} wallet (${money(balances[c].available, c)} available)` }))} />
            </FormField>
            <FormField label="Amount" htmlFor="withdraw-amount" help={<button type="button" className="font-medium text-primary hover:text-primary-pressed" onClick={() => setAmount(String(available))}>Withdraw all ({money(available, ccy)})</button>}>
              <TextField id="withdraw-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder={ccy === 'NGN' ? '₦0.00' : '$0.00'} fullWidth />
            </FormField>
            <FormField label="To" htmlFor="withdraw-account">
              <DropdownSelect id="withdraw-account" value={accountId} onValueChange={setAccountId} options={accounts.map((a) => ({ value: a.id, label: `${a.bankName} · ${a.accountNumber} (${a.kind})` }))} placeholder="No verified account in this currency" />
            </FormField>
            <div>
              <div className="mb-2 text-sm font-medium text-ink">Wallet PIN</div>
              <PinInput aria-label="Wallet PIN" value={pin} onChange={setPin} error={!!error && error.includes('PIN')} />
              {state.demoPin && <p className="mt-2 text-xs text-steel">Demo PIN: {state.demoPin}</p>}
            </div>
            {error && <p role="alert" className="text-sm text-semantic-error-text">{error}</p>}
          </>
        )}
      </ModalBody>
      <ModalFooter className="gap-2">
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        {currencies.length > 0 && <Button onClick={submit}>Withdraw</Button>}
      </ModalFooter>
    </Modal>
  );
}

/* Add money: the permanent NGN account or the USD wire; the demo can make a transfer arrive */
export function AddMoneyDialog({ open, onClose, state, update, startWith }: { open: boolean; onClose: () => void; state: WalletState; update: Update; startWith: Currency }) {
  const [ccy, setCcy] = React.useState<Currency>(startWith);
  const [amount, setAmount] = React.useState('');
  React.useEffect(() => {
    if (open) {
      setCcy(startWith);
      setAmount('');
    }
  }, [open, startWith]);
  const arrive = () => {
    const value = Number(amount.replace(/,/g, ''));
    if (!value || value <= 0) return toast.error('Enter the amount you sent.');
    const at = now();
    const local = ccy === 'NGN';
    const entry: WalletEntry = {
      id: newId(`wallet:${state.companyId}:topup:${at}`), at, kind: 'top_up', direction: 'in', title: local ? 'Bank transfer to your MINMEG account' : 'USD wire to your MINMEG wallet', currency: ccy, amount: round2(value), status: 'received',
      method: local ? 'permanent_account' : 'usd_wire', reference: newId(`ref:topup:${state.companyId}:${at}`),
      steps: [
        { title: local ? 'Transfer sent to your permanent account number' : 'SWIFT wire sent with your wallet reference', at, done: true },
        { title: 'Matched to your company by MINMEG', at, done: true },
        { title: 'Added to your wallet balance', at, done: true },
      ],
    };
    update((s) => ({ ...s, entries: [entry, ...s.entries] }));
    toast.success(`${money(value, ccy)} added to your ${CURRENCY_NAME[ccy].toLowerCase()} wallet.`);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} size="lg" mobileFullScreen>
      <ModalHeader>Add money</ModalHeader>
      <ModalBody className="space-y-4">
        <MethodPicker
          value={ccy}
          onChange={(v) => setCcy(v as Currency)}
          options={[
            { value: 'NGN', icon: <Landmark size={18} aria-hidden />, title: 'Naira, from a Nigerian bank', text: 'Transfer to your permanent account: in minutes' },
            { value: 'USD', icon: <Globe2 size={18} aria-hidden />, title: 'US dollars, from abroad', text: 'SWIFT wire: 1 to 3 working days' },
          ]}
        />
        {ccy === 'NGN' ? state.permanentAccount && <PermanentAccountDetails account={state.permanentAccount} /> : state.usdWire && <UsdWireDetails wire={state.usdWire} />}
        <div className="rounded-lg border border-dashed border-hairline-strong p-4">
          <div className="text-sm font-medium text-ink">Try it in the demo</div>
          <p className="mt-1 text-[13px] text-steel">Pretend the transfer has arrived: type what you sent.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <TextField aria-label="Amount sent" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder={ccy === 'NGN' ? '₦0.00' : '$0.00'} fullWidth />
            <Button variant="outlined" onClick={arrive} className="sm:shrink-0">The money has arrived</Button>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

/* Choose a currency or a way to pay: one card per option */
function MethodPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; icon: React.ReactNode; title: string; text: string; disabled?: boolean; note?: string }[] }) {
  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            value === o.value ? 'border-primary bg-brand-green-soft' : 'border-hairline bg-canvas hover:border-hairline-strong',
          )}
        >
          <span className="mt-0.5 text-primary">{o.icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{o.title}</span>
            <span className="block text-[13px] text-steel">{o.note ?? o.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* Pay one invoice: from the wallet balance (PIN), a one-time NGN account, or a USD wire with the invoice ID as reference */
export function PayInvoiceSheet({ invoice, onClose, state, update }: { invoice: InvoiceToPay; onClose: () => void; state: WalletState; update: Update }) {
  const balances = balancesOf(state);
  const ccy = invoice.currency;
  const enough = balances[ccy].available >= invoice.amount;
  const [method, setMethod] = React.useState<PayMethod>(enough ? 'wallet_balance' : ccy === 'NGN' ? 'one_time_account' : 'usd_wire');
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const oneTime = state.oneTime[invoice.invoiceId];

  const pay = (how: PayMethod) => {
    const at = now();
    const confirmedNow = how !== 'usd_wire';
    const entry: WalletEntry = {
      id: newId(`wallet:${state.companyId}:pay:${invoice.invoiceId}`), at, kind: 'payment', direction: 'out', title: `${invoice.invoiceType}: ${invoice.product}`, currency: ccy, amount: invoice.amount,
      invoiceNgn: invoice.rate ? invoice.amountNgn : undefined, rate: invoice.rate, status: confirmedNow ? 'held' : 'processing', method: how, reference: newId(`ref:${invoice.invoiceId}:${at}`),
      invoiceId: invoice.invoiceId, invoiceType: invoice.invoiceType, tradeId: invoice.tradeId, product: invoice.product,
      steps: [
        { title: 'Invoice issued by MINMEG', at: invoice.issuedAt, done: true, note: invoice.rate ? `Rate locked: ₦${invoice.rate.toLocaleString('en-US')} to $1` : undefined },
        { title: how === 'wallet_balance' ? 'You paid from your wallet balance' : how === 'one_time_account' ? 'You paid by transfer to a one-time account' : 'You sent a USD wire (SWIFT)', at, done: true },
        { title: 'MINMEG confirmed the money', at: confirmedNow ? at : null, done: confirmedNow, note: confirmedNow ? undefined : 'A SWIFT wire takes 1 to 3 working days' },
        { title: 'Held in escrow until delivery and inspection', at: confirmedNow ? at : null, done: confirmedNow },
        { title: 'Released to the seller', at: null, done: false, note: 'Only after you confirm delivery' },
      ],
    };
    update((s) => {
      const rest = { ...s.oneTime };
      delete rest[invoice.invoiceId];
      return { ...s, entries: [entry, ...s.entries], toPay: s.toPay.filter((p) => p.invoiceId !== invoice.invoiceId), oneTime: rest };
    });
    toast.success(confirmedNow ? `Paid. MINMEG holds ${money(invoice.amount, ccy)} for this trade until delivery.` : 'Wire noted. MINMEG confirms it when it arrives.');
    onClose();
  };

  const payFromBalance = () => {
    if (pin.length < 4) return setError('Enter your 4-digit wallet PIN.');
    if (pin !== state.pin) {
      setPin('');
      return setError('That PIN is not right.');
    }
    pay('wallet_balance');
  };

  const openOneTime = () => {
    const a = oneTimeAccountFor(invoice.invoiceId, state.companyName);
    update((s) => ({ ...s, oneTime: { ...s.oneTime, [invoice.invoiceId]: a } }));
  };

  return (
    <SideSheet
      open
      onClose={onClose}
      title={`Pay ${money(invoice.amount, ccy)}`}
      subtitle={`${invoice.invoiceType}: ${invoice.product}`}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outlined" onClick={onClose}>Close</Button>
          {method === 'wallet_balance' && <Button onClick={payFromBalance} disabled={!enough}>Pay from balance</Button>}
          {method === 'one_time_account' && oneTime && <Button onClick={() => pay('one_time_account')}>The transfer has arrived (demo)</Button>}
          {method === 'usd_wire' && <Button onClick={() => pay('usd_wire')}>I have sent the wire</Button>}
        </div>
      }
    >
      <div className="space-y-5">
        <BankDetails
          rows={[
            { label: 'Amount to pay', value: money(invoice.amount, ccy) },
            ...(invoice.rate ? [{ label: 'Invoice amount', value: money(invoice.amountNgn, 'NGN') }, { label: 'Exchange rate (locked)', value: `₦${invoice.rate.toLocaleString('en-US')} = $1` }] : []),
            { label: 'Pay by', value: formatDate(invoice.dueAt) },
            { label: 'Paid to', value: 'MINMEG escrow: held until the goods are inspected and delivered' },
          ]}
        />
        <div className="space-y-1 text-[13px] text-steel">
          <div>Invoice</div>
          <CopyableId value={invoice.invoiceId} />
          <Link href={`/dashboard/invoices/${invoice.invoiceId}`} className="block font-medium text-primary hover:text-primary-pressed">Open the invoice</Link>
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-ink">How do you want to pay?</div>
          <MethodPicker
            value={method}
            onChange={(v) => {
              setMethod(v as PayMethod);
              setError('');
            }}
            options={[
              { value: 'wallet_balance', icon: <Wallet size={18} aria-hidden />, title: 'Wallet balance', text: `${money(balances[ccy].available, ccy)} available`, disabled: !enough, note: enough ? undefined : `Only ${money(balances[ccy].available, ccy)} available` },
              ...(ccy === 'NGN'
                ? [{ value: 'one_time_account', icon: <Building2 size={18} aria-hidden />, title: 'One-time account', text: 'For this invoice only, open 48 hours' }]
                : [{ value: 'usd_wire', icon: <Globe2 size={18} aria-hidden />, title: 'USD wire (SWIFT)', text: 'Invoice ID as the reference' }]),
            ]}
          />
        </div>
        {method === 'wallet_balance' && enough && (
          <div>
            <div className="mb-2 text-sm font-medium text-ink">Wallet PIN</div>
            <PinInput aria-label="Wallet PIN" value={pin} onChange={setPin} error={!!error} />
            {state.demoPin && <p className="mt-2 text-xs text-steel">Demo PIN: {state.demoPin}</p>}
            {error && <p role="alert" className="mt-2 text-sm text-semantic-error-text">{error}</p>}
          </div>
        )}
        {method === 'one_time_account' &&
          (oneTime ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="warning">Open until {formatDateTime(oneTime.expiresAt)}</StatusBadge>
              </div>
              <BankDetails
                rows={[
                  { label: 'Bank', value: oneTime.bankName },
                  { label: 'Account number', value: oneTime.accountNumber, copy: true },
                  { label: 'Account name', value: oneTime.accountName },
                  { label: 'Send exactly', value: money(invoice.amount, 'NGN') },
                ]}
              />
              <p className="text-[13px] text-steel">Send the exact amount from any Nigerian bank. A different amount is sent back. The account closes once paid.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-hairline p-4">
              <p className="text-sm text-slate">MINMEG opens an account number for this invoice only, for the exact amount.</p>
              <Button className="mt-3" variant="outlined" onClick={openOneTime}>Get a one-time account</Button>
            </div>
          ))}
        {method === 'usd_wire' && (
          <div className="space-y-3">
            {state.usdWire && <UsdWireDetails wire={state.usdWire} reference={invoice.invoiceId} />}
            <p className="text-[13px] text-steel">Put the invoice ID in the payment reference and send {money(invoice.amount, 'USD')} with charges paid by you (OUR), so the full amount arrives.</p>
          </div>
        )}
      </div>
    </SideSheet>
  );
}

/* Change the wallet PIN: the current one, then the new one twice */
export function ChangePinDialog({ open, onClose, state, update }: { open: boolean; onClose: () => void; state: WalletState; update: Update }) {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [again, setAgain] = React.useState('');
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setAgain('');
      setError('');
    }
  }, [open]);
  const save = () => {
    if (current !== state.pin) return setError('Your current PIN is not right.');
    if (next.length < 4) return setError('Choose 4 digits.');
    if (/^(\d)\1{3}$/.test(next) || next === '1234' || next === '0000') return setError('Choose a PIN that is harder to guess.');
    if (next !== again) return setError('The two new PINs do not match.');
    update((s) => ({ ...s, pin: next, demoPin: next, pinChangedAt: now() }));
    toast.success('Wallet PIN changed.');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" mobileFullScreen>
      <ModalHeader>Change wallet PIN</ModalHeader>
      <ModalBody className="space-y-4">
        <div>
          <div className="mb-2 text-sm font-medium text-ink">Current PIN</div>
          <PinInput aria-label="Current PIN" value={current} onChange={setCurrent} autoFocus />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-ink">New PIN</div>
          <PinInput aria-label="New PIN" value={next} onChange={setNext} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-ink">New PIN again</div>
          <PinInput aria-label="New PIN again" value={again} onChange={setAgain} />
        </div>
        {error && <p role="alert" className="text-sm text-semantic-error-text">{error}</p>}
      </ModalBody>
      <ModalFooter className="gap-2">
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save PIN</Button>
      </ModalFooter>
    </Modal>
  );
}
