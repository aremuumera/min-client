'use client';

import React, { useState } from 'react';
import { Info, AlertTriangle, X } from 'lucide-react';

export interface FieldNoticeProps {
  label: string;
  required?: boolean;
  noticeTitle?: string;
  noticeContent: string;
  type?: 'warning' | 'info';
}

export const FieldNotice: React.FC<FieldNoticeProps> = ({
  label,
  required = false,
  noticeTitle = 'B2B Compliance Note',
  noticeContent,
  type = 'warning',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <label className="block text-xs sm:text-sm font-semibold text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-0.5 rounded-full transition-colors ${
            isOpen
              ? 'text-amber-700 bg-amber-100/80'
              : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
          }`}
          title="Click to view B2B verification guidance"
        >
          <Info size={15} className="text-amber-600" />
        </button>
      </div>

      {isOpen && (
        <div className="mt-1 mb-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/95 text-amber-950 text-xs flex items-start justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block mb-0.5">{noticeTitle}</span>
              <p className="text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">{noticeContent}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-0.5 rounded text-amber-700 hover:bg-amber-100/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FieldNotice;
