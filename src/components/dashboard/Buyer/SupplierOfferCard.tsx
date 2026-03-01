import { MdVerified, MdOutlineDownloadForOffline } from 'react-icons/md';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useShortlistRfqOfferMutation } from '@/redux/features/trade/trade_api';
import { Loader2 } from 'lucide-react';
import { useAlert } from '@/providers';

interface SupplierOfferCardProps {
    offer: any;
    isSelected: boolean;
    onToggleSelect: () => void;
    onViewDetails: () => void;
}

const SupplierOfferCard: React.FC<SupplierOfferCardProps> = ({ offer, isSelected, onToggleSelect, onViewDetails }) => {
    const [shortlistOffer, { isLoading }] = useShortlistRfqOfferMutation();
    const { showAlert } = useAlert();
    const isShortlisted = offer.is_shortlisted;
    console.log('offer', offer);

    const handleShortlist = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await shortlistOffer({
                offerId: offer.external_id || offer.id,
                is_shortlisted: !isShortlisted
            }).unwrap();
            showAlert(isShortlisted ? 'Removed from shortlist' : 'Offer shortlisted successfully', 'success');
        } catch (err: any) {
            showAlert(err?.data?.message || 'Failed to update shortlist status', 'error');
        }
    };

    return (
        <div
            className={`
                rounded-xl bg-white p-6 relative transition-all duration-200 border
                ${isSelected ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}
            `}
        >
            {/* Selection Checkbox */}
            <div className="absolute -top-3 -right-3 bg-white rounded-full z-10 p-1 border border-gray-200">
                <Checkbox
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
            </div>

            {isShortlisted && (
                <div
                    className="absolute top-4 -left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-r-md"
                >
                    Shortlisted
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        {offer.supplier?.company_name || 'Verified Supplier'}
                        <MdVerified className="text-green-500 text-lg" />
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {offer.supplier?.country || 'Global'} • {offer.delivery_location || 'Standard Delivery'}
                    </p>
                </div>
            </div>

            <hr className="my-4 border-gray-100" />

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span className="text-xs text-gray-500 block mb-1">Offered Volume</span>
                    <span className="font-semibold">
                        {offer.quantity} {offer.measure_type}
                    </span>
                </div>
                <div>
                    <span className="text-xs text-gray-500 block mb-1">Unit Price</span>
                    <span className="font-semibold text-primary-600">
                        {offer.currency === 'USD' ? '$' : '₦'}{Number(offer.display_price).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                    <span className="text-xs text-gray-500 block mb-1">Grade</span>
                    <span className="text-sm font-medium">{offer.purity_grade || 'Nill'}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500 block mb-1">Moisture</span>
                    <span className="text-sm font-medium">{offer.moisture_max ? `${offer.moisture_max}%` : 'Nill'}</span>
                </div>
            </div>

            {offer.attachments?.length > 0 && (
                <div className="mt-4 mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <MdOutlineDownloadForOffline className="text-base" />
                        {offer.attachments.length} files attached
                    </span>
                </div>
            )}

            <div className="mt-6 flex gap-3">
                <Button
                    variant={isShortlisted ? "contained" : "outlined"}
                    className={`flex-1 ${isShortlisted ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                    onClick={handleShortlist}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : (isShortlisted ? 'Un-shortlist' : 'Shortlist')}
                </Button>
                <Button
                    variant="contained"
                    className="flex-1 bg-gray-900"
                    onClick={onViewDetails}
                >
                    View Details
                </Button>
            </div>
        </div>
    );
};

export default SupplierOfferCard;
