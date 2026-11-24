import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight, Award, Banknote, FileCheck2, FileText, Handshake, Inbox, MailQuestion, Microscope, TriangleAlert, Truck, CircleCheck, Tag,
} from 'lucide-react';
import { paths } from '@/config/paths';

/*
 * The merchants overview (decisions #147 to #150; docs/new/implementation/specs/overview-page.md).
 * Types of GET /overview, and how each part is labelled, linked and drawn.
 */

export type OverviewSide = 'selling' | 'buying';
export type WhoseTurn = 'you' | 'minmeg' | 'transit' | null;
export type WaitingKey =
  | 'inquiries_to_answer' | 'offers_to_compare' | 'documents_to_sign' | 'payments_to_make' | 'inspection_reports_to_review'
  | 'deliveries_to_confirm' | 'handovers_to_confirm' | 'data_requests' | 'certificates_expiring' | 'shipment_alerts';

export interface WaitingItem { key: WaitingKey; side: OverviewSide | null; count: number; examples: string[] }
export interface StageCount { order: number; slug: string; name: string; count: number; examples: string[] }
export interface SideStages { inProgress: StageCount[]; completedInWindow: number }
export interface RecentTrade {
  type: 'product_inquiry' | 'rfq_offer';
  id: string;
  roomId: string | null;
  /** What the trade room link needs after the room id (the inquiry's id, or the RFQ's for an offer) */
  itemId: string | null;
  side: OverviewSide;
  product: string | null;
  quantity: string | null;
  unit: string | null;
  stage: { order: number; total: number; name: string };
  subStatus: { key: string; label: string };
  whoseTurn: WhoseTurn;
  updatedAt: string;
}
export type SetupKey = 'business_verified' | 'store_profile' | 'buyer_account' | 'first_listing' | 'first_rfq' | 'first_rfq_offer';
export interface Overview {
  role: 'buyer' | 'supplier' | 'buyer_supplier';
  window: { from: string; to: string };
  setup: { steps: { key: SetupKey; done: boolean }[]; roleUpgrade: { status: string | null; reason: string | null } } | null;
  waitingForYou: WaitingItem[];
  stages: { selling: SideStages | null; buying: SideStages | null };
  recentTrades: RecentTrade[];
}

type Tone = 'primary' | 'warning' | 'error' | 'neutral';

/** "Waiting for you": the words, icon, colour and page of each item */
export const WAITING: Record<WaitingKey, { one: string; many: string; icon: LucideIcon; tone: Tone; href: string }> = {
  inquiries_to_answer: { one: 'inquiry to answer', many: 'inquiries to answer', icon: Inbox, tone: 'primary', href: paths.dashboard.receivedInquiries },
  offers_to_compare: { one: 'offer to compare', many: 'offers to compare', icon: Tag, tone: 'primary', href: paths.dashboard.rfqs.offers },
  documents_to_sign: { one: 'document to sign', many: 'documents to sign', icon: FileCheck2, tone: 'primary', href: paths.dashboard.chat.base },
  payments_to_make: { one: 'payment to make', many: 'payments to make', icon: Banknote, tone: 'warning', href: paths.dashboard.chat.base },
  inspection_reports_to_review: { one: 'inspection report to review', many: 'inspection reports to review', icon: Microscope, tone: 'primary', href: paths.dashboard.chat.base },
  deliveries_to_confirm: { one: 'delivery to confirm', many: 'deliveries to confirm', icon: Truck, tone: 'neutral', href: paths.dashboard.chat.base },
  handovers_to_confirm: { one: 'handover to confirm', many: 'handovers to confirm', icon: ArrowLeftRight, tone: 'neutral', href: paths.dashboard.handovers },
  data_requests: { one: 'data request', many: 'data requests', icon: MailQuestion, tone: 'neutral', href: paths.dashboard.dataRequests },
  certificates_expiring: { one: 'certificate expires soon', many: 'certificates expire soon', icon: Award, tone: 'warning', href: paths.dashboard.certificates },
  shipment_alerts: { one: 'open shipment alert', many: 'open shipment alerts', icon: TriangleAlert, tone: 'error', href: paths.dashboard.alerts },
};

export const waitingText = (i: WaitingItem) => `${i.count} ${i.count === 1 ? WAITING[i.key].one : WAITING[i.key].many}`;

