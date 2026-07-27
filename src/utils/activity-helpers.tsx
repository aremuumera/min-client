import React from 'react';
import {
    Bell, MessageSquare, Briefcase, UserPlus, CreditCard,
    ShoppingBag, LogIn, CheckCircle, XCircle, FileText, Send
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

export const getActivityIcon = (rawType: string, className = "w-4 h-4") => {
    const type = (rawType || '').toUpperCase();
    switch (type) {
        case 'USER_LOGGED_IN':
        case 'USER_SIGNED_UP':
            return <LogIn className={`${className} text-emerald-600`} />;
        case 'TEAM_MEMBER_INVITED':
        case 'TEAM_MEMBER_UPDATED':
        case 'INSPECTOR_INVITED':
        case 'INSPECTOR_INVITE_RESENT':
        case 'INSPECTOR_INVITE_DELETED':
            return <UserPlus className={`${className} text-blue-600`} />;
        case 'INVOICE_CREATED':
        case 'INVOICE_APPROVED':
        case 'INVOICE_REJECTED':
        case 'INVOICE_CANCELLED':
        case 'INVOICE_SUBMITTED_FOR_APPROVAL':
        case 'INSPECTOR_PRICING_CREATED':
        case 'INSPECTOR_PRICING_UPDATED':
            return <CreditCard className={`${className} text-purple-600`} />;
        case 'PRODUCT_CREATED':
        case 'PRODUCT_UPDATED':
        case 'PRODUCT_DELETED':
            return <ShoppingBag className={`${className} text-amber-600`} />;
        case 'RFQ_CREATED':
        case 'RFQ_UPDATED':
        case 'RFQ_DELETED':
        case 'OFFER_SUBMITTED':
        case 'OFFER_SHORTLISTED':
            return <FileText className={`${className} text-indigo-600`} />;
        case 'INQUIRY_CREATED':
        case 'INQUIRY_UPDATED':
        case 'INQUIRY_ACKNOWLEDGED':
        case 'INQUIRY_REJECTED':
            return <MessageSquare className={`${className} text-teal-600`} />;
        case 'OFFER_ACCEPTED_BY_ADMIN':
            return <CheckCircle className={`${className} text-green-600`} />;
        case 'OFFER_REJECTED_BY_ADMIN':
            return <XCircle className={`${className} text-rose-600`} />;
        case 'DOCUMENT_UPLOADED':
        case 'DOCUMENT_SIGNED':
        case 'DOCUMENT_FLAGGED':
        case 'DOCUMENT_APPROVED':
        case 'DOCUMENT_REJECTED':
            return <FileText className={`${className} text-cyan-600`} />;
        case 'INSPECTOR_ASSIGNED':
        case 'INSPECTOR_REGISTERED':
        case 'INSPECTOR_PROFILE_UPDATED':
        case 'INSPECTOR_CREATED_ADMIN':
            return <Briefcase className={`${className} text-orange-600`} />;
        case 'INSPECTION_STATUS_UPDATED':
        case 'INSPECTOR_LIMITS_CREATED':
        case 'INSPECTOR_LIMITS_UPDATED':
            return <Send className={`${className} text-sky-600`} />;
        case 'INSPECTOR_CAPABILITIES_UPDATED':
        case 'CAPABILITY_DEFINITION_CREATED':
            return <CheckCircle className={`${className} text-emerald-600`} />;
        default:
            return <Bell className={`${className} text-gray-600`} />;
    }
};

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
