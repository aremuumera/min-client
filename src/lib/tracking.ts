/*
 * Shipment tracking (step 2.7b). Shapes follow the backend's tracking module. Manual and MINMEG-device
 * tracking only (decision #105); provider tracking stays hidden until a provider is named.
 */
export interface Site {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  geofenceRadiusMeters?: number | null;
}
export interface LivePosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  speedKph: number | null;
  batteryLevel: number | null;
  measuredAt: string;
}
export interface Visit {
  id: string;
  status: 'DETECTED' | 'VALIDATING' | 'PASSED' | 'FAILED' | 'OVERRIDDEN';
  detectionMethod: string;
  arrivedAt: string | null;
  failureReason: string | null;
  overrideReason: string | null;
  locationVerified: boolean;
  identifierVerified: boolean;
  evidenceVerified: boolean;
}
export interface PlanRow {
  id: string;
  sequence: number;
  status: 'PENDING' | 'APPROACHING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  required: boolean;
  skipAllowed: boolean;
  skipReason: string | null;
  expectedArrivalAt: string | null;
  checkpoint: {
    id: string;
    code: string;
    name: string;
    checkpointType: string;
    scanRequired: boolean;
    locationVerificationRequired: boolean;
    evidenceRequired: boolean;
    location: Site | null;
  } | null;
  latestVisit: Visit | null;
}
export interface Alert {
  id: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  status: string;
  title: string;
  message: string;
  detectedAt: string;
  occurrenceCount: number;
}
export interface TrackingView {
  shipment: { id: string; status: string; trackingModes: string[]; plannedArrivalAt: string | null; actualDepartureAt: string | null };
  livePosition: LivePosition | null;
  origin: Site | null;
  destination: Site | null;
  checkpoints: PlanRow[];
  devices: { assignmentId: string; assignmentStatus: string; device: { deviceCode: string } | null; batteryLevel: number | null }[];
  openAlerts: Alert[];
}
export interface Ping {
  latitude: string;
  longitude: string;
  measuredAt: string;
}

export const PLAN_LABELS: Record<PlanRow['status'], string> = {
  PENDING: 'Ahead',
  APPROACHING: 'Approaching',
  ARRIVED: 'At the checkpoint',
  IN_PROGRESS: 'Being checked',
  COMPLETED: 'Passed',
  SKIPPED: 'Skipped',
  FAILED: 'Failed',
};
export const VISIT_LABELS: Record<Visit['status'], string> = {
  DETECTED: 'Detected',
  VALIDATING: 'Waiting for checks',
  PASSED: 'Passed',
  FAILED: 'Failed',
  OVERRIDDEN: 'Passed by MINMEG staff',
};
/** Checkpoints the plan can still change (visited ones stay as they are) */
export const OPEN_PLAN: PlanRow['status'][] = ['PENDING', 'APPROACHING', 'ARRIVED', 'IN_PROGRESS'];

export const toNumber = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? null : Number(v));
