import type { BadgeTone } from '@/components/ui';

/* Step 2.13b: operational alerts (Group 25, decision #113 D8). Companies see and acknowledge; MINMEG resolves. */
export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED' | 'AUTO_RESOLVED';
export interface OperationalAlert {
  id: string;
  alertType: string;
  severity: AlertSeverity;
  subjectType: string;
  subjectId: string;
  shipmentId: string | null;
  title: string;
  message: string;
  status: AlertStatus;
  assignedToUserId: string | null;
  assignedToOrganizationId: string | null;
  detectedAt: string;
  acknowledgedAt: string | null;
  investigationStartedAt: string | null;
  resolvedAt: string | null;
  resolutionCode: string | null;
  resolutionNote: string | null;
  dismissedAt: string | null;
  occurrenceCount: number;
  lastOccurrenceAt: string;
  metadata: ({ history?: { at: string; by?: string; action: string; note?: string | null }[] } & Record<string, unknown>) | null;
}
export const SEVERITY_TEXT: Record<AlertSeverity, string> = { CRITICAL: 'Critical', HIGH: 'High', WARNING: 'Warning', INFO: 'Information' };
export const severityTone = (s: AlertSeverity): BadgeTone => (s === 'CRITICAL' ? 'error' : s === 'HIGH' || s === 'WARNING' ? 'warning' : 'neutral');
export const ALERT_STATUS_TEXT: Record<AlertStatus, string> = {
  OPEN: 'Open',
  ACKNOWLEDGED: 'Seen',
  INVESTIGATING: 'MINMEG is looking into it',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
  AUTO_RESOLVED: 'Cleared by itself',
};
export const OPEN_ALERT: AlertStatus[] = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING'];
export const words = (v: string | null | undefined) => (v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, ' ') : '');
