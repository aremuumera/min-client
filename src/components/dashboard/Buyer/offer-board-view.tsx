'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DropdownSelect, PageHelp } from '@/components/ui';
import { offerBoardHelp } from '@/lib/help/rfqs';
import { rfqStatusLabel } from '@/lib/rfqs';
import { useGetAllRfqByBuyerIdQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetRfqOffersQuery } from '@/redux/features/trade/trade_api';
import { useSelector } from 'react-redux';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { MdCompareArrows } from 'react-icons/md';
import SupplierOfferCard from './SupplierOfferCard';
import OfferComparisonModal from './modals/OfferComparisonModal';

import { Select } from '@/components/ui/select';
import { MenuItem } from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form-control';
import { Loader2, ChevronDown, Tag, Clock, PackageSearch, Eye } from 'lucide-react';
import OfferDetailModal from './modals/OfferDetailModal';
import RfqDetailModal from './modals/RfqDetailModal';
import { format } from 'date-fns';

const OfferBoardView = () => {
    const { user, effectiveUserId } = useAuthIdentity();
    const buyerId = effectiveUserId;

    // My RFQs links here with the RFQ already chosen
    const [selectedRfqId, setSelectedRfqId] = useState<string>(useSearchParams().get('rfq') ?? '');
    const [selectedOffersForProps, setSelectedOffersForProps] = useState<string[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [selectedOfferForDetail, setSelectedOfferForDetail] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRfqDetailModalOpen, setIsRfqDetailModalOpen] = useState(false);

    // Fetch active RFQs for dropdown
    const { data: activeRfqs, isLoading: isLoadingRfqs } = useGetAllRfqByBuyerIdQuery(
        { buyerId, limit: 100 },
        { skip: !buyerId }
    );

    // Fetch offers for the selected RFQ
    const { data: offersData, isLoading: isLoadingOffers } = useGetRfqOffersQuery(
        selectedRfqId,
        { skip: !buyerId || !selectedRfqId }
    );

    const offers = offersData?.data || [];
    const rfqList = activeRfqs?.data || [];

    const handleSelectForCompare = (offerId: string) => {
        setSelectedOffersForProps(prev => {
            if (prev.includes(offerId)) {
                return prev.filter(id => id !== offerId); // Deselect
            }
            if (prev.length >= 3) {
                // Could toast error here: Max 3
                return prev;
            }
            return [...prev, offerId];
        });
    };

    const selectedRfq = rfqList.find((r: any) => r.rfqId === selectedRfqId);

    return (
        <div className="p-4 sm:p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        Offer Management Board <PageHelp content={offerBoardHelp} />
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Evaluate and compare submitted supplier offers.</p>
                </div>

                {selectedOffersForProps.length > 1 && (
                    <button
                        onClick={() => setIsCompareModalOpen(true)}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold px-5 py-3 rounded-full flex items-center justify-center gap-2 text-xs transition-all shadow-md shrink-0 whitespace-nowrap"
                    >
                        <MdCompareArrows size={18} />
                        <span>Compare Selected ({selectedOffersForProps.length})</span>
                    </button>
                )}
            </div>

            {/* Custom RFQ Selector area */}
            <div className="mb-8" id="rfq-custom-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Active RFQ</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch">
                    <div className="relative w-full sm:w-8/12 md:w-6/12 max-w-xl">
                        <DropdownSelect
                            id="offer-board-rfq"
                            aria-label="Select an RFQ"
                            searchable
                            value={selectedRfqId}
                            onValueChange={(id) => {
                                setSelectedRfqId(id);
                                setSelectedOffersForProps([]);
                            }}
                            options={rfqList.map((rfq: any) => ({ value: rfq.rfqId, label: `${rfq.rfqProductName} (${rfqStatusLabel(rfq.status)})` }))}
                            placeholder={isLoadingRfqs ? 'Loading your RFQs...' : rfqList.length ? 'Choose an RFQ' : 'No RFQs found'}
                        />
                    </div>

                    {/* View Details Button */}
                    {selectedRfq && (
                        <Button
                            variant="outlined"
                            className="h-auto min-h-[64px] px-6 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold transition-all whitespace-nowrap"
                            onClick={() => setIsRfqDetailModalOpen(true)}
                        >
                            <Eye className="mr-2 text-primary-500" size={18} /> View RFQ Details
                        </Button>
                    )}
                </div>
            </div>

            {/* Offers Grid */}
            {selectedRfqId && (
                <div>
                    <h2 className="text-xl font-medium mb-4">
                        Received Offers ({offers.length})
                    </h2>

                    {isLoadingOffers ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" size={32} /></div>
                    ) : offers.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-lg border border-gray-100">
                            <img src="/assets/illustrations/empty-folder.svg" alt="No offers" className="w-32 opacity-50 mx-auto mb-4" />
                            <p className="text-gray-500">No suppliers have submitted offers for this RFQ yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offers.map((offer: any) => (
                                <div key={offer.external_id}>
                                    <SupplierOfferCard
                                        offer={offer}
                                        isSelected={selectedOffersForProps.includes(offer.external_id)}
                                        onToggleSelect={() => handleSelectForCompare(offer.external_id)}
                                        onViewDetails={() => {
                                            setSelectedOfferForDetail(offer);
                                            setIsDetailModalOpen(true);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <OfferComparisonModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                offers={offers.filter((o: any) => selectedOffersForProps.includes(o.external_id) || selectedOffersForProps.includes(o.id))}
                rfq={selectedRfq}
            />

            <OfferDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                offer={selectedOfferForDetail}
            />

            {/* Floating Mobile Comparison Bar */}
            {selectedOffersForProps.length > 1 && (
                <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-gray-200 p-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{selectedOffersForProps.length} Offers Selected</span>
                        <span className="text-[10px] text-gray-500 font-medium">Tap to view side-by-side specs</span>
                    </div>
                    <button
                        onClick={() => setIsCompareModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-sm active:scale-[0.98] transition-all"
                    >
                        <MdCompareArrows size={16} />
                        <span>Compare Now</span>
                    </button>
                </div>
            )}

            <RfqDetailModal
                isOpen={isRfqDetailModalOpen}
                onClose={() => setIsRfqDetailModalOpen(false)}
                rfq={selectedRfq}
            />
        </div>
    );
};

export default OfferBoardView;
