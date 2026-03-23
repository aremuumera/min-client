'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { FileText, CheckCircle, AlertTriangle, XCircle, Eye, Clock, ArrowRight } from 'lucide-react';

interface TradeDocumentData {
    id: string;
    title: string;
    version_number?: number;
    status: string; // sent, signed, flagged, rejected, superseded
    stage_slug?: string;
    target_roles?: string[];
    file_url?: string;
    document_description?: string;
    data_snapshot?: Record<string, any>;
    createdAt?: string;
}

interface TradeDocumentCardProps {
    document: TradeDocumentData;
    position: 'left' | 'right';
    onSign?: (documentId: string) => void;
    onFlag?: (documentId: string) => void;
    onView?: (documentId: string) => void;
    onViewDetails?: (documentId: string) => void;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
    sent: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: <Clock size={14} />, label: 'Awaiting Action' },
    signed: { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: <CheckCircle size={14} />, label: 'Signed' },
    flagged: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <AlertTriangle size={14} />, label: 'Flagged for Review' },
    rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: <XCircle size={14} />, label: 'Rejected' },
    superseded: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: <ArrowRight size={14} />, label: 'Superseded' },
    pending_review: { color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', icon: <Eye size={14} />, label: 'Pending Review' },
};

export function TradeDocumentCard({ document, position, onSign, onFlag, onView, onViewDetails }: TradeDocumentCardProps) {
    const config = statusConfig[document.status] || statusConfig.sent;

    return (
        <Card
            style={{
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: `1px solid ${config.border}`,
                maxWidth: '380px',
                width: '100%',
            }}
        >
            {/* Header Bar */}
            <Box
                style={{
                    background: `linear-gradient(135deg, ${config.bg}, white)`,
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${config.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                    <Box
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: config.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FileText size={14} color="white" />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                            Trade Document
                        </Typography>
                        {document.version_number && document.version_number > 1 && (
                            <Typography variant="caption" style={{ color: config.color, fontWeight: 700, fontSize: '0.65rem' }}>
                                Version {document.version_number}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                {/* Status Badge */}
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                        color: config.color,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                    }}
                >
                    {config.icon}
                    {config.label}
                </Box>
            </Box>

            {/* Body */}
            <Box style={{ padding: '0.75rem 1rem' }}>
                <Typography variant="body2" style={{ fontWeight: 700, color: '#111827', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    {document.title}
                </Typography>

                {document.document_description && (
                    <Typography
                        variant="caption"
                        style={{
                            color: '#6b7280',
                            fontSize: '0.7rem',
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontStyle: 'italic',
                            lineHeight: 1.3
                        }}
                    >
                        {document.document_description}
                    </Typography>
                )}

                {document.stage_slug && (
                    <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                        Stage: {document.stage_slug.replace(/_/g, ' ')}
                    </Typography>
                )}

                {/* Superseded Notice */}
                {document.status === 'superseded' && (
                    <Box
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            background: '#f9fafb',
                            border: '1px dashed #d1d5db',
                        }}
                    >
                        <Typography variant="caption" style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.7rem' }}>
                            This version has been replaced by a newer version.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Action Buttons */}
            {document.status !== 'superseded' && (
                <Box
                    style={{
                        padding: '0.5rem 1rem 0.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                    }}
                >
                    {/* View PDF Button */}
                    {document.file_url && (
                        <button
                            onClick={() => onView?.(document.id)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #e5e7eb',
                                background: 'white',
                                color: '#374151',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s',
                            }}
                        >
                            <Eye size={14} />
                            View PDF
                        </button>
                    )}

                    {/* Sign / Accept Button */}
                    {(document.status === 'sent' || document.status === 'pending_review') && (
                        <Stack direction="row" spacing={1} style={{ flex: 1 }}>
                            <button
                                onClick={() => onSign?.(document.id)}
                                style={{
                                    flex: 2,
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    background: '#10b981',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <CheckCircle size={14} />
                                Accept
                            </button>
                            <button
                                onClick={() => onFlag?.(document.id)}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #fde68a',
                                    background: '#fffbeb',
                                    color: '#f59e0b',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s',
                                }}
                                title="Flag an issue with this document"
                            >
                                <AlertTriangle size={14} />
                            </button>
                        </Stack>
                    )}
                </Box>
            )}

            {/* Details Link */}
            <Box style={{ padding: '0 1rem 0.75rem' }}>
                <button
                    onClick={() => onViewDetails?.(document.id)}
                    style={{
                        width: '100%',
                        padding: '0.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: config.color,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        textDecoration: 'underline',
                    }}
                >
                    View Version History & Audit Trail
                </button>
            </Box>
        </Card>
    );
}

export default TradeDocumentCard;
