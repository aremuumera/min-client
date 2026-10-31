'use client';

import * as React from 'react';
import { Country, State } from 'country-state-city';
import { toast } from 'sonner';
import { Alert, Button, FormField, Input, MapPicker, NativeSelect, SideSheet, Textarea, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useIdempotencyKey } from '@/lib/api/idempotency';
import { CODE_PATTERN, LOCATION_TYPES, locationLabel, locationOptions, outlinePoints, outlineToBoundary, positionErrors, type Location, type LngLat } from '@/lib/locations';
import { useCreateLocationMutation, useUpdateLocationMutation } from '@/redux/features/locations/locations_api';

const COUNTRIES = Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }));

export interface LocationFormSheetProps {
  open: boolean;
  /** Edit this location; null to create */
  location: Location | null;
  onClose: () => void;
  onSaved?: (location: Location) => void;
  /** Staff only: who owns the new site */
  ownerField?: React.ReactNode;
  ownerBody?: { organizationId: string | null };
  ownerError?: string;
}

/**
 * POST /locations, PATCH /locations/:id. The code and owner are fixed once created; a mine is a
 * location with the type Mine (rules Stage 10a). Nothing is saved before the confirm step.
 */
export function LocationFormSheet({ open, location, onClose, onSaved, ownerField, ownerBody, ownerError }: LocationFormSheetProps) {
  const [create, createState] = useCreateLocationMutation();
  const [update, updateState] = useUpdateLocationMutation();
  const { key, done } = useIdempotencyKey();
  const { confirm, dialog } = useConfirm();
  const saving = createState.isLoading || updateState.isLoading;

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState('');
  const [country, setCountry] = React.useState('NG');
  const [state, setState] = React.useState('');
  const [city, setCity] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [latitude, setLatitude] = React.useState('');
  const [longitude, setLongitude] = React.useState('');
  const [radius, setRadius] = React.useState('');
  const [outline, setOutline] = React.useState<LngLat[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    setName(location?.name ?? '');
    setCode(location?.code ?? '');
    setType(location?.locationType ?? '');
    setCountry(location?.countryCode ?? 'NG');
    setState(location?.stateRegion ?? '');
    setCity(location?.city ?? '');
    setAddress(location?.address ?? '');
    setLatitude(location?.latitude ?? '');
    setLongitude(location?.longitude ?? '');
    setRadius(location?.geofenceRadiusMeters ? String(Number(location.geofenceRadiusMeters)) : '');
    setOutline(outlinePoints(location?.boundary));
    setErrors({});
    setFormError(undefined);
  }, [open, location]);

  const states = React.useMemo(() => State.getStatesOfCountry(country).map((s) => ({ value: s.name, label: s.name })), [country]);
  const stateOptions = state && !states.some((s) => s.value === state) ? [{ value: state, label: state }, ...states] : states;
  const center = React.useMemo<[number, number]>(() => {
    const c = Country.getCountryByCode(country);
    return c ? [Number(c.latitude), Number(c.longitude)] : [9.08, 8.68];
  }, [country]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next: Record<string, string> = positionErrors(latitude, longitude, radius, 0);
    if (!name.trim()) next.name = 'Enter a name';
    if (!type) next.locationType = 'Choose the kind of site';
    if (!location && code.trim() && !CODE_PATTERN.test(code.trim())) next.code = 'Use A–Z, 0–9 and _ only, starting with a letter';
    if (outline.length > 0 && outline.length < 3) next.boundary = 'An outline needs at least 3 points';
    if (!location && ownerError) next.organizationId = ownerError;
    setErrors(next);
    if (Object.keys(next).length) return;

    const ok = await confirm(
      location
        ? { title: `Save changes to ${location.name}?`, description: 'Shipments and checkpoints at this site use the new position and zone from now on.', confirmLabel: 'Save changes' }
        : { title: `Create ${name.trim()}?`, description: `${locationLabel(type)}. Its code and owner can't change later.`, confirmLabel: 'Create site' },
    );
    if (!ok) return;

    const body = {
      name: name.trim(),
      locationType: type,
      countryCode: country,
      stateRegion: state || null,
      city: city.trim() || null,
      address: address.trim() || null,
      latitude: latitude.trim() === '' ? null : Number(latitude),
      longitude: longitude.trim() === '' ? null : Number(longitude),
      geofenceRadiusMeters: radius.trim() === '' ? null : Number(radius),
      boundary: outlineToBoundary(outline),
    };
    try {
      const res = location ? await update({ id: location.id, ...body }).unwrap() : await create({ ...body, ...(code.trim() ? { code: code.trim() } : {}), ...(ownerBody ?? {}), idempotencyKey: key }).unwrap();
      if (!location) done();
      toast.success(location ? 'Site updated' : 'Site created');
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (Object.keys(apiError.fields).length) setErrors(apiError.fields);
      else setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      size="lg"
      title={location ? `Edit ${location.name}` : 'Add a site'}
      subtitle="A real place where minerals are mined, stored, weighed, tested or handed over"
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="location-form" loading={saving} disabled={saving}>
            {location ? 'Save changes' : 'Create site'}
          </Button>
        </>
      }
    >
      <form id="location-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        {!location && ownerField}
        {!location && errors.organizationId && (
          <p className="text-sm text-semantic-error-text" role="alert">
            {errors.organizationId}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Name" htmlFor="site-name" required error={errors.name}>
            <Input id="site-name" value={name} onChange={(e) => setName(e.target.value)} error={!!errors.name} maxLength={255} autoComplete="off" placeholder="e.g. Jos tin mine, pit 3" />
          </FormField>
          <FormField label="Kind of site" htmlFor="site-type" required error={errors.locationType}>
            <NativeSelect id="site-type" value={type} onValueChange={setType} options={locationOptions(LOCATION_TYPES)} placeholder="Choose…" error={!!errors.locationType} />
          </FormField>
        </div>
        <FormField label="Code" htmlFor="site-code" help={location ? 'Fixed once created' : 'Empty: MINMEG makes one. It can\'t change later.'} error={errors.code}>
          <Input id="site-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={!!location} error={!!errors.code} maxLength={64} autoComplete="off" />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Country" htmlFor="site-country" required error={errors.countryCode}>
            <NativeSelect
              id="site-country"
              value={country}
              onValueChange={(v) => {
                setCountry(v);
                setState('');
              }}
              options={COUNTRIES}
            />
          </FormField>
          <FormField label="State or region" htmlFor="site-state" error={errors.stateRegion}>
            <NativeSelect id="site-state" value={state} onValueChange={setState} options={stateOptions} placeholder="Not set" />
          </FormField>
          <FormField label="City or town" htmlFor="site-city" error={errors.city}>
            <Input id="site-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={128} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="site-address" error={errors.address}>
          <Textarea id="site-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={2000} />
        </FormField>

        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <h3 className="text-sm font-semibold text-ink">Position and zone</h3>
          <p className="text-xs text-steel">Only your company and MINMEG can see the exact position. Checkpoints that must check GPS need a position or an outline.</p>
          {open && (
            <MapPicker
              center={center}
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
          )}
          {errors.boundary && <p className="text-xs text-semantic-error-text">{errors.boundary}</p>}
          <div className="grid gap-3 md:grid-cols-3">
            <FormField label="Latitude" htmlFor="site-lat" error={errors.latitude}>
              <Input id="site-lat" inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} error={!!errors.latitude} />
            </FormField>
            <FormField label="Longitude" htmlFor="site-lng" error={errors.longitude}>
              <Input id="site-lng" inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} error={!!errors.longitude} />
            </FormField>
            <FormField label="Zone radius (metres)" htmlFor="site-radius" error={errors.geofenceRadiusMeters}>
              <Input id="site-radius" type="number" inputMode="numeric" min={0} max={100000} value={radius} onChange={(e) => setRadius(e.target.value)} error={!!errors.geofenceRadiusMeters} />
            </FormField>
          </div>
        </div>
      </form>
      {dialog}
    </SideSheet>
  );
}
