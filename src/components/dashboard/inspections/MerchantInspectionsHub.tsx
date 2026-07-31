"use client";

import React, { useState, useMemo } from 'react';
import { useGetMyTradeInquiriesQuery, useGetReceivedInquiriesQuery, useGetTradeAssignmentsHistoryQuery, useGetReleasedReportQuery } from '@/redux/features/trade/trade_api';
import { Spinner } from '@/components/ui';
import { ShieldCheck, Clock, Search, Filter, ChevronDown, ChevronUp, Eye, CheckCircle2, AlertTriangle, MapPin, CalendarDays, Image as ImageIcon, X, Layers, RefreshCw, Video, Play, FileText } from 'lucide-react';

// ─── Photo & Video Lightbox ─────────────────────────────────────
function PhotoLightbox({ url, caption, onClose }: { url: string; caption?: string | null; onClose: () => void }) {
    const isVideo = Boolean(url?.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i) || url?.includes('/video/upload/'));
    const isPdf = Boolean(url?.match(/\.pdf(\?.*)?$/i) || url?.includes('/raw/upload/'));

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-100 z-10 shadow-xl">
                    <X size={18} />
                </button>
                {isVideo ? (
                    <video src={url} controls autoPlay className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain shadow-2xl bg-black" />
                ) : isPdf ? (
                    <iframe src={url} className="w-full h-[80vh] rounded-xl bg-white shadow-2xl" title={caption || 'Inspection PDF'} />
                ) : (
                    <img src={url} alt={caption || 'Inspection media'} className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl" />
                )}
                {caption && <p className="mt-3 text-xs text-white/90 font-medium text-center bg-black/50 px-4 py-1.5 rounded-full">{caption}</p>}
            </div>
        </div>
    );
}

