"use client";

import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAlert } from '@/providers';
import { useRequestReinspectionMutation } from '@/redux/features/trade/trade_api';
import { getErrorMessage } from '@/utils/helper';

interface RequestReinspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  itemType?: 'product' | 'rfq';
  onSuccess?: () => void;
}

export default function RequestReinspectionModal({
  isOpen,
  onClose,
  tradeId,
  itemType = 'product',
  onSuccess,
}: RequestReinspectionModalProps) {
  const [reason, setReason] = useState('');
  const [requestReinspection, { isLoading }] = useRequestReinspectionMutation();
  const { showAlert } = useAlert();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showAlert('Please enter a reason for the re-inspection request.', 'error');
      return;
    }

    try {
      await requestReinspection({ tradeId, itemType, reason: reason.trim() }).unwrap();
      showAlert('Re-inspection request submitted successfully to Min-meg Admin.', 'success');
      setReason('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showAlert(getErrorMessage(err, 'Failed to submit re-inspection request.'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <RefreshCw className="w-5 h-5 text-amber-600 animate-spin-slow" />
            <span>Request Re-Inspection (Round 2+)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Re-inspection requests are submitted to Min-meg Admin. Admin will evaluate your request and appoint an accredited inspector (re-test with current inspector or assign a new inspection firm).
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Re-Inspection Reason / Scope Notes *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are requesting a re-inspection (e.g. Moisture content exceeds threshold, request re-testing of core samples)..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Submitting...' : 'Submit Re-Inspection Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
