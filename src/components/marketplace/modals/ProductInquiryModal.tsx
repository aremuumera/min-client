"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, X, MapPin, Calendar, Scale, AlertTriangle, Box, Check, ChevronRight, ChevronDown, DollarSign, Upload, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/providers';
import { useCreateProductInquiryMutation, useCreateBusinessInquiryMutation } from '@/redux/features/trade/trade_api';
import { Select } from '@/components/ui/select';
import { MoqUnits } from '@/lib/marketplace-data';
import { formatNumberWithCommas, stripCommas } from '@/lib/number-format';

import { getErrorMessage } from '@/utils/helper';
import { PACKAGING_OPTIONS } from '@/lib/trade-terms';

interface ProductInquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        rfqId: string;
        external_id?: string;
        name: string;
        mineral_tag: string;
        supplier_id?: string;
        purity_grade?: string;
        moisture_max?: number | string;
        packaging?: string;
        sampling_method?: string;
        quantity?: number | string;
        measure?: string;
        minimum_order_quantity?: string | null;
        product_category?: string;
    };
    itemType?: 'product' | 'business';
    productData?: {
        purity_grade?: string;
        moisture_max?: number | string;
        packaging?: string;
        sampling_method?: string;
        quantity?: number | string;
        measure?: string;
    };
}

const initialState = {
    quantity: '',
    measure_type: 'Tons',
    delivery_location: '',
    delivery_state: '',
    delivery_country: 'Nigeria',
    delivery_address: '',
    timeline_type: 'immediate',
    recurring_duration: '',
    recurring_frequency: 'monthly',
    inspection_intent: true,
    description: '',
    urgency: 'standard',
    preferred_grade: '',
    purity_grade: '',
    moisture_max: '',
    packaging: '',
    sampling_method: '',
};

