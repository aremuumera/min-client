'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, DataTable, DropdownSelect, FilterBar, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { ShipmentDetailSheet } from '@/components/shipments/shipment-detail-sheet';
import { ShipmentFormSheet } from '@/components/shipments/shipment-form-sheet';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { shipmentsHelp } from '@/lib/help/shipments';
import { RequireAccess, useCan } from '@/lib/permissions';
import { SHIPMENT_STATUSES, shipmentStatusLabel, type Shipment } from '@/lib/shipments';
import { showQuantity } from '@/lib/trade-stock';
import { useGetShipmentsQuery } from '@/redux/features/shipments/shipments_api';

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const ROLE_LABEL = { seller: 'You supply', buyer: 'You receive', staff: 'MINMEG' } as const;

function ShipmentsPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [type, setType] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [planning, setPlanning] = React.useState(false);
  // A notification or the trade room opens the shipment it is about
  const [selectedId, setSelectedId] = React.useState<string | null>(useSearchParams().get('shipment'));
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, status, type]);
  const list = useGetShipmentsQuery({ page, limit, search: debounced || undefined, status: status || undefined, shipmentType: type || undefined }, { refetchOnMountOrArgChange: true });
  const canPlan = useCan()({ role: ['supplier', 'buyer_supplier'] });
  const filterCount = [status, type].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Shipments"
        help={shipmentsHelp}
        description="Goods on the move for your trades, as supplier or buyer."
        actions={canPlan ? <Button startIcon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setPlanning(true)}>Plan a shipment</Button> : undefined}
      />
      <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Shipment number" activeCount={filterCount} onClear={() => { setStatus(''); setType(''); }}>
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} placeholder="All statuses" options={SHIPMENT_STATUSES.map((s) => ({ value: s, label: shipmentStatusLabel(s) }))} />
        <DropdownSelect aria-label="Type" value={type} onValueChange={setType} placeholder="All types" options={[{ value: 'DELIVERY', label: 'Delivery' }, { value: 'RETURN', label: 'Return' }]} />
      </FilterBar>
      <DataTable<Shipment>
        caption="Shipments"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || filterCount
            ? { title: 'No shipment matches', description: 'Change the search or the filters.' }
            : { title: 'No shipments yet', description: 'Shipments appear here once a trade has stock committed and the supplier plans one.' }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          { key: 'number', header: 'Shipment', mobile: 'title', className: 'min-w-[200px]', cell: (r) => <span className="font-medium text-ink">{r.shipmentNumber}{r.shipmentType === 'RETURN' && <span className="ml-2 text-xs text-steel">Return</span>}</span> },
          { key: 'trade', header: 'Trade', cell: (r) => r.trade?.tradeCode ?? '—' },
          { key: 'role', header: 'Your side', cell: (r) => ROLE_LABEL[r.viewerRole] },
          { key: 'quantity', header: 'Quantity', mobile: 'subtitle', cell: (r) => (r.quantityShipped ? showQuantity(r.quantityShipped, r.unitSymbol) : `${r.lineCount ?? 0} line(s)`) },
          { key: 'to', header: 'To', cell: (r) => r.destination?.name ?? "Trade's site" },
          { key: 'when', header: 'Departure', cell: (r) => formatDateTime(r.actualDepartureAt ?? r.plannedDepartureAt) || '—' },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status}>{shipmentStatusLabel(r.status)}</StatusBadge> },
        ]}
      />
      <PaginationBar meta={list.data?.meta} page={page} onPage={setPage} limit={limit} onLimit={(n) => { setLimit(n); setPage(1); }} />
      <ShipmentDetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
      {planning && <ShipmentFormSheet open onClose={() => setPlanning(false)} onSaved={setSelectedId} />}
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="shipments">
      <React.Suspense fallback={null}>
        <ShipmentsPage />
      </React.Suspense>
    </RequireAccess>
  );
}
