'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { dayjs } from '@/lib/dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell, ShoppingBag, CreditCard, ShieldAlert, FileText,
    Search, ChevronDown, ChevronUp, Code2, RefreshCw
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { useAppSelector } from '@/redux/hooks';
import {
    CategoryFilter,
    parseMetadata,
    getActivityIcon,
    getActivityDescription,
    getActivityActorName,
    getCategoriesForRole
} from '@/utils/activity-helpers';

export default function ActivityLogPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
    const [expandedMetadata, setExpandedMetadata] = useState<Record<number | string, boolean>>({});
    const limit = 20;

    // Debounce search input to avoid hitting backend on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset page on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when category changes
    const handleCategoryChange = (category: CategoryFilter) => {
        setActiveCategory(category);
        setPage(1);
    };

    const actionTypeParam = activeCategory === 'ALL' ? undefined : activeCategory;

    const { user } = useAppSelector((state) => state.auth);
    const { data, isLoading, refetch, isFetching } = useGetActivitiesQuery({
        limit,
        page,
        type: actionTypeParam,
        search: debouncedSearch || undefined,
        orderBy: 'created_at',
        order: 'DESC'
    });

    const activities = data?.data || [];
    const meta = data?.meta || data?.pagination || { total: 0, page: 1, limit: 20, lastPage: 1 };
    const totalPages = meta.lastPage || Math.max(1, Math.ceil((meta.total || 0) / limit));

    const toggleMetadata = (id: number | string) => {
        setExpandedMetadata(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const categories = getCategoriesForRole(user?.role);

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <Typography variant="h4" className="font-bold text-gray-900 tracking-tight">
                        Business Activity Audit Log
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1">
                        Track real-time system actions, trade updates, document sign-offs, and team operations.
                    </Typography>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => refetch()}
                        className="border-gray-200 hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2 font-sans"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Controls Bar: Search & Categories */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${activeCategory === cat.value
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search backend logs or metadata..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                </div>
            </div>

            {/* Main Log Listing Container (Flat Design - No Shadows) */}
            <Box className="bg-white border border-gray-200 rounded-xl p-6">
                {isLoading || isFetching ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                                <div className="space-y-2 grow pt-1">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <Typography variant="h6" className="text-gray-900 font-semibold mb-1">
                            No Activity Logs Found
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 max-w-sm">
                            {debouncedSearch ? `No activity matching "${debouncedSearch}" in this category.` : 'There are no recent audit activities logged for this business account.'}
                        </Typography>
                    </div>
                ) : (
                    <div className="relative before:absolute before:inset-y-0 before:left-4 before:w-[2px] before:bg-gray-100">
                        {activities.map((item: any, index: number) => {
                            const metadata = parseMetadata(item.metadata);
                            const hasMetadata = Object.keys(metadata).length > 0;
                            const isExpanded = !!expandedMetadata[item.id || index];
                            const currentActionType = item.action_type || item.actionType || item.action || '';

                            return (
                                <div
                                    key={item.id || index}
                                    className="relative pl-10 py-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors rounded-lg group"
                                >
                                    {/* Action Icon Badge (Flat Border - No Shadow) */}
                                    <div className="absolute left-0 top-5 w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center z-10">
                                        {getActivityIcon(currentActionType, "w-4 h-4")}
                                    </div>

                                    {/* Content Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                        <div className="space-y-1 grow">
                                             <div className="flex items-center flex-wrap gap-2">
                                                 <span className="text-gray-900 text-sm font-medium">
                                                     {getActivityDescription(item)}
                                                 </span>
                                             </div>

                                            {/* Action Type Chip & Entity ID */}
                                            <div className="flex items-center flex-wrap gap-2 pt-0.5">
                                                <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                                                    {(currentActionType || 'ACTION').replace(/_/g, ' ')}
                                                </span>

                                                {(item.entity_id || item.entityId) && (
                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                        ID: {item.entity_id || item.entityId}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timestamp */}
                                        <Typography variant="body3" className="text-xs text-gray-400 font-medium shrink-0 pt-0.5">
                                            {dayjs(item.created_at || item.createdAt).format('MMM D, YYYY · h:mm A')}
                                        </Typography>
                                    </div>

                                    {/* Rich Metadata Pills Display */}
                                    {hasMetadata && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center flex-wrap gap-2">
                                                {metadata.productName && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                                                        <ShoppingBag className="w-3 h-3 text-amber-600" />
                                                        Product: <strong className="font-semibold">{metadata.productName}</strong>
                                                    </span>
                                                )}

                                                {(metadata.invoiceNumber || metadata.agreementId) && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
                                                        <CreditCard className="w-3 h-3 text-purple-600" />
                                                        Invoice #: <strong className="font-semibold">{metadata.invoiceNumber || metadata.agreementId}</strong>
                                                    </span>
                                                )}

                                                {(metadata.totalAmount !== undefined || metadata.totalPrice !== undefined) && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                                                        Amount: <strong className="font-semibold">{metadata.currency || 'NGN'} {Number(metadata.totalAmount ?? metadata.totalPrice ?? 0).toLocaleString()}</strong>
                                                    </span>
                                                )}

                                                {metadata.rejectionReason && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                                                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                                                        Reason: <strong className="font-semibold">{metadata.rejectionReason}</strong>
                                                    </span>
                                                )}

                                                {(metadata.documentTitle || metadata.title) && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium">
                                                        <FileText className="w-3 h-3 text-cyan-600" />
                                                        Doc: <strong className="font-semibold">{metadata.documentTitle || metadata.title}</strong>
                                                    </span>
                                                )}

                                                {(metadata.approvalStatus || metadata.newStatus || metadata.status) && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-300 text-gray-800 text-xs font-medium">
                                                        Status: <strong className="font-semibold">{metadata.approvalStatus || metadata.newStatus || metadata.status}</strong>
                                                    </span>
                                                )}

                                                {/* Toggle Full Metadata details button */}
                                                <button
                                                    onClick={() => toggleMetadata(item.id || index)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-100 transition-colors"
                                                >
                                                    <Code2 className="w-3 h-3 text-gray-400" />
                                                    {isExpanded ? 'Hide Raw Details' : 'View Payload'}
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                            </div>

                                            {/* Expandable JSON / Metadata Details View */}
                                            {isExpanded && (
                                                <div className="p-3 mt-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200 font-mono text-xs overflow-x-auto">
                                                    <pre>{JSON.stringify(metadata, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Backend Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Typography variant="body3" className="text-gray-500 font-medium text-xs">
                            Showing page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong> ({meta.total || 0} total entries)
                        </Typography>

                        <Pagination
                            page={page}
                            count={totalPages}
                            onChange={(newPage: number) => {
                                setPage(newPage);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                )}
            </Box>
        </div>
    );
}
