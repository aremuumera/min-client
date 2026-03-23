'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Card, CardContent } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Spinner } from '@/components/ui';
import {
    FileText, CheckCircle, Clock, AlertTriangle, XCircle,
    ArrowRight, Eye, Filter, FolderOpen, Download, PenTool, Flag,
    ChevronDown, ChevronUp
} from 'lucide-react';
import dayjs from 'dayjs';
import { SignatureModal, ActionConfirmModal, LongTextModal } from './document-action-modals';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocalPref } from './../../../redux/features/doc-hub/signature_pref_slice';

interface DocumentVaultProps {
    inquiryId: string;
    itemType?: string;
}

interface DocStats {
    total: number;
    signed: number;
    pending: number;
    flagged: number;
    superseded: number;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    sent: { color: '#3b82f6', bg: '#eff6ff', icon: <Clock size={12} /> },
    signed: { color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle size={12} /> },
    flagged: { color: '#f59e0b', bg: '#fffbeb', icon: <AlertTriangle size={12} /> },
    rejected: { color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={12} /> },
    superseded: { color: '#6b7280', bg: '#f9fafb', icon: <ArrowRight size={12} /> },
};

const statusLabel: Record<string, string> = {
    sent: 'Pending Signature',
    pending_review: 'Pending Review',
    signed: 'Signed',
    flagged: 'Flagged',
    rejected: 'Rejected',
    superseded: 'Superseded',
    draft: 'Draft',
};

import {
    useGetDocumentsByInquiryQuery,
    useSignDocumentMutation,
    useUpdateSignaturePreferenceMutation,
    useGetSignatureSettingsQuery
} from '@/redux/features/doc-hub/doc_hub_api';

