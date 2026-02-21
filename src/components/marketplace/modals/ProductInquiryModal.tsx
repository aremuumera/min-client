"use client";

import React, { useState } from 'react';
import { Loader2, CheckCircle, X, MapPin, Calendar, Scale, AlertTriangle, Box, Check, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/providers';
import { useCreateProductInquiryMutation } from '@/redux/features/trade/trade_api';
import { Select } from '@/components/ui/select';
import { MoqUnits } from '@/lib/marketplace-data';

interface ProductInquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string; // Internal ID
        external_id?: string;
        name: string;
        mineral_tag: string;
        supplier_id?: string;
    };
    itemType?: 'product' | 'rfq' | 'business';
}

const initialState = {
    quantity: '',
    measure_type: 'Tons',
    delivery_location: '', // LGA
    delivery_state: '',
    delivery_country: 'Nigeria',
    delivery_address: '', // Detailed Address
    timeline_type: 'immediate',
    recurring_duration: '',
    recurring_frequency: 'monthly',
    inspection_intent: false,
    description: '',
    urgency: 'standard',
    preferred_grade: ''
};

const ProductInquiryModal = ({
    isOpen,
    onClose,
    product,
    itemType = 'product'
}: ProductInquiryModalProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialState);

    const handleClose = () => {
        setStep(1);
        setFormData(initialState);
        onClose();
    };

    const [createInquiry, { isLoading }] = useCreateProductInquiryMutation();
    const { user } = useSelector((state: any) => state.auth);
    const { showAlert } = useAlert();
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        try {
            const isRecurring = formData.timeline_type === 'recurring';
            const payload = {
                product_id: product.id,
                entity_type: itemType,
                mineral_tag: product.mineral_tag,
                quantity: Number(formData.quantity) || 0,
                measure_type: formData.measure_type,
                delivery_location: formData.delivery_location,
                delivery_address: formData.delivery_address,
                delivery_state: formData.delivery_state,
                delivery_country: formData.delivery_country,
                timeline_type: formData.timeline_type,
                recurring_frequency: isRecurring ? formData.recurring_frequency : null,
                recurring_duration: isRecurring ? (Number(formData.recurring_duration) || null) : null,
                inspection_intent: formData.inspection_intent,
                preferred_grade: formData.preferred_grade,
                urgency: formData.urgency,
                description: formData.description
            };

            const result = await createInquiry(payload).unwrap();

            setStep(3); // Success Screen
        } catch (err: any) {
            console.error('Inquiry Error:', err);
            showAlert(err?.data?.message || 'Failed to submit inquiry', 'error');
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.quantity || !formData.delivery_location || !formData.delivery_address || !formData.delivery_state || !formData.delivery_country) {
                showAlert('Please fill in required fields (Quantity, LGA, Country, State and Address)', 'error');
                return;
            }
        }
        setStep(step + 1);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-11000 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {itemType === 'product' && 'Product Inquiry'}
                            {itemType === 'rfq' && 'Submit RFQ Quote'}
                            {itemType === 'business' && 'Contact Business'}
                        </h3>
                        <p className="text-xs text-gray-500">for {product.name}</p>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Quantity & Measure */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantity Required</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Enter amount"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Measure Type</label>
                                    <Select
                                        fullWidth
                                        value={formData.measure_type}
                                        onChange={(val: any) => {
                                            const actualValue = typeof val === 'string' ? val : val.target.value;
                                            setFormData({ ...formData, measure_type: actualValue });
                                        }}
                                        options={MoqUnits.map(unit => ({
                                            value: unit,
                                            label: unit
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Preferred Grade */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Grade / Purity</label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="e.g. 6.5% Li2O, 99.9% Purity"
                                    value={formData.preferred_grade}
                                    onChange={e => setFormData({ ...formData, preferred_grade: e.target.value })}
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Destination</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Country"
                                        value={formData.delivery_country}
                                        onChange={e => setFormData({ ...formData, delivery_country: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="State"
                                        value={formData.delivery_state}
                                        onChange={e => setFormData({ ...formData, delivery_state: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="LGA / Transit Hub"
                                        value={formData.delivery_location}
                                        onChange={e => setFormData({ ...formData, delivery_location: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Detailed Address"
                                        value={formData.delivery_address}
                                        onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Timeline Control */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Delivery Timeline</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setFormData({ ...formData, timeline_type: 'immediate' })}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${formData.timeline_type === 'immediate' ? 'border-green-500 bg-green-50 ring-2 ring-green-500/10' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm">One-time</span>
                                            {formData.timeline_type === 'immediate' && <CheckCircle size={16} className="text-green-500" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500">Single shipment delivery</p>
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, timeline_type: 'recurring' })}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${formData.timeline_type === 'recurring' ? 'border-green-500 bg-green-50 ring-2 ring-green-500/10' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm">Recurring</span>
                                            {formData.timeline_type === 'recurring' && <CheckCircle size={16} className="text-green-500" />}
                                        </div>
                                        <p className="text-[10px] text-gray-500">Scheduled supply chain</p>
                                    </div>
                                </div>

                                {formData.timeline_type === 'recurring' && (
                                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in slide-in-from-top-2 duration-300">
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Frequency</label>
                                            <Select
                                                fullWidth
                                                size="sm"
                                                value={formData.recurring_frequency}
                                                onChange={(val: any) => {
                                                    const actualValue = typeof val === 'string' ? val : val.target.value;
                                                    setFormData({ ...formData, recurring_frequency: actualValue });
                                                }}
                                                options={[
                                                    { value: 'weekly', label: 'Weekly' },
                                                    { value: 'monthly', label: 'Monthly' }
                                                ]}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Duration (Months)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm h-10 outline-none focus:border-green-500"
                                                placeholder="e.g. 6"
                                                value={formData.recurring_duration}
                                                onChange={e => setFormData({ ...formData, recurring_duration: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Urgency */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Urgency Level</label>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="urgency"
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            checked={formData.urgency === 'standard'}
                                            onChange={() => setFormData({ ...formData, urgency: 'standard' })}
                                        />
                                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Standard</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="urgency"
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            checked={formData.urgency === 'urgent'}
                                            onChange={() => setFormData({ ...formData, urgency: 'urgent' })}
                                        />
                                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 flex items-center gap-1.5 transition-colors">
                                            Urgent <AlertTriangle size={14} className="text-amber-500 fill-amber-50" />
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Inspection Toggle */}
                            <div
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.inspection_intent ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-gray-50/20'}`}
                                onClick={() => setFormData({ ...formData, inspection_intent: !formData.inspection_intent })}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.inspection_intent ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}>
                                        {formData.inspection_intent && <Check size={14} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-sm font-bold text-gray-900">Include Independent Inspection</span>
                                        <span className="block text-[11px] text-gray-500 mt-1 leading-relaxed">
                                            Min-meg certified inspectors will verify quality, quantity and container loading protocols at source.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Additional Requirements</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                                    placeholder="Specify purity requirements, packaging preferences, or certification needs..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 text-sm text-gray-600 space-y-4">
                                <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2 flex items-center gap-2">
                                    <Box size={18} className="text-green-600" />
                                    Review Your Inquiry
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                        <span className="text-gray-500">Product:</span>
                                        <span className="font-bold text-gray-900">{product.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                        <span className="text-gray-500">Quantity:</span>
                                        <span className="font-bold text-gray-900">{formData.quantity} {formData.measure_type.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                        <span className="text-gray-500">Grade Required:</span>
                                        <span className="font-bold text-gray-900">{formData.preferred_grade || 'Standard'}</span>
                                    </div>
                                    <div className="flex flex-col py-1 border-b border-dashed border-gray-200 gap-1">
                                        <span className="text-gray-500">Delivery Destination:</span>
                                        <div className="bg-white p-2 rounded border border-gray-100">
                                            <p className="font-bold text-gray-900">{formData.delivery_address}</p>
                                            <p className="text-xs text-gray-500">{formData.delivery_location}, {formData.delivery_state}, {formData.delivery_country}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                        <span className="text-gray-500">Timeline:</span>
                                        <span className="font-bold text-gray-900 capitalize">{formData.timeline_type.replace(/_/g, ' ')} {formData.timeline_type === 'recurring' && `(${formData.recurring_frequency})`}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-500">Inspection:</span>
                                        <span className={`font-bold px-2 py-0.5 rounded ${formData.inspection_intent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {formData.inspection_intent ? 'Requested' : 'Not included'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex gap-4">
                                <AlertTriangle className="text-blue-600 shrink-0" size={20} />
                                <div className="text-[11px] text-blue-900 leading-relaxed">
                                    <p className="font-bold text-xs mb-1">Platform Orchestration Guarantee</p>
                                    <p className="opacity-80">
                                        By submitting this inquiry, you agree to conduct all communication via the Admin Orchestrator.
                                        Min-meg acts as the trusted intermediary to ensure payment security and product quality.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-12 px-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                                    <CheckCircle className="text-green-600 w-10 h-10" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {itemType === 'product' ? 'Inquiry Successfully Logged!' : 'Quote Submitted!'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">
                                {itemType === 'product'
                                    ? 'Our Team has received your request. We are contacting the supplier and will initiate the Procedural Documents shortly.'
                                    : 'Your quote has been submitted to the Admin. Our team will review and relay it to the buyer shortly.'}
                            </p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Return to Marketplace
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step < 3 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            {step === 1 ? (
                                <button onClick={handleClose} className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors uppercase tracking-tight">Discard</button>
                            ) : (
                                <button onClick={() => setStep(1)} className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors uppercase tracking-tight">Back</button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5 mr-4">
                                <div className={`w-1.5 h-1.5 rounded-full ${step === 1 ? 'bg-green-600' : 'bg-gray-300'}`} />
                                <div className={`w-1.5 h-1.5 rounded-full ${step === 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
                            </div>

                            {step === 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="bg-green-600 text-white min-w-[140px] p-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20 active:scale-[0.98]"
                                >
                                    Proceed to Review
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-green-600 text-white min-w-[160px] py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            Send Inquiry <ChevronRight size={18} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProductInquiryModal;
