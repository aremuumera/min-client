'use client';

import React, { useState } from 'react';
import { Activity, Clock, AlertTriangle, FileText, CheckCircle, XCircle, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import dayjs from 'dayjs';
import { useGetActivitiesQuery } from '@/redux/features/activity/activityApi';

interface TradeActivityTimelineProps {
  inquiryId: string;
}

export function TradeActivityTimeline({ inquiryId }: TradeActivityTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string | number, boolean>>({});

  const { data, isLoading, isError, refetch } = useGetActivitiesQuery(
    { inquiryId, limit: 50 },
    { skip: !inquiryId }
  );

  const activities = data?.data || [];

  const toggleExpand = (id: string | number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getActionIcon = (actionType: string) => {
    const type = (actionType || '').toUpperCase();
    if (type.includes('DOCUMENT')) return <FileText className="w-4 h-4 text-blue-600" />;
    if (type.includes('SIGN') || type.includes('ACCEPT')) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (type.includes('FLAG') || type.includes('REVISE')) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (type.includes('REJECT') || type.includes('DECLINE')) return <XCircle className="w-4 h-4 text-red-600" />;
    if (type.includes('INSPECTOR')) return <UserCheck className="w-4 h-4 text-purple-600" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[300px]">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading trade activity timeline...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50/50 rounded-xl border border-red-100 my-4">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-sm font-bold">Failed to load activity logs</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl my-4">
        <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <h4 className="text-base font-bold text-gray-700">No Activity Logs Found</h4>
        <p className="text-xs text-gray-500 mt-1">Actions performed on this trade cycle will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-4xl mx-auto my-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Trade Cycle Activity Timeline</h3>
            <p className="text-xs text-gray-500">Official transactional logs for this trade cycle.</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
          {activities.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {activities.map((item: any, idx: number) => {
          const formattedDate = dayjs(item.createdAt).format('MMM D, YYYY • h:mm A');
          const meta = item.metadata || {};
          const actorRole = meta.role || (item.user_id ? 'ACTOR' : 'SYSTEM');
          const itemId = item.id || idx;
          const isExpanded = !!expandedItems[itemId];

          return (
            <div key={itemId} className="relative group">
              <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-emerald-500 transition-colors shadow-sm">
                {getActionIcon(item.action_type)}
              </div>

              <div className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      {actorRole}
                    </span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                      {item.action_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">
                    {formattedDate}
                  </span>
                </div>

                <p className="text-xs text-gray-700 font-medium leading-relaxed mt-1">
                  {item.message || meta.message || `Activity logged: ${item.action_type}`}
                </p>

                {/* Expand / View Payload Button */}
                <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(itemId)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Payload' : 'View Payload & Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[10px] font-mono text-gray-400">
                    ID: {item.id ? String(item.id).substring(0, 8).toUpperCase() : 'LOG'}
                  </span>
                </div>

                {/* Expandable Payload Box */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-gray-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-gray-800 space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Metadata Payload (JSON):</p>
                    <pre className="leading-relaxed">
                      {JSON.stringify(meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TradeActivityTimeline;
