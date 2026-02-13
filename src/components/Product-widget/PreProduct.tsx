import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import './styles/widgets.css';

import NoProducts from '@/utils/no-products';
import ProductSkeleton from '@/utils/skeleton/product-skelton';
import { Container } from '@/components/ui/container';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { useSelector } from 'react-redux';

import { ViewModeProvider } from '@/contexts/viewProductMode';

import { CertificateBadge, PricingBadge } from './BadgeIcon';
import { NormalBadges, PromoBadges, VerifiedBadges } from './Badges';
import ProductWidgets from './ProductWidgets';
import { useGetAllProductQuery } from '@/redux/features/supplier-products/products_api';
import { useAppSelector } from '@/redux';

const PreProduct = () => {
  const { limit, page, filters, search, sort, } =
    useAppSelector((state) => state.marketplace);

  const { data, isLoading, isError } = useGetAllProductQuery(
    {
      limit,
      page,
      sort,
    },
    {}
  );

  // Use actual API data when available, fallback to mock data
  const productData = data?.products;
  const productsToShow = productData?.length > 0 ? productData : [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Function to check scroll position and update arrow visibility
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Initialize and update scroll buttons on mount and resize
  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll left function
  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = Math.min(scrollRef.current.clientWidth * 0.8, 600);
      scrollRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollButtons, 400);
    }
  };

  // Scroll right function
  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = Math.min(scrollRef.current.clientWidth * 0.8, 600);
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollButtons, 400);
    }
  };

  const [mineralImages, setMineralImages] = React.useState(
    productsToShow.map(() => ({
      currentIndex: 0,
    }))
  );

  const handleNext = (index: number) => {
    setMineralImages((prevImages: any[]) =>
      prevImages.map((j: any, i: number) =>
        i === index ? { currentIndex: (j.currentIndex + 1) % productsToShow[i].images.length } : j
      )
    );
  };

  const handlePrev = (index: number) => {
    setMineralImages((prevImages: any[]) =>
      prevImages.map((j: any, i: number) =>
        i === index ? { currentIndex: (j.currentIndex - 1) % productsToShow[i].images.length } : j
      )
    );
  };

  return (
    <div className="bg-[#f7f7f7f3]">
      <div className="bg-[#f7f7f7f3] max-w-[1280px] mx-auto pb-[30px] grid">
        <ViewModeProvider>
          <Container
            className="pre_product_widget_container mx-auto bg-[#f7f7f7f3] max-w-[1280px]"
          >
            <div className=" ">
              <h2 className="text-[2rem] font-bold">
                {/* <NormalBadges label='Best Seller' /> */}
                Popular Products
              </h2>
            </div>

            <div className="mt-[10px] relative overflow-hidden">
              {/* Scroll Left Button */}
              {showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 z-10"
                  aria-label="Scroll left"
                >
                  <IoArrowBack size={20} />
                </button>
              )}

              {isLoading ? (
                <ProductSkeleton count={8} />
              ) : productsToShow.length > 0 ? (
                // Horizontally scrollable products container
                <div
                  ref={scrollRef}
                  className="flex overflow-x-auto scroll-smooth gap-x-[12px] pb-4 pt-2 px-2 w-full"
                  onScroll={checkScrollButtons}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    maxWidth: '100%',
                  }}
                >
                  {productsToShow.map((prod: any, i: number) => (
                    <div
                      key={i}
                      className="shrink-0 grow-0"
                      style={{ width: 'auto', minWidth: 'auto', maxWidth: '300px' }}
                    >
                      <ProductWidgets products={prod} />
                    </div>
                  ))}
                </div>
              ) : (
                // Show no products message
                <NoProducts
                  image="/assets/no product.png"
                  message="Ooooppppsss!!!!! There is no products at this time"
                />
              )}

              {/* Scroll Right Button */}
              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-2 z-10"
                  aria-label="Scroll right"
                >
                  <IoArrowForward size={20} />
                </button>
              )}
            </div>

            {/* Add CSS to hide scrollbar */}
            <style jsx>{`
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
              .overflow-x-auto {
                flex-wrap: nowrap;
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .pre_product_widget_container {
                max-width: 100% !important;
                overflow-x: hidden !important;
              }
            `}</style>
          </Container>
        </ViewModeProvider>
      </div>
    </div>
  );
};

export default PreProduct;