/** Trade stages by order (spec §9 table A): the icon of each stage, for the activity feed and the trades table */
export const STAGE_ICONS: Record<number, LucideIcon> = { 1: Inbox, 2: FileText, 3: Banknote, 4: Microscope, 5: Handshake, 6: Banknote, 7: Truck, 8: CircleCheck };

/** Colours of the stage bar, lightest first (they differ in lightness, not hue alone) */
export const STAGE_SHADES = ['#cfe8d6', '#96d3a8', '#5cb948', '#1e8742', '#196f37', '#145a2c', '#0a1f1a'];

export const WHOSE_TURN: Record<Exclude<WhoseTurn, null>, { label: string; className: string }> = {
  you: { label: 'Your turn', className: 'bg-primary text-on-primary' },
  minmeg: { label: 'With MINMEG', className: 'bg-brand-green-soft text-primary-pressed' },
  transit: { label: 'On the road', className: 'bg-surface-soft text-slate' },
};

export const SETUP_LABELS: Record<SetupKey, { label: string; href: string }> = {
  business_verified: { label: 'Business verified', href: paths.dashboard.companyInfoVerification },
  store_profile: { label: 'Store profile', href: paths.dashboard.products.companyProfile },
  buyer_account: { label: 'Buyer account', href: paths.dashboard.settings.business },
  first_listing: { label: 'First listing', href: paths.dashboard.products.create },
  first_rfq: { label: 'First RFQ', href: paths.dashboard.rfqs.create },
  first_rfq_offer: { label: 'First RFQ offer', href: paths.marketplace.recentRfQ },
};

/** The trade room of a recent trade */
export const tradeRoomHref = (t: RecentTrade) =>
  t.roomId && t.itemId ? `/dashboard/chat/${t.type === 'rfq_offer' ? 'rfq' : 'product'}/${t.roomId}/${t.itemId}` : paths.dashboard.chat.base;

/* ---------------------------------------------------------------- the inspector's overview (GET /inspector/overview) */

export type InspectorStatus = 'ASSIGNED' | 'ACCEPTED' | 'SCHEDULED' | 'SITE_VISIT' | 'LAB_ANALYSIS' | 'REPORT_WRITING';
export type InspectorNextAction = 'accept_or_decline' | 'sign_document' | 'wait_for_schedule' | 'visit_site' | 'finish_site_visit' | 'record_lab_result' | 'write_report';
export interface InspectorJob {
  id: string;
  itemType: string;
  product: string;
  quantity: string | null;
  unit: string | null;
  mineralTag: string | null;
  status: InspectorStatus;
  scheduledDate: string | null;
  scheduledTime: string | null;
  place: string | null;
  nextAction: InspectorNextAction | null;
  /** Decision #149: end of the site visit + lab time (when the job goes to the lab) + the report SLA */
  reportDueAt: string | null;
  reportDueExpected: boolean;
}
export interface InspectorOverview {
  window: { from: string; to: string };
  counts: { invitations: number; running: number; siteVisitsThisWeek: number; documentsToSign: number; labResultsToRecord: number; reportsToWrite: number; completedInWindow: number };
  stages: { status: InspectorStatus; count: number }[];
  week: { date: string; kind: 'site_visit' | 'report_due' | 'unavailable'; assignmentId: string | null; product: string | null; time: string | null; place: string | null }[];
  jobs: InspectorJob[];
  services: { availability: string | null; running: number; maxConcurrent: number | null; maxWeekly: number | null; leadTimeDays: number | null; reportSlaHours: number; mineralsCovered: number };
}

export const INSPECTOR_STAGE_LABELS: Record<InspectorStatus, string> = {
  ASSIGNED: 'Invited',
  ACCEPTED: 'Accepted',
  SCHEDULED: 'Scheduled',
  SITE_VISIT: 'On site',
  LAB_ANALYSIS: 'In the lab',
  REPORT_WRITING: 'Writing the report',
};

export const NEXT_ACTION_LABELS: Record<InspectorNextAction, string> = {
  accept_or_decline: 'Accept or decline the job',
  sign_document: 'Sign the assignment brief',
  wait_for_schedule: 'Waiting for MINMEG to set the date',
  visit_site: 'Visit the site and take samples',
  finish_site_visit: 'Finish the site visit',
  record_lab_result: 'Record the lab result',
  write_report: 'Write and submit the report',
};
