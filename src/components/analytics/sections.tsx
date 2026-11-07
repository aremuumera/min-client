'use client';

import * as React from 'react';
import { DropdownSelect } from '@/components/ui';
import { duration, number, percent, pick, total, type InspectionsAnalytics, type Window } from '@/lib/analytics';
import {
  useGetAlertAnalyticsQuery,
  useGetCertificateAnalyticsQuery,
  useGetComplianceAnalyticsQuery,
  useGetEsgCarbonAnalyticsQuery,
  useGetInspectionAnalyticsQuery,
  useGetLogisticsAnalyticsQuery,
  useGetMeasurementAnalyticsQuery,
  useGetSupplierAnalyticsQuery,
  useGetTraceabilityAnalyticsQuery,
  useGetTradeAnalyticsQuery,
} from '@/redux/features/analytics/analytics_api';
import { useGetMeasurementChoicesQuery } from '@/redux/features/locations/locations_api';
import { useGetActiveStandardsQuery } from '@/redux/features/passports/passports_api';
import { Breakdown, Pair, Section, Tiles, Trend } from './charts';

/*
 * The sections of the Analytics page (step 2.14, D3/D4). Each reads one Group 27 view for the
 * chosen window; the backend counts only the company's own records.
 */
export type Q = { from?: string; to?: string; interval?: string };
type Opt = { skip: boolean };

/** The key numbers of every area, each pointing to its tab */
export function OverviewSection({ q, opt, buyer, supplier, onOpen }: { q: Q; opt: Opt; buyer: boolean; supplier: boolean; onOpen: (tab: string) => void }) {
  const trade = useGetTradeAnalyticsQuery(q, opt);
  const logistics = useGetLogisticsAnalyticsQuery(q, opt);
  const alerts = useGetAlertAnalyticsQuery(q, opt);
  const certs = useGetCertificateAnalyticsQuery(q, { skip: opt.skip || !supplier });
  const t = trade.data?.data;
  const l = logistics.data?.data;
  const a = alerts.data?.data;
  const c = certs.data?.data;
  const link = (tab: string, text: string) => <button type="button" className="text-primary hover:underline" onClick={() => onOpen(tab)}>{text}</button>;
  return (
    <Section title="At a glance" description="The main numbers for the period. Open a tab for the detail." query={trade} testId="analytics-overview">
      <Tiles
        items={[
          ...(supplier ? [{ label: 'Listings on sale', value: number(pick(t?.listings.byStatus, 'published')), hint: link('trade', `${number(total(t?.listings.byStatus))} listings in all`) }] : []),
          ...(buyer ? [{ label: 'RFQs posted', value: number(total(t?.rfqs.byStatus)), hint: link('trade', 'See requests and offers') }] : []),
          { label: supplier && !buyer ? 'Inquiries received' : buyer && !supplier ? 'Inquiries sent' : 'Inquiries', value: number(total(t?.inquiries.byStatus)), hint: link('trade', 'See trades') },
          { label: 'Trades started', value: number(t?.trades.created), hint: `${percent(t?.trades.conversionRate)} accepted` },
          { label: 'Shipments on the way', value: number(l?.shipments.inMotion), hint: link('shipments', l?.shipments.onTimeRate == null ? 'None arrived yet' : `${percent(l.shipments.onTimeRate)} arrived on time`) },
          ...(supplier ? [{ label: 'Published passports', value: number(pick(c?.passports.byStatus, 'PUBLISHED')), hint: link('passports', `${number(c?.certificates.expiringIn30Days)} certificates expire within 30 days`) }] : []),
          { label: 'Alerts on my shipments', value: number(total(a?.alerts.byType)), hint: link('alerts', `${number(pick(a?.alerts.byStatus, 'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING'))} still open`) },
        ]}
      />
    </Section>
  );
}