// ─── Inspection Report Modal ──────────────────────────────────
function ReportDetailModal({ assignmentId, onClose }: { assignmentId: string; onClose: () => void }) {
    const { data: reportRes, isLoading, error } = useGetReleasedReportQuery(assignmentId, { skip: !assignmentId });
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxCaption, setLightboxCaption] = useState<string | null>(null);

    const report = reportRes?.data || reportRes;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-0 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0 bg-gray-50 z-10">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Round {report?.round_number || 1} Official Inspection Report
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {report?.productName} • {report?.mineral_tag}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-3 text-center">
                        <Spinner size={28} className="text-emerald-600 animate-spin" />
                        <p className="text-sm font-bold text-gray-700">Loading Inspection Report...</p>
                    </div>
                ) : error || !report ? (
                    <div className="p-8 text-center space-y-3">
                        <AlertTriangle size={32} className="text-amber-500 mx-auto" />
                        <h4 className="text-base font-bold text-gray-900">Report Unavailable</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                            {(error as any)?.data?.error?.message || 'Inspection results have not been verified and released by Min-meg Admin yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">Grade Achieved</span>
                                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.gradeAchieved || 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">Agreed Grade %</span>
                                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.agreedGradePercentage != null ? `${report.agreedGradePercentage}%` : 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">Quantity</span>
                                <span className="text-sm font-bold text-gray-900 mt-0.5 block">{report.quantity} {report.unitType}</span>
                            </div>
                        </div>

                        {/* Location & Schedule */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <MapPin size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Inspection Location</span>
                                    <span className="text-xs font-bold text-gray-900">
                                        {[report.inspectionLocation, report.inspectionState, report.inspectionLGA].filter(Boolean).join(', ') || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <CalendarDays size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Scheduled Date</span>
                                    <span className="text-xs font-bold text-gray-900">
                                        {report.scheduledDate ? new Date(report.scheduledDate).toLocaleDateString() : 'N/A'}
                                        {report.scheduledTime ? ` at ${report.scheduledTime}` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Inspector Lab Notes */}
                        {report.completionNotes ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-1">
                                <strong className="block text-gray-900 font-bold uppercase text-[10px]">Inspector Lab Notes & Observations:</strong>
                                <p className="leading-relaxed whitespace-pre-wrap">{report.completionNotes}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No additional notes provided for this round.</p>
                        )}

                        {/* Photos Gallery */}
                        {report.photos && report.photos.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={16} className="text-emerald-600" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        Site & Laboratory Photos ({report.photos.length})
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {report.photos.map((photo: any) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => { setLightboxUrl(photo.photoUrl); setLightboxCaption(photo.caption); }}
                                            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 transition-all"
                                        >
                                            <img src={photo.photoUrl} alt={photo.caption || 'Inspection photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            {photo.caption && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                    <p className="text-[10px] text-white font-medium truncate">{photo.caption}</p>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {lightboxUrl && <PhotoLightbox url={lightboxUrl} caption={lightboxCaption} onClose={() => { setLightboxUrl(null); setLightboxCaption(null); }} />}
            </div>
        </div>
    );
}

// ─── Expanded Nested Rounds View Component ────────────────────
function TradeRoundsExpandedRow({ tradeId, onSelectReport }: { tradeId: string; onSelectReport: (id: string) => void }) {
    const { data: rawHistory, isLoading } = useGetTradeAssignmentsHistoryQuery(
        { tradeId, itemType: 'product' },
        { skip: !tradeId }
    );

    const history = Array.isArray(rawHistory) ? rawHistory : (Array.isArray(rawHistory?.data) ? rawHistory.data : []);

    if (isLoading) {
        return (
            <div className="p-6 text-center space-y-2 bg-gray-50/70">
                <Spinner size={20} className="text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-gray-500 font-medium">Loading inspection rounds...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="p-6 text-center bg-gray-50/70 text-xs text-gray-500 font-medium">
                No inspection rounds recorded for this trade yet.
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50/70 space-y-3">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                <Clock size={14} className="text-emerald-600" /> Inspection Rounds History ({history.length})
            </h5>
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4">Round #</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Admin Release</th>
                            <th className="py-2.5 px-4">Scheduled Date</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium">
                        {history.map((assignment: any) => {
                            const isReleased = assignment.released_to_buyer || assignment.status === 'RELEASED' || assignment.status === 'INSPECTION_RESULT_RELEASED';
                            const isCompleted = assignment.status === 'COMPLETED';

                            return (
                                <tr key={assignment.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-bold text-gray-900">
                                        Round {assignment.round_number || 1}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                            isCompleted ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {assignment.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {isReleased ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                                <CheckCircle2 size={13} className="text-emerald-600" /> Released ✓
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-amber-600 font-medium">Under Review</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                                        {assignment.scheduledDate ? new Date(assignment.scheduledDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {isReleased && isCompleted ? (
                                            <button
                                                onClick={() => onSelectReport(assignment.id)}
                                                className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                            >
                                                <Eye size={13} /> View Detailed Report
                                            </button>
                                        ) : (
                                            <span className="text-[11px] text-gray-400 italic">Pending Release</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Main Merchant Hub Component ──────────────────────────────
export default function MerchantInspectionsHub() {
    const { data: myInquiriesRes, isLoading: loadingMy } = useGetMyTradeInquiriesQuery();
    const { data: receivedInquiriesRes, isLoading: loadingReceived } = useGetReceivedInquiriesQuery();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

    const myInquiries = myInquiriesRes?.data || (Array.isArray(myInquiriesRes) ? myInquiriesRes : []);
    const receivedInquiries = receivedInquiriesRes?.data || (Array.isArray(receivedInquiriesRes) ? receivedInquiriesRes : []);

    const allTrades = useMemo(() => {
        const combined = [...myInquiries, ...receivedInquiries];
        const uniqueMap = new Map();
        combined.forEach((t: any) => {
            const rawId = t.external_id || t.id;
            if (rawId != null) {
                const key = String(rawId);
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, t);
                }
            }
        });
        return Array.from(uniqueMap.values());
    }, [myInquiries, receivedInquiries]);

    const filteredTrades = useMemo(() => {
        return allTrades.filter((trade: any) => {
            const searchTerm = search.toLowerCase().trim();
            const productName = String(
                trade.product?.product_name ||
                trade.product_name ||
                trade.productName ||
                trade.Product?.name ||
                trade.rfq_title ||
                trade.title ||
                trade.item_name ||
                ''
            ).toLowerCase();
            const mineralTag = String(trade.mineral_tag || '').toLowerCase();
            const tradeIdStr = String(trade.external_id || trade.id || '').toLowerCase();

            const matchesSearch = !searchTerm || productName.includes(searchTerm) || mineralTag.includes(searchTerm) || tradeIdStr.includes(searchTerm);
            const matchesStatus = statusFilter === 'ALL' || (trade.state || trade.status) === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allTrades, search, statusFilter]);

    const isLoading = loadingMy || loadingReceived;

    // Stat Totals
    const totalCount = allTrades.length;
    const underInspectionCount = allTrades.filter((t: any) =>
        ['INSPECTION_PENDING', 'INSPECTION_IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'SCHEDULED', 'SITE_VISIT', 'LAB_ANALYSIS', 'REPORT_WRITING'].includes(t.state || t.status)
    ).length;
    const releasedCount = allTrades.filter((t: any) =>
        ['INSPECTION_RESULT_RELEASED', 'RELEASED', 'COMPLETED', 'CONTRACT_NEGOTIATION'].includes(t.state || t.status)
    ).length;
    const reinspectionCount = allTrades.filter((t: any) =>
        (t.state || t.status) === 'RE_INSPECTION_REQUESTED' || t.reinspection_reason
    ).length;

    const statsCards = [
        {
            title: "Total Trades",
            value: totalCount,
            icon: <Layers size={18} />,
            description: "All active & past trades",
            statusKey: "ALL"
        },
        {
            title: "Under Inspection",
            value: underInspectionCount,
            icon: <Clock size={18} />,
            description: "Undergoing quality testing",
            statusKey: "INSPECTION_IN_PROGRESS"
        },
        {
            title: "Results Released",
            value: releasedCount,
            icon: <CheckCircle2 size={18} />,
            description: "Verified & released reports",
            statusKey: "INSPECTION_RESULT_RELEASED"
        },
        {
            title: "Re-Inspections",
            value: reinspectionCount,
            icon: <RefreshCw size={18} />,
            description: "Requested re-tests",
            statusKey: "RE_INSPECTION_REQUESTED"
        }
    ];

    const toggleRow = (tradeId: string) => {
        setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
    };

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={24} className="text-emerald-400" />
                        <h2 className="text-xl font-bold">Trade Quality & Inspections Hub</h2>
                    </div>
                    <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                        View accredited laboratory assays, sample inspection rounds, and physical quality verification reports across all your active and past trades.
                    </p>
                </div>
            </div>

            {/* Top Stat Cards Grid (Analytics Style - Flat Clean Design, NO SHADOWS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((card) => {
                    const isSelected = statusFilter === card.statusKey;
                    return (
                        <div
                            key={card.title}
                            onClick={() => setStatusFilter(card.statusKey)}
                            className={`cursor-pointer rounded-xl border p-5 transition-all ${
                                isSelected
                                    ? 'bg-green-50/90 border-green-500'
                                    : 'bg-green-50/40 border-green-200/60 hover:border-green-300 hover:bg-green-50/70'
                            } group`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 group-hover:bg-green-200 transition-colors">
                                    {card.icon}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {card.title}
                                </h2>
                                <div className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {card.value}
                                </div>
                                <p className="text-xs text-gray-400 font-medium">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search inspections by product name, mineral tag, or trade ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="ALL">All Trade Statuses ({allTrades.length})</option>
                        <option value="ACKNOWLEDGED">Acknowledged</option>
                        <option value="INSPECTION_PENDING">Inspection Pending</option>
                        <option value="INSPECTION_IN_PROGRESS">Inspection In Progress</option>
                        <option value="INSPECTION_COMPLETED">Inspection Completed</option>
                        <option value="INSPECTION_RESULT_RELEASED">Result Released</option>
                        <option value="RE_INSPECTION_REQUESTED">Re-Inspection Requested</option>
                    </select>
                </div>
            </div>

            {/* Trades Main Table */}
            {isLoading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
                    <Spinner size={28} className="text-emerald-600 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-gray-700">Loading Trade Inspections...</p>
                </div>
            ) : filteredTrades.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
                    <ShieldCheck size={32} className="text-gray-300 mx-auto" />
                    <h3 className="text-base font-bold text-gray-900">No Inspections Found</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        No trade inspections match your search query or filter.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Item Type</th>
                                    <th className="py-3.5 px-4">Trade ID</th>
                                    <th className="py-3.5 px-4">Product / RFQ Name</th>
                                    <th className="py-3.5 px-4">Mineral & Quantity</th>
                                    <th className="py-3.5 px-4">Trade Status</th>
                                    <th className="py-3.5 px-4 text-right">Rounds Accordion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs font-medium">
                                {filteredTrades.map((trade: any) => {
                                    const tradeIdStr = String(trade.external_id || trade.id || '');
                                    const displayId = tradeIdStr ? `#${tradeIdStr.substring(0, 8)}...` : 'N/A';
                                    const isExpanded = expandedTradeId === tradeIdStr;

                                    const isRfq = trade.rfq_id != null || trade.item_type === 'rfq' || trade.entity_type === 'rfq';
                                    const productName = String(
                                        trade.product?.product_name ||
                                        trade.product_name ||
                                        trade.productName ||
                                        trade.Product?.name ||
                                        trade.rfq_title ||
                                        trade.title ||
                                        trade.item_name ||
                                        (isRfq ? 'RFQ Mineral Trade' : 'Mineral Product')
                                    );

                                    const statusText = trade.state || trade.status || 'ACTIVE';

                                    return (
                                        <React.Fragment key={tradeIdStr}>
                                            <tr
                                                onClick={() => toggleRow(tradeIdStr)}
                                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-gray-50'}`}
                                            >
                                                {/* Item Type */}
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                        isRfq ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {isRfq ? 'RFQ' : 'PRODUCT'}
                                                    </span>
                                                </td>

                                                {/* Trade ID */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-gray-700 text-[11px]">
                                                    {displayId}
                                                </td>

                                                {/* Product / RFQ Name */}
                                                <td className="py-3.5 px-4 font-bold text-gray-900">
                                                    {productName}
                                                </td>

                                                {/* Mineral & Quantity */}
                                                <td className="py-3.5 px-4 text-gray-600">
                                                    <span className="capitalize">{trade.mineral_tag || 'mineral'}</span>
                                                    {trade.quantity || trade.target_quantity ? (
                                                        <span className="text-gray-400 font-normal"> • {trade.quantity || trade.target_quantity} {trade.unit_type || trade.unitType || 'Tons'}</span>
                                                    ) : null}
                                                </td>

                                                {/* Trade Status */}
                                                <td className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-gray-100 text-gray-700 border border-gray-200">
                                                        {statusText.replace(/_/g, ' ')}
                                                    </span>
                                                </td>

                                                {/* Accordion Toggle Action */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleRow(tradeIdStr); }}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                                            isExpanded ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        <span>View Rounds</span>
                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Nested Row */}
                                            {isExpanded && (
                                                <tr key={`${tradeIdStr}-expanded`} className="bg-gray-50/50">
                                                    <td colSpan={6} className="p-0 border-b border-gray-200">
                                                        <TradeRoundsExpandedRow
                                                            tradeId={tradeIdStr}
                                                            onSelectReport={(id) => setSelectedAssignmentId(id)}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {selectedAssignmentId && (
                <ReportDetailModal
                    assignmentId={selectedAssignmentId}
                    onClose={() => setSelectedAssignmentId(null)}
                />
            )}
        </div>
    );
}
