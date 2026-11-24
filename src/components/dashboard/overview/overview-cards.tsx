'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Award, Boxes, IdCard, Inbox, MessagesSquare, Plus, ScanLine, Search, Tag, Truck, ArrowLeftRight, FileText } from 'lucide-react';
import { QuickAction, SectionCard, SparkBars, StatTile } from '@/components/ui';
import { canOpenArea, useActor } from '@/lib/permissions';
import { number, percent, pick, total, type Series } from '@/lib/analytics';
import { paths } from '@/config/paths';
import { cn } from '@/utils/helper';
import { useGetAlertAnalyticsQuery, useGetCertificateAnalyticsQuery, useGetLogisticsAnalyticsQuery, useGetPassportCompletenessQuery, useGetTradeAnalyticsQuery } from '@/redux/features/analytics/analytics_api';
import { useGetMyRfqOfferSummaryQuery, useGetReceivedInquiriesSummaryQuery, useGetMyTradeInquiriesSummaryQuery } from '@/redux/features/trade/trade_api';
import { useGetBatchesQuery, useGetMaterialChoicesQuery, useGetUnitChoicesQuery } from '@/redux/features/batches/batches_api';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';
import type { TeamPermission } from '@/lib/permissions/team-permissions';
import type { WaitingItem } from '@/lib/overview';

type Role = 'buyer' | 'supplier' | 'buyer_supplier';
type Q = { from?: string; to?: string; interval?: string };
const counts = (s?: Series) => (s ?? []).map((p) => p.count).slice(-8);

/* ---------------------------------------------------------------- quick actions */

const ACTIONS: Record<Role, { href: string; icon: LucideIcon; label: string; key?: TeamPermission }[]> = {
  supplier: [
    { href: paths.dashboard.products.create, icon: Plus, label: 'New listing', key: 'products' },
    // the marketplace's RFQ list is open to every supplier (the rfq key is the buyer's posting side)
    { href: paths.marketplace.recentRfQ, icon: Tag, label: 'Find RFQs to bid on' },
    { href: paths.dashboard.receivedInquiries, icon: Inbox, label: 'Inquiries received', key: 'enquiries' },
    { href: paths.dashboard.scan, icon: ScanLine, label: 'Scan a code', key: 'traceability' },
    { href: paths.dashboard.handovers, icon: ArrowLeftRight, label: 'Handovers', key: 'traceability' },
    { href: paths.dashboard.chat.base, icon: MessagesSquare, label: 'Trade chat', key: 'chat' },
  ],
  buyer: [
    { href: paths.dashboard.rfqs.create, icon: Plus, label: 'New RFQ', key: 'rfq' },
    { href: paths.marketplace.products, icon: Search, label: 'Browse marketplace' },
    { href: paths.dashboard.rfqs.offers, icon: Tag, label: 'Offer board', key: 'rfq' },
    { href: paths.dashboard.receivedMaterials, icon: Boxes, label: 'Received materials', key: 'inventory' },
    { href: paths.dashboard.scan, icon: ScanLine, label: 'Scan a code', key: 'traceability' },
    { href: paths.dashboard.chat.base, icon: MessagesSquare, label: 'Trade chat', key: 'chat' },
  ],
  buyer_supplier: [
    { href: paths.dashboard.products.create, icon: Plus, label: 'New listing', key: 'products' },
    { href: paths.dashboard.rfqs.create, icon: Plus, label: 'New RFQ', key: 'rfq' },
    { href: paths.dashboard.rfqs.offers, icon: Tag, label: 'Offer board', key: 'rfq' },
    { href: paths.dashboard.scan, icon: ScanLine, label: 'Scan a code', key: 'traceability' },
    { href: paths.dashboard.handovers, icon: ArrowLeftRight, label: 'Handovers', key: 'traceability' },
    { href: paths.dashboard.chat.base, icon: MessagesSquare, label: 'Trade chat', key: 'chat' },
  ],
};

