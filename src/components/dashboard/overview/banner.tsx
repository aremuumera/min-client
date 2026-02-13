'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import banner from '@/assets/dashboard-images/overview-banner.png';
import { HiOutlineUser } from 'react-icons/hi2';
import { FiArrowUpRight } from 'react-icons/fi';
import Link from 'next/link';
import { AiOutlineShoppingCart } from "react-icons/ai";
import { CgShoppingBag } from "react-icons/cg";
import { GoPeople } from "react-icons/go";
import { paths } from '@/config/paths';
import { useSelector } from 'react-redux';
import ActionUpdates from '@/utils/actionUpdates';

// Assuming you'll have multiple banner images
// You would replace these with your actual image imports
const bannerImages = [
  '/assets/dashboard-images/overview-banner.png',
  '/assets/dashboard-images/overview-banner.png',
  '/assets/dashboard-images/overview-banner.png',
];

const BannerInfo = [
  // {
  //   title: 'Submit Company Info',
  //   description:
  //     'If you want to have a business page and become a verified buyer. Complete the form now.',
  //   userIcon: <HiOutlineUser className='text-primary text-[24px]' />,
  //   buttonText: 'Get Started',
  //   buttonLink: `${paths.dashboard.companyInfoVerification}`,
  // },
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

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle manual navigation
  const goToSlide = (index: number) => {
    setCurrentBanner(index);
  };

  // Handle next slide
  const nextSlide = () => {
    setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
  };

  // Handle previous slide
  const prevSlide = () => {
    setCurrentBanner((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  return (
    <div className="w-full">
      {/* Banner Slider */}
      <div className="relative overflow-hidden rounded-lg md:rounded-xl lg:rounded-[30px] h-[150px] sm:h-[180px] md:h-[210px] w-full">
        {/* <AnimatePresence initial={false}>
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: `url(${bannerImages[currentBanner]})` }}
          >
            Optional: Banner Content Overlay
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10 bg-black bg-opacity-30 text-white">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-3xl !tracking-tighter lg:text-4xl font-bold"
              >
                Hi {user?.firstName} {user?.lastName} 👋
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm md:text-lg mt-2 max-w-lg"
              >
                Welcome to your dashboard
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence> */}

        {/* Slider Controls */}
        {/* <div className="absolute inset-y-0 left-0 flex items-center">
          <button 
            onClick={prevSlide}
            className="bg-white bg-opacity-30 hover:bg-opacity-50 p-2 rounded-r-lg focus:outline-none"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button 
            onClick={nextSlide}
            className="bg-white bg-opacity-30 hover:bg-opacity-50 p-2 rounded-l-lg focus:outline-none"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div> */}

        {/* Dots Navigation */}
        {/* <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full focus:outline-none ${
                currentBanner === index ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div> */}
      </div>

      <div className="py-4 px-4 lg:px-0">
        <div className="w-full py-4 md:py-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl tracking-tighter font-medium">
            Ready to take your business beyond borders?
          </h1>
          <p className="text-sm md:text-base tracking-tighter lg:text-lg text-[#8895A2] font-normal mt-2">
            It only takes 3 simple steps let’s get started! <br /> To ensure a smooth experience, we recommend suppliers complete this process before listing their products.
          </p>
        </div>

        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5">
          {BannerInfo.map((info, index) => (
            <div
              key={index}
              className="w-full flex flex-col gap-3 md:gap-4 rounded-lg md:rounded-xl lg:rounded-[20px] border border-[#c6c6c6] p-4 md:p-5 lg:p-6 bg-[#F9F9F9]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 flex justify-center items-center bg-white rounded-full">
                {info.userIcon}
              </div>
              <div className="flex-grow">
                <h2 className="text-lg md:text-xl lg:text-2xl font-medium pb-2">
                  {info.title}
                </h2>
                <p className="text-[#8895A2] text-sm md:text-base lg:text-lg">
                  {info.description}
                </p>
              </div>
              <Link
                className="text-primary flex items-center gap-1 mt-auto"
                href={info.buttonLink}
              >
                {info.buttonText}{' '}
                <span>
                  <FiArrowUpRight className="text-primary" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <ActionUpdates />
      <div className="">
        <div className="w-full py-4 md:py-6 px-4 lg:px-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-medium">
            Become a premium User
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-[#8895A2] font-normal mt-2">
            Unlock exclusive benefits, and powerful tools all designed to grow your business faster with our Premium plans!
          </p>
        </div>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 px-4 lg:px-0">
          {MinMegPlans.map((info, index) => (
            <div
              key={index}
              className="w-full flex flex-col gap-3 md:gap-4 rounded-lg md:rounded-xl lg:rounded-[20px] border border-[#c6c6c6] p-4 md:p-5 lg:p-6 bg-[#F9F9F9]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 flex justify-center items-center bg-white rounded-full">
                {info.userIcon}
              </div>
              <div className="flex-grow">
                <h2 className="text-lg md:text-xl lg:text-2xl font-medium pb-2">
                  {info.title}
                </h2>
                <p className="text-[#8895A2] text-sm md:text-base lg:text-lg">
                  {info.description}
                </p>
              </div>
              <Link
                className="text-primary flex items-center gap-1 mt-auto"
                href={info.buttonLink}
              >
                {info.buttonText}{' '}
                <span>
                  <FiArrowUpRight className="text-primary" />
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banner;