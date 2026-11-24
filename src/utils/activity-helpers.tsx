import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity, Archive, ArrowLeftRight, Award, BadgeCheck, Banknote, Bell, Boxes, Building2, CalendarClock, Camera, CircleArrowUp, CircleCheck,
    ClipboardList, Cpu, DatabaseBackup, Download, FileCheck2, FileQuestion, FileSpreadsheet, FileText, FileUp, FlaskConical, GitMerge, Handshake, IdCard,
    Inbox, KeyRound, Landmark, Leaf, LifeBuoy, Lock, LogIn, MailQuestion, MessagesSquare, Microscope, Package, PackageCheck, Printer, QrCode, ReceiptText,
    RotateCcw, Route, Scale, Share2, ShieldCheck, SlidersHorizontal, Split, Store, Tag, Tags, Timer, TriangleAlert, Truck, UserCheck, Users,
} from 'lucide-react';

export type CategoryFilter = 'ALL' | 'INSPECTION' | 'RFQ' | 'INVOICE' | 'PRODUCT' | 'DOCUMENT' | 'INQUIRY' | 'USER';

export const parseMetadata = (rawMeta: any) => {
    if (!rawMeta) return {};
    if (typeof rawMeta === 'string') {
        try {
            return JSON.parse(rawMeta);
        } catch {
            return { details: rawMeta };
        }
    }
    return rawMeta;
};

/*
 * Activity icons (docs/new/implementation/specs/overview-page.md §9; owner, 2026-11-24: "use the icon").
 *  1. A trade step (TRADE_STATUS_TRANSITION) takes the icon of the stage it moved to.
 *  2. Every other type takes the icon of its group.
 *  3. Slate by default; red when something went wrong; green for a completed trade.
 */
const STAGE_ICON: Record<string, LucideIcon> = {
    trade_initiated: Inbox,
    trade_documents_confirmation: FileText,
    payment_inspection: Banknote,
    quality_inspection: Microscope,
    contract_trade_agreement: Handshake,
    payment_logistics_product: Banknote,
    logistics_shipment: Truck,
    completed: CircleCheck,
};

