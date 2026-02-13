
"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/helper';

// We'll use a simple CSS-based fallback if react-slideshow-image causes issues or stick to a custom implementation.
// The original used react-slideshow-image. Let's see if it's installed.
// Note: I'll implement a custom fade for now to avoid dependency issues if it's not and keep it lightweight.

interface SplitLayoutProps {
  children: React.ReactNode;
}

const slides = [
  {
    image: '/assets/im1.jpg', // Assuming these are in public/assets
    title: 'Welcome to MinMeg',
    description: 'Explore, Buy, and Sell Minerals with MinMeg'
  },
  {
    image: '/assets/im5.jpg',
    title: 'Secured Escrow Services',
    description: 'Safeguard your transactions with trusted escrow services for peace of mind.'
  },
  {
    image: '/assets/im1.jpg',
    title: 'Real-time Tracking',
    description: 'Track your mineral shipments and product status in real-time, from source to destination.'
  },
  {
    image: '/assets/im4.jpg',
    title: 'Digital Payments',
    description: 'Seamless and secure digital payment solutions for your mineral transactions.'
  }
];

export function SplitLayout({ children }: SplitLayoutProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
      {/* Hero Section (Left) */}
      <div className="hidden lg:flex lg:flex-[0.45] relative bg-black">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              currentSlide === index ? "opacity-100" : "opacity-0"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end pb-20 pl-16">
              <div className="max-w-xl animate-in fade-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-white text-5xl font-bold mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-white/90 text-xl font-medium italic leading-relaxed">
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-16 flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentSlide === index ? "w-8 bg-green-500" : "w-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Form Section (Right) */}
      <div className="lg:flex-[0.55] flex flex-col items-center h-full overflow-y-auto hide-scrollbar bg-white">
        <div className="w-full max-w-[540px] px-6 py-12 md:px-12 md:py-20 lg:px-16 lg:py-24">
          {children}
        </div>
      </div>
    </div>
  );
}
