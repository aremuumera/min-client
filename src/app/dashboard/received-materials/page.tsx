'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { BatchDetailSheet, type BatchPermissions } from '@/components/batches/batch-detail-sheet';
import { toApiError } from '@/lib/api/errors';
import { batchLabel, formatQuantity, type Batch } from '@/lib/batches';
import { formatDate } from '@/lib/format';
import { RequireAccess } from '@/lib/permissions';
import { useGetBatchesQuery, useGetMaterialChoicesQuery } from '@/redux/features/batches/batches_api';

/*
 * Received materials (decision #126): every delivery a buyer accepts becomes a batch record of its
 * own, linked to the batch it came from, so the origin stays traceable through the buyer. A
 * buyer-only company reads them here; nothing can be changed (splitting, processing and listing
 * need a supplier account). The backend returns only this company's records and decides access.
 */
const READ_ONLY: BatchPermissions = { edit: false, operate: false, adjust: false, quarantine: false, releaseStaffHold: false };

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ReceivedMaterialsPage() {
  const [search, setSearch] = React.useState('');
  const [materialId, setMaterialId] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, materialId]);

  const list = useGetBatchesQuery({ page, limit, search: debounced, materialId, batchType: 'RECEIVED', includeRetired: true });
  const materials = useGetMaterialChoicesQuery();
  const [selectedId, setSelectedId] = React.useState<string | null>(useSearchParams().get('batch'));

  return (
    <div>
      <PageHeader
        title="Received materials"
        description="A record of each delivery you accepted, linked to where the material came from. MINMEG keeps the chain so you can show the origin of what you bought."
      />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search batch code" activeCount={materialId ? 1 : 0} onClear={() => setMaterialId('')}>
        <DropdownSelect aria-label="Material" value={materialId} onValueChange={setMaterialId} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))} placeholder="All materials" className="md:w-56" />
      </FilterBar>
      <DataTable<Batch>
        caption="Received materials"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || materialId
            ? { title: 'No record matches', description: 'Change the search or the material.' }
            : { title: 'Nothing received yet', description: 'When you record a delivery on a shipment, what you accept appears here.' }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          {
            key: 'batch',
            header: 'Material',
            mobile: 'title',
            className: 'min-w-[220px]',
            cell: (r) => (
              <div>
                <p className="font-medium text-ink">{r.material?.name ?? '—'}</p>
                <p className="text-sm text-steel">{r.batchCode}</p>
              </div>
            ),
          },
          { key: 'quantity', header: 'Received', mobile: 'subtitle', cell: (r) => formatQuantity(r.initialQuantity, r.unit?.symbol) },
          { key: 'site', header: 'Where it is now', cell: (r) => r.currentLocation?.name ?? '—' },
          { key: 'verification', header: 'Verification', cell: (r) => batchLabel(r.verificationStatus) },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.batchStatus}>{batchLabel(r.batchStatus)}</StatusBadge> },
          { key: 'created', header: 'Received on', cell: (r) => formatDate(r.createdAt) },
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
      <BatchDetailSheet batchId={selectedId} can={READ_ONLY} onClose={() => setSelectedId(null)} onOpenBatch={setSelectedId} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role="buyer" teamKey="inventory">
      <React.Suspense fallback={null}>
        <ReceivedMaterialsPage />
      </React.Suspense>
    </RequireAccess>
  );
}