/** Exact types first, then prefixes (longest wins) */
const EXACT: Record<string, LucideIcon> = {
    DOCUMENT_UPLOADED: FileUp, DOCUMENT_SIGNED: FileCheck2, DOCUMENT_ACCEPTED: FileCheck2, DOCUMENT_APPROVED: FileCheck2,
    INSPECTOR_ASSIGNED: UserCheck, INSPECTOR_CHANGED: UserCheck, INSPECTOR_REMOVED: UserCheck,
    INSPECTOR_PHOTOS_UPLOADED: Camera, INSPECTION_PHOTO_UPLOADED: Camera,
    INSPECTION_RESULT_SUBMITTED: FlaskConical, ASSAY_RESULT_SUBMITTED: FlaskConical, ASSAY_RESULT_INVALIDATED: FlaskConical, INSPECTION_RESULT_RELEASED: FlaskConical,
    INSPECTION_RESULT_ACCEPTED: BadgeCheck, INSPECTION_REINSPECTION_REQUESTED: RotateCcw, RE_INSPECTION_REQUESTED: RotateCcw,
    BATCH_SPLIT: Split, BATCH_MERGED: GitMerge, BATCHES_EXPORTED: Download, PASSPORTS_EXPORTED: Download, PASSPORT_PACKAGE_EXPORTED: Download,
    OPERATIONAL_ALERT: TriangleAlert, ROLE_UPGRADE_REQUESTED: CircleArrowUp, BUSINESS_INQUIRY_CREATED: MessagesSquare,
    LISTING_MOVED_TO_DRAFT: Store, BATCH_ADDED: Store, BATCH_REMOVED: Store, TEMPLATE_REQUEST_SUBMITTED: FileQuestion,
    PROOF_RECORD_CREATED: Lock, INTEGRITY_SNAPSHOT_SEALED: Lock, BLOCKCHAIN_IDENTITY_DEFAULT_SET: KeyRound,
    SELF_ASSESSED: Scale, LABEL_ASSIGNED: Tags, TAG_ASSIGNED: Tags, UPLOAD_INITIATED: Archive, FILE_DELETED: Archive, LINK_REVOKED: Archive,
    USER_LOGGED_IN: LogIn, USER_SIGNED_UP: LogIn, KYC_MEDIA_VIEWED: ShieldCheck, OWNER_IDENTITY_SAVED: ShieldCheck, PHONE_VERIFIED: ShieldCheck,
};
const PREFIX: Array<[string, LucideIcon]> = [
    ['PRODUCT_INQUIRY_', Inbox], ['INQUIRY_', Inbox], ['ENQUIRY_', MessagesSquare],
    ['RFQ_OFFER_', Tag], ['OFFER_', Tag], ['RFQ_', ClipboardList],
    ['TRADE_DELIVERY_', CalendarClock], ['DELIVERY_SCHEDULE_', CalendarClock], ['TRADE_TYPED_QUANTITY_', PackageCheck], ['ALLOCATION_', PackageCheck],
    ['TRADE_DOCUMENT_', FileText], ['DOCUMENT_', FileText], ['TRADE_', Handshake],
    ['INVOICE_', ReceiptText], ['BANK_ACCOUNT_', Landmark],
    ['INSPECTOR_', SlidersHorizontal], ['INSPECTION_', Microscope], ['FIELD_WORK_', Timer],
    ['PRODUCT_', Store], ['STORE_', Building2], ['SUPPLIER_PROFILE_', Building2], ['SUPPLIER_VERIFICATION_', ShieldCheck],
    ['BATCH_', Boxes], ['IDENTIFIER', QrCode], ['PRINT_', Printer], ['HANDLING_UNIT_', Package], ['CUSTODY_', ArrowLeftRight],
    ['TRACEABILITY_EVENT_', Activity], ['RECORD_RELEASE', Activity],
    ['SHIPMENT_ROUTE_', Route], ['SHIPMENT_CHECKPOINT_', Route], ['SHIPMENT_REROUTED', Route], ['CHECKPOINT_VISIT_', Route], ['SHIPMENT_', Truck],
    ['DEVICE_', Cpu], ['PASSPORT_BACKUP', DatabaseBackup], ['PASSPORT_BACKED_UP', DatabaseBackup], ['PASSPORT_RECOVERY_', DatabaseBackup],
    ['PASSPORT_TEMPLATE_REQUEST', FileQuestion], ['PASSPORT_', IdCard], ['CERTIFICATE_', Award], ['DATA_REQUEST_', MailQuestion],
    ['RECORD_SHARED', Share2], ['RECORD_EMAIL_SHARE_', Share2], ['RESOURCE_ACCESS_', Share2],
    ['BLOCKCHAIN_ANCHOR_', Lock], ['COMPANY_SIGNING_KEY', KeyRound], ['ESG_', Leaf], ['CARBON_', Leaf], ['COMPLIANCE_', Scale],
    ['BULK_JOB', FileSpreadsheet], ['TEAM_MEMBER_', Users], ['LIVENESS_', ShieldCheck], ['ADDRESS_VISIT_', ShieldCheck], ['BUSINESS_', ShieldCheck],
    ['DIRECTOR_', ShieldCheck], ['VERIFICATION_CHECK_', ShieldCheck], ['SUPPORT_', LifeBuoy], ['NOTIFICATION_', Bell], ['PUSH_TOKEN_', Bell],
].sort((a, b) => b[0].length - a[0].length) as Array<[string, LucideIcon]>;

/** Endings that mean something went wrong (shown in red) */
const PROBLEM = /(REJECTED|DECLINED|CANCELLED|REVOKED|FAILED|DISPUTED|INVALIDATED|QUARANTINED|SUSPENDED|DISQUALIFIED|REFUSED)$/;

/** The icon and colour of one activity entry */
export function activityIcon(rawType: string, rawMeta?: unknown): { Icon: LucideIcon; color: string } {
    const type = (rawType || '').toUpperCase();
    if (type === 'TRADE_STATUS_TRANSITION') {
        const meta = parseMetadata(rawMeta);
        const stage = String(meta.to_stage ?? '').replace(/_rfq$/, '');
        const sub = String(meta.to_sub_status ?? '').toUpperCase();
        const Icon = STAGE_ICON[stage] ?? Handshake;
        const color = stage === 'completed' || ['COMPLETED', 'ESCROW_SETTLED'].includes(sub) ? 'text-primary' : PROBLEM.test(sub) ? 'text-semantic-error-text' : 'text-slate';
        return { Icon, color };
    }
    const Icon = EXACT[type] ?? PREFIX.find(([p]) => type.startsWith(p))?.[1] ?? Bell;
    const color = type === 'OPERATIONAL_ALERT' || PROBLEM.test(type) ? 'text-semantic-error-text' : 'text-slate';
    return { Icon, color };
}

