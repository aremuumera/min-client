'use client';

import * as React from 'react';
import { Button, CopyableId, DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, SideSheet, StatusBadge, Tab, TabList, TabPanel, Tabs } from '@/components/ui';
import { CarbonDetail, StartCarbon, TradeCarbon } from '@/components/esg/carbon-panel';
import { toApiError } from '@/lib/api/errors';
import { amount, ASSESSMENT_STATUS_TEXT, statusTone, SUBJECT_TEXT, TRUST_TEXT, trustTone, type AssessmentStatus, type CarbonAssessment } from '@/lib/esg';
import { esgHelp } from '@/lib/help/esg';
import { RequireAccess } from '@/lib/permissions';
import { useAppSelector } from '@/redux/hooks';
import { useGetBuyerTradesQuery, useGetCarbonAssessmentsQuery } from '@/redux/features/esg/esg_api';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';
import { useGetTradeAllocationsQuery } from '@/redux/features/trade/trade_api';

/* ESG & carbon (step 2.10, decision #110): the company's own assessments, and the suppliers' on its trades */
type View = 'carbon' | 'trades';
const STATUSES = (['DRAFT', 'CALCULATED', 'PENDING_VERIFICATION', 'VERIFIED', 'SUPERSEDED', 'INVALIDATED'] as AssessmentStatus[]).map((s) => ({ value: s, label: ASSESSMENT_STATUS_TEXT[s] }));
const SUBJECTS = ['BATCH', 'SHIPMENT', 'ORGANIZATION'].map((s) => ({ value: s, label: SUBJECT_TEXT[s] }));

function OwnCarbon({ orgId }: { orgId: string | null }) {
  const [status, setStatus] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  React.useEffect(() => setPage(1), [status, subject]);
  const list = useGetCarbonAssessmentsQuery({ page, limit, status, subjectType: subject });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-steel">Start a batch’s or shipment’s from its ESG & carbon tab. Here you can start one for the company as a whole.</p>
        {orgId && <Button size="sm" variant="outlined" onClick={() => setStarting(true)}>Start one for the company</Button>}
      </div>
      <FilterBar activeCount={(status ? 1 : 0) + (subject ? 1 : 0)} onClear={() => { setStatus(''); setSubject(''); }}>
        <DropdownSelect aria-label="About" value={subject} onValueChange={setSubject} options={SUBJECTS} placeholder="All subjects" className="md:w-48" />
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={STATUSES} placeholder="All statuses" className="md:w-56" />
      </FilterBar>
      <DataTable<CarbonAssessment>
        caption="Carbon assessments"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: 'No carbon assessments yet', description: 'Open a batch in Inventory, ESG & carbon tab, to start one.' }}
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelected(r.id)}
        selectedId={selected}
        columns={[
          { key: 'code', header: 'Assessment', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.assessmentCode}</p><p className="text-sm text-steel">{r.methodologyCode} {r.methodologyVersion} · version {r.version}</p></div>) },
          { key: 'about', header: 'About', mobile: 'subtitle', cell: (r) => SUBJECT_TEXT[r.subjectType] },
          { key: 'total', header: 'Total', cell: (r) => (r.calculatedAt ? `${amount(r.totalEmissions.value)} ${r.totalEmissions.unit ?? ''}` : '—') },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={statusTone(r.status)}>{ASSESSMENT_STATUS_TEXT[r.status]}</StatusBadge> },
          { key: 'trust', header: 'Checked', cell: (r) => <StatusBadge tone={trustTone(r.trust.level)}>{TRUST_TEXT[r.trust.level]}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      {selected && (
        <SideSheet open onClose={() => setSelected(null)} title="Carbon assessment" size="lg">
          <CarbonDetail id={selected} mode="owner" />
        </SideSheet>
      )}
      {starting && orgId && <StartCarbon subjectType="ORGANIZATION" subjectId={orgId} onClose={() => setStarting(false)} onCreated={setSelected} />}
    </>
  );
}

function OneTrade({ tradeId }: { tradeId: string }) {
  const allocations = useGetTradeAllocationsQuery(tradeId);
  const shipments = useGetShipmentsQuery({ tradeId, limit: 50 });
  if (allocations.isLoading || shipments.isLoading) return <p className="text-sm text-steel">Loading…</p>;
  const batches = [...new Map((allocations.data?.data ?? []).filter((a) => a.batch && !['RELEASED', 'CANCELLED'].includes(a.status)).map((a) => [a.batch!.id, a.batch!])).values()];
  return <TradeCarbon batches={batches} shipments={(shipments.data?.data ?? []).filter((s) => s.status !== 'CANCELLED')} seller={false} />;
}

function OnMyTrades() {
  const trades = useGetBuyerTradesQuery();
  const [tradeId, setTradeId] = React.useState('');
  const options = (trades.data?.data ?? []).map((t) => ({ value: t.id, label: `${t.tradeCode} · ${t.status.toLowerCase()}` }));
  return (
    <div className="space-y-4">
      <p className="text-sm text-steel">The carbon figures your suppliers shared on a trade where you are the buyer.</p>
      <DropdownSelect aria-label="Trade" value={tradeId} onValueChange={setTradeId} options={options} placeholder={trades.isLoading ? 'Loading…' : options.length ? 'Choose a trade' : 'No trades as buyer yet'} searchable={options.length > 8} className="md:w-96" />
      {tradeId && (
        <>
          <p className="text-xs text-steel">Trade ID <CopyableId value={tradeId} /></p>
          <OneTrade tradeId={tradeId} />
        </>
      )}
    </div>
  );
}

function EsgPage() {
  const { isTeamMember, ownerUserId, user } = useAppSelector((s) => s.auth);
  const orgId = ((isTeamMember ? ownerUserId : user?.id) as string | undefined) ?? null;
  const [tab, setTab] = React.useState<View>('carbon');
  return (
    <div>
      <PageHeader title="ESG & carbon" help={esgHelp} description="Your own carbon figures, added up by MINMEG and confirmed once independently verified, and those your suppliers shared on your trades. MINMEG never rates them." />
      <Tabs value={tab} onChange={(v) => setTab(v as View)}>
        <TabList className="mb-4" aria-label="ESG and carbon">
          <Tab value="carbon" label="My carbon" />
          <Tab value="trades" label="On my trades" />
        </TabList>
        <TabPanel value="carbon"><OwnCarbon orgId={orgId} /></TabPanel>
        <TabPanel value="trades"><OnMyTrades /></TabPanel>
      </Tabs>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="esg">
      <EsgPage />
    </RequireAccess>
  );
}
