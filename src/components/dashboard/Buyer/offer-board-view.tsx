'use client';

import React, { useState } from 'react';
import { useGetAllRfqByBuyerIdQuery } from '@/redux/features/buyer-rfq/rfq-api';
import { useGetRfqOffersQuery } from '@/redux/features/trade/trade_api';
import { useSelector } from 'react-redux';
import { MdCompareArrows } from 'react-icons/md';
import SupplierOfferCard from './SupplierOfferCard';
// import OfferComparisonModal from './modals/OfferComparisonModal';

import { Select } from '@/components/ui/select';
import { MenuItem } from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form-control';
import { Loader2 } from 'lucide-react';
import OfferDetailModal from './modals/OfferDetailModal';

const OfferBoardView = () => {
    const { user, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);
    const buyerId = isTeamMember ? ownerUserId : user?.id;

    const [selectedRfqId, setSelectedRfqId] = useState<string>('');
    const [selectedOffersForProps, setSelectedOffersForProps] = useState<string[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [selectedOfferForDetail, setSelectedOfferForDetail] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-semibold">
                    Offer Management Board
                </h1>

                {selectedOffersForProps.length > 1 && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsCompareModalOpen(true)}
                        className="rounded-full flex items-center"
                    >
                        <MdCompareArrows className="mr-2" /> Compare Selected ({selectedOffersForProps.length})
                    </Button>
                )}
            </div>

            {/* RFQ Selector */}
            <div className="max-w-md bg-white rounded-lg p-4 shadow-sm mb-8 border border-gray-100">
                <FormControl fullWidth>
                    <Select
                        value={selectedRfqId}
                        label="Select Active RFQ"
                        onChange={(e: any) => {
                            setSelectedRfqId(e.target.value);
                            setSelectedOffersForProps([]); // Reset comparison when changing RFQ
                        }}
                    >
                        {isLoadingRfqs ? (
                            <MenuItem disabled><Loader2 className="animate-spin mr-2" size={16} /> Loading RFQs...</MenuItem>
                        ) : rfqList.length === 0 ? (
                            <MenuItem disabled>No Active RFQs Found</MenuItem>
                        ) : (
                            rfqList.map((rfq: any) => (
                                <MenuItem key={rfq.rfqId} value={rfq.rfqId}>
                                    {rfq.rfqProductName} - {rfq.quantityRequired} {rfq.quantityMeasure}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </FormControl>
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

            {/* <OfferComparisonModal 
                open={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                offers={offers.filter((o: any) => selectedOffersForProps.includes(o.external_id))}
            /> */}

            <OfferDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                offer={selectedOfferForDetail}
            />
        </div>
    );
};

export default OfferBoardView;
