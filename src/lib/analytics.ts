/*
 * Step 2.14 (Group 27, decisions #87, #115): analytics, worked out by the backend from the
 * company's own records. Counts come as { STATUS: n }, series as [{ period, count }] for the
 * periods that have records only, rates as percentages (0-100), times in hours or minutes.
 */
export type Interval = 'day' | 'week' | 'month';
export type Counts = Record<string, number>;
export type Series = { period: string; count: number }[];
export interface Window {
  from: string;
  to: string;
  interval: Interval;
  organizationId: string | null;
}
type Answer<T> = { success: boolean; data: T & { window: Window } };

export type TradeAnalytics = Answer<{
  rfqs: { byStatus: Counts; posted: Series; offersByStatus: Counts };
  inquiries: { byStatus: Counts; received: Series };
  trades: { created: number; accepted: number; cancelled: number; conversionRate: number | null; cancellationRate: number | null; byStatus: Counts; bySource: Counts };
  allocations: { byStatus: Counts; averageHoursHoldToFulfil: number | null };
  listings: { byStatus: Counts; published: Series };
}>;
export type TraceabilityAnalytics = Answer<{
  batches: { byStatus: Counts; created: Series; bySourceType: Counts };
  ledger: { entriesByType: Counts; waitingForApproval: number };
  shipments: { byStatus: Counts; dispatched: Series };
  events: { byStatus: Counts; recorded: Series };
}>;
export type LogisticsAnalytics = Answer<{
  shipments: { inMotion: number; byStatus: Counts; arrivedWithPlan: number; onTimeArrivals: number; onTimeRate: number | null; averageTransitHours: number | null };
  pings: { bySource: Counts; byValidation: Counts };
  checkpoints: { visitsByStatus: Counts; checkpointsByStatus: Counts };
  alerts: { byType: Counts; bySeverity: Counts };
}>;
export interface SupplierRow {
  organizationId: string;
  trades: number;
  deliveries: number;
  onTimeRate: number | null;
  rejectionRate: number | null;
  returns: number;
  inspectionResults: number;
  inspectionResultsVerified: number;
  quarantines: number;
  disqualifications: number;
}
export type SuppliersAnalytics = Answer<{ note: string; suppliers: SupplierRow[] }>;
export type InspectionsAnalytics = Answer<{
  assignments: { byStatus: Counts; scheduled: Series; averageHoursToComplete: number | null; workloadByInspector?: Counts };
  results: { inspectionByStatus: Counts; assayByStatus: Counts };
  grades: { parameter: string; results: number; average: number; min: number; max: number }[];
}>;
export type MeasurementsAnalytics = Answer<{
  byType: Counts;
  bySource: Counts;
  byVerification: Counts;
  recorded: Series;
  measurementTypeId?: string;
  values?: { period: string; count: number; avg: number | null; min: number | null; max: number | null }[];
  note?: string;
}>;
export type CertificatesAnalytics = Answer<{
  passports: { byStatus: Counts; versionsPublished: Series; averageHoursDraftToPublish: number | null; draftsFailingValidation: number };
  certificates: { byStatus: Counts; issued: Series; expiringIn30Days: number; versionsByStatus: Counts };
}>;
export type ComplianceAnalytics = Answer<{
  current: { byStatus: Counts; byVerification: Counts; byStandard: Counts };
  assessed: Series;
  expiringIn30Days: number;
  averageHoursToVerify: number | null;
}>;
export type EsgCarbonAnalytics = Answer<{
  note: string;
  esg: { byStatus: Counts; byFramework: Counts; created: Series };
  carbon: { byStatus: Counts; byMethodology: Counts; declaredTotals: { status: string; assessments: number; totalEmissions: number | null }[]; created: Series };
}>;
export type AlertsAnalytics = Answer<{
  alerts: { byType: Counts; bySeverity: Counts; byStatus: Counts; detected: Series; averageMinutesToAcknowledge: number | null; averageHoursToResolve: number | null };
  notifications: { receivedByReadStatus: Counts };
}>;
export type HardwareAnalytics = Answer<{ devices: { total: number; byStatus: Counts; onlineLast30Minutes: number; onlineRate: number | null } }>;

