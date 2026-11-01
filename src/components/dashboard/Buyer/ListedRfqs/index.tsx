'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button, DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, StatTile, StatusBadge } from '@/components/ui';
import { RfqDetailSheet } from '@/components/rfqs/rfq-detail-sheet';
import { paths } from '@/config/paths';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { myRfqsHelp } from '@/lib/help/rfqs';
import { RFQ_STATUS_OPTIONS, rfqStatusLabel, rfqStatusTone, type Rfq } from '@/lib/rfqs';
import { useGetAllRfqByBuyerIdQuery, useGetBuyerRfqSummaryQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetMarketplaceMaterialsQuery } from '@/redux/features/listings/listings_api';

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* My RFQs (step 2.6b): the buyer's RFQs in any status */
export default function ListedRfQs() {
  const { effectiveUserId } = useAuthIdentity();
  const buyerId = effectiveUserId ?? '';
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [materialId, setMaterialId] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, status, materialId]);
  const list = useGetAllRfqByBuyerIdQuery({ buyerId, page, limit, q: debounced, status, materialId }, { skip: !buyerId, refetchOnMountOrArgChange: true });
  const summary = useGetBuyerRfqSummaryQuery(buyerId, { skip: !buyerId, refetchOnMountOrArgChange: true });
  const materials = useGetMarketplaceMaterialsQuery();
  const counts = summary.data?.data;
  const rows = (list.data?.data ?? []) as Rfq[];
  const filterCount = [status, materialId].filter(Boolean).length;
  const meta = list.data ? { currentPage: list.data.page, totalPages: list.data.totalPages, totalItems: list.data.total_items } : undefined;
  const newRfq = (
    <Link href={paths.dashboard.rfqs.create}>
      <Button startIcon={<Plus className="h-4 w-4" aria-hidden />}>New RFQ</Button>
    </Link>
  );

  return (
    <div>
      <PageHeader title="My RFQs" help={myRfqsHelp} description="What your company asked suppliers and MINMEG to source." actions={newRfq} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="All RFQs" value={counts?.total ?? '—'} />
        <StatTile label="Published" value={counts ? (counts.published ?? 0) + (counts.pending ?? 0) : '—'} />
        <StatTile label="In negotiation" value={counts ? (counts.in_negotiation ?? 0) : '—'} />
        <StatTile label="Drafts" value={counts ? (counts.draft ?? 0) : '—'} />
      </div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search your RFQs"
        activeCount={filterCount}
        onClear={() => {
          setStatus('');
          setMaterialId('');
        }}
      >
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={RFQ_STATUS_OPTIONS} placeholder="All statuses" className="md:w-44" />
        <DropdownSelect aria-label="Material" value={materialId} onValueChange={setMaterialId} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))} placeholder="All materials" className="md:w-48" />
      </FilterBar>
      <DataTable<Rfq>
        caption="My RFQs"
        rows={list.isError ? undefined : rows}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={debounced || filterCount ? { title: 'No RFQ matches', description: 'Change the search or the filters.' } : { title: 'No RFQs yet', description: "Post what you need, even if it isn't on any list.", action: newRfq }}
        getRowId={(r) => r.rfqId}
        onRowClick={(r) => setSelectedId(r.rfqId)}
        selectedId={selectedId}
        columns={[
          { key: 'name', header: 'Name', mobile: 'title', className: 'min-w-[220px]', cell: (r) => <span className="font-medium text-ink">{r.rfqProductName}</span> },
          { key: 'category', header: 'Category', cell: (r) => r.rfqProductSubCategory ?? r.rfqProductCategory },
          { key: 'quantity', header: 'Quantity', mobile: 'subtitle', cell: (r) => `${r.quantityRequired} ${r.unit?.symbol ?? r.quantityMeasure}` },
          { key: 'purity', header: 'Purity', cell: (r) => r.purity_grade ?? '—' },
          { key: 'moisture', header: 'Moisture', cell: (r) => (r.moisture_max == null ? '—' : `${r.moisture_max}%`) },
          { key: 'offers', header: 'Offers', cell: (r) => r.offerCount ?? 0 },
          { key: 'deadline', header: 'Deadline', cell: (r) => (r.bidding_deadline ? formatDate(r.bidding_deadline) : '—') },
          { key: 'created', header: 'Date created', cell: (r) => formatDate(r.createdAt) },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={rfqStatusTone(r.status)}>{rfqStatusLabel(r.status)}</StatusBadge> },
        ]}
      />
      <PaginationBar
        meta={meta}
        page={page}
        onPage={setPage}
        limit={limit}
        onLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
      <RfqDetailSheet rfqId={selectedId} row={rows.find((r) => r.rfqId === selectedId)} buyerId={buyerId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