export const getActivityIcon = (rawType: string, className = "w-4 h-4", rawMeta?: unknown) => {
    const { Icon, color } = activityIcon(rawType, rawMeta);
    return <Icon className={`${className} ${color}`} aria-hidden="true" />;
};

/** Account events: in the full activity log, not on the overview card (spec §9) */
const ACCOUNT_EVENTS = new Set(['USER_SIGNED_UP', 'USER_LOGGED_IN', 'NOTIFICATION_SETTINGS_UPDATED', 'NOTIFICATION_ACKNOWLEDGED', 'PUSH_TOKEN_REGISTERED', 'PUSH_TOKEN_CLEARED', 'KYC_MEDIA_VIEWED']);
export const isAccountActivity = (rawType: string) => ACCOUNT_EVENTS.has((rawType || '').toUpperCase());

export const getActivityDescription = (activity: any) => {
    // Strictly extract and return the official backend-generated message
    if (activity?.message && typeof activity.message === 'string') {
        return activity.message;
    }
    const metadata = parseMetadata(activity?.metadata);
    if (metadata?.message && typeof metadata.message === 'string') {
        return metadata.message;
    }
    if (metadata?.description && typeof metadata.description === 'string') {
        return metadata.description;
    }

    const rawType = activity?.action_type || activity?.actionType || activity?.action || '';
    if (rawType) {
        return rawType.replace(/_/g, ' ').toLowerCase();
    }
    return '';
};

export const getActivityActorName = (activity: any, currentUser?: any) => {
    const metadata = parseMetadata(activity.metadata);
    const actorId = activity.userId || activity.user_id;

    if (currentUser && actorId && (actorId === currentUser.id || actorId === currentUser.external_id)) {
        return "You";
    }
    if (metadata.updated_by_name || metadata.created_by_name || metadata.registered_by_name || metadata.invited_by_name || metadata.actorName || metadata.name) {
        return metadata.updated_by_name || metadata.created_by_name || metadata.registered_by_name || metadata.invited_by_name || metadata.actorName || metadata.name;
    }
    if (metadata.updated_by_email || metadata.created_by_email || metadata.registered_by_email || metadata.invited_by_email || metadata.actorEmail || metadata.email) {
        return metadata.updated_by_email || metadata.created_by_email || metadata.registered_by_email || metadata.invited_by_email || metadata.actorEmail || metadata.email;
    }
    return "Team Member";
};

export const getCategoriesForRole = (userRole?: string): { label: string; value: CategoryFilter }[] => {
    const role = userRole?.toLowerCase();
    if (role === 'inspector') {
        return [
            { label: 'All Activities', value: 'ALL' },
            { label: 'Inspections & Services', value: 'INSPECTION' },
            { label: 'Team & Auth', value: 'USER' },
            { label: 'Trade Documents', value: 'DOCUMENT' },
            { label: 'Invoices & Agreements', value: 'INVOICE' },
        ];
    }
    if (role === 'buyer') {
        return [
            { label: 'All Activities', value: 'ALL' },
            { label: 'RFQs & Bids', value: 'RFQ' },
            { label: 'Inquiries', value: 'INQUIRY' },
            { label: 'Invoices & Agreements', value: 'INVOICE' },
            { label: 'Trade Documents', value: 'DOCUMENT' },
            { label: 'Team & Auth', value: 'USER' },
        ];
    }
    if (role === 'supplier') {
        return [
            { label: 'All Activities', value: 'ALL' },
            { label: 'Products', value: 'PRODUCT' },
            { label: 'Inquiries', value: 'INQUIRY' },
            { label: 'Invoices & Agreements', value: 'INVOICE' },
            { label: 'Trade Documents', value: 'DOCUMENT' },
            { label: 'Team & Auth', value: 'USER' },
        ];
    }
    return [
        { label: 'All Activities', value: 'ALL' },
        { label: 'Inspections & Services', value: 'INSPECTION' },
        { label: 'RFQs & Bids', value: 'RFQ' },
        { label: 'Invoices & Agreements', value: 'INVOICE' },
        { label: 'Products', value: 'PRODUCT' },
        { label: 'Trade Documents', value: 'DOCUMENT' },
        { label: 'Inquiries', value: 'INQUIRY' },
        { label: 'Team & Auth', value: 'USER' },
    ];
};
