'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Country } from 'country-state-city';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, FilterBar, NativeSelect, PageHeader, PaginationBar, StatusBadge } from '@/components/ui';
import { LocationDetailSheet, type LocationPermissions } from '@/components/locations/location-detail-sheet';
import { LocationFormSheet } from '@/components/locations/location-form-sheet';
import { toApiError } from '@/lib/api/errors';
import { sitesHelp } from '@/lib/help/sites';
import { LOCATION_TYPES, locationLabel, locationOptions, type Location } from '@/lib/locations';
import { RequireAccess } from '@/lib/permissions';
import { useAppSelector } from '@/redux/hooks';
import { useGetLocationsQuery, useSetLocationActiveMutation } from '@/redux/features/locations/locations_api';

/*
 * My sites (step 2.4 B1–B2): the company's own sites, which it manages, and platform-wide ones, which
 * it can only read. Another company's sites are never listed (decision #29).
 */
const ACTIVE_FILTERS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
const NO_ACCESS: LocationPermissions = { edit: false, status: false, checkpointCreate: false, checkpointEdit: false, checkpointStatus: false };
const FULL_ACCESS: LocationPermissions = { edit: true, status: true, checkpointCreate: true, checkpointEdit: true, checkpointStatus: true };

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SitesPage() {
  const { isTeamMember, ownerUserId, user } = useAppSelector((s) => s.auth);
  const orgId = ((isTeamMember ? ownerUserId : user?.id) as string | undefined) ?? null;
  const [search, setSearch] = React.useState('');
  const [locationType, setLocationType] = React.useState('');
  const [active, setActive] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const debounced = useDebounced(search.trim());
  React.useEffect(() => setPage(1), [debounced, locationType, active]);

  const list = useGetLocationsQuery({ page, limit, search: debounced, locationType, active });
  const [setLocationActive, toggleState] = useSetLocationActiveMutation();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{ open: boolean; location: Location | null }>({ open: false, location: null });
  const [toggling, setToggling] = React.useState<Location | null>(null);
  const filterCount = [locationType, active].filter(Boolean).length;
  const isOwn = (l: Location) => !!orgId && l.organizationId === orgId;

  const toggle = async () => {
    if (!toggling) return;
    try {
      await setLocationActive({ id: toggling.id, active: !toggling.active }).unwrap();
      toast.success(`${toggling.name} ${toggling.active ? 'deactivated' : 'activated'}`);
      setToggling(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="My sites"
        help={sitesHelp}
        description="The mines, warehouses and other places your company uses. Batches and shipments point to them."
        actions={
          <Button onClick={() => setForm({ open: true, location: null })} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Add site
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, code, city or address"
        activeCount={filterCount}
        onClear={() => {
          setLocationType('');
          setActive('');
        }}
      >
        <NativeSelect aria-label="Kind of site" value={locationType} onValueChange={setLocationType} options={locationOptions(LOCATION_TYPES)} placeholder="All kinds" className="md:w-48" />
        <NativeSelect aria-label="Status" value={active} onValueChange={setActive} options={ACTIVE_FILTERS} placeholder="All statuses" className="md:w-36" />
      </FilterBar>
      <DataTable<Location>
        caption="Sites"
        rows={list.isError ? undefined : list.data?.data}
        loading={list.isLoading}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={
          debounced || filterCount
            ? { title: 'No site matches', description: 'Change the search or the filters.' }
            : { title: 'No sites yet', description: 'Add your mines, warehouses and delivery sites so batches and shipments can point to them.', action: <Button onClick={() => setForm({ open: true, location: null })}>Add site</Button> }
        }
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedId={selectedId}
        columns={[
          {
            key: 'name',
            header: 'Site',
            mobile: 'title',
            className: 'min-w-[220px]',
            cell: (r) => (
              <div>
                <p className="font-medium text-ink">{r.name}</p>
                <p className="text-sm text-steel">{r.code}</p>
              </div>
            ),
          },
          { key: 'type', header: 'Kind', mobile: 'subtitle', cell: (r) => locationLabel(r.locationType) },
          { key: 'place', header: 'Place', cell: (r) => [r.city, r.stateRegion, Country.getCountryByCode(r.countryCode)?.name ?? r.countryCode].filter(Boolean).join(', ') },
          {
            key: 'status',
            header: 'Status',
            cell: (r) => (
              <span className="flex flex-wrap gap-1.5">
                <StatusBadge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</StatusBadge>
                {!r.organizationId && <StatusBadge tone="dark">Shared</StatusBadge>}
              </span>
            ),
          },
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
      <LocationDetailSheet
        locationId={form.open ? null : selectedId}
        can={(l) => (isOwn(l) ? FULL_ACCESS : NO_ACCESS)}
        note={(l) => (l.organizationId ? null : 'A shared site, added by MINMEG. You can use it, but not change it.')}
        onClose={() => setSelectedId(null)}
        onEdit={(location) => setForm({ open: true, location })}
        onToggleActive={setToggling}
      />
      <LocationFormSheet open={form.open} location={form.location} onClose={() => setForm({ open: false, location: null })} onSaved={(l) => setSelectedId(l.id)} />
      <ConfirmDialog
        open={!!toggling}
        tone={toggling?.active ? 'error' : 'primary'}
        title={`${toggling?.active ? 'Deactivate' : 'Activate'} ${toggling?.name ?? ''}?`}
        description={toggling?.active ? "It can't be chosen for new batches or shipments. Records that already use it keep it. Deactivate its checkpoints first." : 'It can be chosen for new batches and shipments again.'}
        confirmLabel={toggling?.active ? 'Deactivate' : 'Activate'}
        loading={toggleState.isLoading}
        onConfirm={toggle}
        onClose={() => setToggling(null)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess role={['buyer', 'supplier', 'buyer_supplier']} teamKey="inventory">
      <SitesPage />
    </RequireAccess>
  );
}
