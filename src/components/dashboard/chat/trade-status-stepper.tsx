'use client';

import React, { useState } from 'react';
import { useGetClientStagesQuery } from '@/redux/features/doc-hub/doc_hub_api';
import { CheckCircle2, Clock, PlayCircle, ChevronDown, ChevronUp, Layers, Info, X } from 'lucide-react';
import { cn } from '@/utils/helper';
import {
  MAIN_TRADE_PHASES,
  BUYER_PRODUCT_STEPPER,
  SUPPLIER_PRODUCT_STEPPER,
  INSPECTOR_STEPPER,
  getRoleStepNumber,
  formatTradeStatusLabel,
} from '@/config/trade-stepper-config';

interface TradeStatusStepperProps {
  inquiryId: string;
  itemType?: string;
  currentStatus?: string;
  userRole?: 'buyer' | 'supplier' | 'inspector' | string;
}

export function TradeStatusStepper({ inquiryId, itemType, currentStatus, userRole }: TradeStatusStepperProps) {
  const { data, isLoading } = useGetClientStagesQuery({ inquiryId: inquiryId || '' }, { skip: !inquiryId });
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStepPopover, setActiveStepPopover] = useState<any | null>(null);

  const isInspector = (userRole || '').toLowerCase() === 'inspector';
  const isSupplier = (userRole || '').toLowerCase() === 'supplier';
  const roleSteps = isInspector ? INSPECTOR_STEPPER : (isSupplier ? SUPPLIER_PRODUCT_STEPPER : BUYER_PRODUCT_STEPPER);
  const activeStepNum = getRoleStepNumber(roleSteps, currentStatus);

  const fetchedStages: any[] = data?.data || [];

  // Deduplicate stages to ensure clean lifecycle
  const uniqueStagesMap = new Map();
  (fetchedStages && fetchedStages.length > 0 ? fetchedStages : (isInspector ? [] : MAIN_TRADE_PHASES)).forEach((st: any) => {
    const slugKey = (st.slug || st.name).toLowerCase().replace(/_rfq$/, '').replace(/[^a-z0-9]/g, '');
    if (!uniqueStagesMap.has(slugKey)) {
      uniqueStagesMap.set(slugKey, st);
    }
  });

  const rawStagesList = Array.from(uniqueStagesMap.values());
  const fallbackStages = roleSteps.map((s) => ({
    id: `step-${s.step}`,
    name: s.title,
    slug: `step_${s.step}`,
    stage_order: s.step,
    generates_document: false,
    is_current_stage: s.step === activeStepNum,
    is_completed_stage: s.step < activeStepNum,
    matchingKeys: s.matchingKeys,
    description: s.description,
  }));

  const stages: any[] = rawStagesList.length > 0 ? rawStagesList : fallbackStages;

  const currentStageIndex = stages.findIndex((st: any) => st.is_current_stage || st.stage_order === activeStepNum);
  const activeStageIndex = currentStageIndex !== -1 ? currentStageIndex : (activeStepNum - 1);
  const activeStage = stages[activeStageIndex] || stages[0];
  const activeSubStatus = activeStage?.active_sub_status;
  const currentStatusLabel = formatTradeStatusLabel(currentStatus) || activeSubStatus?.label || activeStage?.name;

  return (
    <div className="bg-white border-b border-gray-200 flex-none transition-all relative select-none">
      {/* Compact Header Bar */}
      <div className="px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 bg-gray-50/80">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            <Layers size={12} />
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] font-black text-gray-900 truncate">
              Phase {activeStageIndex + 1} of {stages.length}: {activeStage?.name || 'Trade Progress'}
            </span>

            {currentStatusLabel && (
              <span className="hidden md:inline-flex text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 truncate shrink-0">
                ● {currentStatusLabel}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors shrink-0"
        >
          <span>{isExpanded ? 'Hide Status' : 'View Status'}</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Stepper Drawer Container — Inline on desktop, Bottom Sheet on Mobile */}
      {isExpanded && (
        <>
          {/* Mobile Bottom Sheet Overlay (< sm screen) */}
          <div className="sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-white rounded-t-2xl border-t border-gray-200 p-4 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-xs font-black text-gray-900">
                      Trade Stepper — Phase {activeStageIndex + 1} of {stages.length}: {activeStage?.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold mt-0.5">💡 Tap any phase below to view sub-status details</p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded bg-gray-100 text-gray-500 hover:text-gray-900 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mobile Vertical Steps List with Expandable Sub-Statuses */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 py-1">
                {stages.map((stage: any, idx: number) => {
                  const isCompleted = stage.is_completed_stage || idx < activeStageIndex;
                  const isCurrent = stage.is_current_stage || idx === activeStageIndex;
                  const isSelected = activeStepPopover?.slug === stage.slug;

                  let Icon = Clock;
                  let iconBg = 'bg-gray-100 text-gray-400 border-gray-200';

                  if (isCompleted) {
                    Icon = CheckCircle2;
                    iconBg = 'bg-emerald-500 text-white border-emerald-600';
                  } else if (isCurrent) {
                    Icon = PlayCircle;
                    iconBg = 'bg-emerald-600 text-white border-2 border-emerald-700 ring-2 ring-emerald-100';
                  }

                  return (
                    <div
                      key={stage.id || stage.slug || idx}
                      className={cn(
                        'rounded-xl border transition-all overflow-hidden',
                        isCurrent ? 'bg-emerald-50/60 border-emerald-400' : isSelected ? 'bg-emerald-50/30 border-emerald-300' : 'bg-white border-gray-200'
                      )}
                    >
                      {/* Step Header Bar */}
                      <div
                        onClick={() => setActiveStepPopover(isSelected ? null : stage)}
                        className="p-2.5 flex items-start gap-3 cursor-pointer active:bg-gray-50/80"
                      >
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5', iconBg)}>
                          <Icon size={14} className={isCurrent ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={cn('text-xs font-black', isCurrent ? 'text-emerald-950' : 'text-gray-900')}>
                              Phase {idx + 1}: {stage.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded border', isCurrent ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : isCompleted ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-gray-50 text-gray-400 border-gray-200')}>
                                {isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Pending'}
                              </span>
                              <ChevronDown size={14} className={cn('text-gray-400 transition-transform duration-200', isSelected && 'rotate-180 text-emerald-600')} />
                            </div>
                          </div>
                          {stage.active_sub_status?.label && isCurrent && (
                            <p className="text-[10px] font-bold text-emerald-700 mt-1">● {stage.active_sub_status.label}</p>
                          )}
                        </div>
                      </div>

                      {/* Expandable Sub-Statuses List on Mobile (Title on Top, Description Full Text Directly Underneath) */}
                      {isSelected && (
                        <div className="px-3 py-2.5 bg-white border-t border-emerald-100 space-y-2 animate-in fade-in duration-150">
                          {Array.isArray(stage.sub_statuses) && stage.sub_statuses.length > 0 ? (
                            stage.sub_statuses.map((sub: any, sIdx: number) => {
                              const isSkipped = sub.is_skipped || (!sub.is_active && !sub.is_completed && !sub.is_pending);
                              const isCurrentSub = sub.is_active;
                              const isPassedSub = sub.is_completed && !sub.is_active;

                              return (
                                <div
                                  key={sub.key || sIdx}
                                  className={cn(
                                    'p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all',
                                    isCurrentSub
                                      ? 'bg-white border-2 border-emerald-600 text-gray-900'
                                      : isPassedSub
                                      ? 'bg-emerald-50/50 border-emerald-200 text-gray-800'
                                      : isSkipped
                                      ? 'bg-gray-50/40 border-gray-100 text-gray-400 opacity-60'
                                      : 'bg-gray-50/80 border-gray-200 text-gray-600'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {isCurrentSub ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300 shrink-0" />
                                      ) : isPassedSub ? (
                                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                      ) : isSkipped ? (
                                        <div className="w-2 h-2 rounded-full bg-gray-200 ring-1 ring-gray-300 shrink-0" />
                                      ) : (
                                        <div className="w-2 h-2 rounded-full border-2 border-gray-300 bg-transparent shrink-0" />
                                      )}
                                      <span className={cn('text-xs truncate', isCurrentSub ? 'font-black text-emerald-950' : isPassedSub ? 'font-bold text-gray-900' : isSkipped ? 'font-normal text-gray-400' : 'font-semibold text-gray-700')}>
                                        {sub.label}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      'text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0',
                                      isCurrentSub
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                        : isPassedSub
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : isSkipped
                                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                    )}>
                                      {isCurrentSub ? '● Active' : isPassedSub ? '✓ Done' : isSkipped ? 'Skipped' : '○ Upcoming'}
                                    </span>
                                  </div>
                                  {sub.description && (
                                    <p className={cn('text-[11px] pl-4 leading-relaxed', isCurrentSub ? 'font-medium text-gray-700' : isPassedSub ? 'font-normal text-gray-600' : 'font-normal text-gray-400')}>
                                      {sub.description}
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-gray-500 italic py-1">Phase lifecycle step</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="mt-2 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center active:bg-emerald-700 transition-colors"
              >
                Close Stepper & Continue Chat
              </button>
            </div>
          </div>

          {/* Desktop Inline Drawer (≥ sm screen) */}
          <div className="hidden sm:block border-t border-gray-200 bg-white animate-in slide-in-from-top-2 duration-150">
            <div className="px-6 pt-2 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700">
                💡 Click any phase circle below to inspect sub-status breakdown
              </span>
            </div>

            <div className="px-6 py-3 overflow-x-auto no-scrollbar">
              <div className={cn(
                'flex items-center relative px-2',
                stages.length <= 3 ? 'max-w-md mx-auto justify-around' : stages.length <= 4 ? 'max-w-xl mx-auto justify-around' : 'min-w-[650px] justify-between'
              )}>
                {/* Background Line */}
                <div className="absolute top-4 left-6 right-6 h-[2px] bg-gray-200 z-0" />

                {/* Active Progress Line */}
                {activeStageIndex > 0 && (
                  <div
                    className="absolute top-4 left-6 h-[2px] bg-emerald-500 z-0 transition-all duration-500"
                    style={{
                      width: `${(activeStageIndex / Math.max(stages.length - 1, 1)) * 100}%`,
                    }}
                  />
                )}

                {stages.map((stage: any, idx: number) => {
                  const isCompleted = stage.is_completed_stage || idx < activeStageIndex;
                  const isCurrent = stage.is_current_stage || idx === activeStageIndex;
                  const isSelected = activeStepPopover?.slug === stage.slug;

                  let iconBg = 'bg-gray-100 text-gray-400 border border-gray-200 hover:border-gray-400';
                  let Icon = Clock;

                  if (isCompleted) {
                    iconBg = 'bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700';
                    Icon = CheckCircle2;
                  } else if (isCurrent) {
                    iconBg = 'bg-emerald-600 text-white border-2 border-emerald-700 ring-2 ring-emerald-200';
                    Icon = PlayCircle;
                  }

                  return (
                    <div
                      key={stage.id || stage.slug || idx}
                      onClick={() => setActiveStepPopover(isSelected ? null : stage)}
                      className="flex flex-col items-center text-center z-10 relative px-1 cursor-pointer group min-w-[80px]"
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all', iconBg, isSelected && 'ring-4 ring-emerald-200')}>
                        <Icon size={16} className={isCurrent ? 'animate-pulse' : ''} />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold mt-1.5 leading-tight max-w-[120px] truncate group-hover:underline',
                          isCurrent ? 'text-emerald-950 font-black' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                        )}
                      >
                        {stage.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Step Details Popover Drawer on Desktop (Title on Top, Description Directly Underneath, Side-by-Side Cards) */}
            {activeStepPopover && (
              <div className="px-6 py-3.5 bg-emerald-50/40 border-t border-emerald-200 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-gray-900 flex items-center gap-2">
                        <span>Phase {stages.findIndex(s => s.slug === activeStepPopover.slug) + 1} of {stages.length}: {activeStepPopover.name}</span>
                        {activeStepPopover.trade_pack_type && (
                          <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                            Trade Pack Required
                          </span>
                        )}
                      </h4>

                      {/* Side-by-Side Cards with Title on Top and Description Directly Underneath */}
                      {Array.isArray(activeStepPopover.sub_statuses) && activeStepPopover.sub_statuses.length > 0 ? (
                        <div className="flex flex-wrap items-stretch gap-2.5 mt-2.5">
                          {activeStepPopover.sub_statuses.map((sub: any, sIdx: number) => {
                            const isSkipped = sub.is_skipped || (!sub.is_active && !sub.is_completed && !sub.is_pending);
                            const isCurrentSub = sub.is_active;
                            const isPassedSub = sub.is_completed && !sub.is_active;

                            return (
                              <div
                                key={sub.key || sIdx}
                                className={cn(
                                  'p-2.5 rounded-xl border text-xs flex flex-col justify-center gap-1 min-w-[210px] flex-1 sm:flex-initial transition-all',
                                  isCurrentSub
                                    ? 'bg-white border-2 border-emerald-600 text-gray-900'
                                    : isPassedSub
                                    ? 'bg-emerald-50/50 border-emerald-200 text-gray-800'
                                    : isSkipped
                                    ? 'bg-gray-50/40 border-gray-100 text-gray-400 opacity-60'
                                    : 'bg-gray-50/80 border-gray-200 text-gray-600'
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {isCurrentSub ? (
                                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300 shrink-0" />
                                    ) : isPassedSub ? (
                                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                    ) : isSkipped ? (
                                      <div className="w-2 h-2 rounded-full bg-gray-200 ring-1 ring-gray-300 shrink-0" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full border-2 border-gray-300 bg-transparent shrink-0" />
                                    )}
                                    <span className={cn('text-xs truncate', isCurrentSub ? 'font-black text-emerald-950' : isPassedSub ? 'font-bold text-gray-900' : isSkipped ? 'font-normal text-gray-400' : 'font-semibold text-gray-700')}>
                                      {sub.label}
                                    </span>
                                  </div>
                                  <span className={cn(
                                    'text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0',
                                    isCurrentSub
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : isPassedSub
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isSkipped
                                      ? 'bg-gray-100 text-gray-400 border-gray-200'
                                      : 'bg-gray-100 text-gray-500 border-gray-200'
                                  )}>
                                    {isCurrentSub ? '● Active' : isPassedSub ? '✓ Done' : isSkipped ? 'Skipped' : '○ Upcoming'}
                                  </span>
                                </div>
                                {sub.description && (
                                  <p className={cn('text-[11px] pl-3.5 leading-snug', isCurrentSub ? 'font-medium text-gray-700' : isPassedSub ? 'font-normal text-gray-600' : 'font-normal text-gray-400')}>
                                    {sub.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 mt-1">Lifecycle stage step</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveStepPopover(null)}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default TradeStatusStepper;