/** Requests, offers, inquiries, trades and listings */
export function TradeSection({ q, opt, window, buyer, supplier }: { q: Q; opt: Opt; window?: Window; buyer: boolean; supplier: boolean }) {
  const query = useGetTradeAnalyticsQuery(q, opt);
  const d = query.data?.data;
  return (
    <Section title="Trade" description="Your requests for quotes, inquiries and trades in the period. A trade is accepted once both sides and MINMEG agree." query={query} testId="analytics-trade">
      {d && window && (
        <>
          <Tiles
            items={[
              { label: 'Trades started', value: number(d.trades.created) },
              { label: 'Accepted', value: number(d.trades.accepted), hint: `${percent(d.trades.conversionRate)} of those started` },
              { label: 'Cancelled', value: number(d.trades.cancelled), hint: `${percent(d.trades.cancellationRate)} of those started` },
              { label: 'From stock held to delivered', value: duration(d.allocations.averageHoursHoldToFulfil), hint: 'On average' },
            ]}
          />
          <Pair>
            <Trend title={supplier && !buyer ? 'Inquiries received' : buyer && !supplier ? 'Inquiries sent' : 'Inquiries'} series={d.inquiries.received} window={window} />
            <Breakdown title="Inquiries by status" counts={d.inquiries.byStatus} />
          </Pair>
          {buyer && (
            <Pair>
              <Trend title="RFQs posted" series={d.rfqs.posted} window={window} />
              <Breakdown title="Offers on my RFQs, by status" counts={d.rfqs.offersByStatus} />
            </Pair>
          )}
          {supplier && !buyer && <Breakdown title="My offers on buyers' RFQs, by status" counts={d.rfqs.offersByStatus} />}
          <Pair>
            <Breakdown title="All my trades, by status" counts={d.trades.byStatus} />
            <Breakdown title="Trades started from" counts={d.trades.bySource} labels={{ PRODUCT_INQUIRY: 'An inquiry on a listing', RFQ_OFFER: 'An offer on an RFQ' }} />
          </Pair>
          {supplier && (
            <Pair>
              <Trend title="Listings published" series={d.listings.published} window={window} />
              <Breakdown title="My listings, by status" counts={d.listings.byStatus} />
            </Pair>
          )}
        </>
      )}
    </Section>
  );
}

/** Shipments on the way, on time, transit, checkpoints (both sides) */
export function ShipmentsSection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const logistics = useGetLogisticsAnalyticsQuery(q, opt);
  const trace = useGetTraceabilityAnalyticsQuery(q, opt);
  const l = logistics.data?.data;
  const t = trace.data?.data;
  return (
    <Section title="Shipments" description="Shipments on your trades: on the way, on time, and how long they take. On time means it arrived by its planned date." query={logistics} testId="analytics-shipments">
      {l && window && (
        <>
          <Tiles
            items={[
              { label: 'On the way now', value: number(l.shipments.inMotion) },
              { label: 'Arrived on time', value: percent(l.shipments.onTimeRate), hint: `${number(l.shipments.onTimeArrivals)} of ${number(l.shipments.arrivedWithPlan)} with a planned date` },
              { label: 'Time on the road', value: duration(l.shipments.averageTransitHours), hint: 'On average, departure to arrival' },
              { label: 'Checkpoint passes', value: number(total(l.checkpoints.visitsByStatus)) },
            ]}
          />
          <Pair>
            {t ? <Trend title="Shipments dispatched" series={t.shipments.dispatched} window={window} /> : <span />}
            <Breakdown title="All my shipments, by status" counts={l.shipments.byStatus} />
          </Pair>
          <Pair>
            <Breakdown title="Checkpoint passes, by result" counts={l.checkpoints.visitsByStatus} />
            <Breakdown title="Location updates, by source" counts={l.pings.bySource} />
          </Pair>
        </>
      )}
    </Section>
  );
}

