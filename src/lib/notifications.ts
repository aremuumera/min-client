import type { BadgeTone } from '@/components/ui';

/*
 * Step 2.13: the notification inbox (Group 24, decisions #82, #113). Everything MINMEG tells a
 * company, in PostgreSQL and live over SSE. Chat messages stay in Firestore with the chat.
 */
/** The inbox list's own meta (with the unread count) */
export type InboxPage<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number; unread: number } };
export type Single<T> = { data: T };

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export interface InboxItem {
  id: string;
  notificationType: string;
  category: string;
  priority: Priority;
  title: string;
  message: string;
  link: string | null;
  requiresAcknowledgement: boolean;
  readStatus: 'UNREAD' | 'SEEN' | 'READ' | 'ACKNOWLEDGED' | 'DISMISSED';
  readAt: string | null;
  acknowledgedAt: string | null;
  dismissedAt: string | null;
  audience: 'ORGANIZATION' | 'PERSONAL';
  createdAt: string;
}
export interface Switches {
  email?: boolean;
  push?: boolean;
}
export interface NotificationSettings {
  notifications: {
    channels: { email: boolean; push: boolean };
    categories: Record<string, Switches>;
    quietHours: { enabled: boolean; start: string; end: string; timezone: string };
    locale: string;
  };
  announcementsEnabled: boolean;
  pushRegistered: boolean;
  categories: string[];
  editable: boolean;
}

export const CATEGORY_TEXT: Record<string, string> = {
  ACCOUNT: 'Account and support',
  TRADE: 'Trades',
  MARKETPLACE: 'Listings and requests',
  INVENTORY: 'Batches and stock',
  SHIPMENT: 'Shipments',
  TRACKING: 'Tracking alerts',
  CUSTODY: 'Custody and codes',
  INSPECTION: 'Inspections and lab results',
  PASSPORT: 'Passports',
  CERTIFICATE: 'Certificates',
  COMPLIANCE: 'Compliance',
  ESG_CARBON: 'ESG and carbon',
  EVIDENCE: 'Evidence',
  DEVICE: 'Devices',
  BLOCKCHAIN: 'Blockchain',
  SYSTEM: 'MINMEG',
  // emails about new trade chat messages (settings only: chat messages show on the chat icon, not in the inbox)
  CHAT: 'Chat messages',
};
export const PRIORITY_TEXT: Record<Priority, string> = { LOW: 'Low', NORMAL: 'Normal', HIGH: 'Important', CRITICAL: 'Critical' };
export const priorityTone = (p: Priority): BadgeTone => (p === 'CRITICAL' ? 'error' : p === 'HIGH' ? 'warning' : 'neutral');
export const isUnread = (n: InboxItem) => n.readStatus === 'UNREAD' || n.readStatus === 'SEEN';
export const needsAck = (n: InboxItem) => n.requiresAcknowledgement && !n.acknowledgedAt;

/*
 * Where a notice opens. The backend links each notice to its record (/shipments/<id>, /alerts/<id>,
 * /batches/<id>/ledger…); this maps the record to its screen here. A record with no screen in this
 * app (e.g. /trades/<id>, staff pages) opens nothing: the notice is just marked read.
 */
const SCREENS: [RegExp, (id: string) => string][] = [
  [/^\/alerts\/([^/?]+)/, (id) => `/dashboard/alerts?alert=${id}`],
  [/^\/shipments\/([^/?]+)/, (id) => `/dashboard/shipments?shipment=${id}`],
  [/^\/(batches|events|assay-results)\//, () => '/dashboard/batches'],
  [/^\/(passports|compliance-assessments)\//, () => '/dashboard/passports'],
  [/^\/passport-template-requests\//, () => '/dashboard/passports/requests'],
  [/^\/certificates\//, () => '/dashboard/certificates'],
  [/^\/custody\//, () => '/dashboard/handovers'],
  [/^\/listings\//, () => '/dashboard/supplier-list'],
  [/^\/disqualifications\//, () => '/dashboard/documents'],
];
export function noticeHref(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith('/dashboard/')) return link;
  for (const [pattern, to] of SCREENS) {
    const m = link.match(pattern);
    if (m) return to(m[1]);
  }
  return null;
}
