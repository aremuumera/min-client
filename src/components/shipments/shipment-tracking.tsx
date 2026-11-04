'use client';

import * as React from 'react';
import { LocateFixed } from 'lucide-react';
import { Button, FormField, Input, Modal, StatusBadge, Textarea, TrackMap, type TrackMapPlace } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { useSse } from '@/lib/realtime/use-sse';
import type { Shipment } from '@/lib/shipments';
import { OPEN_PLAN, PLAN_LABELS, toNumber, VISIT_LABELS, type PlanRow, type Site } from '@/lib/tracking';
import { useGetLocationsQuery } from '@/redux/features/locations/locations_api';
import {
  useAcknowledgeAlertMutation,
  useGetHistoryQuery,
  useGetShipmentAlertsQuery,
  useGetTrackingQuery,
  useScanCheckpointMutation,
} from '@/redux/features/shipments/shipments_api';

const sitePlace = (s: Site | null, label: string): TrackMapPlace[] => {
  const lat = toNumber(s?.latitude);
  const lng = toNumber(s?.longitude);
  return s && lat !== null && lng !== null ? [{ label: `${label}: ${s.name}`, latitude: lat, longitude: lng, radius: s.geofenceRadiusMeters ?? null, kind: 'site' }] : [];
};

function ScanModal({ shipmentId, row, onClose }: { shipmentId: string; row: PlanRow; onClose: () => void }) {
  const cp = row.checkpoint!;
  const [identifier, setIdentifier] = React.useState('');
  const [seal, setSeal] = React.useState('');
  const [note, setNote] = React.useState('');
  const [where, setWhere] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [scan, { isLoading }] = useScanCheckpointMutation();
  const locate = () => {
    if (!navigator.geolocation) return setError('This device cannot share its location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setWhere({ latitude: Number(p.coords.latitude.toFixed(6)), longitude: Number(p.coords.longitude.toFixed(6)) });
        setLocating(false);
      },
      () => {
        setError('Your location could not be read. Allow location for this site and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20_000 },
    );
  };
  const submit = async () => {
    setError(null);
    const body: Record<string, unknown> = {};
    if (identifier.trim()) body.identifierValue = identifier.trim();
    if (seal.trim()) body.sealReference = seal.trim();
    if (note.trim()) body.note = note.trim();
    if (where) Object.assign(body, where);
    try {
      await scan({ id: shipmentId, checkpointId: cp.id, body }).unwrap();
      onClose();
    } catch (err) {
      // A failed check is recorded as a failed visit and can be tried again
      setError(toApiError(err).message);
    }
  };
  const needs = [cp.scanRequired && 'the shipment number, waybill, container or seal number', cp.locationVerificationRequired && 'your location inside the checkpoint zone', cp.evidenceRequired && 'a document (ask MINMEG staff)'].filter(Boolean);
  return (
    <Modal open onClose={onClose} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Record the truck passing {cp.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{needs.length ? `This checkpoint checks ${needs.join(', ')}.` : 'This checkpoint has no checks of its own.'} If a check fails, nothing moves and you can try again.</p>
        </div>
        <FormField htmlFor="scan-identifier" label="Number read at the checkpoint" required={cp.scanRequired} optional={!cp.scanRequired} info="The shipment number, waybill, container or seal number, or the code on a loaded unit.">
          <Input id="scan-identifier" value={identifier} maxLength={200} onChange={(e) => setIdentifier(e.target.value)} />
        </FormField>
        <FormField htmlFor="scan-seal" label="Seal number" optional>
          <Input id="scan-seal" value={seal} maxLength={200} onChange={(e) => setSeal(e.target.value)} />
        </FormField>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outlined" startIcon={<LocateFixed className="h-4 w-4" aria-hidden />} disabled={locating} onClick={locate}>{locating ? 'Reading location…' : 'Use my location'}</Button>
          {where && <span className="text-sm text-gray-600">{where.latitude}, {where.longitude}</span>}
        </div>
        <FormField htmlFor="scan-note" label="Note" optional>
          <Textarea id="scan-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
        </FormField>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outlined" onClick={onClose}>Back</Button>
          <Button disabled={isLoading || (cp.scanRequired && !identifier.trim()) || (cp.locationVerificationRequired && !where)} onClick={submit}>{isLoading ? 'Checking…' : 'Record'}</Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * The tracking part of a shipment: the map, the checkpoints on the way and the alerts. MINMEG staff plan
 * the route; a MINMEG tracker records each passage on entering the checkpoint's zone. Where there is no
 * tracker, the company that runs the checkpoint's site records it (decision #106), so a company sees
 * "Record passing" only at its own sites.
 */
export function ShipmentTracking({ shipment }: { shipment: Shipment }) {
  const tracking = useGetTrackingQuery(shipment.id, { refetchOnMountOrArgChange: true });
  const history = useGetHistoryQuery(shipment.id, { refetchOnMountOrArgChange: true });
  const alerts = useGetShipmentAlertsQuery(shipment.id, { refetchOnMountOrArgChange: true });
  const [acknowledge] = useAcknowledgeAlertMutation();
  const [scanning, setScanning] = React.useState<PlanRow | null>(null);
  const sites = useGetLocationsQuery({ limit: 100 });
  const ownSites = new Set((sites.data?.data ?? []).filter((l) => l.organizationId).map((l) => l.id));
  const [alertError, setAlertError] = React.useState<string | null>(null);

  useSse(`/realtime/shipments/${shipment.id}`, (e) => {
    if (['position', 'checkpoint_visit', 'alert'].includes(e.event)) {
      void tracking.refetch();
      if (e.event === 'position') void history.refetch();
      if (e.event === 'alert') void alerts.refetch();
    }
  });

  const view = tracking.data?.data;
  if (tracking.isError) return <p role="alert" className="text-sm text-red-600">{toApiError(tracking.error).message}</p>;
  if (!view) return <p className="text-sm text-steel">Loading tracking…</p>;

  const moving = ['DEPARTED', 'IN_TRANSIT', 'ARRIVED'].includes(shipment.status);
  const places: TrackMapPlace[] = [
    ...sitePlace(view.origin, 'From'),
    ...sitePlace(view.destination, 'To'),
    ...view.checkpoints.flatMap((r) => {
      const lat = toNumber(r.checkpoint?.location?.latitude);
      const lng = toNumber(r.checkpoint?.location?.longitude);
      return r.checkpoint && lat !== null && lng !== null ? [{ label: `${r.sequence}. ${r.checkpoint.name}`, latitude: lat, longitude: lng, kind: 'checkpoint' as const, done: r.status === 'COMPLETED' }] : [];
    }),
  ];
  const trail = (history.data?.data ?? []).map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
  const live = view.livePosition;
  const tracker = view.devices.find((d) => d.assignmentStatus === 'ACTIVE');
  const openAlerts = (alerts.data?.data ?? []).filter((a) => ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING'].includes(a.status));

  const ack = async (id: string) => {
    setAlertError(null);
    try {
      await acknowledge({ id }).unwrap();
    } catch (err) {
      setAlertError(toApiError(err).message);
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-ink">Tracking</h3>
      <TrackMap places={places} trail={trail} live={live ? { latitude: live.latitude, longitude: live.longitude, label: 'Now' } : null} />
      <p className="text-sm text-steel">
        {live
          ? `Last position ${formatDateTime(live.measuredAt)}${live.speedKph !== null ? ` · ${Math.round(live.speedKph)} km/h` : ''}${tracker?.batteryLevel != null ? ` · tracker battery ${Math.round(Number(tracker.batteryLevel))}%` : ''}`
          : tracker
            ? 'A MINMEG tracker is on this shipment. No position has arrived yet.'
            : 'No tracker on this shipment. Each step is recorded by hand.'}
      </p>

      <h4 className="text-sm font-semibold text-ink">Checkpoints</h4>
      {!view.checkpoints.length ? (
        <p className="text-sm text-steel">MINMEG has not planned checkpoints for this shipment yet.</p>
      ) : (
        <ol className="divide-y divide-hairline rounded-xl border border-hairline">
          {view.checkpoints.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-ink">{r.sequence}. {r.checkpoint?.name ?? 'Checkpoint'}</p>
                {r.checkpoint?.location && <p className="text-steel">{r.checkpoint.location.name}</p>}
                {r.latestVisit && <p className="text-steel">{VISIT_LABELS[r.latestVisit.status]}{r.latestVisit.arrivedAt ? ` · ${formatDateTime(r.latestVisit.arrivedAt)}` : ''}</p>}
                {r.latestVisit?.failureReason && <p className="text-red-700">{r.latestVisit.failureReason}</p>}
                {r.latestVisit?.overrideReason && <p className="text-steel">Staff reason: {r.latestVisit.overrideReason}</p>}
                {r.skipReason && <p className="text-steel">Skipped: {r.skipReason}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status}>{PLAN_LABELS[r.status]}</StatusBadge>
                {moving && OPEN_PLAN.includes(r.status) && !!r.checkpoint?.location && ownSites.has(r.checkpoint.location.id) && <Button size="sm" onClick={() => setScanning(r)}>Record passing</Button>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <h4 className="text-sm font-semibold text-ink">Alerts</h4>
      {alertError && <p role="alert" className="text-sm text-red-600">{alertError}</p>}
      {!openAlerts.length ? (
        <p className="text-sm text-steel">No open alerts.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {openAlerts.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-ink">{a.title}{a.occurrenceCount > 1 ? ` (${a.occurrenceCount} times)` : ''}</p>
                <p className="text-steel">{a.message}</p>
                <p className="text-xs text-steel">{formatDateTime(a.detectedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={a.severity}>{a.severity.charAt(0) + a.severity.slice(1).toLowerCase()}</StatusBadge>
                {a.status === 'OPEN' && <Button size="sm" variant="outlined" onClick={() => ack(a.id)}>Acknowledge</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {scanning && <ScanModal shipmentId={shipment.id} row={scanning} onClose={() => setScanning(null)} />}
    </section>
  );
}
