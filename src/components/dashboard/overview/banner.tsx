'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Link from 'next/link';
import { AiOutlineShoppingCart } from "react-icons/ai";
import { CgShoppingBag } from "react-icons/cg";
import { GoPeople } from "react-icons/go";
import { paths } from '@/config/paths';
import { useSelector } from 'react-redux';

const bannerImages = [
  '/assets/dashboard-images/overview-banner.png',
  '/assets/dashboard-images/overview-banner.png',
  '/assets/dashboard-images/overview-banner.png',
];

const BannerInfo = [
  {
    title: 'Create Products',
    description:
      'Create your products on your company website and increase your visibility to potential buyers.',
    userIcon: <AiOutlineShoppingCart className='text-primary text-[24px]' />,
    buttonText: 'List Product',
    buttonLink: `${paths.dashboard.products.create}`,
  },
  {
    title: 'Create RFQs',
    description:
      'Create your buy requirement for free on your company website and find suitable suppliers.',
    userIcon: <CgShoppingBag className='text-primary text-[24px]' />,
    buttonText: 'Start Now',
    buttonLink: `${paths.dashboard.rfqs.create}`,
  },
];

const MinMegPlans = [
  {
    title: 'Upgrade to premium plan',
    description:
      'For more flexibility, upgrade to premium plan.',
    userIcon: <GoPeople className='text-primary text-[24px]' />,
    buttonText: 'Upgrade now',
    buttonLink: '/rfq',
  },
  {
    title: 'Check our premium plan',
    description:
      'We have simple and affordable plan for you',
    userIcon: <GoPeople className='text-primary text-[24px]' />,
    buttonText: 'Check plan',
    buttonLink: '/rfq',
  },
];

const Banner = () => {
  const { user } = useSelector((state: any) => state.auth);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setCurrentBanner(index);
  const nextSlide = () => setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
  const prevSlide = () => setCurrentBanner((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);

  const isInspector = user?.role === 'inspector';
  const filteredBannerInfo = isInspector ? [] : BannerInfo;
  const filteredPlans = isInspector ? [] : MinMegPlans;

  if (isInspector) return null;

  return (
    <div className="w-full">
      <div className="pb-4">
        {filteredBannerInfo.length > 0 && (
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {filteredBannerInfo.map((info, index) => (
              <div
                key={index}
                className="group w-full flex flex-col gap-3 md:gap-4 rounded-xl border border-[#e5e7eb] p-5 md:p-6 bg-white hover:border-primary-500 transition-all"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 flex justify-center items-center bg-primary-50 rounded-lg text-primary-600">
                  {info.userIcon}
                </div>
                <div className="grow">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 pb-1">
                    {info.title}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                    {info.description}
                  </p>
                </div>
                <Link
                  className="text-primary-600 font-bold flex items-center gap-1 mt-auto hover:gap-2 transition-all"
                  href={info.buttonLink}
                >
                  {info.buttonText} <FiArrowUpRight className="text-lg" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredPlans.length > 0 && (
        <div className="pt-2">
          <div className="w-full py-4 md:py-6">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Become a premium User
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-gray-500 font-medium mt-2">
              Unlock exclusive benefits and powerful tools designed to grow your business faster.
            </p>
          </div>
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {filteredPlans.map((info, index) => (
              <div
                key={index}
                className="group w-full flex flex-col gap-3 md:gap-4 rounded-xl border border-[#e5e7eb] p-5 md:p-6 bg-white hover:border-primary-500 transition-all"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 flex justify-center items-center bg-primary-50 rounded-lg text-primary-600">
                  {info.userIcon}
                </div>
                <div className="grow">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 pb-1">
                    {info.title}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                    {info.description}
                  </p>
                </div>
                <Link
                  className="text-primary-600 font-bold flex items-center gap-1 mt-auto hover:gap-2 transition-all"
                  href={info.buttonLink}
                >
                  {info.buttonText} <FiArrowUpRight className="text-lg" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Banner;