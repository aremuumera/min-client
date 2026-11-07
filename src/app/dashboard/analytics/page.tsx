'use client';

import * as React from 'react';
import { PageHeader, Tab, TabList, TabPanel, Tabs } from '@/components/ui';
import { AlertsSection, OverviewSection, PassportsSection, QualitySection, ShipmentsSection, StockSection, SustainabilitySection, TradeSection } from '@/components/analytics/sections';
import { WindowFilter } from '@/components/analytics/window-filter';
import { DEFAULT_WINDOW, windowQuery, type WindowChoice } from '@/lib/analytics';
import { analyticsHelp } from '@/lib/help/analytics';
import { RequireAccess, useActor } from '@/lib/permissions';
import { useGetTradeAnalyticsQuery } from '@/redux/features/analytics/analytics_api';

/*
 * Analytics (step 2.14, decision #115): the company's own numbers for a chosen period, in tabs by
 * area. What shows depends on the role (D3): buyers their buying, suppliers their selling, stock,
 * quality and passports; buyer-and-supplier both. Read-only.
 */
function AnalyticsPage() {
  const actor = useActor();
  const buyer = actor.role === 'buyer' || actor.role === 'buyer_supplier';
  const supplier = actor.role === 'supplier' || actor.role === 'buyer_supplier';
  const [choice, setChoice] = React.useState<WindowChoice>(DEFAULT_WINDOW);
  const [tab, setTab] = React.useState('overview');
  // worked out once per choice ("last 30 days" from the moment it is chosen), so every tab asks for the same period
  const query = React.useMemo(() => windowQuery(choice), [choice]);
  const q = query ?? {};
  const opt = { skip: !query };
  const shown = useGetTradeAnalyticsQuery(q, opt).data?.data.window;
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'trade', label: 'Trade' },
    { value: 'shipments', label: 'Shipments' },
    ...(supplier ? [{ value: 'stock', label: 'Stock' }, { value: 'quality', label: 'Quality' }, { value: 'passports', label: 'Passports and certificates' }] : []),
    { value: 'sustainability', label: 'ESG and carbon' },
    { value: 'alerts', label: 'Alerts' },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" help={analyticsHelp} description="How your business on MINMEG is going, from your own records. Choose the period; every tab follows it." />
      <WindowFilter value={choice} onChange={setChoice} shown={shown} />
      <Tabs value={tab} onChange={setTab}>
        <TabList className="mb-4 overflow-x-auto" aria-label="Analytics">
          {tabs.map((t) => <Tab key={t.value} value={t.value} label={t.label} className="shrink-0 whitespace-nowrap" />)}
        </TabList>
        <TabPanel value="overview"><OverviewSection q={q} opt={opt} buyer={buyer} supplier={supplier} onOpen={setTab} /></TabPanel>
        <TabPanel value="trade"><TradeSection q={q} opt={opt} window={shown} buyer={buyer} supplier={supplier} /></TabPanel>
        <TabPanel value="shipments"><ShipmentsSection q={q} opt={opt} window={shown} /></TabPanel>
        {supplier && <TabPanel value="stock"><StockSection q={q} opt={opt} window={shown} /></TabPanel>}
        {supplier && <TabPanel value="quality" className="space-y-4"><QualitySection q={q} opt={opt} window={shown} /></TabPanel>}
        {supplier && <TabPanel value="passports" className="space-y-4"><PassportsSection q={q} opt={opt} window={shown} /></TabPanel>}
        <TabPanel value="sustainability"><SustainabilitySection q={q} opt={opt} window={shown} /></TabPanel>
        <TabPanel value="alerts"><AlertsSection q={q} opt={opt} window={shown} /></TabPanel>
      </Tabs>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="analytics">
      <AnalyticsPage />
    </RequireAccess>
  );
}
