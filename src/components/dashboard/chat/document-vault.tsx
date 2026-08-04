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
    rejected: number;
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
import { cn } from '@/utils/helper';

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
        refetchOnMountOrArgChange: true,
    });

    // Always refetch fresh documents on mount / tab open
    React.useEffect(() => {
        if (inquiryId) {
            refetch();
        }
    }, [inquiryId, refetch]);

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

    const stats: DocStats = React.useMemo(() => {
        const backendStats = apiResponse?.stats;
        const computedPending = documents.filter((d: any) =>
            ['sent', 'pending_review', 'pending_signature', 'pending'].includes(d.status)
        ).length;

        return {
            total: backendStats?.total !== undefined ? backendStats.total : documents.length,
            signed: backendStats?.signed !== undefined ? backendStats.signed : documents.filter((d: any) => d.status === 'signed').length,
            pending: backendStats?.pending !== undefined && backendStats.pending > 0 ? backendStats.pending : computedPending,
            flagged: backendStats?.flagged !== undefined ? backendStats.flagged : documents.filter((d: any) => d.status === 'flagged').length,
            rejected: backendStats?.rejected !== undefined ? backendStats.rejected : documents.filter((d: any) => d.status === 'rejected').length,
            superseded: backendStats?.superseded !== undefined ? backendStats.superseded : documents.filter((d: any) => d.status === 'superseded').length,
        };
    }, [documents, apiResponse?.stats]);

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
        { label: 'Flagged', value: stats.flagged, color: '#d97706', bg: '#fffbeb' },
        { label: 'Rejected', value: stats.rejected, color: '#ef4444', bg: '#fef2f2' },
    ];

    return (
        <Box className="p-3 sm:p-5 select-none">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <FolderOpen size={20} className="text-blue-500 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                    Document Vault
                </h3>
            </div>

            {/* Stat Cards Container — Horizontally Scrollable on Mobile to prevent text truncation */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar flex-nowrap pb-1">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex-1 min-w-[72px] sm:min-w-[90px] p-2.5 rounded-xl border bg-white text-center shrink-0 transition-all"
                        style={{ borderColor: `${stat.color}40`, backgroundColor: stat.bg }}
                    >
                        <p className="text-base sm:text-lg font-black" style={{ color: stat.color }}>
                            {stat.value}
                        </p>
                        <p className="text-[9px] font-black uppercase text-gray-600 tracking-wider whitespace-nowrap">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="mb-3 flex items-center gap-2">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                    <option value="">All Statuses</option>
                    <option value="sent">Pending</option>
                    <option value="signed">Signed</option>
                    <option value="flagged">Flagged</option>
                    <option value="rejected">Rejected</option>
                    <option value="superseded">Superseded</option>
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                <Box className="text-center py-8">
                    <Spinner size={24} />
                </Box>
            ) : isError ? (
                <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-200 space-y-2">
                    <AlertTriangle size={32} className="text-red-500 mx-auto" />
                    <p className="text-sm font-bold text-red-700">Failed to load documents.</p>
                    <p className="text-xs text-red-500">
                        {String((apiError as any)?.data?.message || (apiError as any)?.message || 'Unknown error occurred')}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs"
                    >
                        Retry
                    </button>
                </div>
            ) : documents.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([stage, docs]) => (
                        <div key={stage} className="space-y-2">
                            {/* Stage Header */}
                            <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold uppercase text-[10px] sm:text-xs tracking-wider">
                                <FolderOpen size={14} /> <span>{stage}</span>
                            </div>

                            {/* Documents List */}
                            <div className="space-y-2">
                                {(docs as any[]).map((doc: any) => {
                                    const config = statusConfig[doc.status] || statusConfig.sent;
                                    const isSelected = selectedDocId === doc.id;
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                                            className={cn(
                                                'p-3 rounded-xl border transition-all cursor-pointer bg-white',
                                                isSelected ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-gray-300',
                                                doc.status === 'superseded' && 'opacity-60'
                                            )}
                                        >
                                            {/* Responsive Document Main Header Row */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                                        style={{ backgroundColor: config.bg }}
                                                    >
                                                        <FileText size={14} color={config.color} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                            {doc.title}
                                                        </h4>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium flex-wrap mt-0.5">
                                                            <span>v{doc.version_number}</span>
                                                            <span>•</span>
                                                            <span>{dayjs(doc.createdAt).format('MMM D, YYYY • h:mm A')}</span>
                                                        </div>
                                                        {doc.template?.description && (
                                                            <p className="text-[10px] text-gray-500 italic mt-1 border-l-2 border-gray-200 pl-2">
                                                                {doc.template.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action & Status Badges Row (Fully responsive, wrapping gracefully) */}
                                                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                                    {/* Status Badge */}
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0"
                                                        style={{ backgroundColor: config.bg, color: config.color }}
                                                    >
                                                        {config.icon}
                                                        {statusLabel[doc.status] || doc.status}
                                                    </span>

                                                    {/* Sigs Badge */}
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                                                        <CheckCircle size={10} className="text-gray-400" />
                                                        {(doc.signatures || []).filter((s: any) => s.action === 'signed' || s.action === 'accepted').length} SIGS
                                                    </span>

                                                    {/* View Button */}
                                                    {doc.file_url && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}
                                                            className="p-1 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-colors shrink-0"
                                                            title="View PDF"
                                                        >
                                                            <Eye size={13} />
                                                        </button>
                                                    )}

                                                    {/* Dropdown Indicator */}
                                                    <div className="p-0.5 text-gray-400 shrink-0">
                                                        {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details (Audit Trail + Actions) */}
                                            {isSelected && (
                                                <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
                                                    {/* Audit Trail */}
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-wider mb-2">
                                                            Audit Trail &amp; Signatures
                                                        </h5>
                                                        <div className="space-y-1.5">
                                                            {(() => {
                                                                const history = Array.isArray(doc.audit_trail) && doc.audit_trail.length > 0
                                                                    ? doc.audit_trail
                                                                    : Array.isArray(doc.signatures)
                                                                        ? doc.signatures
                                                                        : [];

                                                                if (history.length === 0) {
                                                                    return (
                                                                        <p className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded-lg">
                                                                            No actions recorded yet.
                                                                        </p>
                                                                    );
                                                                }

                                                                return history.map((sig: any, idx: number) => {
                                                                    if (!sig) return null;
                                                                    const sigAction = (sig.action || '').toLowerCase() || 'sent';
                                                                    const sigConfig = statusConfig[sigAction === 'accepted' ? 'signed' : sigAction === 'flagged' ? 'flagged' : sigAction === 'rejected' ? 'rejected' : 'sent'] || statusConfig.sent;
                                                                    return (
                                                                        <div key={idx} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2 text-xs">
                                                                            <div className="mt-0.5">{sigConfig.icon}</div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <div>
                                                                                        <p className="font-bold text-gray-800 text-[11px]">
                                                                                            {(sig.signer_role || 'Unknown').replace(/_/g, ' ').toUpperCase()}
                                                                                            {sig.version_number && (
                                                                                                <span className="ml-1 text-gray-400 font-normal text-[10px]">v{sig.version_number}</span>
                                                                                            )}
                                                                                        </p>
                                                                                        <p className="font-extrabold text-[10px]" style={{ color: sigConfig.color }}>
                                                                                            {(sig?.action || 'PENDING').toUpperCase()}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right flex flex-col items-end gap-1">
                                                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                                                            {sig?.createdAt ? dayjs(sig.createdAt).format('MMM D, h:mm A') : 'N/A'}
                                                                                        </span>
                                                                                        {sig.file_url && (
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); window.open(sig.file_url, '_blank'); }}
                                                                                                className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 font-bold hover:bg-blue-100 transition-colors"
                                                                                            >
                                                                                                View Ver.
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {sig.flag_reason && (
                                                                                    <div className="mt-1.5 p-2 bg-white rounded-lg border-l-2 border-emerald-500 flex justify-between items-start gap-2">
                                                                                        <p className="text-[10px] text-gray-600 italic flex-1">
                                                                                            &quot;{sig.flag_reason}&quot;
                                                                                        </p>
                                                                                        {sig.flag_reason.length > 50 && (
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); setViewFullText({ title: `${sig.signer_role?.toUpperCase()} FLAG REASON`, content: sig.flag_reason }); }}
                                                                                                className="text-blue-600 hover:text-blue-700 p-0.5"
                                                                                            >
                                                                                                <Eye size={12} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons — open modals */}
                                                    {(doc.status === 'sent' || doc.status === 'pending_review') && (
                                                        <div className="border-t border-gray-100 pt-2 space-y-1.5">
                                                            <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                                                Actions
                                                            </h5>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSignModalDoc(doc); }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                                                                >
                                                                    <PenTool size={12} /> Accept
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setActionModalDoc({ doc, type: 'flag' }); }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-colors"
                                                                >
                                                                    <Flag size={12} /> Flag
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setActionModalDoc({ doc, type: 'reject' }); }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors"
                                                                >
                                                                    <XCircle size={12} /> Reject
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, '_blank'); }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <Eye size={12} /> View
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-gray-50/70 rounded-2xl border-2 border-dashed border-gray-200 space-y-2">
                    <FileText size={36} className="text-gray-300 mx-auto" />
                    <p className="text-xs font-bold text-gray-500">
                        No documents found in this vault.
                    </p>
                </div>
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
