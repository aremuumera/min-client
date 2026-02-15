import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { MdNavigateBefore, MdNavigateNext, MdDelete } from 'react-icons/md';
import { FaStar } from 'react-icons/fa6';
import { formatCompanyNameForUrl } from '@/utils/url-formatter';
import { paths } from '@/config/paths';
import LoginModal from '@/utils/login-modal';
import ShareButton from '@/components/marketplace/product-widgets/share-button';

const SavedProductWidget = ({ products, onDelete, isSaved }: any) => {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [showLoginModalForSave, setShowLoginModalForSave] = React.useState(false);

    const handleScroll = () => {
        window.scrollTo(0, 0);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((currentIndex + 1) % (products?.images?.length || 1));
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((currentIndex - 1 + (products?.images?.length || 1)) % (products?.images?.length || 1));
    };

    const imageContainerStyle = {
        width: `${(products?.images?.length || 1) * 100}%`,
        transform: `translateX(-${(currentIndex / (products?.images?.length || 1)) * 100}%)`,
        transition: "transform 0.5s ease-in-out",
    };

    const {
        product_name,
        prev_price,
        real_price,
        country,
        productRating,
        delivery_period,
        storeProfile,
        quantity,
        measure,
        id
    } = products || {};

    // Safety check
    if (!products) return null;

    const productCardRoute = `/dashboard/products/details/${id}/${formatCompanyNameForUrl(product_name)}`;

    return (
        <div className='relative h-full w-full max-w-[250px]'>
            <div className='group transition-all duration-300 hover:shadow-md border border-[#e5e7eb]   mb-[14px] bg-[#ffffff] pt-[10px] px-[10px] rounded-[15px] pb-[10px] h-full flex flex-col justify-between'>
                {/* Delete button for saved items */}
                {isSaved && (
                    <div className="absolute top-2 right-2 m-2 z-20">
                        <Tooltip title="Remove from saved items">
                            <IconButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                aria-label="Remove from saved items"
                                size="sm"
                                className="bg-white/80 hover:bg-white/90 shadow-sm transition-all"
                            >
                                <MdDelete className="text-red-500" />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                {/* Images */}
                <div className="relative">
                    <div className="widget_image_container relative aspect-square md:h-[230px] overflow-hidden rounded-xl bg-gray-50">
                        <div className="w-full h-full flex" style={imageContainerStyle}>
                            {products?.images?.map((j: string, i: number) => (
                                <div
                                    className="relative h-full shrink-0"
                                    style={{ width: `${100 / (products?.images?.length || 1)}%` }}
                                    key={i}
                                >
                                    <Link
                                        href={productCardRoute}
                                        onClick={handleScroll}
                                        className="block w-full h-full"
                                    >
                                        <img
                                            src={j}
                                            alt={product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className='absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10'>
                            <button
                                onClick={handlePrev}
                                className="pointer-events-auto w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-800 shadow-sm backdrop-blur-sm transition-colors"
                            >
                                <MdNavigateBefore className="text-xl" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="pointer-events-auto w-8 h-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-800 shadow-sm backdrop-blur-sm transition-colors"
                            >
                                <MdNavigateNext className="text-xl" />
                            </button>
                        </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center mt-2 gap-1.5">
                        {products?.images?.map((_: any, i: number) => (
                            <div
                                key={i}
                                className={`rounded-full h-1.5 transition-all duration-300 ${currentIndex === i ? "bg-gray-800 w-4" : "bg-gray-300 w-1.5"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Product details */}
                <div className="grow flex flex-col mt-3">
                    <h2 className='text-[14px] font-medium line-clamp-2 min-h-[40px] text-gray-800'>
                        {product_name}
                    </h2>

                    <div className='mt-2 flex items-baseline gap-2'>
                        {prev_price && (
                            <span className='text-[20px] font-bold text-gray-900'>${prev_price}</span>
                        )}
                        {real_price && (
                            <span className='text-[13px] text-gray-500 line-through decoration-gray-400'>${real_price}</span>
                        )}
                    </div>

                    <div className="space-y-1 mt-2">
                        {quantity && (
                            <div className='flex items-center text-[13px]'>
                                <span className='text-gray-500 font-medium'>M.O.Q:</span>
                                <span className='pl-1 text-gray-800'>{quantity} {measure}</span>
                            </div>
                        )}

                        {delivery_period && (
                            <div className='flex items-center text-[13px]'>
                                <span className='text-gray-500 font-medium'>Del. Period:</span>
                                <span className='pl-1 text-gray-800'>{delivery_period}</span>
                            </div>
                        )}
                    </div>

                    <div className='mt-3 flex justify-between items-center bg-yellow-50/50 px-2 py-1 rounded-md border border-yellow-100/50'>
                        <span className='flex items-center gap-1.5'>
                            <FaStar className="text-yellow-400 text-xs" />
                            <span className='text-[12px] font-bold text-gray-800'>
                                {Math.round((productRating?.average || 0) * 100) / 100}
                            </span>
                            <span className='text-[11px] text-gray-500'>
                                ({productRating?.count || 0})
                            </span>
                        </span>
                    </div>

                    <div className="mt-3 pt-3 flex items-center gap-2 border-t border-gray-100">
                        {country?.flagImage && (
                            <img src={country?.flagImage} alt='Country' className='w-4 h-auto object-contain shrink-0' />
                        )}
                        <Link
                            className='text-[12px] font-medium text-gray-600 hover:text-green-600 hover:underline truncate'
                            href={`/dashboard/business/${storeProfile?.company_name}`}
                        >
                            {storeProfile?.company_name}
                        </Link>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                    <Link href={productCardRoute} className="w-full">
                        <Button
                            variant="contained"
                            className="w-full text-sm font-medium h-10 rounded-lg bg-[#0a9150] hover:bg-[#087f45] transition-colors"
                        >
                            Contact Now
                        </Button>
                    </Link>
                </div>
            </div>

            <LoginModal
                isOpen={showLoginModalForSave}
                onClose={() => setShowLoginModalForSave(false)}
            />
        </div>
    );
};

export default SavedProductWidget;
