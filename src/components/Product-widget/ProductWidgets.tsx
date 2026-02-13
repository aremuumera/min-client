'use client';

import * as React from 'react';
import Link from 'next/link';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { FaStar } from 'react-icons/fa6';
import { useViewMode } from '@/contexts/viewProductMode';
import { paths } from '@/config/paths';
import { formatCompanyNameForUrl } from '@/utils/UrlFormatter';
import ToggleSaveButton from '@/components/marketplace/product-widgets/saved-button';
import ShareButton from '@/components/marketplace/product-widgets/share-button';
import LoginModal from '@/utils/login_check_modal';

interface ProductProps {
  products: {
    id: string | number;
    product_name: string;
    prev_price?: number;
    real_price?: number;
    quantity?: number;
    measure?: string;
    delivery_period?: string;
    productRating?: {
      average: number;
      count: number;
    };
    country?: {
      flagImage: string;
    };
    storeProfile?: {
      company_name: string;
    };
    images: string[];
    [key: string]: any;
  };
}

const ProductWidgets = ({ products }: ProductProps) => {
  const { isGridView } = useViewMode();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showLoginModalForSave, setShowLoginModalForSave] = React.useState(false);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % (products?.images?.length || 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + (products?.images?.length || 1)) % (products?.images?.length || 1));
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
    id,
  } = products;

  const productCardRoute = `${paths.marketplace.productDetails(id)}/${formatCompanyNameForUrl(product_name)}`;

  const imageContainerStyle = {
    width: `${(products?.images?.length || 1) * 100}%`,
    transform: `translateX(-${(currentIndex / (products?.images?.length || 1)) * 100}%)`,
    transition: 'transform 0.5s ease-in-out',
  };

  return (
    <div>
      <div className="relative">
        <div className="relative scroll-smooth">
          <div className="gap-[10px]">
            <div
              className={`group ${isGridView
                  ? 'flex w-full max-w-[300px] flex-col min-h-[530px] flex-grow'
                  : 'flex flex-row w-full justify-around gap-[30px]'
                } shadow-sm shadow-[#0000002a] mb-[14px] bg-white pt-[10px] px-[10px] rounded-[15px] pb-[10px] h-full`}
            >
              {/* images */}
              <div>
                <div
                  className={`${isGridView ? 'max-w-[300px] w-full' : 'max-w-[430px] w-full'
                    } relative h-[230px] overflow-hidden`}
                >
                  <div className="w-full h-full flex" style={imageContainerStyle}>
                    {products?.images?.map((j, i) => (
                      <div className="relative w-full h-full rounded-t-xl overflow-hidden flex-shrink-0" key={i}>
                        <Link href={productCardRoute}>
                          <img
                            src={j}
                            alt={product_name}
                            className="w-full h-full object-cover rounded-[20px]"
                          />
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* next and previous button */}
                  <Box className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button onClick={handleNext} className="absolute z-[10] right-2 top-[50%]">
                      <MdNavigateNext className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                    </button>
                    <button onClick={handlePrev} className="absolute z-[10] left-2 top-[50%]">
                      <MdNavigateBefore className="text-gray-200 bg-[#727272] w-[20px] h-[20px] rounded-full text-[22px]" />
                    </button>
                  </Box>
                </div>
                <div>
                  <div className="flex justify-center mt-[3px] gap-[10px]">
                    {products?.images?.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full w-2 h-2 ${currentIndex === i ? 'bg-black' : 'bg-gray-300'
                          }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products description */}
              <div className="flex flex-col flex-grow">
                <h2 className="pt-[5px] sm:text-[15px] text-[13px] flex flex-row w-full font-[500] uppercase">
                  {product_name}
                </h2>
                <div className="pt-[10px]">
                  {prev_price && <span className="sm:text-[24px] text-[1.1rem] font-[700]">${prev_price}</span>}
                  {real_price && (
                    <span className="text-[14px] font-[400] pl-[10px] text-[#666666]">
                      <del>${real_price}</del>
                    </span>
                  )}
                </div>

                {quantity && (
                  <div className="py-[px]">
                    <span className="sm:text-[15px] text-[12px] font-[400]">M.O.Q:</span>
                    <span className="sm:text-[15px] text-[12px] font-[400] pl-[10px]">
                      {quantity}
                      {measure}
                    </span>
                  </div>
                )}

                {delivery_period && (
                  <div className="py-[px]">
                    <span className="sm:text-[15px] text-[12px] font-[400]">Del.Period:</span>
                    <span className="sm:text-[15px] text-[12px] font-[400] pl-[10px]">{delivery_period}</span>
                  </div>
                )}

                <div className="py-[4px] flex justify-between items-center gap-[5px]">
                  <span className="flex items-center gap-[2px]">
                    <span>
                      <FaStar />
                    </span>
                    <span className="sm:text-[15px] text-[12px] font-[400]">
                      <b>{Math.round((productRating?.average || 0) * 100) / 100}</b>/5.0
                    </span>
                    <span className="sm:text-[15px] text-[12px] pl-[5px] font-[400]">{`(${productRating?.count || 0
                      })`}</span>
                  </span>
                  <div className="flex items-center gap-[10px]">
                    <span className="bg-green-200 text-white px-2 py-1 rounded-full">
                      <ToggleSaveButton setShowLoginModal={setShowLoginModalForSave} products={products} />
                    </span>
                    <span className="hidden sm:inline">
                      <ShareButton productName={product_name} />
                    </span>
                  </div>
                </div>

                <div className="pt-[20px] flex gap-[10px] items-center">
                  <div className="w-7 h-10">
                    {country?.flagImage && <img src={country.flagImage} alt="Country Flag" className="w-full h-full object-contain" />}
                  </div>
                  <Link
                    className="sm:text-[15px] text-[12px] cursor-pointer font-[500] underline"
                    href={`${paths.marketplace.companyProfile(String(storeProfile?.company_name))}`}
                  >
                    {storeProfile?.company_name}
                  </Link>
                </div>

                {/* buttons save/Contact Now */}
                <div className="mt-auto pt-[10px]">
                  <Button
                    asChild
                    variant="contained"
                    className="w-full text-[0.8rem] cursor-pointer"
                  >
                    <Link href={productCardRoute}>Contact Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

export default ProductWidgets;
