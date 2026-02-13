
"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
// import Image from "next/image"; // Using img for now to avoid domain issues with generic URLs

interface DetailImageWidgetProps {
  images: string[];
}

export default function DetailImageWidget({ images }: DetailImageWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verticalIndex, setVerticalIndex] = useState(0);
  const router = useRouter();
  
  // Safe check for images
  const validImages = images?.length > 0 ? images : ['/assets/placeholder.png'];
  
  const thumbnailHeight = 92; 
  const visibleThumbnails = 3; 
  
  const verticalSliderStyle = {
    transform: `translateY(-${verticalIndex * thumbnailHeight}px)`,
    transition: "transform 0.5s ease-in-out",
  };
  
  const imageContainerStyle = {
    // width: `${validImages.length * 100}%`,
    transform: `translateX(-${currentIndex * 100}%)`,
    transition: "transform 0.5s ease-in-out",
  };

  return (
    <div className="w-full h-[400px] max-w-[639px] sm:h-[400px] mx-auto">
        <div className="flex relative justify-center gap-[20px] h-full">
            {/* Vertical Thumbs Desktop */}
            <div className={`pt-[150px] bg-[#fff] lg:flex hidden justify-center h-full rounded-lg w-[120px] overflow-hidden relative`}>
                <div 
                    style={verticalSliderStyle}
                    className="flex flex-col gap-[15px] z-10 w-full max-w-[120px] items-center transition-transform duration-500"
                >
                    {validImages.map((img, j) => (
                        <div 
                            key={j} 
                            className={`rounded-lg cursor-pointer border-2 ${currentIndex === j ? 'border-green-600' : 'border-transparent'}`}
                            onClick={() => setCurrentIndex(j)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt="Thumbnail"
                                className="w-[92px] h-[92px] object-cover rounded-lg"
                            />
                        </div>
                    ))} 
                </div>
                
                {/* Nav buttons for vertical slider */}
                <button
                    onClick={() => setVerticalIndex(prev => (prev + 1) % validImages.length)}
                    className="absolute bg-white shadow-md p-1 z-20 rounded-full left-1/2 -translate-x-1/2 top-2 hover:bg-gray-50"
                >
                    <ChevronLeft className="rotate-90 text-gray-800" size={20} />
                </button>
                <button
                    onClick={() => setVerticalIndex(prev => (prev - 1 + validImages.length) % validImages.length)}
                    className="absolute bg-white shadow-md p-1 z-20 rounded-full left-1/2 -translate-x-1/2 bottom-2 hover:bg-gray-50"
                >
                     <ChevronLeft className="-rotate-90 text-gray-800" size={20} />
                </button>
            </div> 

            {/* Main Image Area */}
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden bg-gray-100 group">
                {/* Mobile Back Button */}
                <div
                    onClick={() => router.back()}
                    className="sm:hidden absolute top-3 left-3 z-30 cursor-pointer"
                >
                    <div className="bg-black/30 rounded-full p-2 text-white backdrop-blur-sm">
                        <ArrowLeft size={20} />
                    </div>
                </div>

                {/* Main Slider */}
                <div className="w-full h-full flex" style={{ width: `${validImages.length * 100}%`, ...imageContainerStyle }}>
                    {validImages.map((img, i) => (
                        <div
                            className="relative w-full h-full"
                            style={{ width: `${100 / validImages.length}%` }}
                            key={i}
                        >
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt="Product"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={() => setCurrentIndex((currentIndex + 1) % validImages.length)}
                    className="absolute bg-white/80 hover:bg-white p-2 rounded-full right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="text-gray-900" size={24} />
                </button>
                <button
                    onClick={() => setCurrentIndex((currentIndex - 1 + validImages.length) % validImages.length)}
                    className="absolute bg-white/80 hover:bg-white p-2 rounded-full left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronLeft className="text-gray-900" size={24} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 w-full flex justify-center gap-2">
                    {validImages.map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-full w-2 h-2 transition-colors ${
                                currentIndex === i ? "bg-white" : "bg-white/50"
                            }`}
                        />
                    ))}
                </div>
            </div>   
        </div>
    </div>
  );
}
