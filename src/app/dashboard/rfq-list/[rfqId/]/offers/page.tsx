"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetOffersByRfqQuery } from '@/redux/features/trade/trade_api';
import {
    Package,
    ArrowLeft,
    Layers,
    CheckCircle2,
    Clock,
    Boxes,
    FileSearch,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import OfferComparisonModal from './OfferComparisonModal';

export default function OfferBoardPage() {
    const { rfqId } = useParams();
    const { data: offersData, isLoading } = useGetOffersByRfqQuery(rfqId as string);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedOffers, setSelectedOffers] = React.useState<string[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);

    const offers = offersData?.data || [];
    const rfq = offersData?.rfq;

    const filteredComparingOffers = offers.filter((o: any) => selectedOffers.includes(o.id));

    const toggleOfferSelection = (id: string) => {
        if (selectedOffers.includes(id)) {
            setSelectedOffers(prev => prev.filter(oid => oid !== id));
        } else if (selectedOffers.length < 3) {
            setSelectedOffers(prev => [...prev, id]);
        }
    };

    if (isLoading) return <div className="p-10 text-center font-bold text-gray-400">Loading Offers...</div>;

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                    <Link href={paths.dashboard.rfqs.list} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-green-600 transition-colors mb-4 uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to RFQs
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Offer Management
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest border border-green-200">
                            {offers.length} Offers
                        </span>
                    </h1>
                    <p className="text-gray-500 font-medium">Comparing supplier quotes for: <span className="text-gray-900 font-bold">{rfq?.name || 'Loading...'}</span></p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        disabled={selectedOffers.length < 2}
                        onClick={() => setIsCompareModalOpen(true)}
                        className="bg-green-600 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        Compare {selectedOffers.length} {selectedOffers.length === 1 ? 'Offer' : 'Offers'}
                    </Button>
                </div>
            </div>

            {/* Offer List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* ... existing offers map content ... */}
                {offers.length === 0 ? (
                    <div className="col-span-full py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300">
                            <Boxes size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-900">No Offers Yet</h3>
                            <p className="text-sm text-gray-500 max-w-xs px-6 font-medium leading-relaxed">Suppliers have not responded to this RFQ. Notifications have been sent to matching providers.</p>
                        </div>
                    </div>
                ) : (
                    offers.map((offer: any) => (
                        <div
                            key={offer.id}
                            onClick={() => toggleOfferSelection(offer.id)}
                            className={`group relative bg-white border-2 rounded-[32px] p-6 transition-all duration-300 cursor-pointer overflow-hidden ${selectedOffers.includes(offer.id) ? 'border-green-500 shadow-xl shadow-green-500/5 ring-4 ring-green-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-lg'}`}
                        >
                            {/* Selection Badge */}
                            <div className={`absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedOffers.includes(offer.id) ? 'bg-green-600 border-green-600' : 'bg-gray-50 border-gray-200'}`}>
                                {selectedOffers.includes(offer.id) && <CheckCircle2 size={16} className="text-white" />}
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 font-bold text-gray-400">
                                        {offer.supplier?.logo ? (
                                            <img src={offer.supplier.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <Package size={20} />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-gray-900 tracking-tight leading-none group-hover:text-green-600 transition-colors uppercase text-sm">{offer.supplier?.company || 'Supplier'}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{offer.supplier?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 leading-none">Purity/Grade</p>
                                        <p className="font-bold text-gray-900 leading-none">{offer.purity_grade || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 leading-none">Moisture</p>
                                        <p className="font-bold text-gray-900 leading-none">{offer.moisture_max ? `${offer.moisture_max}%` : '-'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        <span>Quantity Offered</span>
                                        <span className="text-gray-900">{offer.quantity} {offer.measure_type}</span>
                                    </div>
                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full w-full" />
                                    </div>
                                </div>

                                <Link
                                    href={`/dashboard/trade/details/${offer.id}`}
                                    className="pt-2 flex items-center justify-between text-xs font-bold text-gray-900 group/link"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View Full Specs
                                    <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover/link:bg-green-600 group-hover/link:text-white transition-all">
                                        <ArrowUpRight size={14} />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <OfferComparisonModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                offers={filteredComparingOffers}
                rfq={rfq}
            />
        </div>
    );
}