// ---------------- the window (D5) ----------------
export type Preset = '7' | '30' | '90' | '365' | 'custom';
export const PRESETS: { value: Preset; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
  { value: 'custom', label: 'Choose dates' },
];
export const INTERVALS: { value: string; label: string }[] = [
  { value: 'day', label: 'By day' },
  { value: 'week', label: 'By week' },
  { value: 'month', label: 'By month' },
];
export interface WindowChoice {
  preset: Preset;
  from: string;
  to: string;
  interval: '' | Interval;
}
export const DEFAULT_WINDOW: WindowChoice = { preset: '30', from: '', to: '', interval: '' };
const DAY = 86_400_000;
/** The query for the backend; a custom range ends at the end of its last day. Null while a custom range is incomplete or wrong */
export function windowQuery(w: WindowChoice): { from?: string; to?: string; interval?: Interval } | null {
  const interval = w.interval || undefined;
  if (w.preset !== 'custom') return { from: new Date(Date.now() - Number(w.preset) * DAY).toISOString(), interval };
  if (!w.from || !w.to) return null;
  const from = new Date(`${w.from}T00:00:00`);
  const to = new Date(new Date(`${w.to}T00:00:00`).getTime() + DAY);
  if (from >= to || to.getTime() - from.getTime() > 366 * DAY) return null;
  return { from: from.toISOString(), to: to.toISOString(), interval };
}
export function windowProblem(w: WindowChoice): string | null {
  if (w.preset !== 'custom') return null;
  if (!w.from || !w.to) return 'Choose both dates.';
  if (w.from > w.to) return 'The start date is after the end date.';
  return windowQuery(w) ? null : 'Choose at most 366 days.';
}

// ---------------- reading the answers ----------------
export const total = (c: Counts | undefined) => Object.values(c ?? {}).reduce((a, b) => a + b, 0);
export const pick = (c: Counts | undefined, ...keys: string[]) => keys.reduce((a, k) => a + (c?.[k] ?? 0), 0);
export const words = (v: string) => (v === 'NONE' ? 'Not set' : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, ' '));
export const percent = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v}%`);
export const duration = (hours: number | null | undefined) => (hours === null || hours === undefined ? '—' : hours < 1 ? `${Math.round(hours * 60)} min` : hours < 48 ? `${hours} h` : `${Math.round((hours / 24) * 10) / 10} days`);
export const number = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toLocaleString());

/** Every period of the window, with 0 where nothing happened (the backend returns only periods with records) */
export function fillSeries(series: Series | undefined, w: Window): { period: string; label: string; count: number }[] {
  const byPeriod = new Map((series ?? []).map((p) => [p.period.slice(0, 10), p.count]));
  const out: { period: string; label: string; count: number }[] = [];
  const start = truncate(new Date(w.from), w.interval);
  const end = new Date(w.to);
  for (let d = start; d < end && out.length < 400; d = step(d, w.interval)) {
    const key = d.toISOString().slice(0, 10);
    out.push({ period: key, label: periodLabel(d, w.interval), count: byPeriod.get(key) ?? 0 });
  }
  return out;
}
function truncate(d: Date, interval: Interval): Date {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), interval === 'month' ? 1 : d.getUTCDate()));
  if (interval === 'week') t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7)); // weeks start on Monday, as in PostgreSQL
  return t;
}
function step(d: Date, interval: Interval): Date {
  const n = new Date(d);
  if (interval === 'month') n.setUTCMonth(n.getUTCMonth() + 1);
  else n.setUTCDate(n.getUTCDate() + (interval === 'week' ? 7 : 1));
  return n;
}
function periodLabel(d: Date, interval: Interval): string {
  const opts: Intl.DateTimeFormatOptions = interval === 'month' ? { month: 'short', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' };
  return `${interval === 'week' ? 'Week of ' : ''}${d.toLocaleDateString(undefined, opts)}`;
}
export const windowText = (w: Window | undefined) =>
  w ? `${new Date(w.from).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(new Date(w.to).getTime() - 1).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