/** Batches, stock movements and events (suppliers) */
export function StockSection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const query = useGetTraceabilityAnalyticsQuery(q, opt);
  const d = query.data?.data;
  return (
    <Section title="Stock" description="Your batches, the stock movements recorded on them, and the events on your goods." query={query} testId="analytics-stock">
      {d && window && (
        <>
          <Tiles
            items={[
              { label: 'Batches', value: number(total(d.batches.byStatus)), hint: `${number(pick(d.batches.byStatus, 'ACTIVE'))} active` },
              { label: 'On hold', value: number(pick(d.batches.byStatus, 'QUARANTINED', 'SUSPENDED')), hint: 'Quarantined or suspended' },
              { label: 'Stock movements', value: number(total(d.ledger.entriesByType)) },
              { label: 'Changes waiting for MINMEG', value: number(d.ledger.waitingForApproval) },
            ]}
          />
          <Pair>
            <Trend title="Batches created" series={d.batches.created} window={window} />
            <Breakdown title="Batches, by status" counts={d.batches.byStatus} />
          </Pair>
          <Pair>
            <Breakdown title="Stock movements, by kind" counts={d.ledger.entriesByType} />
            <Breakdown title="New batches, by source" counts={d.batches.bySourceType} />
          </Pair>
          <Pair>
            <Trend title="Events recorded" series={d.events.recorded} window={window} />
            <Breakdown title="Events, by status" counts={d.events.byStatus} />
          </Pair>
        </>
      )}
    </Section>
  );
}

/** My performance as a seller, inspections, lab grades, readings (suppliers) */
export function QualitySection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const perf = useGetSupplierAnalyticsQuery(q, opt);
  const insp = useGetInspectionAnalyticsQuery(q, opt);
  const me = perf.data?.data.suppliers[0];
  const i = insp.data?.data;
  return (
    <>
      <Section title="My performance as a seller" description="From your trades in the period. There is no pass or fail of inspections: “checked by MINMEG” counts the results MINMEG verified." query={perf} testId="analytics-performance">
        <Tiles
          items={[
            { label: 'Deliveries', value: number(me?.deliveries ?? 0), hint: `${number(me?.trades ?? 0)} trades` },
            { label: 'Delivered on time', value: percent(me?.onTimeRate) },
            { label: 'Quantity rejected by buyers', value: percent(me?.rejectionRate), hint: `${number(me?.returns ?? 0)} returns` },
            { label: 'Inspection results checked by MINMEG', value: `${number(me?.inspectionResultsVerified ?? 0)} of ${number(me?.inspectionResults ?? 0)}`, hint: `${number(me?.quarantines ?? 0)} quarantines, ${number(me?.disqualifications ?? 0)} disqualifications` },
          ]}
        />
      </Section>
      <Section title="Inspections and lab grades" description="Inspections on your trades and the lab results on your batches." query={insp} testId="analytics-inspections">
        {i && window && <InspectionBody data={i} window={window} />}
      </Section>
      <ReadingsSection q={q} opt={opt} window={window} />
    </>
  );
}