export function QuickActions({ role }: { role: Role }) {
  const actor = useActor();
  const actions = ACTIONS[role].filter((a) => !a.key || canOpenArea(actor, a.key));
  if (!actions.length) return null;
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6" data-testid="overview-quick-actions">
      {actions.map((a) => (
        <QuickAction key={a.label} href={a.href} icon={a.icon} label={a.label} />
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- key numbers (the analytics views, same period) */

const SideTag = ({ side }: { side: Exclude<Side, undefined> }) => (
  <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium', side === 'Selling' ? 'bg-brand-green-soft text-primary-pressed' : 'bg-surface-soft text-charcoal')}>{side}</span>
);
type Side = 'Selling' | 'Buying' | undefined;
/** The label stays on one line (owner, 2026-11-24); the Selling / Buying chip goes to the bottom of the card */
const Label = ({ text }: { text: string }) => <span className="block truncate whitespace-nowrap" title={text}>{text}</span>;

/** `waiting` (from GET /overview) gives the "waiting for you" hints, so the cards and the chips always agree */
export function KeyNumbers({ role, q, skip, waiting }: { role: Role; q: Q; skip: boolean; waiting: WaitingItem[] }) {
  const actor = useActor();
  const allowed = canOpenArea(actor, 'analytics');
  const opt = { skip: skip || !allowed };
  const supplier = role !== 'buyer';
  const t = useGetTradeAnalyticsQuery(q, opt).data?.data;
  const l = useGetLogisticsAnalyticsQuery(q, opt).data?.data;
  const a = useGetAlertAnalyticsQuery(q, opt).data?.data;
  const c = useGetCertificateAnalyticsQuery(q, { skip: opt.skip || role !== 'supplier' }).data?.data;
  const received = useGetReceivedInquiriesSummaryQuery(undefined, { skip: !supplier }).data?.data;
  const sent = useGetMyTradeInquiriesSummaryQuery(undefined, { skip: role !== 'buyer' }).data?.data;
  const offers = useGetMyRfqOfferSummaryQuery(undefined, { skip: role !== 'supplier' }).data?.data as Record<string, number> | undefined;
  if (!allowed) return null;
  const waitingCount = (key: WaitingItem['key']) => waiting.find((w) => w.key === key)?.count ?? 0;
  const openAlerts = pick(a?.alerts.byStatus, 'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING');
  const listings = { label: 'Listings on sale', side: (role === 'buyer_supplier' ? 'Selling' : undefined) as Side, value: number(pick(t?.listings.byStatus, 'published')), hint: `${number(total(t?.listings.byStatus))} listings in all`, trend: counts(t?.listings.published) };
  const trades = { label: 'Trades started', side: undefined as Side, value: number(t?.trades.created), hint: `${percent(t?.trades.conversionRate)} accepted`, trend: [] as number[] };
  const shipments = { label: 'Shipments on the way', side: undefined as Side, value: number(l?.shipments.inMotion), hint: openAlerts ? `${number(openAlerts)} open alert${openAlerts === 1 ? '' : 's'}` : l?.shipments.onTimeRate == null ? 'None arrived yet' : `${percent(l.shipments.onTimeRate)} arrived on time`, trend: [] as number[] };
  const rfqs = { label: 'RFQs posted', side: (role === 'buyer_supplier' ? 'Buying' : undefined) as Side, value: number(total(t?.rfqs.byStatus)), hint: `${number(pick(t?.rfqs.byStatus, 'published'))} open for offers`, trend: counts(t?.rfqs.posted) };
  const offersIn = { label: 'Offers received', side: (role === 'buyer_supplier' ? 'Buying' : undefined) as Side, value: number(total(t?.rfqs.offersByStatus)), hint: `${number(waitingCount('offers_to_compare'))} waiting for your decision`, trend: [] as number[] };
  const tiles =
    role === 'supplier'
      ? [
          listings,
          { label: 'Inquiries received', side: undefined as Side, value: number(total(t?.inquiries.byStatus)), hint: `${number(waitingCount('inquiries_to_answer'))} waiting for your answer`, trend: counts(t?.inquiries.received) },
          { label: 'Offers on RFQs', side: undefined as Side, value: number(offers?.total ?? 0), hint: `${number(offers?.SHORTLISTED ?? offers?.shortlisted ?? 0)} shortlisted by a buyer`, trend: [] as number[] },
          trades,
          shipments,
          { label: 'Published passports', side: undefined as Side, value: number(pick(c?.passports.byStatus, 'PUBLISHED')), hint: `${number(c?.certificates.expiringIn30Days)} certificates expire within 30 days`, trend: counts(c?.passports.versionsPublished) },
        ]
      : role === 'buyer'
        ? [
            rfqs,
            offersIn,
            { label: 'Inquiries sent', side: undefined as Side, value: number(total(t?.inquiries.byStatus)), hint: `${number(sent?.total ?? 0)} in all`, trend: counts(t?.inquiries.received) },
            trades,
            shipments,
            { label: 'Open alerts', side: undefined as Side, value: number(openAlerts), hint: 'On your shipments', trend: [] as number[] },
          ]
        : [
            listings,
            { label: 'Inquiries received', side: 'Selling' as Side, value: number(received?.total ?? 0), hint: `${number(waitingCount('inquiries_to_answer'))} waiting for your answer`, trend: [] as number[] },
            rfqs,
            offersIn,
            trades,
            shipments,
          ];
  return (
    <section aria-label="Key numbers for the period" className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6" data-testid="overview-numbers">
      {tiles.map((tile) => (
        <StatTile key={tile.label} label={<Label text={tile.label} />} value={tile.value} hint={tile.hint} trend={tile.trend.length > 1 ? <SparkBars values={tile.trend} /> : undefined} footer={tile.side ? <SideTag side={tile.side} /> : undefined} className="rounded-xl" />
      ))}
    </section>
  );
}

/* ---------------------------------------------------------------- stock, received materials, shipments, passports */

const Bar = ({ label, value, width }: { label: string; value: string; width: number }) => (
  <div className="mt-2.5">
    <div className="flex justify-between gap-2 text-[13px]">
      <span className="truncate text-charcoal">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline-soft">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(2, width)}%` }} />
    </div>
  </div>
);

/** Stock on hand (`own`) or received materials: the company's batches added up by material, in their unit */
export function StockCard({ received = false }: { received?: boolean }) {
  const actor = useActor();
  const allowed = canOpenArea(actor, 'inventory');
  const all = useGetBatchesQuery({ page: 1, limit: 100, ...(received ? { batchType: 'RECEIVED' } : {}) }, { skip: !allowed }).data?.data ?? [];
  const batches = received ? all : all.filter((b) => b.batchType !== 'RECEIVED');
  const materials = useGetMaterialChoicesQuery(undefined, { skip: !allowed }).data?.data ?? [];
  const units = useGetUnitChoicesQuery(undefined, { skip: !allowed }).data?.data ?? [];
  if (!allowed) return null;
  const live = batches.filter((b) => !b.retiredAt && Number(b.currentQuantity) > 0);
  const unitOf = (id: string) => units.find((u) => u.id === id)?.symbol ?? '';
  const byMaterial = new Map<string, { name: string; unit: string; qty: number }>();
  let held = 0;
  for (const b of live) {
    const key = `${b.materialId}:${b.quantityUnitId}`;
    const row = byMaterial.get(key) ?? { name: materials.find((m) => m.id === b.materialId)?.name ?? 'Material', unit: unitOf(b.quantityUnitId), qty: 0 };
    row.qty += Number(b.currentQuantity) || 0;
    byMaterial.set(key, row);
    held += (Number(b.reservedQuantity) || 0) + (Number(b.allocatedQuantity) || 0);
  }
  const rows = [...byMaterial.values()].sort((x, y) => y.qty - x.qty).slice(0, 4);
  const mainUnit = rows[0]?.unit ?? '';
  const sameUnit = rows.filter((r) => r.unit === mainUnit);
  const totalQty = sameUnit.reduce((n, r) => n + r.qty, 0);
  const top = rows[0]?.qty || 1;
  return (
    <SectionCard title={received ? 'Received materials' : 'Stock on hand'} actionHref={received ? paths.dashboard.receivedMaterials : paths.dashboard.batches} actionLabel={received ? 'Open' : 'Inventory'} className="flex-[1_1_280px]" data-testid={received ? 'overview-received' : 'overview-stock'}>
      {rows.length ? (
        <>
          <p className="text-3xl font-medium text-ink">{`${totalQty.toLocaleString()} ${mainUnit}`.trim()}</p>
          <p className="mb-3 mt-0.5 text-[13px] text-steel">
            In {live.length} {live.length === 1 ? 'batch' : 'batches'}
            {!received && held > 0 ? ` · ${held.toLocaleString()} ${mainUnit} held for trades` : ''}
          </p>
          {rows.map((r) => (
            <Bar key={`${r.name}:${r.unit}`} label={r.name} value={`${r.qty.toLocaleString()} ${r.unit}`.trim()} width={(r.qty / top) * 100} />
          ))}
        </>
      ) : (
        <p className="text-sm text-steel">{received ? 'Nothing received yet.' : 'No stock recorded yet.'}</p>
      )}
    </SectionCard>
  );
}

/** Shipments on the way: departed or in transit, with their planned arrival */
export function ShipmentsCard() {
  const actor = useActor();
  const allowed = canOpenArea(actor, 'shipments');
  const departed = useGetShipmentsQuery({ status: 'DEPARTED', limit: 3 }, { skip: !allowed }).data?.data ?? [];
  const moving = useGetShipmentsQuery({ status: 'IN_TRANSIT', limit: 3 }, { skip: !allowed }).data?.data ?? [];
  const shipments = [...moving, ...departed].slice(0, 3);
  if (!allowed) return null;
  return (
    <SectionCard title="Shipments on the way" actionHref={paths.dashboard.shipments} actionLabel="All shipments" className="flex-[1_1_320px]" data-testid="overview-shipments">
      {shipments.length ? (
        shipments.map((s) => (
          <Link key={s.id} href={`${paths.dashboard.shipments}/${s.id}`} className="mt-1 flex items-start gap-3 border-t border-hairline-soft py-3 first:border-t-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-soft text-slate">
              <Truck className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{s.shipmentNumber}</span>
              <span className="mt-0.5 block text-[13px] text-steel">{[s.origin?.name, s.destination?.name].filter(Boolean).join(' → ') || 'Route not set'}</span>
              <span className="mt-1.5 block text-xs text-steel">{s.plannedArrivalAt ? `Arrives around ${new Date(s.plannedArrivalAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : 'No planned arrival'}</span>
            </span>
          </Link>
        ))
      ) : (
        <p className="text-sm text-steel">No shipments on the way.</p>
      )}
    </SectionCard>
  );
}

/** Passports and certificates (suppliers): completeness, published, drafts, certificates expiring */
export function PassportsCard({ q, skip }: { q: Q; skip: boolean }) {
  const actor = useActor();
  const allowed = canOpenArea(actor, 'passports');
  const c = useGetCertificateAnalyticsQuery(q, { skip: skip || !allowed || !canOpenArea(actor, 'analytics') }).data?.data;
  const completeness = useGetPassportCompletenessQuery({ attention: 1 }, { skip: !allowed || !canOpenArea(actor, 'analytics') }).data?.data;
  if (!allowed) return null;
  const average = completeness?.summary?.averageMandatory ?? null;
  const rows: { icon: LucideIcon; label: string; value: number | undefined; tone: string; href: string }[] = [
    { icon: IdCard, label: 'Published passports', value: pick(c?.passports.byStatus, 'PUBLISHED'), tone: 'bg-brand-green-soft text-primary', href: paths.dashboard.passports.list },
    { icon: FileText, label: 'Drafts failing validation', value: c?.passports.draftsFailingValidation, tone: 'bg-surface-soft text-slate', href: paths.dashboard.passports.list },
    { icon: Award, label: 'Certificates expiring within 30 days', value: c?.certificates.expiringIn30Days, tone: 'bg-semantic-warning-bg text-semantic-warning-text', href: paths.dashboard.certificates },
  ];
  return (
    <SectionCard title="Passports and certificates" actionHref={paths.dashboard.passports.list} actionLabel="Open" className="flex-[1_1_280px]" data-testid="overview-passports">
      {average !== null && <Bar label="Required fields filled, on average" value={percent(average)} width={average} />}
      {rows.map((r) => (
        <Link key={r.label} href={r.href} className="mt-2.5 flex items-center gap-3 border-t border-hairline-soft pt-3 text-ink">
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', r.tone)}>
            <r.icon className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm text-charcoal">{r.label}</span>
          <span className="text-lg font-medium">{number(r.value)}</span>
        </Link>
      ))}
    </SectionCard>
  );
}

