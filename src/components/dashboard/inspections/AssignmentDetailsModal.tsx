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
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateAssignmentStatusMutation } from '@/redux/features/inspector/inspector_api';
import { toast } from 'sonner';

interface AssignmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
}

const AssignmentDetailsModal = ({ isOpen, onClose, assignment }: AssignmentDetailsModalProps) => {
    const [updateStatus, { isLoading: isUpdating }] = useUpdateAssignmentStatusMutation();

    if (!isOpen || !assignment) return null;

    const handleAction = async (status: string) => {
        try {
            await updateStatus({
                id: assignment.id,
                status: status
            }).unwrap();
            toast.success(`Assignment ${status.toLowerCase()} successfully`);
            onClose();
        } catch (err) {
            toast.error(`Failed to ${status.toLowerCase()} assignment`);
        }
    };

    const specs = [
        { label: 'Product', value: assignment.product_name || assignment.productName, icon: Box },
        { label: 'Mineral Type', value: assignment.mineral_tag, icon: Layers },
        { label: 'Quantity', value: `${assignment.quantityRequired || assignment.quantity || '-'} ${assignment.quantityMeasure || assignment.measure_type || ''}`, icon: Info },
        { label: 'Location', value: assignment.location || assignment.delivery_location || 'Port Access', icon: MapPin },
        { label: 'Target Date', value: assignment.scheduledDate ? new Date(assignment.scheduledDate).toLocaleDateString() : 'Flexible', icon: Calendar },
    ];

    return (
        <div className="fixed inset-0 z-12000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-gray-100">

                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={24} className="text-primary-600" />
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Inspection Invitation</h2>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] ml-9">REF: {assignment.id?.substring(0, 12).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specs.map((spec, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 text-primary-600">
                                    <spec.icon size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{spec.label}</p>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{spec.value || 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payout Card */}
                    <div className="relative overflow-hidden bg-neutral-900 rounded-[32px] p-8 text-white">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary-400">
                                    <CreditCard size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Estimated Payout</span>
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter">$1,250.00 <span className="text-sm font-bold text-white/40 uppercase tracking-widest">USD</span></h3>
                                <p className="text-xs text-white/50 font-medium">Billed after report authentication & ledger sync.</p>
                            </div>
                            <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Assignment SLA</p>
                                <p className="text-sm font-bold mt-1">48 Hours (Reporting)</p>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
                    <Button
                        onClick={() => handleAction('REJECTED')}
                        disabled={isUpdating}
                        variant="outlined"
                        className="flex-1 py-7 rounded-2xl border-2 border-gray-200 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        <XCircle size={18} />
                        Decline
                    </Button>
                    <Button
                        onClick={() => handleAction('ACCEPTED')}
                        disabled={isUpdating}
                        className="flex-2 py-7 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} />
                        Accept Assignment
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailsModal;
