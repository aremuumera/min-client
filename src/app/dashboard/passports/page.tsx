'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button, CopyableId, DataTable, DownloadButton, DropdownSelect, FilterBar, PageHeader, PaginationBar, SideSheet, StatusBadge } from '@/components/ui';
import { BulkJobPanel } from '@/components/bulk/bulk-job-panel';
import { ImportSheet } from '@/components/bulk/import-sheet';
import { bulk, type BulkJob } from '@/lib/bulk';
import { PassportDetail } from '@/components/passports/passport-panel';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { passportsHelp } from '@/lib/help/passports';
import { PASSPORT_STATUS_TEXT, passportTone, type Passport } from '@/lib/passports';
import { RequireAccess } from '@/lib/permissions';
import { useAppSelector } from '@/redux/hooks';
import { useGetPassportsQuery, useGetTemplatesQuery, useLazyGetPassportsQuery } from '@/redux/features/passports/passports_api';

/* Passports (step 2.9b): the company's own passports. Passports shared with it are read on each trade's Passport & certificates tab */
const STATUSES = (['DRAFT', 'PUBLISHED', 'SUSPENDED', 'REVOKED', 'ARCHIVED'] as const).map((s) => ({ value: s, label: PASSPORT_STATUS_TEXT[s] }));

function PassportsPage() {
  const { isTeamMember, ownerUserId, user } = useAppSelector((s) => s.auth);
  const orgId = ((isTeamMember ? ownerUserId : user?.id) as string | undefined) ?? null;
  const [status, setStatus] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  React.useEffect(() => setPage(1), [status, search]);
  const q = search.trim();
  const list = useGetPassportsQuery({ page, limit, status, ...(q.length >= 2 ? { q } : {}) });
  const [selected, setSelected] = React.useState<Passport | null>(null);
  // decision #128: import from a spreadsheet, and publish every draft in one go
  const token = useAppSelector((s) => (s.auth as { token?: string | null }).token ?? null);
  const templates = useGetTemplatesQuery({ status: 'PUBLISHED', limit: 100 });
  const [fetchPassports] = useLazyGetPassportsQuery();
  const [importing, setImporting] = React.useState(false);
  const [publishing, setPublishing] = React.useState<BulkJob | null>(null);
  const [starting, setStarting] = React.useState(false);
  const publishDrafts = async () => {
    setStarting(true);
    try {
      const ids: string[] = [];
      for (let p = 1; p <= 50; p++) {
        const res = await fetchPassports({ page: p, limit: 100, status: 'DRAFT' }).unwrap();
        ids.push(...res.data.map((x) => x.id));
        if (p >= (res.meta?.totalPages ?? 1)) break;
      }
      if (!ids.length) toast.info('You have no draft passport to publish.');
      else setPublishing(await bulk.startAction({ kind: 'PUBLISH_PASSPORTS', passportIds: ids }, token));
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setStarting(false);
    }
  };
  return (
    <div>
      <PageHeader title="Passports" help={passportsHelp} description="The digital passport of each of your batches. Issue one from the batch's Passport tab. A supplier's passport on your trade opens from that trade's Passport & certificates tab." actions={<div className="flex flex-wrap items-center gap-2"><Button variant="outlined" color="secondary" size="sm" onClick={() => setImporting(true)} data-testid="open-import-passports">Import</Button><Button variant="outlined" color="secondary" size="sm" loading={starting} onClick={publishDrafts} data-testid="publish-drafts">Publish all drafts</Button><DownloadButton path="/certificates/export.csv" params={{ status, ...(q.length >= 2 ? { q } : {}) }} fileName="passports.csv" data-testid="export-passports">Export CSV</DownloadButton></div>} />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by passport code" activeCount={status ? 1 : 0} onClear={() => setStatus('')}>
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={STATUSES} placeholder="All statuses" className="md:w-52" />
      </FilterBar>
      <DataTable<Passport>
        caption="Passports"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{ title: 'No passports yet', description: 'Open a batch in Inventory and use its Passport tab to issue one.' }}
        getRowId={(r) => r.id}
        onRowClick={setSelected}
        columns={[
          { key: 'code', header: 'Passport', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.passportCode}</p><p className="text-sm text-steel">{r.certificateType?.name}</p></div>) },
          { key: 'version', header: 'Published version', cell: (r) => (r.publishedVersion ? `${r.publishedVersion.versionNumber}, ${r.publishedVersion.publishedAt ? formatDateTime(r.publishedVersion.publishedAt) : ''}` : '—') },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={passportTone(r.status)}>{PASSPORT_STATUS_TEXT[r.status]}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      {selected && (
        <SideSheet open onClose={() => setSelected(null)} title={selected.passportCode} subtitle={<span>About batch <CopyableId value={selected.subjectId} /></span>}>
          <PassportDetail passportId={selected.id} mode={selected.ownerOrganizationId === orgId ? 'owner' : 'reader'} batchId={selected.subjectType === 'BATCH' ? selected.subjectId : null} />
        </SideSheet>
      )}
      <ImportSheet kind="passports" open={importing} onClose={() => setImporting(false)} onImported={() => list.refetch()} templates={(templates.data?.data ?? []).map((t) => ({ value: t.id, label: `${t.name} (${t.code} v${t.version})` }))} />
      {publishing && (
        <SideSheet open onClose={() => setPublishing(null)} title="Publish all drafts" subtitle="Check first, then publish" size="lg">
          <BulkJobPanel job={publishing} token={token} noun="passport" verb="publish" onFinished={(j) => j.succeeded > 0 && list.refetch()} />
        </SideSheet>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="passports">
      <PassportsPage />
    </RequireAccess>
  );
}
