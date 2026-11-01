'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, StatTile, StatusBadge } from '@/components/ui';
import { MaterialRequestDetailSheet } from '@/components/listings/material-request-detail-sheet';
import { MaterialRequestForm } from '@/components/listings/material-request-form';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { materialRequestsHelp } from '@/lib/help/material-requests';
import { MATERIAL_REQUEST_STATUSES, materialRequestLabel, materialRequestTone, type MaterialRequest } from '@/lib/listings';
import { RequireAccess } from '@/lib/permissions';
import { useGetMaterialRequestSummaryQuery, useGetMaterialRequestsQuery } from '@/redux/features/listings/listings_api';

/* Material requests (decision #98): what the company asked MINMEG to add, and the answers */
function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const answerOf = (r: MaterialRequest) => {
  if (r.status === 'PENDING') return '—';
  if (r.status === 'REFUSED') return r.reviewReason ?? '—';
  return `Added as ${r.material?.name ?? r.requestedName}`;
};

function MaterialRequestsPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [asking, setAsking] = React.useState(false);
  // A notification opens the request it is about
  const [selectedId, setSelectedId] = React.useState<string | null>(useSearchParams().get('request'));
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, status]);
  const list = useGetMaterialRequestsQuery({ page, limit, search: debounced, status }, { refetchOnMountOrArgChange: true });
  const summary = useGetMaterialRequestSummaryQuery(undefined, { refetchOnMountOrArgChange: true });
  const counts = summary.data?.data;
  const filterCount = status ? 1 : 0;
  const ask = <Button startIcon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setAsking(true)}>Ask for a material</Button>;

  return (
    <div>
      <PageHeader title="Material requests" help={materialRequestsHelp} description="Materials your company asked MINMEG to add, and the answers." actions={ask} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="All requests" value={counts?.total ?? '—'} />
        {MATERIAL_REQUEST_STATUSES.map((s) => (
          <StatTile key={s} label={materialRequestLabel(s)} value={counts?.[s] ?? '—'} />
        ))}
      </div>
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search material name" activeCount={filterCount} onClear={() => setStatus('')}>
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={MATERIAL_REQUEST_STATUSES.map((s) => ({ value: s, label: materialRequestLabel(s) }))} placeholder="All statuses" className="md:w-52" />
      </FilterBar>
      <DataTable<MaterialRequest>
        caption="Material requests"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || filterCount
            ? { title: 'No request matches', description: 'Change the search or the filter.' }
            : { title: 'No requests yet', description: "If a material you sell isn't in the list, ask MINMEG to add it.", action: ask }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          { key: 'material', header: 'Material', mobile: 'title', className: 'min-w-[200px]', cell: (r) => <span className="font-medium text-ink">{r.requestedName}</span> },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={materialRequestTone(r.status)}>{materialRequestLabel(r.status)}</StatusBadge> },
          { key: 'answer', header: "MINMEG's answer", mobile: 'subtitle', className: 'min-w-[240px]', cell: (r) => answerOf(r) },
          { key: 'sent', header: 'Sent', cell: (r) => formatDate(r.createdAt) },
          { key: 'answered', header: 'Answered', cell: (r) => (r.reviewedAt ? formatDate(r.reviewedAt) : '—') },
        ]}
      />
      <PaginationBar
        meta={list.data?.meta}
        page={page}
        onPage={setPage}
        limit={limit}
        onLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
      <MaterialRequestForm open={asking} onClose={() => setAsking(false)} />
      <MaterialRequestDetailSheet requestId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="products">
      <React.Suspense fallback={null}>
        <MaterialRequestsPage />
      </React.Suspense>
    </RequireAccess>
  );
}
