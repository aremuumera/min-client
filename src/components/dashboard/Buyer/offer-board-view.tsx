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
import { Loader2, ChevronDown, Tag, Clock, PackageSearch, Eye } from 'lucide-react';
import OfferDetailModal from './modals/OfferDetailModal';
import RfqDetailModal from './modals/RfqDetailModal';
import { format } from 'date-fns';

const OfferBoardView = () => {
    const { user, isTeamMember, ownerUserId } = useSelector((state: any) => state.auth);
    const buyerId = isTeamMember ? ownerUserId : user?.id;

    const [selectedRfqId, setSelectedRfqId] = useState<string>('');
    const [selectedOffersForProps, setSelectedOffersForProps] = useState<string[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [selectedOfferForDetail, setSelectedOfferForDetail] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isRfqDropdownOpen, setIsRfqDropdownOpen] = useState(false);
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

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = document.getElementById('rfq-custom-dropdown');
            if (dropdown && !dropdown.contains(event.target as Node)) {
                setIsRfqDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            {/* Custom RFQ Selector area */}
            <div className="mb-8" id="rfq-custom-dropdown">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Active RFQ</label>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch">
                    <div className="relative w-full sm:w-8/12 md:w-6/12 max-w-xl">
                        {/* Dropdown Button */}
                        <div
                            className={`w-full bg-white border ${isRfqDropdownOpen ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-300 hover:border-gray-400'} rounded-xl cursor-pointer min-h-[64px] transition-all flex items-center justify-between p-3 px-4`}
                            onClick={() => setIsRfqDropdownOpen(!isRfqDropdownOpen)}
                        >
                            {isLoadingRfqs ? (
                                <div className="flex items-center text-gray-500 gap-2"><Loader2 className="animate-spin" size={18} /> Loading your RFQs...</div>
                            ) : selectedRfq ? (
                                <div className="flex flex-col overflow-hidden pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900 truncate">{selectedRfq.rfqProductName}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${selectedRfq.status === 'active' || selectedRfq.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {selectedRfq.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><PackageSearch size={12} /> {selectedRfq.quantityRequired} {selectedRfq.quantityMeasure}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(selectedRfq.createdAt), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 font-medium">-- Please select an RFQ --</div>
                            )}
                            <ChevronDown className={`text-gray-400 transition-transform ${isRfqDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                        </div>

                        {/* Dropdown Options List */}
                        {isRfqDropdownOpen && rfqList.length > 0 && (
                            <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl max-h-96 overflow-y-auto overflow-hidden custom-scrollbar">
                                <div className="p-1">
                                    {rfqList.map((rfq: any) => (
                                        <div
                                            key={rfq.rfqId}
                                            className={`p-3 m-1 rounded-lg cursor-pointer transition-colors border ${selectedRfqId === rfq.rfqId ? 'bg-primary-50 border-primary-200' : 'border-transparent hover:bg-gray-50'}`}
                                            onClick={() => {
                                                setSelectedRfqId(rfq.rfqId);
                                                setSelectedOffersForProps([]);
                                                setIsRfqDropdownOpen(false);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {rfq.rfqProductName}
                                                    {selectedRfqId === rfq.rfqId && <span className="w-2 h-2 rounded-full bg-primary-500"></span>}
                                                </div>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${rfq.status === 'active' || rfq.status === 'published' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                                    {rfq.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1.5 flex-wrap">
                                                <span className="bg-white px-1.5 py-0.5 rounded border border-gray-100">Vol: <strong className="text-gray-900">{rfq.quantityRequired} {rfq.quantityMeasure}</strong></span>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(rfq.createdAt), 'MMM dd, yyyy')}</span>
                                                <span className="flex items-center gap-1"><Tag size={10} /> {rfq.rfqProductCategory}</span>
                                            </div>
                                            {rfq.rfqDescription && (
                                                <p className="text-[11px] text-gray-400 mt-2 truncate max-w-full italic">"{rfq.rfqDescription}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {isRfqDropdownOpen && rfqList.length === 0 && !isLoadingRfqs && (
                            <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                                No active RFQs found.
                            </div>
                        )}
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

            <RfqDetailModal
                isOpen={isRfqDetailModalOpen}
                onClose={() => setIsRfqDetailModalOpen(false)}
                rfq={selectedRfq}
            />
        </div>
    );
};

export default OfferBoardView;
