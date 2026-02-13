import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { MdNavigateBefore, MdNavigateNext, MdDelete } from 'react-icons/md';
import { FaStar } from 'react-icons/fa6';
import { formatCompanyNameForUrl } from '@/utils/UrlFormatter';
import { paths } from '@/config/paths';
// import ShareButton from '../MarketPlace/saved_share/share_button';
import LoginModal from '@/utils/login_check_modal';
import ShareButton from '@/components/marketplace/product-widgets/share-button';

const SavedProductWidget = ({ products, onDelete, isSaved }: any) => {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [showLoginModalForSave, setShowLoginModalForSave] = React.useState(false);

    const handleScroll = () => {
        window.scrollTo(0, 0);
    };

    const handleNext = () => {
        setCurrentIndex((currentIndex + 1) % (products?.images?.length || 1));
    };

    const handlePrev = () => {
        setCurrentIndex((currentIndex - 1 + (products?.images?.length || 1)) % (products?.images?.length || 1));
    };

    const imageContainerStyle = {
        width: `${products?.images?.length * 100}%`,
        transform: `translateX(-${(currentIndex / products?.images?.length) * 100}%)`,
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
        images,
        id
    } = products;

    const productCardRoute = `/products/details/${id}/${formatCompanyNameForUrl(product_name)}`;

    return (
        <div className='relative'>
            <div className='group shadow-sm shadow-[#0000002a] mb-[14px] bg-[#fff] pt-[10px] px-[10px] rounded-[15px] pb-[10px] h-full flex flex-col'>
                {/* Delete button for saved items */}
                {isSaved && (
                    <div className="absolute top-3 right-3 m-2 z-20">
                        <Tooltip title="Remove from saved items">
                            <IconButton
                                onClick={onDelete}
                                aria-label="Remove from saved items"
                                size="sm"
                                className="bg-white/80 hover:bg-white/90"
                            >
                                <MdDelete color="error" />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                {/* Images */}
                <div>
                    <div className="widget_image_container relative h-[230px]">
                        <div className="w-full h-full flex" style={imageContainerStyle}>
                            {products?.images?.map((j: any, i: any) => (
                                <div
                                    className="relative w-full h-full rounded-t-xl overflow-hidden"
                                    key={i}
                                >
                                    <Link
                                        href={productCardRoute}
                                        onClick={handleScroll}
                                    >
                                        <img
                                            src={j}
                                            alt={product_name}
                                            className="w-full h-full object-cover rounded-[20px]"
                                        />
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <Box className='opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                            <button
                                onClick={handleNext}
                                className="absolute z-[10] right-2 top-[50%]"
                            >
                                <MdNavigateNext className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                            </button>
                            <button
                                onClick={handlePrev}
                                className="absolute z-[10] left-2 top-[50%]"
                            >
                                <MdNavigateBefore className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                            </button>
                        </Box>
                    </div>

                    {/* Image indicators */}
                    <div className="">
                        <div className="flex justify-center mt-[3px] gap-[10px]">
                            {products?.images?.map((_: any, i: any) => (
                                <div
                                    key={i}
                                    className={`rounded-full w-2 h-2 ${currentIndex === i ? "bg-[#000] " : "bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product description */}
                <div className="flex-grow">
                    <h2 className='pt-[5px] sm:text-[15px] text-[13px] flex flex-row w-full font-[500]'>{product_name}</h2>
                    <div className='pt-[10px]'>
                        {prev_price && (
                            <span className='sm:text-[24px] text-[1.1rem] font-[700]'>${prev_price}</span>
                        )}
                        {real_price && (
                            <span className='text-[14px] font-[400] pl-[10px] text-[#666666]'><del>${real_price}</del></span>
                        )}
                    </div>

                    {quantity && (
                        <div className='py-[px]'>
                            <span className='sm:text-[15px] text-[12px] font-[400]'>M.O.Q:</span>
                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{quantity}{measure}</span>
                        </div>
                    )}

                    {delivery_period && (
                        <div className='py-[px]'>
                            <span className='sm:text-[15px] text-[12px] font-[400]'>Del.Period:</span>
                            <span className='sm:text-[15px] text-[12px] font-[400] pl-[10px]'>{delivery_period}</span>
                        </div>
                    )}

                    <div className='py-[4px] flex justify-between items-center gap-[5px]'>
                        <span className='flex items-center gap-[2px]'>
                            <span><FaStar /></span>
                            <span className='sm:text-[15px] text-[12px] font-[400]'>
                                <b>{Math.round((productRating?.average || 0) * 100) / 100}</b>/5.0
                            </span>
                            <span className='sm:text-[15px] text-[12px] pl-[5px] font-[400]'>
                                {`(${productRating?.count || 0})`}
                            </span>
                        </span>
                        {/* <div className='flex items-center gap-[10px]'>
                            <span className='hidden sm:inline'>
                                <ShareButton productName={product_name} />
                            </span>
                        </div> */}
                    </div>

                    <div className="pt-[10px] flex gap-[10px]">
                        {country?.flagImage && (
                            <div className='w-7 h-10'>
                                <img src={country?.flagImage} alt='Country Flag' className='' />
                            </div>
                        )}
                        <Link
                            className='sm:text-[15px] text-[12px] cursor-pointer font-[500] underline'
                            href={`/business/${storeProfile?.company_name}`}
                        >
                            {storeProfile?.company_name}
                        </Link>
                    </div>
                </div>

                {/* Button */}
                <div className="flex flex-col pt-[10px] items-end justify-center gap-[10px] w-full mt-auto">
                    <Link href={productCardRoute} className="w-full">
                        <Button
                            variant="contained"
                            className="w-full text-xs cursor-pointer"
                        >
                            Contact Now
                        </Button>
                    </Link>
                </div>
            </div>

            <LoginModal
                isOpen={showLoginModalForSave}
                onClose={() => setShowLoginModalForSave(false)}
                loginPath={paths.auth.signIn}
            />
        </div>
    );
};

export default SavedProductWidget;