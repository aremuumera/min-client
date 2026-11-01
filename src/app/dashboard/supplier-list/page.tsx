'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { Button, DataTable, FilterBar, DropdownSelect, PageHeader, PaginationBar, StatusBadge, Thumbnail } from '@/components/ui';
import { ListingDetailSheet, type ListingPermissions } from '@/components/listings/listing-detail-sheet';
import { paths } from '@/config/paths';
import { toApiError } from '@/lib/api/errors';
import { formatQuantity } from '@/lib/batches';
import { formatDate } from '@/lib/format';
import { listingsHelp } from '@/lib/help/listings';
import { LISTING_STATUSES, categoryPathOf, formatMoney, isNonMineral, listingStatusLabel, listingStatusTone, type Listing } from '@/lib/listings';
import { RequireAccess } from '@/lib/permissions';
import { useGetListingsQuery, useGetMarketplaceMaterialsQuery } from '@/redux/features/listings/listings_api';

/* My listings (step 2.6 A): the company's own listings in any status */
const OWNER_ACCESS: ListingPermissions = { edit: true, status: true, batches: true };

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ListingsPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [materialId, setMaterialId] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, status, materialId]);
  const list = useGetListingsQuery({ mine: true, page, limit, search: debounced, status, materialId });
  const materials = useGetMarketplaceMaterialsQuery();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const filterCount = [status, materialId].filter(Boolean).length;
  const materialName = (id: string | null) => materials.data?.data.find((m) => m.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader
        title="My listings"
        help={listingsHelp}
        description="What you offer for sale. For minerals, buyers see what the batches behind each listing have available."
        actions={
          <Link href={paths.dashboard.products.create}>
            <Button startIcon={<Plus className="h-4 w-4" aria-hidden />}>New listing</Button>
          </Link>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or listing code"
        activeCount={filterCount}
        onClear={() => {
          setStatus('');
          setMaterialId('');
        }}
      >
        <DropdownSelect aria-label="Status" value={status} onValueChange={setStatus} options={LISTING_STATUSES.map((s) => ({ value: s, label: listingStatusLabel(s) }))} placeholder="All statuses" className="md:w-44" />
        <DropdownSelect aria-label="Material" value={materialId} onValueChange={setMaterialId} options={(materials.data?.data ?? []).map((m) => ({ value: m.id, label: m.name }))} placeholder="All materials" className="md:w-48" />
      </FilterBar>
      <DataTable<Listing>
        caption="Listings"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || filterCount
            ? { title: 'No listing matches', description: 'Change the search or the filters.' }
            : { title: 'No listings yet', description: 'Create a listing to offer your stock to buyers.', action: <Link href={paths.dashboard.products.create}><Button>New listing</Button></Link> }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          {
            key: 'listing',
            header: 'Listing',
            mobile: 'title',
            className: 'min-w-[260px]',
            cell: (r) => (
              <div className="flex items-center gap-3">
                <Thumbnail src={r.images?.[0]?.url} alt="" fallback={<Package className="h-4 w-4 text-steel" aria-hidden />} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.product_name}</p>
                  <p className="text-sm text-steel">{r.listingCode ?? '—'}</p>
                </div>
              </div>
            ),
          },
          { key: 'material', header: 'Material', cell: (r) => (isNonMineral(r) ? 'Not a mineral' : materialName(r.materialId)) },
          { key: 'category', header: 'Category', cell: (r) => categoryPathOf(r).at(-1) ?? '—' },
          { key: 'available', header: 'Available', mobile: 'subtitle', cell: (r) => formatQuantity(String(r.quantity), r.measure) },
          { key: 'price', header: 'Price', cell: (r) => formatMoney(r.real_price, r.unitCurrency) },
          { key: 'status', header: 'Status', cell: (r) => <StatusBadge tone={listingStatusTone(r.status)}>{listingStatusLabel(r.status)}</StatusBadge> },
          { key: 'changed', header: 'Last changed', cell: (r) => formatDate(r.updatedAt) },
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
      <ListingDetailSheet listingId={selectedId} can={OWNER_ACCESS} editHref={(l) => paths.dashboard.products.update(l.id) ?? ''} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['supplier', 'buyer_supplier']} teamKey="products">
      <ListingsPage />
    </RequireAccess>
  );
}
