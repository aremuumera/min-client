'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { OWNER_STATUSES, ROLE_LABEL, dataRequestStatusLabel, dataRequestTone, type DataRequestRow } from '@/lib/data-requests';
import { formatDateTime } from '@/lib/format';
import { dataRequestsHelp } from '@/lib/help/passports';
import { RequireAccess } from '@/lib/permissions';
import { useGetDataRequestsQuery } from '@/redux/features/passports/passports_api';

/* Data requests (decision #137): people without an account ask for more of your passports; MINMEG checked them first */
function DataRequestsPage() {
  const router = useRouter();
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const list = useGetDataRequestsQuery({ page, limit, status });
  return (
    <div>
      <PageHeader title="Data requests" help={dataRequestsHelp} description="People without a MINMEG account who ask for more of your passports than the public page shows. MINMEG checks each request first. You decide." />
      <FilterBar activeCount={status ? 1 : 0} onClear={() => { setStatus(''); setPage(1); }}>
        <DropdownSelect aria-label="Status" value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} placeholder="All statuses" options={OWNER_STATUSES.map((s) => ({ value: s, label: dataRequestStatusLabel(s) }))} />
      </FilterBar>
      <DataTable<DataRequestRow>
        caption="Data requests"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading || list.isUninitialized}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={status ? { title: 'No request matches', description: 'Choose another status.' } : { title: 'No data requests yet', description: 'When someone asks for more of one of your passports and MINMEG has checked the request, it appears here.' }}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`${paths.dashboard.dataRequests}/${r.id}`)}
        columns={[
          { key: 'who', header: 'From', mobile: 'title', cell: (r) => (<div><p className="font-medium text-ink">{r.requester.organization}</p><p className="text-sm text-steel">{r.requester.name} · {ROLE_LABEL[r.requester.role] ?? r.requester.role}</p></div>) },
          { key: 'passport', header: 'Passport', mobile: 'subtitle', cell: (r) => r.passportCode ?? '—' },
          { key: 'code', header: 'Request', cell: (r) => r.requestCode },
          { key: 'at', header: 'Received', cell: (r) => (r.forwardedAt ? formatDateTime(r.forwardedAt) : '—') },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={dataRequestTone(r.status)}>{dataRequestStatusLabel(r.status)}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="passports">
      <DataRequestsPage />
    </RequireAccess>
  );
}
