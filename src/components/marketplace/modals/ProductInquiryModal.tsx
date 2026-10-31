"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, X, MapPin, Calendar, Scale, AlertTriangle, Box, Check, ChevronRight, ChevronDown, DollarSign, Upload, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/providers';
import { useCreateProductInquiryMutation, useCreateBusinessInquiryMutation, useSubmitRfqOfferMutation } from '@/redux/features/trade/trade_api';
import { Select } from '@/components/ui/select';
import { MoqUnits } from '@/lib/marketplace-data';
import { formatNumberWithCommas, stripCommas } from '@/lib/number-format';

import { getErrorMessage } from '@/utils/helper';

const PACKAGING_OPTIONS = [
    { value: '50kg bags', label: '50kg Bags' },
    { value: '1 ton bags', label: '1 Ton Bags' },
    { value: 'Jumbo bags', label: 'Jumbo Bags (FIBC)' },
    { value: 'Bulk', label: 'Bulk (Loose)' },
    { value: 'Drums', label: 'Drums' },
    { value: 'Containers', label: 'Containers' },
    { value: 'Custom', label: 'Custom Packaging' },
];

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
    itemType?: 'product' | 'rfq' | 'business';
    rfqData?: {
        quantityRequired?: string;
        quantityMeasure?: string;
        purity_grade?: string;
        moisture_max?: number;
        packaging?: string;
        sampling_method?: string;
        productDestination?: string;
        rfqDescription?: string;
    };
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

const offerInitialState = {
    quantity: '',
    measure_type: 'Tons',
    unit_price: '',
    currency: 'NGN',
    purity_grade: '',
    moisture_max: '',
    packaging: '',
    sampling_method: '',
    delivery_location: '',
    delivery_state: '',
    delivery_country: 'Nigeria',
    delivery_address: '',
    timeline_type: 'immediate',
    recurring_duration: '',
    recurring_frequency: 'monthly',
    description: '',
    attachments: [] as any[],
};