export function DocumentVault({ inquiryId, itemType }: DocumentVaultProps) {
    const [statusFilter, setStatusFilter] = React.useState('');
    const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
    const [signDocument, { isLoading: isSigning }] = useSignDocumentMutation();

    // Modal state
    const [signModalDoc, setSignModalDoc] = React.useState<any>(null);
    const [actionModalDoc, setActionModalDoc] = React.useState<{ doc: any; type: 'flag' | 'reject' } | null>(null);
    const [viewFullText, setViewFullText] = React.useState<{ title: string; content: string } | null>(null);

    const dispatch = useDispatch();
    const { data: sigSettings } = useGetSignatureSettingsQuery();
    const [updateSignaturePreference] = useUpdateSignaturePreferenceMutation();
    const savePreference = useSelector((state: any) => state.signaturePref?.save_signature_enabled);

    // Sync remote pref to local slice on load
    React.useEffect(() => {
        if (sigSettings?.data) {
            dispatch(updateLocalPref(sigSettings.data.save_signature_enabled));
        }
    }, [sigSettings, dispatch]);

    const { data: apiResponse, isLoading, isError, error: apiError, refetch } = useGetDocumentsByInquiryQuery({
        inquiryId,
        status: statusFilter || undefined,
        itemType,
    }, {
        skip: !inquiryId,
    });


    console.log('apiResponse', apiResponse, inquiryId)

    const handleSign = async (signatureType: 'typed_name' | 'svg_drawing', signatureData: string) => {
        if (!signModalDoc) return;
        try {
            await signDocument({
                documentId: signModalDoc.id,
                action: 'accepted',
                signature_type: signatureType,
                signature_data: signatureData,
            }).unwrap();
            setSignModalDoc(null);
            refetch();
        } catch (err: any) {
            console.error('Sign failed:', err);
        }
    };

    const handleToggleSavePreference = async (enabled: boolean) => {
        try {
            dispatch(updateLocalPref(enabled));
            await updateSignaturePreference({ save_signature_enabled: enabled }).unwrap();
        } catch (err) {
            console.error('Failed to update signature preference:', err);
            dispatch(updateLocalPref(!enabled));
        }
    };

    const handleFlagOrReject = async (reason: string) => {
        if (!actionModalDoc) return;
        const actionMap = { flag: 'flagged', reject: 'rejected' } as const;
        try {
            await signDocument({
                documentId: actionModalDoc.doc.id,
                action: actionMap[actionModalDoc.type],
                flag_reason: reason,
            }).unwrap();
            setActionModalDoc(null);
            refetch();
        } catch (err: any) {
            console.error('Action failed:', err);
        }
    };

    const documents = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    const stats = apiResponse?.stats || { total: 0, signed: 0, pending: 0, flagged: 0, superseded: 0 };

    // Group documents by stage name
    const grouped = React.useMemo(() => {
        try {
            return documents.reduce((acc: Record<string, any[]>, doc: any) => {
                if (!doc) return acc;
                const stageName = doc.stage?.name || doc.stage_slug?.replace(/_/g, ' ') || 'General Documents';
                if (!acc[stageName]) acc[stageName] = [];
                acc[stageName].push(doc);
                return acc;
            }, {});
        } catch (err) {
            console.error('Error grouping documents:', err);
            return {};
        }
    }, [documents]);

    const statCards = [
        { label: 'Total', value: stats.total, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Signed', value: stats.signed, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Flagged', value: stats.flagged, color: '#ef4444', bg: '#fef2f2' },
    ];

    return (
        <Box style={{ padding: '1rem' }}>
            {/* Header */}
            <Stack direction="row" spacing={1} style={{ alignItems: 'center', marginBottom: '1rem' }}>
                <FolderOpen size={20} color="#3b82f6" />
                <Typography variant="subtitle1" style={{ fontWeight: 700, color: '#111827' }}>
                    Document Vault
                </Typography>
            </Stack>

            {/* Stat Cards */}
            <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {statCards.map((stat) => (
                    <Card key={stat.label} style={{ borderRadius: '0.75rem', border: `1px solid ${stat.bg}`, overflow: 'hidden' }}>
                        <CardContent style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <Typography variant="h5" style={{ fontWeight: 800, color: stat.color }}>
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                {stat.label}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Filter */}
            <Box style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={14} color="#9ca3af" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                    <option value="">All Statuses</option>
                    <option value="sent">Pending</option>
                    <option value="signed">Signed</option>
                    <option value="flagged">Flagged</option>
                    <option value="rejected">Rejected</option>
                    <option value="superseded">Superseded</option>
                </select>
            </Box>

            {/* Content */}
            {isLoading ? (
                <Box style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner size={24} />
                </Box>
            ) : isError ? (
                <Box style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: '1rem', border: '1px solid #ef4444' }}>
                    <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <Typography variant="body2" style={{ color: '#b91c1c', fontWeight: 600 }}>
                        Failed to load documents.
                    </Typography>
                    <Typography variant="caption" style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                        {String((apiError as any)?.data?.message || (apiError as any)?.message || 'Unknown error occurred')}
                    </Typography>
                    <button
                        onClick={() => refetch()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                        Retry
                    </button>
                </Box>
            ) : documents.length > 0 ? (
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(grouped).map(([stage, docs]) => (
                        <Box key={stage}>
                            {/* Stage Header */}
                            <Typography
                                variant="caption"
                                style={{ fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <FolderOpen size={14} /> {stage}
                            </Typography>

                            {/* Documents List */}
                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {(docs as any[]).map((doc: any) => {
                                    const config = statusConfig[doc.status] || statusConfig.sent;
                                    const isSelected = selectedDocId === doc.id;
                                    return (
                                        <Card
                                            key={doc.id}
                                            style={{
                                                borderRadius: '0.5rem',
                                                border: `1px solid ${isSelected ? config.color : '#e5e7eb'}`,
                                                overflow: 'hidden',
                                                opacity: doc.status === 'superseded' ? 0.6 : 1,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                background: isSelected ? `${config.bg}40` : 'white',
                                            }}
                                            onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                                        >
                                            <CardContent style={{ padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {/* Document Row */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                                                    <Stack direction="row" spacing={1} style={{ alignItems: 'center', flex: 1 }}>
                                                        <Box style={{ width: '24px', height: '24px', borderRadius: '4px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <FileText size={12} color={config.color} />
                                                        </Box>
                                                        <Box style={{ minWidth: 0 }}>
                                                            <Typography variant="body2" style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {doc.title}
                                                            </Typography>
                                                            <Typography variant="caption" style={{ color: config.color, fontSize: '0.65rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                {/* <span style={{ color: '#3b82f6', fontWeight: 600 }}>{doc.template?.name || 'Manual Upload'}</span> */}
                                                                {/* <span>•</span> */}
                                                                <span>v{doc.version_number}</span>
                                                                <span>•</span>
                                                                <span>{dayjs(doc.createdAt).format('MMM D, YYYY')}</span>
                                                            </Typography>
                                                            {doc.template?.description && (
                                                                <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.65rem', fontStyle: 'italic', marginTop: '4px', borderLeft: '2px solid #e5e7eb', paddingLeft: '8px' }}>
                                                                    {doc.template.description}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} style={{ alignItems: 'center', flexShrink: 0 }}>
                                                        {/* Status Badge */}
                                                        <Box style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '999px', background: config.bg, color: config.color, fontSize: '0.6rem', fontWeight: 700 }}>
                                                            {config.icon}
                                                            {statusLabel[doc.status] || doc.status}
                                                        </Box>
                                                        {/* Recipient Role Chips with defensive parsing */}
                                                        {/* {(() => {
                                                            let roles: string[] = [];
                                                            if (Array.isArray(doc.target_roles)) {
                                                                roles = doc.target_roles;
                                                            } else if (typeof doc.target_roles === 'string' && doc.target_roles.trim()) {
                                                                try {
                                                                    const parsed = JSON.parse(doc.target_roles);
                                                                    roles = Array.isArray(parsed) ? parsed : [String(parsed)];
                                                                } catch (e) {
                                                                    roles = [doc.target_roles];
                                                                }
                                                            }

                                                            return roles.map((role: string) => {
                                                                const roleLower = role.toLowerCase();
                                                                const roleStyles: Record<string, { bg: string, color: string, border: string }> = {
                                                                    buyer: { bg: '#eef2ff', color: '#4f46e5', border: '#e0e7ff' },
                                                                    supplier: { bg: '#fffbeb', color: '#d97706', border: '#fef3c7' },
                                                                    inspector: { bg: '#faf5ff', color: '#9333ea', border: '#f3e8ff' }
                                                                };
                                                                const theme = roleStyles[roleLower] || { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
                                                                return (
                                                                    <Box key={role} style={{
                                                                        padding: '2px 8px',
                                                                        borderRadius: '6px',
                                                                        background: theme.bg,
                                                                        color: theme.color,
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 800,
                                                                        textTransform: 'uppercase',
                                                                        border: `1px solid ${theme.border}`,
                                                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                                                    }}>
                                                                        {role}
                                                                    </Box>
                                                                );
                                                            });
                                                        })()} */}
                                                        {/* View Button */}
                                                        {doc.file_url && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}
                                                                style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                title="View PDF"
                                                            >
                                                                <Eye size={12} color="#6b7280" />
                                                            </button>
                                                        )}
                                                        {/* Dropdown Arrow Indicator */}
                                                        <Box style={{ padding: '0.25rem', display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                                                            {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </Box>
                                                    </Stack>
                                                </div>

                                                {/* Expanded Details (Audit Trail + Actions) */}
                                                {isSelected && (
                                                    <>
                                                        {/* Audit Trail */}
                                                        <Box style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                                            <Typography variant="caption" style={{ fontWeight: 800, color: '#4b5563', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                                                                Audit Trail &amp; Signatures
                                                            </Typography>
                                                            <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                {(() => {
                                                                    const history = Array.isArray(doc.audit_trail) && doc.audit_trail.length > 0
                                                                        ? doc.audit_trail
                                                                        : Array.isArray(doc.signatures)
                                                                            ? doc.signatures
                                                                            : [];

                                                                    if (history.length === 0) {
                                                                        return (
                                                                            <Typography variant="caption" style={{ color: '#9ca3af', fontStyle: 'italic', padding: '0.5rem' }}>
                                                                                No actions recorded yet.
                                                                            </Typography>
                                                                        );
                                                                    }

                                                                    return history.map((sig: any, idx: number) => {
                                                                        if (!sig) return null;
                                                                        const sigAction = (sig.action || '').toLowerCase() || 'sent';
                                                                        const sigConfig = statusConfig[sigAction === 'accepted' ? 'signed' : sigAction === 'flagged' ? 'flagged' : sigAction === 'rejected' ? 'rejected' : 'sent'] || statusConfig.sent;
                                                                        return (
                                                                            <Box key={idx} style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                                                <Box style={{ marginTop: '0.125rem' }}>{sigConfig.icon}</Box>
                                                                                <Box style={{ flex: 1 }}>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                                        <div>
                                                                                            <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', fontSize: '0.7rem' }}>
                                                                                                {(sig.signer_role || 'Unknown').replace(/_/g, ' ').toUpperCase()}
                                                                                                {sig.version_number && (
                                                                                                    <span style={{ marginLeft: '6px', color: '#9ca3af', fontWeight: 400 }}>v{sig.version_number}</span>
                                                                                                )}
                                                                                            </Typography>
                                                                                            <Typography variant="caption" style={{ color: sigConfig.color, fontWeight: 600, fontSize: '0.65rem', display: 'block' }}>
                                                                                                {(sig?.action || 'PENDING').toUpperCase()}
                                                                                            </Typography>
                                                                                        </div>
                                                                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                                                            <Typography variant="caption" style={{ color: '#9ca3af', fontSize: '0.6rem' }}>
                                                                                                {sig?.createdAt ? dayjs(sig.createdAt).format('MMM D, h:mm A') : 'N/A'}
                                                                                            </Typography>
                                                                                            {sig.file_url && (
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); window.open(sig.file_url, '_blank'); }}
                                                                                                    style={{ fontSize: '9px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #dbeafe', borderRadius: '4px', padding: '1px 4px', cursor: 'pointer', fontWeight: 700 }}
                                                                                                >
                                                                                                    View Ver.
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {sig.flag_reason && (
                                                                                        <Box style={{ marginTop: '0.25rem', padding: '0.375rem', background: 'white', borderRadius: '0.25rem', borderLeft: `2px solid ${sigConfig.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                                                            <Typography variant="caption" style={{ color: '#4b5563', fontStyle: 'italic', fontSize: '0.65rem', flex: 1 }}>
                                                                                                &quot;{sig.flag_reason}&quot;
                                                                                            </Typography>
                                                                                            {sig.flag_reason.length > 50 && (
                                                                                                <button
                                                                                                    onClick={(e) => { e.stopPropagation(); setViewFullText({ title: `${sig.signer_role?.toUpperCase()} FLAG REASON`, content: sig.flag_reason }); }}
                                                                                                    style={{ padding: '0.125rem', color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                                                                >
                                                                                                    <Eye size={10} />
                                                                                                </button>
                                                                                            )}
                                                                                        </Box>
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    });
                                                                })()}
                                                            </Box>
                                                        </Box>

                                                        {/* Action Buttons — open modals */}
                                                        {(doc.status === 'sent' || doc.status === 'pending_review') && (
                                                            <Box style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                                                                <Typography variant="caption" style={{ fontWeight: 800, color: '#4b5563', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                                                                    Actions
                                                                </Typography>
                                                                <Box style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setSignModalDoc(doc); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                                                    >
                                                                        <PenTool size={12} /> Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setActionModalDoc({ doc, type: 'flag' }); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                                                    >
                                                                        <Flag size={12} /> Flag
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setActionModalDoc({ doc, type: 'reject' }); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                                                    >
                                                                        <XCircle size={12} /> Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#eff6ff', color: '#3b82f6', border: '1px solid #c7d2fe', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                                                    >
                                                                        <Eye size={12} /> View
                                                                    </button>
                                                                    {/* {doc.file_url && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                                                        >
                                                                            <Download size={12} /> Download
                                                                        </button>
                                                                    )} */}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb' }}>
                    <FileText size={40} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                    <Typography variant="body2" style={{ color: '#6b7280', fontWeight: 500 }}>
                        No documents found in this vault.
                    </Typography>
                </Box>
            )}

            {/* ── MODALS ── */}
            {actionModalDoc && (
                <ActionConfirmModal
                    actionType={actionModalDoc.type}
                    documentTitle={actionModalDoc.doc.title}
                    isLoading={isSigning}
                    onConfirm={handleFlagOrReject}
                    onClose={() => setActionModalDoc(null)}
                />
            )}
            {viewFullText && (
                <LongTextModal
                    title={viewFullText.title}
                    content={viewFullText.content}
                    onClose={() => setViewFullText(null)}
                />
            )}
            {signModalDoc && (
                <SignatureModal
                    documentTitle={signModalDoc.title}
                    isLoading={isSigning}
                    initialSavePreference={savePreference}
                    savedSignatureData={sigSettings?.data?.signature_data}
                    onConfirm={handleSign}
                    onToggleSavePreference={handleToggleSavePreference}
                    onClose={() => setSignModalDoc(null)}
                />
            )}
        </Box>
    );
}

export default DocumentVault;
