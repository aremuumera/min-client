
"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { PromoBadges, VerifiedBadges } from './badges';
import { CertificateBadge, PricingBadge } from './badges';
import { useViewMode } from '@/contexts/view-product-mode';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { paths } from '@/config/paths'; // Assuming paths are migrated here or I should check. 
// I previously saw @/config/paths in imports, let's assume it's there or I might need to migrate it. 
// I'll check paths file existence, but for now I will assume @/config/paths.
import { formatCompanyNameForUrl } from '@/utils/url-formatter';
import ToggleSaveButton from './saved-button';
import ShareButton from './share-button';
import LoginModal from '@/utils/login-modal';
// import { Button } from '@/components/ui/button'; // Replacing with custom or tailwind
// import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '@/redux';
import { toggleComparison } from '@/redux/features/comparison/comparison-slice';
import { GitCompare } from 'lucide-react';

// Temporary assets imports - standardizing assets
// import CE from '/assets/CE_logo.png' // Need to make sure assets exist in public
// import ISO from '/assets/ISO-Standards.png'

const CE = '/assets/CE_logo.png';
const ISO = '/assets/ISO-Standards.png';

interface ProductWidgetsProps {
    products: any; // Type strictly later
}

const ProductWidgets = ({ products }: ProductWidgetsProps) => {
    const { isGridView } = useViewMode();
    const dispatch = useAppDispatch();
    const { comparisonList } = useAppSelector((state) => state.comparison);
    // const navigate = useNavigate(); // Not needed in Next.js usually due to Link
    // const scrollRef = React.useRef(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    // const [mineralImages, setMineralImages] = React.useState(
    //     products?.images?.map(() => ({
    //       currentIndex: 0
    //     }))
    //   )
    const [showLoginModalForSave, setShowLoginModalForSave] = React.useState(false);

    // const handleScroll = () => {
    //     window.scrollTo(0, 0);
    // }



    // Normalize images to {url, type} objects
    const normalizedImages = products?.images?.map((img: any) =>
        typeof img === 'string' ? { url: img, type: 'image' } : { url: img.url, type: img.type || 'image' }
    ) || [];

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentIndex((currentIndex + 1) % (normalizedImages.length || 1));
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrentIndex((currentIndex - 1 + (normalizedImages.length || 1)) % (normalizedImages.length || 1));
    }

    const imageContainerStyle = {
        width: `${normalizedImages.length * 100}%`,
        transform: `translateX(-${(currentIndex / (normalizedImages.length || 1)) * 100}%)`,
        transition: "transform 0.5s ease-in-out",
    }

    const { product_name, prev_price, real_price, country, sold, productRating, delivery_period, reviews, storeProfile, quantity, measure, unitCurrency, images, id } = products || {};

    const currencySymbol = unitCurrency === 'NGN' || !unitCurrency ? '₦' : (unitCurrency === 'USD' ? '$' : unitCurrency);

    const formatPrice = (price: any) => {
        if (!price) return '';
        return Number(price).toLocaleString();
    };

    // Safety check for products
    if (!products) return null;

    const productCardRoute = `/dashboard/products/details/${id}/${formatCompanyNameForUrl(product_name)}`;


    return (
        <div>
            <div className='relative'>

                <div className='relative scroll-smooth'>
                    <div className='gap-[10px]'>
                        <div className={`group transition-all duration-300 hover:shadow-md ${isGridView ? 'flex w-full flex-col flex-grow' : 'flex flex-row w-full justify-around gap-[30px]'} shadow-sm shadow-[#0000002a] mb-[14px] bg-[#fff] pt-[10px] px-[10px] rounded-[15px] pb-[10px] h-full`}>
                            {/* images  */}
                            <div>
                                <div className={`${isGridView ? 'w-full aspect-square md:h-[230px]' : 'max-w-[430px] w-full aspect-[4/3] md:h-[280px]'} widget_image_container relative h-auto overflow-hidden rounded-xl`}>
                                    <div className="absolute inset-0 z-0">
                                        {/* Image & Video Carousel */}
                                        <Link href={productCardRoute} className="w-full h-full flex" style={imageContainerStyle}>
                                            {normalizedImages.map((media: any, i: number) => {
                                                const isVideo = media.type === 'video' || media.url?.toLowerCase()?.endsWith('.mp4') || media.url?.toLowerCase()?.endsWith('.webm');
                                                return (
                                                    <div
                                                        className={`relative h-full rounded-t-xl overflow-hidden shrink-0`}
                                                        style={{ width: `${100 / (normalizedImages.length || 1)}%` }}
                                                        key={i}
                                                    >
                                                        {isVideo ? (
                                                            <video
                                                                src={media.url}
                                                                autoPlay
                                                                muted
                                                                loop
                                                                playsInline
                                                                className="w-full h-full object-cover rounded-[20px]"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={media.url}
                                                                alt={product_name || "Product Image"}
                                                                className="w-full h-full object-cover rounded-[20px]"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </Link>
                                    </div>

                                    {/* next and previous button */}
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

                                <div className="">
                                    <div className="flex justify-center mt-[3px] gap-[6px]">
                                        {normalizedImages.map((_: any, i: number) => {
                                            return (
                                                <div
                                                    key={i}
                                                    className={`rounded-full h-1.5 transition-all duration-300 ${currentIndex === i ? "bg-gray-800 w-4" : "bg-gray-300 w-1.5"
                                                        }`}
                                                ></div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Products description */}
                            <div className="flex-1 flex flex-col">
                                <h2 className='pt-[5px] sm:text-[15px] text-[13px] flex flex-row w-full font-[500] line-clamp-2 min-h-[40px]'>
                                    {product_name}
                                </h2>

                                <div className='pt-[10px] flex items-baseline gap-2'>
                                    {real_price && (
                                        <span className='sm:text-[24px] text-[1.1rem] font-[700] text-gray-900'>{currencySymbol}{formatPrice(real_price)}</span>
                                    )}
                                    {prev_price && (
                                        <span className='text-[14px] font-[400] text-[#666666] line-through decoration-gray-400'>{currencySymbol}{formatPrice(prev_price)}</span>
                                    )}
                                </div>

                                {quantity && (
                                    <div className='mt-1 flex items-center'>
                                        <span className='text-[13px] text-gray-500 font-medium'>M.O.Q:</span>
                                        <span className='text-[13px] font-[400] pl-[5px] text-gray-800'>{quantity} {measure}</span>
                                    </div>
                                )}


                                {delivery_period && (
                                    <div className='mt-1 flex items-center'>
                                        <span className='text-[13px] text-gray-500 font-medium'>Del. Period:</span>
                                        <span className='text-[13px] font-[400] pl-[5px] text-gray-800'>{delivery_period}</span>
                                    </div>
                                )}



                                <div className='py-[8px] flex justify-between items-center gap-[5px] mt-auto'>
                                    <span className='flex items-center gap-[4px] bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100'>
                                        <FaStar className="text-yellow-400 text-xs" />
                                        <span className='text-[12px] font-semibold text-gray-800'>{Math.round((productRating?.average || 0) * 100) / 100}</span>
                                        <span className='text-[11px] text-gray-500'>{`(${productRating?.count || 0})`}</span>
                                    </span>

                                    <div className='flex items-center gap-[10px]'>
                                        <div
                                            className='flex items-center gap-2 group/compare relative cursor-pointer'
                                            onClick={() => dispatch(toggleComparison(products))}
                                        >
                                            <div className={`p-1 mt-1 rounded-full transition-colors ${comparisonList.some((p: any) => p.id === id) ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-100 hover:text-green-600'}`}>
                                                <GitCompare size={18} className={comparisonList.some((p: any) => p.id === id) ? 'fill-green-600 stroke-green-600' : ''} />
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[11px] rounded opacity-0 invisible group-hover/compare:opacity-100 group-hover/compare:visible transition-all whitespace-nowrap pointer-events-none z-10">
                                                {comparisonList.some((p: any) => p.id === id) ? 'Remove Compare' : 'Compare'}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
                                            </div>
                                        </div>
                                        <span className='' >
                                            <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={products} />
                                        </span>
                                        <span className='hidden sm:inline'><ShareButton productName={product_name} /></span>
                                    </div>

                                </div>

                                <div className="pt-[15px] flex items-center gap-[10px] border-t border-gray-100 mt-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {country?.flagImage && <img src={country.flagImage} alt='Country' className='w-5 h-auto object-contain' />}
                                    <Link href={`/dashboard/business/${formatCompanyNameForUrl(storeProfile?.company_name)}`} className='text-[13px] text-gray-600 hover:text-green-600 font-medium hover:underline truncate' >
                                        {storeProfile?.company_name}
                                    </Link>
                                </div>
                            </div>

                            {/* buttons save/Contact Now */}
                            <div className={`${isGridView ? 'w-full' : 'max-w-[190px]'} flex flex-col pt-[15px] items-end justify-center gap-[10px] w-full mt-auto`}>
                                <Link
                                    href={productCardRoute}
                                    className="w-full bg-[#0a9150] hover:bg-[#087f45] text-white text-center text-sm font-medium py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:transform active:scale-[0.98]"
                                >
                                    Contact Now
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <LoginModal
                isOpen={showLoginModalForSave}
                onClose={() => setShowLoginModalForSave(false)}
            //   loginPath={paths.auth.signIn} // check path
            />
        </div>
    )
}

export default ProductWidgets