const ProductInquiryModal = ({
    isOpen,
    onClose,
    product,
    itemType = 'product',
    rfqData,
    productData,
}: ProductInquiryModalProps) => {
    const isRfqOffer = itemType === 'rfq';
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>(isRfqOffer ? offerInitialState : initialState);
    const [customPackaging, setCustomPackaging] = useState(false);
    const [showSpecsPopover, setShowSpecsPopover] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    // A listing with a minimum order is asked for in its own unit, so the amount can be checked
    const listedMeasure = !isRfqOffer ? (product as { measure?: string })?.measure : undefined;
    const minimumOrder = !isRfqOffer ? (product as { minimum_order_quantity?: string | null })?.minimum_order_quantity : null;
    useEffect(() => {
        if (isOpen && listedMeasure) setFormData((f: any) => ({ ...f, measure_type: listedMeasure }));
    }, [isOpen, listedMeasure]);

    const handleClose = () => {
        setStep(1);
        setShowSpecsPopover(false);
        setFormData(isRfqOffer ? offerInitialState : initialState);
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
    const [submitOffer, { isLoading: isSubmittingOffer }] = useSubmitRfqOfferMutation();
    const { user } = useSelector((state: any) => state.auth);
    const { showAlert } = useAlert();
    const router = useRouter();
    const loading = isRfqOffer ? isSubmittingOffer : (itemType === 'business' ? isCreatingBusinessInquiry : isLoading);

    if (!isOpen) return null;

    // Prevent buyers from submitting RFQ offers
    const userRole = (user?.role || '').toLowerCase();
    const canSubmitOffer = userRole === 'supplier' || userRole === 'buyer_supplier' || userRole === 'both' || userRole === 'admin';
    if (isRfqOffer && !canSubmitOffer) {
        return (
            <div className="fixed inset-0 bg-black/60 z-11000 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-600 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Not Authorized</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        You are not authorized to submit an offer, Kindly contact support.
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

    // Prevent suppliers from submitting product inquiries or requesting quotes
    const canSubmitInquiry = userRole === 'buyer' || userRole === 'buyer_supplier' || userRole === 'both' || userRole === 'admin' || userRole === 'super_admin' || userRole === 'user';
    if (!isRfqOffer && !canSubmitInquiry) {
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
            if (isRfqOffer) {
                const offerData = formData as typeof offerInitialState;
                const isRecurring = offerData.timeline_type === 'recurring';

                const formDataPayload = new FormData();
                formDataPayload.append('quantity', String(offerData.quantity || 0));
                formDataPayload.append('measure_type', offerData.measure_type);
                formDataPayload.append('unit_price', String(offerData.unit_price || 0));
                formDataPayload.append('currency', offerData.currency);
                formDataPayload.append('purity_grade', offerData.purity_grade);
                formDataPayload.append('moisture_max', offerData.moisture_max);
                formDataPayload.append('packaging', offerData.packaging);
                formDataPayload.append('sampling_method', offerData.sampling_method);
                formDataPayload.append('delivery_location', offerData.delivery_location);
                formDataPayload.append('delivery_state', offerData.delivery_state);
                formDataPayload.append('delivery_country', offerData.delivery_country);
                formDataPayload.append('delivery_address', offerData.delivery_address);
                formDataPayload.append('timeline_type', offerData.timeline_type);
                if (isRecurring && offerData.recurring_duration) {
                    formDataPayload.append('recurring_frequency', offerData.recurring_frequency);
                    formDataPayload.append('recurring_duration', String(Math.round(Number(offerData.recurring_duration))));
                }
                formDataPayload.append('description', offerData.description);

                if (offerData.attachments && offerData.attachments.length > 0) {
                    offerData.attachments.forEach((file: File) => {
                        formDataPayload.append('offerAttachment', file);
                    });
                }

                const targetRfqId = product.rfqId || product.id;
                if (!targetRfqId) {
                    showAlert('Target RFQ ID is missing', 'error');
                    return;
                }

                await submitOffer({ rfqId: targetRfqId, body: formDataPayload }).unwrap();
            } else {
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
            }
            setStep(3);
        } catch (err: any) {
            console.error('Submit Error:', err);
            showAlert(getErrorMessage(err, isRfqOffer ? 'Failed to submit offer' : 'Failed to submit inquiry'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (isRfqOffer) {
                const od = formData as typeof offerInitialState;
                if (!od.quantity || !od.unit_price) {
                    showAlert('Please fill in Quantity and Unit Price', 'error');
                    return;
                }
            } else {
                if (!formData.quantity || !formData.delivery_location || !formData.delivery_address || !formData.delivery_state || !formData.delivery_country) {
                    showAlert('Please fill in required fields (Quantity, LGA, Country, State and Address)', 'error');
                    return;
                }
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
                            {itemType === 'rfq' && 'Submit Offer'}
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
                            {isRfqOffer ? (
                                <>
                                    {/* Buyer Requirements (Read-Only) */}
                                    {rfqData && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                                            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2"><FileText size={16} /> Buyer Requirements</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                                                {rfqData.quantityRequired && <p><strong>Qty:</strong> {rfqData.quantityRequired} {rfqData.quantityMeasure}</p>}
                                                {rfqData.purity_grade && <p><strong>Grade:</strong> {rfqData.purity_grade}</p>}
                                                {rfqData.moisture_max && <p><strong>Moisture:</strong> ≤{rfqData.moisture_max}%</p>}
                                                {rfqData.packaging && <p><strong>Packaging:</strong> {rfqData.packaging}</p>}
                                                {rfqData.productDestination && <p><strong>Destination:</strong> {rfqData.productDestination}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pricing */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Unit Price *</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-3 text-gray-400 text-sm font-bold">
                                                    {(formData as any).currency === 'NGN' ? '₦' : '$'}
                                                </div>
                                                <input type="text" className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Price per unit"
                                                    value={formatNumberWithCommas((formData as any).unit_price)}
                                                    onChange={e => setFormData({ ...formData, unit_price: stripCommas(e.target.value) } as any)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                            <Select fullWidth value={(formData as any).currency}
                                                onChange={(val: any) => { const v = typeof val === 'string' ? val : val.target.value; setFormData({ ...formData, currency: v } as any); }}
                                                options={[{ value: 'NGN', label: '₦ NGN' } /* , { value: 'USD', label: '$ USD' } */]} />
                                        </div>
                                    </div>

                                    {/* Quantity & Measure */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Quantity Available *</label>
                                            <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Enter amount"
                                                value={formatNumberWithCommas(formData.quantity)}
                                                onChange={e => setFormData({ ...formData, quantity: stripCommas(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Measure Type</label>
                                            <Select fullWidth value={formData.measure_type}
                                                onChange={(val: any) => { const v = typeof val === 'string' ? val : val.target.value; setFormData({ ...formData, measure_type: v }); }}
                                                options={MoqUnits.map(u => ({ value: u, label: u }))} />
                                        </div>
                                    </div>

                                    {/* Mineral Specs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Your Purity / Grade</label>
                                            <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 95%+, Grade A"
                                                value={(formData as any).purity_grade} onChange={e => setFormData({ ...formData, purity_grade: e.target.value } as any)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Your Moisture (%)</label>
                                            <input type="number" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. 5.0"
                                                value={(formData as any).moisture_max} onChange={e => setFormData({ ...formData, moisture_max: e.target.value } as any)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Packaging</label>
                                            <Select fullWidth value={customPackaging ? 'Custom' : ((formData as any).packaging || '')}
                                                onChange={(val: any) => {
                                                    const v = typeof val === 'string' ? val : val.target.value;
                                                    if (v === 'Custom') {
                                                        setCustomPackaging(true);
                                                        setFormData({ ...formData, packaging: '' } as any);
                                                    } else {
                                                        setCustomPackaging(false);
                                                        setFormData({ ...formData, packaging: v } as any);
                                                    }
                                                }}
                                                options={PACKAGING_OPTIONS} />
                                            {customPackaging && (
                                                <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none mt-2" placeholder="Enter custom packaging"
                                                    value={(formData as any).packaging} onChange={e => setFormData({ ...formData, packaging: e.target.value } as any)} />
                                            )}
                                        </div>
                                        {/* Sampling Protocol - not needed for supplier offers */}
                                        {/* <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Sampling Protocol</label>
                                            <input type="text" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. ASTM Standard"
                                                value={(formData as any).sampling_method} onChange={e => setFormData({ ...formData, sampling_method: e.target.value } as any)} />
                                        </div> */}
                                    </div>

                                    {/* Origin / Loading Point */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Origin / Loading Point</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Country"
                                                value={formData.delivery_country} onChange={e => setFormData({ ...formData, delivery_country: e.target.value })} />
                                            <input type="text" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="State"
                                                value={formData.delivery_state} onChange={e => setFormData({ ...formData, delivery_state: e.target.value })} />
                                            <input type="text" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="LGA / Loading Site"
                                                value={formData.delivery_location} onChange={e => setFormData({ ...formData, delivery_location: e.target.value })} />
                                            <input type="text" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Detailed Address"
                                                value={formData.delivery_address} onChange={e => setFormData({ ...formData, delivery_address: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700">Attachments (Images/PDF/MP4)</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf,video/mp4"
                                                id="offer-attachments"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    const validFiles = files.filter(f => {
                                                        if (f.size > 15 * 1024 * 1024) {
                                                            showAlert(`${f.name} is too large (>15MB)`, 'error');
                                                            return false;
                                                        }
                                                        if (f.type.startsWith('video/') && f.type !== 'video/mp4') {
                                                            showAlert(`Only MP4 videos are supported`, 'error');
                                                            return false;
                                                        }
                                                        return true;
                                                    });
                                                    setFormData({ ...formData, attachments: [...(formData.attachments || []), ...validFiles] });
                                                }}
                                            />
                                            <label htmlFor="offer-attachments" className="cursor-pointer flex flex-col items-center gap-2">
                                                <Upload size={24} className="text-gray-400" />
                                                <span className="text-xs text-gray-500">Click to upload (Max 15MB per file)</span>
                                            </label>
                                        </div>
                                        {formData.attachments?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.attachments.map((file: any, i: number) => (
                                                    <div key={i} className="bg-gray-100 px-2 py-1 rounded text-[10px] flex items-center gap-1">
                                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                                        <button onClick={() => setFormData({ ...formData, attachments: formData.attachments.filter((_: any, idx: number) => idx !== i) })} className="text-red-500"><X size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Additional Description</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm h-24 focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                                            placeholder="Provide more details about your offer..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
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
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 text-sm text-gray-600 space-y-4">
                                <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2 flex items-center gap-2">
                                    <Box size={18} className="text-green-600" />
                                    {isRfqOffer ? 'Review Your Offer' : 'Review Your Inquiry'}
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
                                    {isRfqOffer && (
                                        <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                                            <span className="text-gray-500">Unit Price:</span>
                                            <span className="font-bold text-gray-900">{formData.currency} {formatNumberWithCommas(formData.unit_price)}</span>
                                        </div>
                                    )}
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
                                    if (isRfqOffer) {
                                        router.push('/dashboard/chat');
                                    }
                                }}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
                            >
                                {isRfqOffer ? 'View in Trade Desk' : 'Return to Marketplace'}
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
                                                {isRfqOffer ? 'Submit Offer' : 'Send Inquiry'} <ChevronRight size={18} />
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
