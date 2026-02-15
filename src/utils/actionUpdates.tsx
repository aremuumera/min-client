import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineInformationCircle } from 'react-icons/hi';

const SlidingNotice = () => {
  /*
  const notices = [
    {
      title: "Submit Company Info",
      description: "If you want to have a business page and list your products and services"
    },
    {
      title: "Submit Company Info",
      description: "If you want to be a verified buyer"
    }
  ];
  */

  const notices = [
    {
      title: "Marketplace Tip",
      description: "Keep your product catalog updated to improve search visibility and buyer trust."
    },
    {
      title: "Engagement Hint",
      description: "Respond to RFQs and messages promptly to increase your business rating."
    },
    {
      title: "Pro Feature",
      description: "Check your Activity Timeline frequently for real-time engagement updates."
    }
  ];

  const [currentNotice, setCurrentNotice] = useState(0);

  // Auto-rotate through notices
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNotice((prev) => (prev + 1) % notices.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [notices.length]);

  return (
    <div className="w-full bg-blue-50 border-l-4 sm:py-0 py-4 pr-2 border-blue-500 rounded-lg overflow-hidden">
      <div className="relative h-14 md:h-12 px-4 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNotice}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center"
          >
            <div className="flex items-center w-full">
              <HiOutlineInformationCircle className="text-blue-500 w-5 h-5 shrink-0" />
              <div className="ml-3">
                <span className="font-medium text-sm md:text-base">
                  {notices[currentNotice].title}:
                </span>{' '}
                <span className="text-gray-600 text-sm">
                  {notices[currentNotice].description}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicator dots */}
      {/* <div className="flex justify-center pb-2">
        {notices.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 mx-1 rounded-full ${
              currentNotice === index ? 'bg-blue-500' : 'bg-blue-200'
            }`}
          />
        ))}
      </div> */}
    </div>
  );
};

export default SlidingNotice;