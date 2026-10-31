'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, Checkbox, DataTable, FilterBar, NativeSelect, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { BatchDetailSheet, type BatchPermissions } from '@/components/batches/batch-detail-sheet';
import { BatchDocumentsPanel } from '@/components/batches/batch-documents-panel';
import { BatchFormSheet } from '@/components/batches/batch-form-sheet';
import { toApiError } from '@/lib/api/errors';
import { BATCH_STATUSES, batchLabel, batchOptions, formatQuantity, type Batch } from '@/lib/batches';
import { formatDate } from '@/lib/format';
import { inventoryHelp } from '@/lib/help/inventory';
import { RequireAccess } from '@/lib/permissions';
import { useGetBatchesQuery, useGetMaterialChoicesQuery } from '@/redux/features/batches/batches_api';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';

/*
 * Inventory (step 2.5 B): the company's own batches. The backend only returns this company's, and
 * decides every action; a hold raised by staff can't be lifted here.
 */
const OWNER_ACCESS: BatchPermissions = { edit: true, operate: true, adjust: true, quarantine: true, releaseStaffHold: false };

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function InventoryPage() {
  const [search, setSearch] = React.useState('');
  const [materialId, setMaterialId] = React.useState('');
  const [batchStatus, setBatchStatus] = React.useState('');
  const [currentLocationId, setCurrentLocationId] = React.useState('');
  const [includeRetired, setIncludeRetired] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, materialId, batchStatus, currentLocationId, includeRetired]);

  const list = useGetBatchesQuery({ page, limit, search: debounced, materialId, batchStatus, currentLocationId, includeRetired: includeRetired || undefined });
  const materials = useGetMaterialChoicesQuery();
  const locations = useGetLocationsQuery({ active: true, limit: 100 });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [registering, setRegistering] = React.useState(false);
  const filterCount = [materialId, batchStatus, currentLocationId, includeRetired].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        help={inventoryHelp}
        description="The material your company physically has, kept as batches with their origin and quantity history."
        actions={
          <Button onClick={() => setRegistering(true)} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Register batch
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch code"
        activeCount={filterCount}
        onClear={() => {
          setMaterialId('');
          setBatchStatus('');
          setCurrentLocationId('');
          setIncludeRetired(false);
        }}
      >
        <NativeSelect aria-label="Material" value={materialId} onValueChange={setMaterialId} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))} placeholder="All materials" className="md:w-48" />
        <NativeSelect aria-label="Status" value={batchStatus} onValueChange={setBatchStatus} options={batchOptions(BATCH_STATUSES)} placeholder="All statuses" className="md:w-44" />
        <NativeSelect aria-label="Where it is now" value={currentLocationId} onValueChange={setCurrentLocationId} options={(locations.data?.data ?? []).map((l) => ({ value: l.id, label: l.name }))} placeholder="All sites" className="md:w-44" />
        <Checkbox label="Include ended batches" checked={includeRetired} onChange={(e) => setIncludeRetired(e.target.checked)} />
      </FilterBar>
      <DataTable<Batch>
        caption="Batches"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || filterCount
            ? { title: 'No batch matches', description: 'Change the search or the filters.' }
            : { title: 'No batches yet', description: 'Register each lot of material you physically have, with where it came from.', action: <Button onClick={() => setRegistering(true)}>Register batch</Button> }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          {
            key: 'batch',
            header: 'Batch',
            mobile: 'title',
            className: 'min-w-[220px]',
            cell: (r) => (
              <div>
                <p className="font-medium text-ink">{r.material?.name ?? '—'}</p>
                <p className="text-sm text-steel">{r.batchCode}</p>
              </div>
            ),
          },
          { key: 'quantity', header: 'Quantity', mobile: 'subtitle', cell: (r) => formatQuantity(r.currentQuantity, r.unit?.symbol) },
          { key: 'available', header: 'Available', cell: (r) => formatQuantity(r.availableQuantity, r.unit?.symbol) },
          { key: 'site', header: 'Where it is now', cell: (r) => r.currentLocation?.name ?? '—' },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.batchStatus}>{batchLabel(r.batchStatus)}</StatusBadge> },
          { key: 'created', header: 'Registered', cell: (r) => formatDate(r.createdAt) },
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
      <BatchDetailSheet batchId={registering ? null : selectedId} can={OWNER_ACCESS} documents={(b) => <BatchDocumentsPanel batchId={b.id} batchCode={b.batchCode} />} onClose={() => setSelectedId(null)} onOpenBatch={setSelectedId} />
      <BatchFormSheet open={registering} batch={null} onClose={() => setRegistering(false)} onSaved={(b) => setSelectedId(b.id)} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="inventory">
      <InventoryPage />
    </RequireAccess>
  );
}
