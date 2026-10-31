'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Country } from 'country-state-city';
import { toast } from 'sonner';
import { Alert, Button, ConfirmDialog, CopyableId, KeyValueList, MapPicker, SideSheet, Skeleton, StatusBadge } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { locationLabel, outlinePoints, type Checkpoint, type Location } from '@/lib/locations';
import { useGetLocationCheckpointsQuery, useGetLocationQuery, useSetCheckpointActiveMutation } from '@/redux/features/locations/locations_api';
import { CheckpointFormSheet } from './checkpoint-form-sheet';

export interface LocationPermissions {
  edit: boolean;
  status: boolean;
  checkpointCreate: boolean;
  checkpointEdit: boolean;
  checkpointStatus: boolean;
}

/** What a shipment must prove at a checkpoint, in words */
export function checkpointProofs(c: Checkpoint): string {
  const m = c.metadata?.requiredMeasurements ?? [];
  const proofs = [c.scanRequired && 'scan', c.locationVerificationRequired && 'GPS', c.evidenceRequired && 'evidence', c.metadata?.sealCheckRequired && 'seal', m.length > 0 && `${m.length} ${m.length === 1 ? 'measurement' : 'measurements'}`].filter(Boolean);
  return proofs.length ? proofs.join(', ') : 'Nothing required';
}

/** One site with its map and checkpoints. What can be changed comes from `can`; the backend decides in the end. */
export function LocationDetailSheet({
  locationId,
  can,
  note,
  ownerNode,
  onClose,
  onEdit,
  onToggleActive,
}: {
  locationId: string | null;
  can: (location: Location) => LocationPermissions;
  /** e.g. "Platform-wide site, managed by MINMEG" */
  note?: (location: Location) => string | null;
  ownerNode?: (location: Location) => React.ReactNode;
  onClose: () => void;
  onEdit: (location: Location) => void;
  onToggleActive: (location: Location) => void;
}) {
  const detail = useGetLocationQuery(locationId ?? '', { skip: !locationId });
  const checkpoints = useGetLocationCheckpointsQuery(locationId ?? '', { skip: !locationId });
  const [setActive, activeState] = useSetCheckpointActiveMutation();
  const [form, setForm] = React.useState<{ open: boolean; checkpoint: Checkpoint | null }>({ open: false, checkpoint: null });
  const [toggling, setToggling] = React.useState<Checkpoint | null>(null);

  if (!locationId) return null;
  const l = detail.data?.data;
  const perms = l ? can(l) : null;
  const rows = checkpoints.data?.data ?? [];

  const toggle = async () => {
    if (!toggling) return;
    try {
      await setActive({ id: toggling.id, active: !toggling.active }).unwrap();
      toast.success(`${toggling.name} ${toggling.active ? 'deactivated' : 'activated'}`);
      setToggling(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <>
      <SideSheet
        open={!form.open}
        onClose={onClose}
        size="lg"
        title={l?.name ?? 'Site'}
        subtitle={l ? `${locationLabel(l.locationType)} · ${l.code}` : undefined}
        footer={
          l && perms && (perms.status || perms.edit) ? (
            <>
              {perms.status && (
                <Button variant="outlined" color={l.active ? 'secondary' : 'primary'} onClick={() => onToggleActive(l)}>
                  {l.active ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {perms.edit && <Button onClick={() => onEdit(l)}>Edit</Button>}
            </>
          ) : undefined
        }
      >
        {detail.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail.isError || !l ? (
          <Alert severity="error">{toApiError(detail.error).message}</Alert>
        ) : (
          <div className="flex flex-col gap-5">
            {note?.(l) && <p className="rounded-lg bg-surface px-3 py-2 text-sm text-slate">{note(l)}</p>}
            <KeyValueList
              columns={2}
              items={[
                { label: 'Site ID', value: <CopyableId value={l.id} />, wide: true },
                { label: 'Status', value: <StatusBadge tone={l.active ? 'success' : 'neutral'}>{l.active ? 'Active' : 'Inactive'}</StatusBadge> },
                ...(ownerNode ? [{ label: 'Owner', value: ownerNode(l) }] : []),
                { label: 'Country', value: Country.getCountryByCode(l.countryCode)?.name ?? l.countryCode },
                { label: 'State or region', value: l.stateRegion },
                { label: 'City or town', value: l.city },
                { label: 'Address', value: l.address, wide: true },
                { label: 'Zone', value: l.boundary ? 'Drawn outline' : l.geofenceRadiusMeters ? `${Number(l.geofenceRadiusMeters)} m radius` : l.latitude ? 'Position only' : 'Not set' },
                { label: 'Last changed', value: formatDateTime(l.updatedAt) },
              ]}
            />
            {(l.latitude != null || l.boundary) && (
              <MapPicker center={[Number(l.latitude ?? 0), Number(l.longitude ?? 0)]} zoom={13} latitude={l.latitude ?? ''} longitude={l.longitude ?? ''} radius={l.geofenceRadiusMeters ?? ''} outline={outlinePoints(l.boundary)} height={220} />
            )}

            <section className="flex flex-col gap-3 border-t border-hairline pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Checkpoints</h3>
                {perms?.checkpointCreate && l.active && (
                  <Button size="sm" variant="outlined" onClick={() => setForm({ open: true, checkpoint: null })} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
                    Add checkpoint
                  </Button>
                )}
              </div>
              {checkpoints.isError ? (
                <Alert severity="error">{toApiError(checkpoints.error).message}</Alert>
              ) : rows.length === 0 ? (
                <p className="text-sm text-steel">{checkpoints.isLoading ? 'Loading…' : 'No checkpoints yet. Add the gates, weighbridges and other control points here.'}</p>
              ) : (
                <ul aria-label="Checkpoints" className="flex flex-col divide-y divide-hairline rounded-xl border border-hairline">
                  {rows.map((c) => (
                    <li key={c.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium text-ink">
                          {c.sequence != null ? `${c.sequence}. ` : ''}
                          {c.name}
                        </p>
                        <p className="text-xs text-steel">
                          {locationLabel(c.checkpointType)} · {c.code} · {checkpointProofs(c)}
                        </p>
                      </div>
                      <StatusBadge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</StatusBadge>
                      <span className="flex gap-1">
                        {perms?.checkpointEdit && (
                          <Button size="sm" variant="text" color="secondary" onClick={() => setForm({ open: true, checkpoint: c })} aria-label={`Edit ${c.name}`}>
                            Edit
                          </Button>
                        )}
                        {perms?.checkpointStatus && (
                          <Button size="sm" variant="text" color="secondary" onClick={() => setToggling(c)} aria-label={`${c.active ? 'Deactivate' : 'Activate'} ${c.name}`}>
                            {c.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SideSheet>
      <CheckpointFormSheet open={form.open} location={l ?? null} checkpoint={form.checkpoint} onClose={() => setForm({ open: false, checkpoint: null })} />
      <ConfirmDialog
        open={!!toggling}
        tone={toggling?.active ? 'error' : 'primary'}
        title={`${toggling?.active ? 'Deactivate' : 'Activate'} ${toggling?.name ?? ''}?`}
        description={toggling?.active ? "New shipments can't be planned through it. Shipments and events that already used it keep it." : 'New shipments can be planned through it again.'}
        confirmLabel={toggling?.active ? 'Deactivate' : 'Activate'}
        loading={activeState.isLoading}
        onConfirm={toggle}
        onClose={() => setToggling(null)}
      />
    </>
  );
}
