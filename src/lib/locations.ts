/*
 * Group 04 locations and checkpoints (docs/new/frontend/implementation/step-2.4-locations-checkpoints.md).
 * Shapes follow the backend's Swagger schemas (minmeg-backend-ts src/docs/location.docs.ts).
 */
export interface Paged<T> {
  data: T[];
  meta: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
}

export const LOCATION_TYPES = ['MINE_LOCATION', 'PROCESSING_FACILITY', 'WAREHOUSE', 'STORAGE_FACILITY', 'PORT', 'TERMINAL', 'LABORATORY', 'WEIGHBRIDGE', 'INSPECTION_SITE', 'DELIVERY_SITE', 'CUSTOMER_SITE', 'OTHER'] as const;
export const CHECKPOINT_TYPES = ['ENTRY_GATE', 'EXIT_GATE', 'WEIGHBRIDGE', 'LOADING', 'UNLOADING', 'INSPECTION', 'SAMPLING', 'STORAGE', 'PROCESSING', 'CUSTOMS', 'DELIVERY', 'OTHER'] as const;

/** [lng, lat], as GeoJSON stores it */
export type LngLat = [number, number];
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: LngLat[][];
}

export interface Location {
  id: string;
  code: string;
  name: string;
  locationType: string;
  /** null = a platform-wide site, managed by MINMEG */
  organizationId: string | null;
  countryCode: string;
  stateRegion: string | null;
  city: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  geofenceRadiusMeters: string | null;
  boundary?: GeoPolygon | null;
  active: boolean;
  updatedAt: string;
  /** GET /locations/:id only */
  checkpointCount?: number;
}

export interface RequiredMeasurement {
  measurementTypeCode: string;
  compareWithShipped: boolean;
}

export interface Checkpoint {
  id: string;
  locationId: string;
  code: string;
  name: string;
  checkpointType: string;
  description: string | null;
  scanRequired: boolean;
  locationVerificationRequired: boolean;
  evidenceRequired: boolean;
  sequence: number | null;
  latitude?: string | null;
  longitude?: string | null;
  geofenceRadiusMeters?: string | null;
  boundary?: GeoPolygon | null;
  active: boolean;
  metadata: ({ requiredMeasurements?: RequiredMeasurement[]; sealCheckRequired?: boolean } & Record<string, unknown>) | null;
  location?: { id: string; code: string; name: string; locationType: string; organizationId: string | null; countryCode: string; active: boolean };
}

const LABELS: Record<string, string> = {
  MINE_LOCATION: 'Mine',
  PROCESSING_FACILITY: 'Processing facility',
  ENTRY_GATE: 'Entry gate',
  EXIT_GATE: 'Exit gate',
};

export function locationLabel(value: string | null | undefined): string {
  if (!value) return '—';
  if (LABELS[value]) return LABELS[value];
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const locationOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: locationLabel(v) }));

/** Same rule as the backend's code: A-Z, 0-9 and underscore, starting with a letter */
export const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;
export const codeFromName = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^[^A-Z]+|_+$/g, '');

export function listParams(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** The outline's points without the closing repeat, as the map draws them */
export function outlinePoints(boundary: GeoPolygon | null | undefined): LngLat[] {
  const ring = boundary?.coordinates?.[0] ?? [];
  return ring.length > 1 ? ring.slice(0, -1).map(([lng, lat]) => [lng, lat]) : [];
}

/** Points → the closed polygon the backend expects; fewer than 3 points is no outline */
export function outlineToBoundary(points: readonly LngLat[]): GeoPolygon | null {
  if (points.length < 3) return null;
  return { type: 'Polygon', coordinates: [[...points.map(([lng, lat]) => [lng, lat] as LngLat), [points[0][0], points[0][1]]]] };
}

/** Checks a position typed or dropped on the map; returns field errors */
export function positionErrors(lat: string, lng: string, radius: string, minRadius: number): Record<string, string> {
  const errors: Record<string, string> = {};
  const hasLat = lat.trim() !== '';
  const hasLng = lng.trim() !== '';
  if (hasLat !== hasLng) errors[hasLat ? 'longitude' : 'latitude'] = 'Enter latitude and longitude together';
  if (hasLat && !(Number(lat) >= -90 && Number(lat) <= 90)) errors.latitude = 'From -90 to 90';
  if (hasLng && !(Number(lng) >= -180 && Number(lng) <= 180)) errors.longitude = 'From -180 to 180';
  if (radius.trim() !== '') {
    if (!hasLat) errors.geofenceRadiusMeters = 'A radius needs a position';
    else if (!(Number(radius) >= minRadius && Number(radius) <= 100_000)) errors.geofenceRadiusMeters = `From ${minRadius} to 100000 metres`;
  }
  return errors;
}
