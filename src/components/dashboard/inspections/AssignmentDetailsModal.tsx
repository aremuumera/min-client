"use client";

import React from 'react';
import {
    X,
    Box,
    Layers,
    MapPin,
    Calendar,
    CheckCircle2,
    XCircle,
    Info,
    ShieldCheck,
    Copy,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';
import { toast } from 'sonner';
import { formatTimeAmPm } from '@/utils/helper';
import { getErrorMessage } from '@/utils/helper';

interface AssignmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
    initialAction?: 'idle' | 'accepting' | 'rejecting';
}

export function CopyableId({ id, className = "" }: { id: string; className?: string }) {
    const [copied, setCopied] = React.useState(false);
    if (!id) return null;
    const shortDisplay = id.length > 8 ? `${id.substring(0, 8)}...` : id;

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopied(true);
        toast.success(`Copied ID: ${id}`);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <span
            onClick={handleCopy}
            title={`Click to copy full ID: ${id}`}
            className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded cursor-pointer transition-colors ${className}`}
        >
            <span>#{shortDisplay}</span>
            {copied ? (
                <Check size={11} className="text-green-600 shrink-0" />
            ) : (
                <Copy size={11} className="text-gray-400 shrink-0" />
            )}
        </span>
    );
}

const AssignmentDetailsModal = ({ isOpen, onClose, assignment, initialAction = 'idle' }: AssignmentDetailsModalProps) => {
    const [updateStatus, { isLoading: isUpdating }] = useUpdateAssignmentStatusMutation();
    const [showConfirmModal, setShowConfirmModal] = React.useState<'none' | 'accept' | 'decline'>(
        initialAction === 'accepting' ? 'accept' : initialAction === 'rejecting' ? 'decline' : 'none'
    );
    const [notes, setNotes] = React.useState('');

    React.useEffect(() => {
        if (initialAction === 'accepting') setShowConfirmModal('accept');
        else if (initialAction === 'rejecting') setShowConfirmModal('decline');
        else setShowConfirmModal('none');
    }, [initialAction, isOpen]);

    if (!isOpen || !assignment) return null;

    const handleAction = async (status: string) => {
        try {
            await updateStatus({
                id: assignment.id,
                status: status,
                notes: (status === 'REJECTED' || status === 'DECLINED') ? notes.trim() : undefined
            }).unwrap();
            toast.success(`Assignment ${status.toLowerCase()} successfully`);
            setShowConfirmModal('none');
            setNotes('');
            onClose();
        } catch (error: any) {
            toast.error(getErrorMessage(error, `Failed to ${status.toLowerCase()} assignment`));
        }
    };

    const isRfq = assignment.item_type === 'rfq';
    const productName = assignment.productName || assignment.product_name || (isRfq ? 'RFQ Request' : 'Product Inquiry');
    const mineralTag = assignment.mineral_tag && assignment.mineral_tag !== 'N/A' && assignment.mineral_tag !== 'mineral' ? assignment.mineral_tag : null;
    const quantityStr = assignment.quantity || assignment.quantityRequired ? `${assignment.quantity || assignment.quantityRequired} ${assignment.unitType || assignment.measure_type || 'MT'}` : null;
    const gradeStr = assignment.agreedGradePercentage ? `${assignment.agreedGradePercentage}%` : null;

    const locationStr = [assignment.inspectionLocation || assignment.location || assignment.delivery_location, assignment.inspectionState || assignment.delivery_state]
        .filter(Boolean)
        .filter(val => val !== 'N/A')
        .join(', ');

    const dateStr = assignment.scheduledDate ? new Date(assignment.scheduledDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : null;

    const specs = [
        { label: isRfq ? 'RFQ Title' : 'Product Name', value: productName, icon: Box, fullWidth: true },
        { label: 'Category', value: mineralTag || 'N/A', icon: Layers, fullWidth: true },
        quantityStr ? { label: 'Quantity & Unit', value: quantityStr, icon: Info } : null,
        gradeStr ? { label: 'Target Grade', value: gradeStr, icon: ShieldCheck } : null,
        locationStr ? { label: 'Inspection Site & Location', value: locationStr, icon: MapPin, fullWidth: true } : null,
        dateStr ? { label: 'Scheduled Date & Time', value: `${dateStr}${assignment.scheduledTime ? ` at ${formatTimeAmPm(assignment.scheduledTime)}` : ''}`, icon: Calendar } : null,
    ].filter(Boolean);

    return (
        <>
            <div className="fixed inset-0 z-12000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden flex flex-col border border-gray-100">

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={22} className="text-green-600" />
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Inspection Assignment</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isRfq ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                    {isRfq ? 'RFQ Inspection' : 'Product Inspection'}
                                </span>
                                <CopyableId id={assignment.id} />
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {specs.map((spec: any, i: number) => (
                                <div key={i} className={`flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 ${spec.fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
                                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-600 shrink-0 mt-0.5">
                                        <spec.icon size={16} />
                                    </div>
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{spec.label}</p>
                                        <p className="text-xs font-black text-gray-900 break-words whitespace-pre-wrap leading-snug">{spec.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Product / Job Description if present */}
                        {assignment.productDescription && (
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description & Notes</p>
                                <p className="text-xs font-medium text-gray-700 leading-relaxed">{assignment.productDescription}</p>
                            </div>
                        )}

                        {/* Admin Instructions if present */}
                        {assignment.adminNotes && (
                            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Admin Notes</p>
                                <p className="text-xs font-medium text-amber-900 leading-relaxed">{assignment.adminNotes}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                        {assignment.status === 'ASSIGNED' ? (
                            <>
                                <Button
                                    onClick={() => setShowConfirmModal('decline')}
                                    disabled={isUpdating}
                                    variant="outlined"
                                    className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <XCircle size={16} />
                                    Decline
                                </Button>
                                <Button
                                    onClick={() => setShowConfirmModal('accept')}
                                    disabled={isUpdating}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle2 size={16} />
                                    Accept Assignment
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={onClose}
                                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition-all"
                            >
                                Close Details
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Confirmation Modal for Acceptance */}
            {showConfirmModal === 'accept' && (
                <div className="fixed inset-0 z-13000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Accept Assignment?</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Confirmation Required</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                            Are you sure you want to accept this inspection assignment for <span className="font-bold text-gray-900">{productName}</span>? Your company will be appointed as the active inspector.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => setShowConfirmModal('none')}
                                disabled={isUpdating}
                                variant="outlined"
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleAction('ACCEPTED')}
                                disabled={isUpdating}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                {isUpdating ? 'Accepting...' : 'Confirm Acceptance'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Confirmation Modal for Declining */}
            {showConfirmModal === 'decline' && (
                <div className="fixed inset-0 z-13000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">Decline Assignment?</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Reason Required</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-800">
                                Reason for Declining (Required)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="State why your company cannot fulfill this assignment..."
                                className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-hidden focus:border-red-600 resize-none h-24"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => { setShowConfirmModal('none'); setNotes(''); }}
                                disabled={isUpdating}
                                variant="outlined"
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleAction('REJECTED')}
                                disabled={isUpdating || !notes.trim()}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                {isUpdating ? 'Declining...' : 'Confirm Decline'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AssignmentDetailsModal;