const ProductInquiryModal = ({
    isOpen,
    onClose,
    product,
    itemType = 'product',
    productData,
}: ProductInquiryModalProps) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>(initialState);
    const [customPackaging, setCustomPackaging] = useState(false);
    const [showSpecsPopover, setShowSpecsPopover] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // A listing with a minimum order is asked for in its own unit, so the amount can be checked
    const listedMeasure = (product as { measure?: string })?.measure;
    const minimumOrder = (product as { minimum_order_quantity?: string | null })?.minimum_order_quantity ?? null;
    useEffect(() => {
        if (isOpen && listedMeasure) setFormData((f: any) => ({ ...f, measure_type: listedMeasure }));
    }, [isOpen, listedMeasure]);

    const handleClose = () => {
        setStep(1);
        setShowSpecsPopover(false);
        setFormData(initialState);
        onClose();
    };

    const effectiveProductData = {
        purity_grade: productData?.purity_grade || (product as any)?.purity_grade || '',
        moisture_max: productData?.moisture_max !== undefined && productData?.moisture_max !== null
            ? productData.moisture_max
            : ((product as any)?.moisture_max !== undefined && (product as any)?.moisture_max !== null ? (product as any).moisture_max : ''),
        packaging: productData?.packaging || (product as any)?.packaging || '',
        sampling_method: productData?.sampling_method || (product as any)?.sampling_method || '',
    };

    const hasProductSpecs = Boolean(
        effectiveProductData.purity_grade ||
        (effectiveProductData.moisture_max !== '' && effectiveProductData.moisture_max !== undefined && effectiveProductData.moisture_max !== null) ||
        effectiveProductData.packaging ||
        effectiveProductData.sampling_method
    );

    const handleApplyGrade = (grade: string) => {
        setFormData((prev: any) => ({
            ...prev,
            purity_grade: grade,
            preferred_grade: grade,
        }));
        showAlert(`Applied Grade: ${grade}`, 'success');
    };

    const handleApplyMoisture = (moisture: number | string) => {
        setFormData((prev: any) => ({
            ...prev,
            moisture_max: String(moisture),
        }));
        showAlert(`Applied Moisture: ${moisture}%`, 'success');
    };

    const handleApplyPackaging = (pkg: string) => {
        const isStandard = PACKAGING_OPTIONS.some(opt => opt.value.toLowerCase() === pkg.toLowerCase());
        setCustomPackaging(!isStandard);
        setFormData((prev: any) => ({ ...prev, packaging: pkg }));
        showAlert(`Applied Packaging: ${pkg}`, 'success');
    };

    const handleApplySampling = (sampling: string) => {
        setFormData((prev: any) => ({
            ...prev,
            sampling_method: sampling,
        }));
        showAlert(`Applied Sampling Protocol: ${sampling}`, 'success');
    };

    const handlePrefillAllProductSpecs = () => {
        const updates: any = {};
        if (effectiveProductData.purity_grade) {
            updates.purity_grade = effectiveProductData.purity_grade;
            updates.preferred_grade = effectiveProductData.purity_grade;
        }
        if (effectiveProductData.moisture_max !== '' && effectiveProductData.moisture_max !== undefined && effectiveProductData.moisture_max !== null) {
            updates.moisture_max = String(effectiveProductData.moisture_max);
        }
        if (effectiveProductData.packaging) {
            updates.packaging = effectiveProductData.packaging;
            const isStandard = PACKAGING_OPTIONS.some(opt => opt.value.toLowerCase() === effectiveProductData.packaging.toLowerCase());
            setCustomPackaging(!isStandard);
        }
        if (effectiveProductData.sampling_method) {
            updates.sampling_method = effectiveProductData.sampling_method;
        }
        setFormData((prev: any) => ({ ...prev, ...updates }));
        setShowSpecsPopover(false);
        showAlert('Applied all supplier specifications', 'success');
    };

    const [createInquiry, { isLoading }] = useCreateProductInquiryMutation();
    const [createBusinessInquiry, { isLoading: isCreatingBusinessInquiry }] = useCreateBusinessInquiryMutation();
    const { user } = useSelector((state: any) => state.auth);
    const { showAlert } = useAlert();
    const router = useRouter();
    const loading = itemType === 'business' ? isCreatingBusinessInquiry : isLoading;

    if (!isOpen) return null;

    const userRole = (user?.role || '').toLowerCase();
    // Prevent suppliers from submitting product inquiries or requesting quotes
    const canSubmitInquiry = userRole === 'buyer' || userRole === 'buyer_supplier' || userRole === 'both' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'user';
    if (!canSubmitInquiry) {
        return (
            <div className="fixed inset-0 bg-black/60 z-11000 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-amber-600 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Not Authorized</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        You are not authorized to submit an inquiry, Kindly contact support.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Prevent self-inquiry: user cannot inquire about their own product
    const effectiveUserId = String(user?.ownerUserId || user?.id || '');
    const isOwnProduct = product.supplier_id && String(product.supplier_id) === effectiveUserId;

    if (isOwnProduct) {
        return (
            <div className="fixed inset-0 bg-black/60 z-11000 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-amber-600 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">This is your product</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        You cannot send an inquiry or offer for your own listing.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (submitting || loading) return;
        setSubmitting(true);
        try {
            const inquiryData = formData as typeof initialState;
            const isRecurring = inquiryData.timeline_type === 'recurring';
            if (itemType === 'business') {
                const payload = {
                    supplier_profile_id: product.id,
                    quantity: Number(inquiryData.quantity) || 0,
                    measure_type: inquiryData.measure_type,
                    delivery_location: inquiryData.delivery_location,
                    delivery_address: inquiryData.delivery_address,
                    delivery_state: inquiryData.delivery_state,
                    delivery_country: inquiryData.delivery_country,
                    timeline_type: inquiryData.timeline_type,
                    recurring_frequency: isRecurring ? (inquiryData.recurring_frequency || null) : null,
                    recurring_duration: isRecurring && inquiryData.recurring_duration ? (Math.round(Number(inquiryData.recurring_duration)) || null) : null,
                    urgency: inquiryData.urgency,
                    description: inquiryData.description,
                };
                await createBusinessInquiry(payload).unwrap();
            } else {
                const payload = {
                    product_id: product.id,
                    entity_type: itemType,
                    mineral_tag: product.mineral_tag,
                    quantity: Number(inquiryData.quantity) || 0,
                    measure_type: inquiryData.measure_type,
                    delivery_location: inquiryData.delivery_location,
                    delivery_address: inquiryData.delivery_address,
                    delivery_state: inquiryData.delivery_state,
                    delivery_country: inquiryData.delivery_country,
                    timeline_type: inquiryData.timeline_type,
                    recurring_frequency: isRecurring ? (inquiryData.recurring_frequency || null) : null,
                    recurring_duration: isRecurring && inquiryData.recurring_duration ? (Math.round(Number(inquiryData.recurring_duration)) || null) : null,
                    inspection_intent: inquiryData.inspection_intent,
                    preferred_grade: inquiryData.preferred_grade,
                    urgency: inquiryData.urgency,
                    description: inquiryData.description,
                    purity_grade: inquiryData.purity_grade,
                    moisture_max: inquiryData.moisture_max,
                    packaging: inquiryData.packaging,
                    sampling_method: inquiryData.sampling_method,
                };
                await createInquiry(payload).unwrap();
            }
            setStep(3);
        } catch (err: any) {
            console.error('Submit Error:', err);
            showAlert(getErrorMessage(err, 'Failed to submit inquiry'), 'error');
        } finally {
            setSubmitting(false);
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
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {itemType === 'product' && 'Product Inquiry'}
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
                                <>
                                    {/* Quantity & Measure */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity Required *</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="Enter Quantity"
                                                value={formatNumberWithCommas(formData.quantity)}
                                                onChange={e => setFormData({ ...formData, quantity: stripCommas(e.target.value) })}
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
                                                options={(minimumOrder && listedMeasure ? [listedMeasure] : Array.from(new Set([...(listedMeasure ? [listedMeasure] : []), ...MoqUnits]))).map(unit => ({
                                                    value: unit,
                                                    label: unit
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    {minimumOrder && (
                                        <p className="text-sm text-gray-600">Minimum order: {Number(minimumOrder).toLocaleString()} {listedMeasure}</p>
                                    )}

                                    {/* Mineral Specifications */}
                                    <div className="space-y-4 pt-1">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                            <div className="pr-2">
                                                <h4 className="text-sm font-bold text-gray-900">Mineral Specifications</h4>
                                                <p className="text-xs text-gray-500">
                                                    Specify your requirements, or apply supplier's listed specifications if satisfied.
                                                </p>
                                            </div>
                                            {itemType === 'product' && hasProductSpecs && (
                                                <div className="relative shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSpecsPopover(!showSpecsPopover)}
                                                        className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <span>Supplier Specs</span>
                                                        <ChevronDown size={14} className={`transition-transform duration-200 ${showSpecsPopover ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {showSpecsPopover && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-30"
                                                                onClick={() => setShowSpecsPopover(false)}
                                                            />
                                                            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl p-3.5 z-40 space-y-3">
                                                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                                    <span className="text-xs font-bold text-gray-900">Supplier Listed Specifications</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowSpecsPopover(false)}
                                                                        className="text-gray-400 hover:text-gray-600 p-0.5"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-2 text-xs">
                                                                    {effectiveProductData.purity_grade && (
                                                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors">
                                                                            <div className="min-w-0 pr-2">
                                                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Grade</span>
                                                                                <span className="font-semibold text-gray-800 truncate block">{effectiveProductData.purity_grade}</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleApplyGrade(effectiveProductData.purity_grade)}
                                                                                className="text-[11px] font-bold text-green-700 bg-white hover:bg-green-50 border border-green-200 px-2.5 py-1 rounded cursor-pointer transition-colors shrink-0"
                                                                            >
                                                                                {formData.purity_grade === effectiveProductData.purity_grade ? 'Applied' : 'Apply'}
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {effectiveProductData.moisture_max !== '' && effectiveProductData.moisture_max !== undefined && effectiveProductData.moisture_max !== null && (
                                                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors">
                                                                            <div className="min-w-0 pr-2">
                                                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Max Moisture</span>
                                                                                <span className="font-semibold text-gray-800 truncate block">{effectiveProductData.moisture_max}%</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleApplyMoisture(effectiveProductData.moisture_max)}
                                                                                className="text-[11px] font-bold text-green-700 bg-white hover:bg-green-50 border border-green-200 px-2.5 py-1 rounded cursor-pointer transition-colors shrink-0"
                                                                            >
                                                                                {formData.moisture_max === String(effectiveProductData.moisture_max) ? 'Applied' : 'Apply'}
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {effectiveProductData.packaging && (
                                                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors">
                                                                            <div className="min-w-0 pr-2">
                                                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Packaging</span>
                                                                                <span className="font-semibold text-gray-800 truncate block">{effectiveProductData.packaging}</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleApplyPackaging(effectiveProductData.packaging)}
                                                                                className="text-[11px] font-bold text-green-700 bg-white hover:bg-green-50 border border-green-200 px-2.5 py-1 rounded cursor-pointer transition-colors shrink-0"
                                                                            >
                                                                                {formData.packaging === effectiveProductData.packaging ? 'Applied' : 'Apply'}
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {effectiveProductData.sampling_method && (
                                                                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors">
                                                                            <div className="min-w-0 pr-2">
                                                                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Sampling Protocol</span>
                                                                                <span className="font-semibold text-gray-800 truncate block">{effectiveProductData.sampling_method}</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleApplySampling(effectiveProductData.sampling_method)}
                                                                                className="text-[11px] font-bold text-green-700 bg-white hover:bg-green-50 border border-green-200 px-2.5 py-1 rounded cursor-pointer transition-colors shrink-0"
                                                                            >
                                                                                {formData.sampling_method === effectiveProductData.sampling_method ? 'Applied' : 'Apply'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={handlePrefillAllProductSpecs}
                                                                    className="w-full text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    Apply All Specifications
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                                    placeholder={effectiveProductData.purity_grade ? `e.g. ${effectiveProductData.purity_grade}` : "enter grade value"}
                                                    value={formData.purity_grade}
                                                    onChange={e => setFormData({ ...formData, purity_grade: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Max Moisture (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                                    placeholder={effectiveProductData.moisture_max !== '' && effectiveProductData.moisture_max !== undefined && effectiveProductData.moisture_max !== null ? `e.g. ${effectiveProductData.moisture_max}` : "e.g. 5.0"}
                                                    value={formData.moisture_max}
                                                    onChange={e => setFormData({ ...formData, moisture_max: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Packaging</label>
                                                <Select
                                                    fullWidth
                                                    value={customPackaging ? 'Custom' : (formData.packaging || '')}
                                                    onChange={(val: any) => {
                                                        const v = typeof val === 'string' ? val : val.target.value;
                                                        if (v === 'Custom') {
                                                            setCustomPackaging(true);
                                                            setFormData({ ...formData, packaging: '' });
                                                        } else {
                                                            setCustomPackaging(false);
                                                            setFormData({ ...formData, packaging: v });
                                                        }
                                                    }}
                                                    options={PACKAGING_OPTIONS}
                                                />
                                                {customPackaging && (
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all mt-2"
                                                        placeholder="Enter custom packaging"
                                                        value={formData.packaging}
                                                        onChange={e => setFormData({ ...formData, packaging: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Sampling Protocol</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                                    placeholder={effectiveProductData.sampling_method ? `e.g. ${effectiveProductData.sampling_method}` : "e.g. ASTM Standard"}
                                                    value={formData.sampling_method}
                                                    onChange={e => setFormData({ ...formData, sampling_method: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Destination *</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="Country *"
                                                value={formData.delivery_country}
                                                onChange={e => setFormData({ ...formData, delivery_country: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="State *"
                                                value={formData.delivery_state}
                                                onChange={e => setFormData({ ...formData, delivery_state: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="LGA / Transit Hub *"
                                                value={formData.delivery_location}
                                                onChange={e => setFormData({ ...formData, delivery_location: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="col-span-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="Detailed Address *"
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
                                                    onChange={() => setFormData({ ...formData, urgency: 'standard' } as any)}
                                                />
                                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Standard</span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="urgency"
                                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                                    checked={formData.urgency === 'urgent'}
                                                    onChange={() => setFormData({ ...formData, urgency: 'urgent' } as any)}
                                                />
                                                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 flex items-center gap-1.5 transition-colors">
                                                    Urgent <AlertTriangle size={14} className="text-amber-500 fill-amber-50" />
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Inspection - Fixed Mandatory for All Trades */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded border border-green-600 bg-green-600 flex items-center justify-center shrink-0">
                                                <Check size={13} className="text-white stroke-[3]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="block text-sm font-bold text-gray-900">Independent Inspection Included</span>
                                                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Mandatory</span>
                                                </div>
                                                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                                                    Minmeg certified inspectors verify quality, quantity, and loading protocols at source for every trade.
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Additional Requirements</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                                            placeholder="Specify other requirements, preferences, or certification needs..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </>
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
                                        <span className="font-bold text-gray-900">{formatNumberWithCommas(formData.quantity)} {formData.measure_type?.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                        <span className="text-gray-500">Grade Required:</span>
                                        <span className="font-bold text-gray-900">{formData.purity_grade || formData.preferred_grade || 'Standard'}</span>
                                    </div>
                                    {formData.moisture_max && (
                                        <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                            <span className="text-gray-500">Max Moisture:</span>
                                            <span className="font-bold text-gray-900">{formData.moisture_max}%</span>
                                        </div>
                                    )}
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
                                        <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-green-100 text-green-700">
                                            Included (Mandatory)
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
                                {itemType === 'product' ? 'Inquiry Successfully Logged!' : `Quote Submitted for ${product.name}!`}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed">
                                {itemType === 'product'
                                    ? `Our Team has received your inquiry for ${product.name}. We are contacting the supplier and will initiate the Procedural Documents shortly.`
                                    : 'Your competitive quote has been submitted to the Admin. Our team will review your offer against the requirements and relay it to the buyer shortly.'}
                            </p>
                            <button
                                onClick={() => {
                                    handleClose();
                                }}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
                            >
                                Return to Marketplace
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {
                    step < 3 && (
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
                                        className="bg-green-600 text-white min-w-[140px] p-3 rounded-xl font-bold hover:bg-green-700 transition active:scale-[0.98]"
                                    >
                                        Proceed to Review
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || submitting}
                                        className="bg-green-600 text-white min-w-[160px] py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {loading || submitting ? (
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
                    )
                }

            </div>
        </div>
    );
};

export default ProductInquiryModal;