export function InspectionBody({ data: i, window }: { data: InspectionsAnalytics['data']; window: Window }) {
  return (
    <>
      <Tiles
        items={[
          { label: 'Inspections', value: number(total(i.assignments.byStatus)) },
          { label: 'Time to complete', value: duration(i.assignments.averageHoursToComplete), hint: 'On average, from assignment' },
          { label: 'Inspection results', value: number(total(i.results.inspectionByStatus)) },
          { label: 'Lab results', value: number(total(i.results.assayByStatus)) },
        ]}
      />
      <Pair>
        <Trend title="Inspections scheduled" series={i.assignments.scheduled} window={window} />
        <Breakdown title="Inspections, by status" counts={i.assignments.byStatus} />
      </Pair>
      <figure className="space-y-2">
        <figcaption className="text-sm font-medium text-ink">Lab grades (final and checked results)</figcaption>
        {!i.grades.length ? (
          <p className="text-sm text-steel">No lab grades in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead><tr className="border-b border-hairline text-steel"><th className="py-2 font-medium">Measured</th><th className="py-2 text-right font-medium">Results</th><th className="py-2 text-right font-medium">Average</th><th className="py-2 text-right font-medium">Lowest</th><th className="py-2 text-right font-medium">Highest</th></tr></thead>
              <tbody>{i.grades.map((g) => <tr key={g.parameter} className="border-b border-hairline"><td className="py-2">{g.parameter}</td><td className="py-2 text-right">{number(g.results)}</td><td className="py-2 text-right">{g.average}</td><td className="py-2 text-right">{g.min}</td><td className="py-2 text-right">{g.max}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </figure>
    </>
  );
}

/** Readings: volume and checks; one reading type's average, lowest and highest per period (D5) */
function ReadingsSection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const [type, setType] = React.useState('');
  const query = useGetMeasurementAnalyticsQuery({ ...q, ...(type ? { measurementTypeId: type } : {}) }, opt);
  const types = useGetMeasurementChoicesQuery();
  const names = Object.fromEntries((types.data?.data ?? []).map((t) => [t.id, t.name]));
  const d = query.data?.data;
  return (
    <Section title="Readings" description="Readings recorded on your batches and shipments, and whether MINMEG or a device checked them." query={query} testId="analytics-readings">
      {d && window && (
        <>
          <Pair>
            <Trend title="Readings recorded" series={d.recorded} window={window} />
            <Breakdown title="Readings, by kind" counts={d.byType} labels={names} />
          </Pair>
          <Pair>
            <Breakdown title="Readings, by check" counts={d.byVerification} />
            <Breakdown title="Readings, by source" counts={d.bySource} />
          </Pair>
          <div className="space-y-2">
            <DropdownSelect aria-label="Reading type" value={type} onValueChange={setType} placeholder="Choose a reading type to see its values" options={(types.data?.data ?? []).map((t) => ({ value: t.id, label: t.name }))} searchable className="md:w-80" />
            {type && (
              !d.values?.length ? (
                <p className="text-sm text-steel">No {names[type] ?? 'readings of this type'} in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm" aria-label={`${names[type]} per period`}>
                    <thead><tr className="border-b border-hairline text-steel"><th className="py-2 font-medium">Period</th><th className="py-2 text-right font-medium">Readings</th><th className="py-2 text-right font-medium">Average</th><th className="py-2 text-right font-medium">Lowest</th><th className="py-2 text-right font-medium">Highest</th></tr></thead>
                    <tbody>{d.values.map((v) => <tr key={v.period} className="border-b border-hairline"><td className="py-2">{new Date(v.period).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td><td className="py-2 text-right">{number(v.count)}</td><td className="py-2 text-right">{v.avg ?? '—'}</td><td className="py-2 text-right">{v.min ?? '—'}</td><td className="py-2 text-right">{v.max ?? '—'}</td></tr>)}</tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </Section>
  );
}

/** Passports, certificates and compliance checks (suppliers) */
export function PassportsSection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const certs = useGetCertificateAnalyticsQuery(q, opt);
  const comp = useGetComplianceAnalyticsQuery(q, opt);
  const standards = useGetActiveStandardsQuery();
  const standardNames = Object.fromEntries((standards.data?.data ?? []).map((s) => [s.id, s.name]));
  const c = certs.data?.data;
  const k = comp.data?.data;
  return (
    <>
      <Section title="Passports and certificates" description="Your passports, and the certificates MINMEG issued on your company, batches, results and shipments." query={certs} testId="analytics-passports">
        {c && window && (
          <>
            <Tiles
              items={[
                { label: 'Published passports', value: number(pick(c.passports.byStatus, 'PUBLISHED')), hint: `${number(total(c.passports.byStatus))} in all` },
                { label: 'From draft to published', value: duration(c.passports.averageHoursDraftToPublish), hint: 'On average' },
                { label: 'Drafts with problems to fix', value: number(c.passports.draftsFailingValidation) },
                { label: 'Certificates expiring within 30 days', value: number(c.certificates.expiringIn30Days) },
              ]}
            />
            <Pair>
              <Trend title="Passport versions published" series={c.passports.versionsPublished} window={window} />
              <Breakdown title="Passports, by status" counts={c.passports.byStatus} />
            </Pair>
            <Pair>
              <Trend title="Certificates issued" series={c.certificates.issued} window={window} />
              <Breakdown title="Certificates, by status" counts={c.certificates.byStatus} />
            </Pair>
          </>
        )}
      </Section>
      <Section title="Compliance checks" description="The current compliance checks on your passports, and MINMEG’s verification of them." query={comp} testId="analytics-compliance">
        {k && window && (
          <>
            <Tiles
              items={[
                { label: 'Current checks', value: number(total(k.current.byStatus)) },
                { label: 'Verified by MINMEG', value: number(pick(k.current.byVerification, 'VERIFIED')) },
                { label: 'Expiring within 30 days', value: number(k.expiringIn30Days) },
                { label: 'Time for MINMEG to verify', value: duration(k.averageHoursToVerify), hint: 'On average' },
              ]}
            />
            <Pair>
              <Trend title="Checks done" series={k.assessed} window={window} />
              <Breakdown title="Checks, by standard" counts={k.current.byStandard} labels={standardNames} />
            </Pair>
            <Pair>
              <Breakdown title="Checks, by result" counts={k.current.byStatus} />
              <Breakdown title="Checks, by MINMEG verification" counts={k.current.byVerification} />
            </Pair>
          </>
        )}
      </Section>
    </>
  );
}

/** ESG and carbon: counts and the company's own declared figures; MINMEG never rates (D8) */
export function SustainabilitySection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const query = useGetEsgCarbonAnalyticsQuery(q, opt);
  const d = query.data?.data;
  const confirmed = d?.carbon.declaredTotals.find((t) => t.status === 'VERIFIED');
  return (
    <Section
      title="ESG and carbon"
      description="Figures are your own declarations. “Confirmed” means MINMEG checked them against an independent verifier’s statement. MINMEG does not rate."
      query={query}
      testId="analytics-esg"
    >
      {d && window && (
        <>
          <Tiles
            items={[
              { label: 'ESG results', value: number(total(d.esg.byStatus)), hint: `${number(pick(d.esg.byStatus, 'VERIFIED'))} confirmed by MINMEG` },
              { label: 'Carbon assessments', value: number(total(d.carbon.byStatus)), hint: `${number(pick(d.carbon.byStatus, 'VERIFIED'))} confirmed by MINMEG` },
              { label: 'Declared emissions, confirmed', value: confirmed?.totalEmissions === null || confirmed?.totalEmissions === undefined ? '—' : `${number(confirmed.totalEmissions)} t CO₂e`, hint: `${number(confirmed?.assessments ?? 0)} confirmed assessments` },
              { label: 'Waiting for MINMEG', value: number(pick(d.esg.byStatus, 'PENDING_VERIFICATION') + pick(d.carbon.byStatus, 'PENDING_VERIFICATION')) },
            ]}
          />
          <Pair>
            <Breakdown title="ESG results, by scheme" counts={d.esg.byFramework} />
            <Breakdown title="Carbon assessments, by method" counts={d.carbon.byMethodology} />
          </Pair>
          <Pair>
            <Trend title="ESG results added" series={d.esg.created} window={window} />
            <Trend title="Carbon assessments started" series={d.carbon.created} window={window} />
          </Pair>
        </>
      )}
    </Section>
  );
}

/** Alerts on my shipments and the notices I received */
export function AlertsSection({ q, opt, window }: { q: Q; opt: Opt; window?: Window }) {
  const query = useGetAlertAnalyticsQuery(q, opt);
  const d = query.data?.data;
  return (
    <Section title="Alerts" description="Problems MINMEG’s tracking found on your shipments, and how fast they were handled." query={query} testId="analytics-alerts">
      {d && window && (
        <>
          <Tiles
            items={[
              { label: 'Alerts', value: number(total(d.alerts.byType)) },
              { label: 'Still open', value: number(pick(d.alerts.byStatus, 'OPEN', 'ACKNOWLEDGED', 'INVESTIGATING')) },
              { label: 'Time to acknowledge', value: d.alerts.averageMinutesToAcknowledge === null ? '—' : duration(d.alerts.averageMinutesToAcknowledge / 60), hint: 'On average' },
              { label: 'Time to resolve', value: duration(d.alerts.averageHoursToResolve), hint: 'On average' },
            ]}
          />
          <Pair>
            <Trend title="Alerts raised" series={d.alerts.detected} window={window} />
            <Breakdown title="Alerts, by kind" counts={d.alerts.byType} />
          </Pair>
          <Pair>
            <Breakdown title="Alerts, by severity" counts={d.alerts.bySeverity} labels={{ CRITICAL: 'Critical', HIGH: 'High', WARNING: 'Warning', INFO: 'Information' }} />
            <Breakdown title="Notices I received" counts={d.notifications.receivedByReadStatus} labels={{ UNREAD: 'Unread', SEEN: 'Seen', READ: 'Read', ACKNOWLEDGED: 'Acknowledged', DISMISSED: 'Dismissed' }} />
          </Pair>
        </>
      )}
    </Section>
  );
}

