'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, Button, Checkbox, FormField, IconButton, Input, MapPicker, DropdownSelect, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { CHECKPOINT_TYPES, codeFromName, CODE_PATTERN, locationOptions, outlinePoints, outlineToBoundary, positionErrors, type Checkpoint, type LngLat, type Location, type RequiredMeasurement } from '@/lib/locations';
import { useCreateCheckpointMutation, useGetMeasurementChoicesQuery, useUpdateCheckpointMutation } from '@/redux/features/locations/locations_api';

export interface CheckpointFormSheetProps {
  open: boolean;
  /** The site it belongs to */
  location: Pick<Location, 'id' | 'name' | 'latitude' | 'longitude' | 'geofenceRadiusMeters' | 'boundary'> | null;
  /** Edit this checkpoint; null to create */
  checkpoint: Checkpoint | null;
  onClose: () => void;
}

/**
 * POST /checkpoints, PATCH /checkpoints/:id. The flags say what a shipment must prove here; the checks
 * run when a shipment passes (rules Stage 10b). Code and site are fixed once created.
 */
export function CheckpointFormSheet({ open, location, checkpoint, onClose }: CheckpointFormSheetProps) {
  const [create, createState] = useCreateCheckpointMutation();
  const [update, updateState] = useUpdateCheckpointMutation();
  const choices = useGetMeasurementChoicesQuery(undefined, { skip: !open });
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const saving = createState.isLoading || updateState.isLoading;

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sequence, setSequence] = React.useState('');
  const [scan, setScan] = React.useState(false);
  const [gps, setGps] = React.useState(false);
  const [evidence, setEvidence] = React.useState(false);
  const [seal, setSeal] = React.useState(false);
  const [measurements, setMeasurements] = React.useState<RequiredMeasurement[]>([]);
  const [ownZone, setOwnZone] = React.useState(false);
  const [latitude, setLatitude] = React.useState('');
  const [longitude, setLongitude] = React.useState('');
  const [radius, setRadius] = React.useState('');
  const [outline, setOutline] = React.useState<LngLat[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    const c = checkpoint;
    setName(c?.name ?? '');
    setCode(c?.code ?? '');
    setType(c?.checkpointType ?? '');
    setDescription(c?.description ?? '');
    setSequence(c?.sequence == null ? '' : String(c.sequence));
    setScan(c?.scanRequired ?? false);
    setGps(c?.locationVerificationRequired ?? false);
    setEvidence(c?.evidenceRequired ?? false);
    setSeal(!!c?.metadata?.sealCheckRequired);
    setMeasurements(c?.metadata?.requiredMeasurements ?? []);
    setOwnZone(!!c?.boundary || c?.latitude != null);
    setLatitude(c?.latitude ?? '');
    setLongitude(c?.longitude ?? '');
    setRadius(c?.geofenceRadiusMeters ? String(Number(c.geofenceRadiusMeters)) : '');
    setOutline(outlinePoints(c?.boundary));
    setErrors({});
    setFormError(undefined);
  }, [open, checkpoint]);

  if (!open || !location) return null;
  const options = (choices.data?.data ?? []).map((m) => ({ value: m.code, label: m.name }));
  const siteHasZone = !!location.boundary || location.latitude != null;
  const center: [number, number] = location.latitude != null ? [Number(location.latitude), Number(location.longitude)] : [9.08, 8.68];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const finalCode = (code.trim() || codeFromName(name)).toUpperCase();
    const next: Record<string, string> = ownZone ? positionErrors(latitude, longitude, radius, 1) : {};
    if (!name.trim()) next.name = 'Enter a name';
    if (!type) next.checkpointType = 'Choose what happens here';
    if (!checkpoint && !CODE_PATTERN.test(finalCode)) next.code = 'Use A–Z, 0–9 and _ only, starting with a letter';
    if (sequence.trim() && !(Number.isInteger(Number(sequence)) && Number(sequence) >= 0)) next.sequence = 'A whole number, 0 or more';
    if (ownZone && outline.length > 0 && outline.length < 3) next.boundary = 'An outline needs at least 3 points';
    if (gps && !siteHasZone && !(ownZone && (latitude.trim() || outline.length >= 3))) next.gps = `${location.name} has no position, so give this checkpoint its own zone`;
    if (measurements.some((m) => !m.measurementTypeCode)) next.measurements = 'Choose a measurement, or remove the row';
    if (new Set(measurements.map((m) => m.measurementTypeCode)).size !== measurements.length) next.measurements = 'Each measurement once';
    setErrors(next);
    if (Object.keys(next).length) return;

    const ok = await confirm(
      checkpoint
        ? { title: `Save changes to ${checkpoint.name}?`, description: 'Shipments passing here from now on must meet the new requirements.', confirmLabel: 'Save changes' }
        : { title: `Add ${name.trim()}?`, description: `At ${location.name}. Its code and site can't change later.`, confirmLabel: 'Add checkpoint' },
    );
    if (!ok) return;

    // keeps any other settings already in metadata
    const metadata: Record<string, unknown> = { ...checkpoint?.metadata };
    delete metadata.requiredMeasurements;
    delete metadata.sealCheckRequired;
    if (measurements.length) metadata.requiredMeasurements = measurements;
    if (seal) metadata.sealCheckRequired = true;
    const body = {
      name: name.trim(),
      checkpointType: type,
      description: description.trim() || null,
      sequence: sequence.trim() === '' ? null : Number(sequence),
      scanRequired: scan,
      locationVerificationRequired: gps,
      evidenceRequired: evidence,
      latitude: ownZone && latitude.trim() !== '' ? Number(latitude) : null,
      longitude: ownZone && longitude.trim() !== '' ? Number(longitude) : null,
      geofenceRadiusMeters: ownZone && radius.trim() !== '' ? Number(radius) : null,
      boundary: ownZone ? outlineToBoundary(outline) : null,
      metadata: Object.keys(metadata).length ? metadata : null,
    };
    try {
      if (checkpoint) await update({ id: checkpoint.id, ...body }).unwrap();
      else {
        await create({ ...body, locationId: location.id, code: finalCode, idempotencyKey: key }).unwrap();
        done();
      }
      toast.success(checkpoint ? 'Checkpoint updated' : 'Checkpoint added');
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      else if (/code/i.test(apiError.message) && !checkpoint) setErrors({ code: apiError.message });
      else setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open
      onClose={onClose}
      size="lg"
      title={checkpoint ? `Edit ${checkpoint.name}` : 'Add a checkpoint'}
      subtitle={`At ${location.name}`}
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="checkpoint-form" loading={saving} disabled={saving}>
            {checkpoint ? 'Save changes' : 'Add checkpoint'}
          </Button>
        </>
      }
    >
      <form id="checkpoint-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" htmlFor="cp-name" required error={errors.name}>
            <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} error={!!errors.name} maxLength={255} autoComplete="off" placeholder="e.g. Main weighbridge" />
          </FormField>
          <FormField label="What happens here" htmlFor="cp-type" required error={errors.checkpointType}>
            <DropdownSelect id="cp-type" value={type} onValueChange={setType} options={locationOptions(CHECKPOINT_TYPES)} placeholder="Choose…" error={!!errors.checkpointType} />
          </FormField>
          <FormField label="Code" htmlFor="cp-code" help={checkpoint ? 'Fixed once created' : `Empty: ${codeFromName(name) || 'made from the name'}`} error={errors.code}>
            <Input id="cp-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={!!checkpoint} error={!!errors.code} maxLength={64} autoComplete="off" />
          </FormField>
          <FormField label="Order" htmlFor="cp-sequence" help="The usual order at this site; each shipment's own plan decides" error={errors.sequence}>
            <Input id="cp-sequence" type="number" inputMode="numeric" min={0} value={sequence} onChange={(e) => setSequence(e.target.value)} error={!!errors.sequence} />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="cp-description" error={errors.description}>
          <Textarea id="cp-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={5000} />
        </FormField>

        <fieldset className="flex flex-col gap-3 border-t border-hairline pt-4">
          <legend className="mb-1 text-sm font-semibold text-ink">What a shipment must prove here</legend>
          <Checkbox label="Scan a code (QR, NFC or seal)" checked={scan} onChange={(e) => setScan(e.target.checked)} />
          <Checkbox label="Be inside the zone (GPS)" checked={gps} onChange={(e) => setGps(e.target.checked)} />
          {errors.gps && <p className="text-xs text-semantic-error-text">{errors.gps}</p>}
          <Checkbox label="Attach evidence (photo or document)" checked={evidence} onChange={(e) => setEvidence(e.target.checked)} />
          <Checkbox label="Pass a seal check" checked={seal} onChange={(e) => setSeal(e.target.checked)} />
        </fieldset>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-ink">Measurements to record here</h3>
          {measurements.map((m, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-hairline p-3 sm:flex-row sm:items-center">
              <DropdownSelect
                aria-label={`Measurement ${i + 1}`}
                value={m.measurementTypeCode}
                onValueChange={(v) => setMeasurements((prev) => prev.map((x, j) => (j === i ? { ...x, measurementTypeCode: v } : x)))}
                options={options}
                placeholder="Choose…"
                className="sm:flex-1"
              />
              <Checkbox label="Compare with the quantity shipped" checked={m.compareWithShipped} onChange={(e) => setMeasurements((prev) => prev.map((x, j) => (j === i ? { ...x, compareWithShipped: e.target.checked } : x)))} />
              <IconButton type="button" aria-label={`Remove measurement ${i + 1}`} onClick={() => setMeasurements((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </IconButton>
            </div>
          ))}
          {errors.measurements && <p className="text-xs text-semantic-error-text">{errors.measurements}</p>}
          {measurements.length < 5 && (
            <Button type="button" size="sm" variant="outlined" className="self-start" onClick={() => setMeasurements((prev) => [...prev, { measurementTypeCode: '', compareWithShipped: false }])} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
              Add a measurement
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <Checkbox label="This checkpoint has its own zone (e.g. 50 m around a weighbridge)" checked={ownZone} onChange={(e) => setOwnZone(e.target.checked)} />
          {!ownZone && <p className="text-xs text-steel">{siteHasZone ? `It uses the zone of ${location.name}.` : `${location.name} has no position yet.`}</p>}
          {ownZone && (
            <>
              <MapPicker
                center={center}
                zoom={location.latitude != null ? 15 : 6}
                latitude={latitude}
                longitude={longitude}
                radius={radius}
                outline={outline}
                onPoint={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                onClearPoint={() => {
                  setLatitude('');
                  setLongitude('');
                  setRadius('');
                }}
                onOutline={setOutline}
              />
              {errors.boundary && <p className="text-xs text-semantic-error-text">{errors.boundary}</p>}
              <div className="grid gap-3 md:grid-cols-3">
                <FormField label="Latitude" htmlFor="cp-lat" error={errors.latitude}>
                  <Input id="cp-lat" inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} error={!!errors.latitude} />
                </FormField>
                <FormField label="Longitude" htmlFor="cp-lng" error={errors.longitude}>
                  <Input id="cp-lng" inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} error={!!errors.longitude} />
                </FormField>
                <FormField label="Zone radius (metres)" htmlFor="cp-radius" error={errors.geofenceRadiusMeters}>
                  <Input id="cp-radius" type="number" inputMode="numeric" min={1} max={100000} value={radius} onChange={(e) => setRadius(e.target.value)} error={!!errors.geofenceRadiusMeters} />
                </FormField>
              </div>
            </>
          )}
        </div>
      </form>
      {dialog}
    </SideSheet>
  );
}
